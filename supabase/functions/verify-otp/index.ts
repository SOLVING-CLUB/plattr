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
    const { phone, otp, username } = await req.json()

    // Validate inputs
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Phone must be 10 digits" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "OTP must be 6 digits" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find valid OTP
    const { data: otpRecords, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('otp', otp)
      .eq('is_used', false)
      .limit(1)

    if (otpError || !otpRecords || otpRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const otpRecord = otpRecords[0]

    // Check expiration
    const expiresAt = new Date(otpRecord.expires_at)
    if (expiresAt <= new Date()) {
      return new Response(
        JSON.stringify({ error: "OTP has expired" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mark OTP as used
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpRecord.id)

    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .limit(1)

    let user
    if (existingUsers && existingUsers.length > 0) {
      // Existing user - login
      user = existingUsers[0]
    } else {
      // New user - signup
      // Generate temporary username if not provided
      const tempUsername = username || `user_${Math.floor(1000 + Math.random() * 9000)}`
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: tempUsername,
          phone,
          password: '',
          is_verified: true,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      user = newUser
    }

    // Create Supabase Auth user if doesn't exist
    // Note: This requires admin privileges, so we'll use Supabase Auth API
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.phone === `+91${phone}`)

    if (!existingAuthUser) {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        phone: `+91${phone}`,
        phone_confirmed: true,
        user_metadata: {
          username: user.username,
        },
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        // Continue anyway - user record exists in database
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          isVerified: user.is_verified || user.isVerified,
        },
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify OTP" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

