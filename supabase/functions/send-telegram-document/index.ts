// Supabase Edge Function for sending documents via Telegram

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

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

    // Get Telegram bot token from environment variables
    const telegramToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!telegramToken) {
      return new Response(
        JSON.stringify({ error: "Telegram bot token not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const telegramId = formData.get("telegramId");
    const document = formData.get("document");
    const caption = formData.get("caption") || "Document from FinanceTech";

    if (!telegramId || !document) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create new FormData for Telegram API
    const telegramFormData = new FormData();
    telegramFormData.append("chat_id", telegramId.toString());
    telegramFormData.append("document", document);
    telegramFormData.append("caption", caption.toString());
    telegramFormData.append("parse_mode", "Markdown");

    // Send document to Telegram
    const telegramResponse = await fetch(
      `${TELEGRAM_API_URL}${telegramToken}/sendDocument`,
      {
        method: "POST",
        body: telegramFormData,
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      throw new Error(
        `Telegram API error: ${telegramData.description || "Unknown error"}`
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Document sent successfully",
        telegramResponse: telegramData
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
    console.error("Error sending Telegram document:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send Telegram document" 
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