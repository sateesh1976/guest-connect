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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { visitor, eventType } = await req.json() as { visitor: Visitor; eventType: 'checkin' | 'checkout' };

    console.log(`Processing ${eventType} notification for visitor:`, visitor.full_name);

    // Fetch active webhooks
    const { data: webhooks, error: webhookError } = await supabase
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

    const results = await Promise.allSettled(
      activeWebhooks.map(async (webhook) => {
        const message = formatMessage(visitor, eventType, webhook.webhook_type);
        
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
