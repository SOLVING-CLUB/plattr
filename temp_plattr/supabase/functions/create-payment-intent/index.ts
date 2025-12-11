import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated. Please log in." }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated. Please log in." }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please set up your Stripe API keys." }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Fetch user's cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        dishes (
          price
        )
      `)
      .eq('user_id', user.id)

    if (cartError) {
      console.error('Error fetching cart:', cartError)
      return new Response(
        JSON.stringify({ error: "Failed to fetch cart items" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate totals from cart items
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.dishes?.price || '0')
      return sum + (price * item.quantity)
    }, 0)

    const deliveryFee = 40
    const tax = Math.round(subtotal * 0.05)
    const total = subtotal + deliveryFee + tax

    if (total <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid cart total" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to paise (smallest currency unit for INR)
      currency: 'inr', // Indian Rupees
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        cartItems: cartItems.length.toString(),
      },
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        amount: total
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to create payment intent",
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

