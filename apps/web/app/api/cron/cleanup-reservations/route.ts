import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint should be called by a cron job (e.g., Vercel Cron, external cron service)
// to cleanup expired quota reservations
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    // You can use a secret token for authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the cleanup function
    const { data: result, error } = await supabaseAdmin.rpc(
      "release_expired_reservations"
    );

    if (error) {
      console.error("Error releasing expired reservations:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to release expired reservations",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`Cleaned up ${result} expired reservations`);

    return NextResponse.json({
      success: true,
      released_count: result,
      message: `Successfully released ${result} expired reservation(s)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in cleanup cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
