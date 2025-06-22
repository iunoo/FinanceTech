// Supabase Edge Function for sending Telegram messages

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

interface TelegramRequest {
  telegramId: string;
  message: string;
  reminderType?: string;
  reportType?: string;
  hasAttachment?: boolean;
}

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

    // Parse request body
    const { telegramId, message, reminderType, reportType, hasAttachment } = await req.json() as TelegramRequest;

    if (!telegramId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send message to Telegram
    const telegramResponse = await fetch(
      `${TELEGRAM_API_URL}${telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      throw new Error(
        `Telegram API error: ${telegramData.description || "Unknown error"}`
      );
    }

    // Log the type of message sent
    let logMessage = "Message sent successfully";
    if (reminderType) {
      logMessage = `${reminderType.toUpperCase()} reminder sent successfully`;
    } else if (reportType) {
      logMessage = `${reportType.toUpperCase()} report sent successfully`;
      if (hasAttachment) {
        logMessage += " (with attachment)";
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: logMessage,
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
    console.error("Error sending Telegram message:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send Telegram message" 
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