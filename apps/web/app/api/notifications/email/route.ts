import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, from = 'noreply@iproxy.com' } = body;

    // Validate input
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'to, subject, and html are required' },
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

    // TODO: Implement Resend email sending
    // const resendApiKey = process.env.RESEND_API_KEY;
    //
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${resendApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     from,
    //     to,
    //     subject,
    //     html,
    //   }),
    // });
    //
    // const data = await response.json();
    //
    // if (!response.ok) {
    //   return NextResponse.json(
    //     { success: false, error: 'Failed to send email' },
    //     { status: 500 }
    //   );
    // }

    // Placeholder response
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: `email_${Date.now()}`,
    });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
