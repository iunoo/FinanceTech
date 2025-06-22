// Supabase Edge Function for creating database backups

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all user data
    const userData = await fetchUserData(supabase, userId);

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `financetech-backup-${timestamp}.json`;

    // Create backup record
    const { data: backupRecord, error: backupError } = await supabase
      .from('backup_history')
      .insert([
        {
          user_id: userId,
          filename: filename,
          size: `${(JSON.stringify(userData).length / 1024).toFixed(2)} KB`,
          type: 'manual',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (backupError) {
      console.error("Error creating backup record:", backupError);
    }

    // Create a pre-signed URL for downloading the backup
    // In a real implementation, you would store the backup in Storage
    // For this example, we'll return the data directly
    
    return new Response(
      JSON.stringify({
        success: true,
        data: userData,
        filename: filename,
        timestamp: timestamp,
        backupId: backupRecord?.id || null
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Content-Disposition": `attachment; filename="${filename}"`
        },
      }
    );
  } catch (error) {
    console.error("Error creating backup:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to create backup" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  }
});

async function fetchUserData(supabase, userId) {
  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
  }

  // Fetch user wallets
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);

  if (walletsError) {
    console.error("Error fetching wallets:", walletsError);
  }

  // Fetch user transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  if (transactionsError) {
    console.error("Error fetching transactions:", transactionsError);
  }

  // Fetch user debts
  const { data: debts, error: debtsError } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId);

  if (debtsError) {
    console.error("Error fetching debts:", debtsError);
  }

  // Fetch user categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  // Fetch user settings
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId);

  if (settingsError) {
    console.error("Error fetching settings:", settingsError);
  }

  // Return all user data
  return {
    profile,
    wallets: wallets || [],
    transactions: transactions || [],
    debts: debts || [],
    categories: categories || [],
    settings: settings || [],
    metadata: {
      timestamp: new Date().toISOString(),
      version: "1.0",
      source: "Supabase"
    }
  };
}