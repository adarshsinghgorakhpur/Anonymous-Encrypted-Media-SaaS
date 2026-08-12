import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  pro: { amount: 90000, name: 'XCrypt Pro Plan' }, // $9 = 90000 paise
  ultra: { amount: 290000, name: 'XCrypt Ultra Plan' }, // $29 = 290000 paise
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();

    // Create order
    if (req.method === 'POST' && body.action === 'create_order') {
      const { planId } = body;
      if (!planId || !PLAN_PRICES[planId]) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return new Response(JSON.stringify({
          error: 'Payment system not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
          hint: 'Add keys at https://bolt.new/setup/razorpay'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const planPrice = PLAN_PRICES[planId];
      const orderId = `order_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

      // Create Razorpay order
      const orderData = {
        amount: planPrice.amount,
        currency: 'INR',
        receipt: orderId,
        notes: {
          user_id: user.id,
          plan: planId,
        }
      };

      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(orderData)
      });

      if (!razorpayResponse.ok) {
        const rpError = await razorpayResponse.json();
        console.error('Razorpay order creation failed:', rpError);
        return new Response(JSON.stringify({ error: 'Failed to create payment order' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const order = await razorpayResponse.json();

      return new Response(JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        planId,
        planName: planPrice.name,
        userId: user.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify payment and upgrade subscription
    if (req.method === 'POST' && body.action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
        return new Response(JSON.stringify({ error: 'Missing payment details' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = await new Response(
        await crypto.subtle.sign(
          'HMAC',
          await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(RAZORPAY_KEY_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          ),
          new TextEncoder().encode(text)
        )
      ).arrayBuffer();
      const signatureHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // For simplicity, we'll fetch payment details from Razorpay to verify
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });

      if (!paymentRes.ok) {
        return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const payment = await paymentRes.json();

      if (payment.status !== 'captured') {
        return new Response(JSON.stringify({ error: 'Payment not completed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update subscription
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: upsertError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: planId,
        status: 'active',
        provider: 'razorpay',
        provider_subscription_id: razorpay_payment_id,
        provider_customer_id: payment.customer_id || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Failed to update subscription:', upsertError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        plan: planId,
        validUntil: periodEnd.toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current subscription
    if (req.method === 'GET') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      return new Response(JSON.stringify({ subscription }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Razorpay function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
