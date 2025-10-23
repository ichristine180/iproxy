import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Connection already in stoplist" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to add to stoplist" },
        { status: 500 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in stoplist DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
