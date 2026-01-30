import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        // Create a Supabase client with the user's JWT
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        );

        // Verify the requesting user is an admin
        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error('Unauthorized');
        }

        // Check if user is admin
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            throw new Error('Only admins can create users');
        }

        // Get request body
        const { login, password, role } = await req.json();
        const email = `${login.trim().toLowerCase()}@claro.com.br`;

        // Create admin client with service role
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Create user with admin client (no auto-login)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                login: login.trim().toUpperCase(),
            },
        });

        if (createError) throw createError;

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([
                {
                    id: newUser.user.id,
                    login: login.trim().toUpperCase(),
                    role: role || 'analyst',
                },
            ]);

        if (profileError) throw profileError;

        return new Response(
            JSON.stringify({
                success: true,
                message: `Usuário ${login.toUpperCase()} criado com sucesso!`,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
