// supabase/functions/create-user/index.ts
//
// Lets an authenticated Admin / Transport Officer (any role with can_manage)
// create a new staff account with a set password, fully confirmed — no
// email verification step needed.
//
// Deploy via the Supabase Dashboard: Edge Functions -> Create a new function
// -> name it "create-user" -> paste this file's contents -> Deploy.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by Supabase — no manual secrets setup required.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserBody {
  email: string
  password: string
  username: string
  first_name: string
  surname: string
  id_number?: string
  contact_number?: string
  department_id?: string | null
  section_id?: string | null
  location_id?: string | null
  role_id?: string | null
  status?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client scoped to the caller's own JWT — used only to verify who's calling.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client — bypasses RLS, never exposed to the browser.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('role_id, roles:role_id(can_manage)')
      .eq('id', caller.id)
      .single()

    const canManage = !profileErr && (callerProfile?.roles as { can_manage?: boolean } | null)?.can_manage

    if (!canManage) {
      return new Response(JSON.stringify({ error: 'Not authorized to create users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as CreateUserBody

    if (!body.email || !body.password || !body.username || !body.first_name || !body.surname) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        username: body.username,
        first_name: body.first_name,
        surname: body.surname,
      },
    })

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'Failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // The handle_new_user trigger already inserted a bare profile row
    // (Staff role, blank fields). Fill in what the admin actually specified.
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        username: body.username,
        first_name: body.first_name,
        surname: body.surname,
        id_number: body.id_number || null,
        contact_number: body.contact_number || null,
        department_id: body.department_id || null,
        section_id: body.section_id || null,
        location_id: body.location_id || null,
        role_id: body.role_id || null,
        status: body.status || 'Active',
      })
      .eq('id', created.user.id)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: created.user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
