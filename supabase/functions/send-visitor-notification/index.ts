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

    // Validate user and get claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user has staff role
    const { data: roleData, error: roleError } = await supabaseUser
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

    // Use service role for webhook settings (admin-only table)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { visitor, eventType } = await req.json() as { visitor: Visitor; eventType: 'checkin' | 'checkout' };

    console.log(`Processing ${eventType} notification for visitor:`, visitor.full_name);

    // Validate visitor exists in database
    if (visitor.id) {
      const { data: visitorData, error: visitorError } = await supabaseUser
        .from('visitors')
        .select('id')
        .eq('id', visitor.id)
        .maybeSingle();

      if (visitorError || !visitorData) {
        console.error("Visitor not found:", visitorError);
        return new Response(
          JSON.stringify({ success: false, error: 'Visitor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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
        const message = formatMessage(safeVisitor, eventType, webhook.webhook_type);
        
        console.log(`Sending ${webhook.webhook_type} notification to ${webhook.name}`);
        
        const response = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
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
