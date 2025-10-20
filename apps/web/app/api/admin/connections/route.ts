import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';

/**
 * GET /api/admin/connections
 * Fetch all connections from connection_info table
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Fetch all connections from connection_info table
    const { data: connections, error: connectionsError } = await supabase
      .from('connection_info')
      .select(`
        id,
        connection_id,
        client_email,
        proxy_access,
        is_occupied,
        expires_at,
        created_at,
        order_id
      `)
      .order('created_at', { ascending: false });

    if (connectionsError) {
      throw connectionsError;
    }

    return NextResponse.json({
      success: true,
      connections: connections || []
    });

  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/connections
 * Add a new connection by connection ID
 * Note: Connection is added without proxy details. Details will be populated when assigned to user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Check if connection already exists in our database
    const { data: existingConnection } = await supabase
      .from('connection_info')
      .select('id')
      .eq('connection_id', connectionId)
      .single();

    if (existingConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection ID already exists in database' },
        { status: 400 }
      );
    }

    // Validate that the connection exists in iProxy API
    const connectionResult = await iproxyService.getConnection(connectionId);

    if (!connectionResult.success || !connectionResult.connection) {
      return NextResponse.json(
        { success: false, error: 'Connection ID not found in iProxy. Please verify the connection ID is correct.' },
        { status: 400 }
      );
    }

    // Create connection record in connection_info table
    // Proxy details will be added later when assigned to user
    const { data: newConnection, error: insertError } = await supabase
      .from('connection_info')
      .insert({
        connection_id: connectionId,
        is_occupied: false
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Connection validated and added successfully',
      connection: newConnection
    });

  } catch (error) {
    console.error('Error adding connection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/connections
 * Remove a connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Delete the connection from connection_info table
    const { error: deleteError } = await supabase
      .from('connection_info')
      .delete()
      .eq('id', connectionId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Connection removed successfully'
    });

  } catch (error) {
    console.error('Error removing connection:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
