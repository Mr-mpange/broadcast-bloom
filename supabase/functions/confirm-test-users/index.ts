import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { emails } = await req.json()

    if (!emails || !Array.isArray(emails)) {
      return new Response(
        JSON.stringify({ error: 'emails array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []

    for (const email of emails) {
      try {
        // Get user by email
        const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (getUserError) {
          results.push({ email, success: false, error: getUserError.message })
          continue
        }

        const user = users.users.find(u => u.email === email)
        
        if (!user) {
          results.push({ email, success: false, error: 'User not found' })
          continue
        }

        // Confirm the user's email
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        )

        if (confirmError) {
          results.push({ email, success: false, error: confirmError.message })
        } else {
          results.push({ email, success: true, message: 'Email confirmed' })
        }
      } catch (error) {
        results.push({ email, success: false, error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})