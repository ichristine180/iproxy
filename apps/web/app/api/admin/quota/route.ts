import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch quota (single row)
// Accessible to all authenticated users (read-only)
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch quota (should be a single row)
    // All authenticated users can view quota
    const { data: quota, error } = await supabase
      .from("quota")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching quota:", error);
      return NextResponse.json(
        { error: "Failed to fetch quota" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, quota });
  } catch (error) {
    console.error("Error in quota GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update quota
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { availableConnectionNumber } = await request.json();

    if (availableConnectionNumber === undefined || availableConnectionNumber === null) {
      return NextResponse.json(
        { error: "Available connection number is required" },
        { status: 400 }
      );
    }

    if (availableConnectionNumber < 0) {
      return NextResponse.json(
        { error: "Available connection number must be non-negative" },
        { status: 400 }
      );
    }

    // Check if quota already exists
    const { data: existingQuota } = await supabase
      .from("quota")
      .select("*")
      .limit(1)
      .maybeSingle();

    let data, error;

    if (existingQuota) {
      // Update existing quota
      const result = await supabase
        .from("quota")
        .update({
          available_connection_number: availableConnectionNumber,
        })
        .eq("id", existingQuota.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Create new quota
      const result = await supabase
        .from("quota")
        .insert({
          available_connection_number: availableConnectionNumber,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error saving quota:", error);
      return NextResponse.json(
        { error: "Failed to save quota" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, quota: data });
  } catch (error) {
    console.error("Error in quota POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update quota
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { availableConnectionNumber } = await request.json();

    if (availableConnectionNumber === undefined || availableConnectionNumber === null) {
      return NextResponse.json(
        { error: "Available connection number is required" },
        { status: 400 }
      );
    }

    if (availableConnectionNumber < 0) {
      return NextResponse.json(
        { error: "Available connection number must be non-negative" },
        { status: 400 }
      );
    }

    // Get the quota row
    const { data: existingQuota } = await supabase
      .from("quota")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!existingQuota) {
      return NextResponse.json(
        { error: "Quota not found. Please create one first." },
        { status: 404 }
      );
    }

    // Update quota
    const { data, error } = await supabase
      .from("quota")
      .update({
        available_connection_number: availableConnectionNumber,
      })
      .eq("id", existingQuota.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quota:", error);
      return NextResponse.json(
        { error: "Failed to update quota" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, quota: data });
  } catch (error) {
    console.error("Error in quota PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
