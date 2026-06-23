import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Visitor {
  id: string;
  badge_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  company_name: string;
  host_name: string;
  host_email: string | null;
  purpose: string;
  check_in_time: string;
  check_out_time: string | null;
  status: string;
}

interface WebhookSetting {
  id: string;
  name: string;
  webhook_url: string;
  webhook_type: 'slack' | 'teams';
  is_active: boolean;
  notify_on_checkin: boolean;
  notify_on_checkout: boolean;
}

// Text escape function to prevent injection in webhook messages
function escapeText(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  // Remove control characters and limit length
  return unsafe
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 500);
}

// SSRF guard: only allow HTTPS calls to known notification providers.
// Blocks private/internal ranges and cloud metadata endpoints regardless of the allowlist.
const WEBHOOK_HOST_ALLOWLIST = [
  'hooks.slack.com',
  'outlook.office.com',
  'outlook.office365.com',
  'webhook.office.com',
];

function isSafeWebhookUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase();

  // Block IP literals entirely — webhooks should always use a hostname.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  if (hostname.includes(':')) return false; // IPv6 literal
  // Block localhost and metadata aliases.
  const blockedHosts = ['localhost', 'metadata.google.internal', 'metadata.goog'];
  if (blockedHosts.includes(hostname)) return false;
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;

  // Must match the explicit allowlist of notification providers.
  return WEBHOOK_HOST_ALLOWLIST.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate user
    const { data: { user: authUser }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !authUser) {
      console.error("JWT validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.id;

    // Verify user has staff role using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError || !roleData || !['admin', 'receptionist'].includes(roleData.role)) {
      console.error("User does not have staff role:", roleError || 'No role found');
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Staff access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { visitor: visitorInput, eventType } = await req.json() as { visitor: { id?: string }; eventType: 'checkin' | 'checkout' };

    // SECURITY: require visitor.id; only DB-sourced fields are used downstream.
    if (!visitorInput?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'visitor.id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: visitorRow, error: visitorError } = await supabaseAdmin
      .from('visitors')
      .select('id, badge_id, full_name, phone_number, email, company_name, host_name, host_email, purpose, check_in_time, check_out_time, status')
      .eq('id', visitorInput.id)
      .maybeSingle();

    if (visitorError || !visitorRow) {
      console.error("Visitor not found:", visitorError);
      return new Response(
        JSON.stringify({ success: false, error: 'Visitor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visitor = visitorRow as Visitor;
    console.log(`Processing ${eventType} notification for visitor:`, visitor.full_name);


    // Fetch active webhooks using service role
    const { data: webhooks, error: webhookError } = await supabaseAdmin
      .from('webhook_settings')
      .select('*')
      .eq('is_active', true);

    if (webhookError) {
      console.error('Error fetching webhooks:', webhookError);
      throw new Error('Failed to fetch webhook settings');
    }

    const activeWebhooks = (webhooks as WebhookSetting[]).filter(w => {
      if (eventType === 'checkin') return w.notify_on_checkin;
      if (eventType === 'checkout') return w.notify_on_checkout;
      return false;
    });

    console.log(`Found ${activeWebhooks.length} active webhooks for ${eventType}`);

    // Sanitize visitor data for webhook messages
    const safeVisitor: Visitor = {
      ...visitor,
      full_name: escapeText(visitor.full_name),
      badge_id: escapeText(visitor.badge_id),
      company_name: escapeText(visitor.company_name),
      host_name: escapeText(visitor.host_name),
      purpose: escapeText(visitor.purpose),
      phone_number: escapeText(visitor.phone_number),
      email: visitor.email ? escapeText(visitor.email) : null,
      host_email: visitor.host_email ? escapeText(visitor.host_email) : null,
    };

    const results = await Promise.allSettled(
      activeWebhooks.map(async (webhook) => {
        if (!isSafeWebhookUrl(webhook.webhook_url)) {
          console.error(`Blocked unsafe webhook URL for "${webhook.name}"`);
          throw new Error(
            `Webhook ${webhook.name} blocked: URL must be HTTPS and on the allowlist (Slack/Teams).`
          );
        }

        const message = formatMessage(safeVisitor, eventType, webhook.webhook_type);

        console.log(`Sending ${webhook.webhook_type} notification to ${webhook.name}`);

        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
          redirect: 'error', // prevent redirect-based SSRF bypass
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Webhook ${webhook.name} failed: ${response.status} - ${errorText}`);
        }

        return { webhook: webhook.name, success: true };
      })
    );

    const summary = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Webhook failed:`, result.reason);
        return { webhook: activeWebhooks[index].name, success: false, error: result.reason.message };
      }
    });

    console.log('Notification results:', summary);

    return new Response(
      JSON.stringify({ success: true, results: summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatMessage(visitor: Visitor, eventType: 'checkin' | 'checkout', webhookType: 'slack' | 'teams') {
  const isCheckin = eventType === 'checkin';
  const emoji = isCheckin ? '🟢' : '🔴';
  const action = isCheckin ? 'checked in' : 'checked out';
  const time = new Date(isCheckin ? visitor.check_in_time : visitor.check_out_time || new Date().toISOString())
    .toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (webhookType === 'slack') {
    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Visitor ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Visitor:*\n${visitor.full_name}` },
            { type: 'mrkdwn', text: `*Badge:*\n${visitor.badge_id}` },
            { type: 'mrkdwn', text: `*Company:*\n${visitor.company_name}` },
            { type: 'mrkdwn', text: `*Host:*\n${visitor.host_name}` },
            { type: 'mrkdwn', text: `*Purpose:*\n${visitor.purpose}` },
            { type: 'mrkdwn', text: `*Time:*\n${time}` },
          ],
        },
      ],
    };
  }

  // Microsoft Teams format
  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: isCheckin ? '00C853' : 'FF1744',
    summary: `Visitor ${action}: ${visitor.full_name}`,
    sections: [
      {
        activityTitle: `${emoji} Visitor ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        facts: [
          { name: 'Visitor', value: visitor.full_name },
          { name: 'Badge', value: visitor.badge_id },
          { name: 'Company', value: visitor.company_name },
          { name: 'Host', value: visitor.host_name },
          { name: 'Purpose', value: visitor.purpose },
          { name: 'Time', value: time },
        ],
        markdown: true,
      },
    ],
  };
}
