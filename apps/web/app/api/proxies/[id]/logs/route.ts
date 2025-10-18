import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/proxies/[id]/logs
 *
 * Fetches rotation logs for a specific proxy
 *
 * Query params:
 * - limit: Number of logs to fetch (default: 20)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proxyId = id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify proxy belongs to user (RLS will handle this, but good to check)
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select('id, label')
      .eq('id', proxyId)
      .single();

    if (proxyError || !proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy not found' },
        { status: 404 }
      );
    }

    // Fetch rotation logs (RLS ensures user can only see their own logs)
    const { data: logs, error: logsError, count } = await supabase
      .from('rotation_logs')
      .select('*', { count: 'exact' })
      .eq('proxy_id', proxyId)
      .order('rotated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('Error fetching rotation logs:', logsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in logs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
