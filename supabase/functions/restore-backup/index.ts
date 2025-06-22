// Supabase Edge Function for restoring database from backup

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
    const { backupData, userId } = await req.json();
    
    if (!backupData || !userId) {
      return new Response(
        JSON.stringify({ error: "Backup data and user ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate backup data
    if (!backupData.metadata || !backupData.metadata.version) {
      return new Response(
        JSON.stringify({ error: "Invalid backup format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a temporary backup of current data
    const currentData = await fetchUserData(supabase, userId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempBackupFilename = `pre-restore-backup-${timestamp}.json`;

    // Create backup record for the temporary backup
    const { error: tempBackupError } = await supabase
      .from('backup_history')
      .insert([
        {
          user_id: userId,
          filename: tempBackupFilename,
          size: `${(JSON.stringify(currentData).length / 1024).toFixed(2)} KB`,
          type: 'automatic',
          created_at: new Date().toISOString()
        }
      ]);

    if (tempBackupError) {
      console.error("Error creating temporary backup record:", tempBackupError);
    }

    // Restore data from backup
    const restoreResult = await restoreUserData(supabase, userId, backupData);

    // Create a record for the restore operation
    const { data: restoreRecord, error: restoreRecordError } = await supabase
      .from('backup_history')
      .insert([
        {
          user_id: userId,
          filename: `restore-${timestamp}.json`,
          size: `${(JSON.stringify(backupData).length / 1024).toFixed(2)} KB`,
          type: 'restore',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (restoreRecordError) {
      console.error("Error creating restore record:", restoreRecordError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Database berhasil dipulihkan dari backup!",
        tempBackup: tempBackupFilename,
        restoreId: restoreRecord?.id || null,
        details: restoreResult
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      }
    );
  } catch (error) {
    console.error("Error restoring backup:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to restore backup" 
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch user wallets
  const { data: wallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);

  // Fetch user transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  // Fetch user debts
  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', userId);

  // Fetch user categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId);

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

async function restoreUserData(supabase, userId, backupData) {
  const results = {
    deletions: {},
    insertions: {}
  };

  // Delete existing data (in reverse order of dependencies)
  // First delete transactions
  const { error: deleteTransactionsError, count: deletedTransactions } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .select('count');
  
  results.deletions.transactions = deletedTransactions || 0;
  if (deleteTransactionsError) console.error("Error deleting transactions:", deleteTransactionsError);

  // Delete debts
  const { error: deleteDebtsError, count: deletedDebts } = await supabase
    .from('debts')
    .delete()
    .eq('user_id', userId)
    .select('count');
  
  results.deletions.debts = deletedDebts || 0;
  if (deleteDebtsError) console.error("Error deleting debts:", deleteDebtsError);

  // Delete categories
  const { error: deleteCategoriesError, count: deletedCategories } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .select('count');
  
  results.deletions.categories = deletedCategories || 0;
  if (deleteCategoriesError) console.error("Error deleting categories:", deleteCategoriesError);

  // Delete wallets
  const { error: deleteWalletsError, count: deletedWallets } = await supabase
    .from('wallets')
    .delete()
    .eq('user_id', userId)
    .select('count');
  
  results.deletions.wallets = deletedWallets || 0;
  if (deleteWalletsError) console.error("Error deleting wallets:", deleteWalletsError);

  // Delete settings
  const { error: deleteSettingsError, count: deletedSettings } = await supabase
    .from('user_settings')
    .delete()
    .eq('user_id', userId)
    .select('count');
  
  results.deletions.settings = deletedSettings || 0;
  if (deleteSettingsError) console.error("Error deleting settings:", deleteSettingsError);

  // Insert data from backup (in order of dependencies)
  // First update profile
  if (backupData.profile) {
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        name: backupData.profile.name,
        email: backupData.profile.email,
        telegram_id: backupData.profile.telegram_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateProfileError) console.error("Error updating profile:", updateProfileError);
  }

  // Insert wallets
  if (backupData.wallets && backupData.wallets.length > 0) {
    const walletsToInsert = backupData.wallets.map(wallet => ({
      ...wallet,
      user_id: userId,
      id: undefined // Let Supabase generate new IDs
    }));

    const { data: insertedWallets, error: insertWalletsError } = await supabase
      .from('wallets')
      .insert(walletsToInsert)
      .select();
    
    results.insertions.wallets = insertedWallets?.length || 0;
    if (insertWalletsError) console.error("Error inserting wallets:", insertWalletsError);
  }

  // Insert categories
  if (backupData.categories && backupData.categories.length > 0) {
    const categoriesToInsert = backupData.categories.map(category => ({
      ...category,
      user_id: userId,
      id: undefined // Let Supabase generate new IDs
    }));

    const { data: insertedCategories, error: insertCategoriesError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();
    
    results.insertions.categories = insertedCategories?.length || 0;
    if (insertCategoriesError) console.error("Error inserting categories:", insertCategoriesError);
  }

  // Insert transactions
  if (backupData.transactions && backupData.transactions.length > 0) {
    const transactionsToInsert = backupData.transactions.map(transaction => ({
      ...transaction,
      user_id: userId,
      id: undefined // Let Supabase generate new IDs
    }));

    const { data: insertedTransactions, error: insertTransactionsError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();
    
    results.insertions.transactions = insertedTransactions?.length || 0;
    if (insertTransactionsError) console.error("Error inserting transactions:", insertTransactionsError);
  }

  // Insert debts
  if (backupData.debts && backupData.debts.length > 0) {
    const debtsToInsert = backupData.debts.map(debt => ({
      ...debt,
      user_id: userId,
      id: undefined // Let Supabase generate new IDs
    }));

    const { data: insertedDebts, error: insertDebtsError } = await supabase
      .from('debts')
      .insert(debtsToInsert)
      .select();
    
    results.insertions.debts = insertedDebts?.length || 0;
    if (insertDebtsError) console.error("Error inserting debts:", insertDebtsError);
  }

  // Insert settings
  if (backupData.settings && backupData.settings.length > 0) {
    const settingsToInsert = backupData.settings.map(setting => ({
      ...setting,
      user_id: userId,
      id: undefined, // Let Supabase generate new IDs
      updated_at: new Date().toISOString()
    }));

    const { data: insertedSettings, error: insertSettingsError } = await supabase
      .from('user_settings')
      .insert(settingsToInsert)
      .select();
    
    results.insertions.settings = insertedSettings?.length || 0;
    if (insertSettingsError) console.error("Error inserting settings:", insertSettingsError);
  }

  return results;
}