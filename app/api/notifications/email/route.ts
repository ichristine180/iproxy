import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, text, html, from } = body;

    // Validate input - accept either text or html
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { success: false, error: 'to, subject, and either text or html are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get email configuration from environment
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultFromEmail = process.env.EMAIL_FROM;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Use provided 'from' or fall back to environment variable
    const fromEmail = from || defaultFromEmail;

    // Build email payload - prefer text over html
    const emailPayload: any = {
      from: fromEmail,
      to,
      subject,
    };

    if (text) {
      emailPayload.text = text;
    } else if (html) {
      emailPayload.html = html;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data.id,
    });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
