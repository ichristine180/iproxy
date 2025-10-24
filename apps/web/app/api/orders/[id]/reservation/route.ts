import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET - Check reservation status for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const orderId = params.id;

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get reservation for this order
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("quota_reservations")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reservationError) {
      console.error("Error fetching reservation:", reservationError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reservation" },
        { status: 500 }
      );
    }

    if (!reservation) {
      return NextResponse.json({
        success: true,
        has_reservation: false,
        order_status: order.status,
      });
    }

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    const expiresInSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    );

    const isExpired = expiresInSeconds === 0 || reservation.status !== "reserved";

    return NextResponse.json({
      success: true,
      has_reservation: true,
      reservation: {
        id: reservation.id,
        status: reservation.status,
        reserved_connections: reservation.reserved_connections,
        reserved_at: reservation.reserved_at,
        expires_at: reservation.expires_at,
        expires_in_seconds: expiresInSeconds,
        expires_in_minutes: Math.floor(expiresInSeconds / 60),
        is_expired: isExpired,
        confirmed_at: reservation.confirmed_at,
        released_at: reservation.released_at,
      },
      order_status: order.status,
    });
  } catch (error) {
    console.error("Error in reservation status API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Manually cancel/release reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const orderId = params.id;

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Release reservation
    const { data: releaseResult, error: releaseError } = await supabaseAdmin
      .rpc('release_quota_reservation', { p_order_id: orderId });

    if (releaseError) {
      console.error("Error releasing reservation:", releaseError);
      return NextResponse.json(
        { success: false, error: "Failed to release reservation" },
        { status: 500 }
      );
    }

    // Cancel order if still pending
    if (order.status === "pending") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    return NextResponse.json({
      success: true,
      message: "Reservation released successfully",
      result: releaseResult,
    });
  } catch (error) {
    console.error("Error in reservation release API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
