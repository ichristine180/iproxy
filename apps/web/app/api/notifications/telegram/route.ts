import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chat_id, chatId, message, parse_mode = 'Markdown' } = body;

    // Support both chat_id and chatId for backwards compatibility
    const telegramChatId = chat_id || chatId;

    // Validate input
    if (!telegramChatId || !message) {
      return NextResponse.json(
        { success: false, error: 'chat_id and message are required' },
        { status: 400 }
      );
    }

    // Check if Telegram bot token is configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return NextResponse.json(
        { success: false, error: 'Telegram bot is not configured' },
        { status: 503 }
      );
    }

    // Send message via Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: parse_mode,
        disable_web_page_preview: true, // Don't show link previews
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);

      // Handle specific Telegram errors
      let errorMessage = 'Failed to send Telegram message';

      if (data.description) {
        if (data.description.includes('chat not found')) {
          errorMessage = 'Invalid Telegram chat ID';
        } else if (data.description.includes('bot was blocked')) {
          errorMessage = 'Bot was blocked by the user';
        } else if (data.description.includes('bot can\'t initiate')) {
          errorMessage = 'User must start the bot first';
        } else {
          errorMessage = data.description;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: data.description
        },
        { status: 400 }
      );
    }

    console.log(`Telegram notification sent to chat_id: ${telegramChatId}`);

    return NextResponse.json({
      success: true,
      message: 'Telegram notification sent successfully',
      message_id: data.result?.message_id,
    });
  } catch (error: any) {
    console.error('Telegram notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
        details: error.message
      },
      { status: 500 }
    );
  }
}
