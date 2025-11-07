import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { iproxyService } from "@/lib/iproxy-service";

// GET - Fetch all stoplist entries
export async function GET() {
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

    // Fetch all stoplist entries
    const { data: stoplist, error } = await supabase
      .from("connection_stoplist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stoplist:", error);
      return NextResponse.json(
        { error: "Failed to fetch stoplist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, stoplist });
  } catch (error) {
    console.error("Error in stoplist GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add connection to stoplist
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

    const { connectionId } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Validate that connection exists in iProxy
    const connectionResult = await iproxyService.getConnection(connectionId);

    if (!connectionResult.success) {
      return NextResponse.json(
        { error: connectionResult.error || "Connection ID not found in iProxy" },
        { status: 404 }
      );
    }

    // Check if already in stoplist
    const { data: existing } = await supabase
      .from("connection_stoplist")
      .select("id")
      .eq("connection_id", connectionId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Connection already in stoplist" },
        { status: 400 }
      );
    }

    // Add to stoplist
    const { data, error } = await supabase
      .from("connection_stoplist")
      .insert({
        connection_id: connectionId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding to stoplist:", error);
      return NextResponse.json(
        { error: "Failed to add to stoplist" },
        { status: 500 }
      );
    }

    // Reduce quota by 1 when adding to stoplist
    const { data: quota, error: quotaFetchError } = await supabase
      .from("quota")
      .select("*")
      .limit(1)
      .single();

    if (quotaFetchError && quotaFetchError.code !== "PGRST116") {
      console.error("Error fetching quota:", quotaFetchError);
    } else if (quota) {
      // Update quota - reduce available connections by 1
      const newAvailable = Math.max(0, quota.available_connection_number - 1);

      const { error: quotaUpdateError } = await supabase
        .from("quota")
        .update({
          available_connection_number: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quota.id);

      if (quotaUpdateError) {
        console.error("Error updating quota:", quotaUpdateError);
        // Don't fail the whole operation if quota update fails
      } else {
        console.log(`Quota reduced: ${quota.available_connection_number} → ${newAvailable}`);
      }
    } else {
      console.warn("No quota record found - skipping quota reduction");
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (error) {
    console.error("Error in stoplist POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove connection from stoplist
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Get the stoplist entry before deleting (to log connection_id)
    const { data: stoplisted, error: fetchError } = await supabase
      .from("connection_stoplist")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching stoplist entry:", fetchError);
      return NextResponse.json(
        { error: "Stoplist entry not found" },
        { status: 404 }
      );
    }

    // Delete from stoplist
    const { error } = await supabase
      .from("connection_stoplist")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting from stoplist:", error);
      return NextResponse.json(
        { error: "Failed to delete from stoplist" },
        { status: 500 }
      );
    }

    // Add quota back when removing from stoplist
    const { data: quota, error: quotaFetchError } = await supabase
      .from("quota")
      .select("*")
      .limit(1)
      .single();

    if (quotaFetchError && quotaFetchError.code !== "PGRST116") {
      console.error("Error fetching quota:", quotaFetchError);
    } else if (quota) {
      // Update quota - add 1 connection back
      const newAvailable = quota.available_connection_number + 1;

      const { error: quotaUpdateError } = await supabase
        .from("quota")
        .update({
          available_connection_number: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quota.id);

      if (quotaUpdateError) {
        console.error("Error updating quota:", quotaUpdateError);
        // Don't fail the whole operation if quota update fails
      } else {
        console.log(`Quota increased: ${quota.available_connection_number} → ${newAvailable}`);
        console.log(`Removed connection ${stoplisted.connection_id} from stoplist`);
      }
    } else {
      // Create quota if it doesn't exist
      const { error: quotaCreateError } = await supabase
        .from("quota")
        .insert({
          available_connection_number: 1,
        });

      if (quotaCreateError) {
        console.error("Error creating quota:", quotaCreateError);
      } else {
        console.log("Created quota with 1 available connection");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in stoplist DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
