import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { phone } = await req.json()

    // Validate phone
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Phone must be 10 digits" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone,
        otp,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: "Failed to store OTP" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send SMS using 2factor.in
    const apiKey = Deno.env.get('TWOFACTOR_API_KEY') || Deno.env.get('BULK_SMS_API_KEY')
    const templateName = Deno.env.get('TWOFACTOR_TEMPLATE_NAME') || 'PLATTR'
    
    if (!apiKey) {
      // In development, just return OTP in response
      console.log(`📱 [DEV MODE] SMS to +91${phone}: Your OTP is ${otp}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent successfully",
          otp // Include OTP in dev mode
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Format phone with country code
    const phoneWithCountryCode = `91${phone}`
    const apiUrl = templateName
      ? `https://2factor.in/API/V1/${apiKey}/SMS/${phoneWithCountryCode}/${otp}/${templateName}`
      : `https://2factor.in/API/V1/${apiKey}/SMS/${phoneWithCountryCode}/${otp}`

    const smsResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error('SMS API Error:', errorText)
      
      // In development, still return success with OTP
      if (Deno.env.get('NODE_ENV') === 'development') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "OTP sent successfully (dev mode)",
            otp
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to send OTP" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const responseData: any = {
      success: true,
      message: "OTP sent successfully",
    }

    // In development, include OTP in response
    if (Deno.env.get('NODE_ENV') === 'development') {
      responseData.otp = otp
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

