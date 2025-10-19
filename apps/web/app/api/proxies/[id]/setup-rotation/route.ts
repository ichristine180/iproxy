import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { iproxyService } from '@/lib/iproxy-service';

/**
 * POST /api/proxies/[id]/setup-rotation
 *
 * Creates an action link for a proxy that doesn't have one
 * This enables IP rotation functionality
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch the proxy (RLS ensures user can only access their own)
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select('*')
      .eq('id', id)
      .single();

    if (proxyError || !proxy) {
      return NextResponse.json(
        { success: false, error: 'Proxy not found' },
        { status: 404 }
      );
    }

    // Check if proxy already has action link
    if (proxy.iproxy_action_link_id) {
      return NextResponse.json(
        { success: false, error: 'Proxy already has an action link configured' },
        { status: 400 }
      );
    }

    // Check if proxy has iProxy connection ID
    if (!proxy.iproxy_connection_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proxy does not have iProxy connection ID. Cannot create action link.'
        },
        { status: 400 }
      );
    }

    // Create action link for IP rotation
    console.log(`Creating action link for proxy ${id} on connection ${proxy.iproxy_connection_id}`);

    const actionLinkResult = await iproxyService.createActionLink(
      proxy.iproxy_connection_id,
      'changeip',
      `Rotation link for ${proxy.label || proxy.username}`
    );

    if (!actionLinkResult.success || !actionLinkResult.actionLink) {
      console.error('Failed to create action link:', actionLinkResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create action link: ${actionLinkResult.error}`
        },
        { status: 500 }
      );
    }

    // Update proxy with action link ID
    const { error: updateError } = await supabase
      .from('proxies')
      .update({
        iproxy_action_link_id: actionLinkResult.actionLink.id,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update proxy with action link:', updateError);

      // Try to clean up the created action link
      try {
        await iproxyService.deleteActionLink(
          proxy.iproxy_connection_id,
          actionLinkResult.actionLink.id
        );
      } catch (cleanupError) {
        console.error('Failed to cleanup action link:', cleanupError);
      }

      return NextResponse.json(
        { success: false, error: 'Failed to update proxy with action link' },
        { status: 500 }
      );
    }

    console.log(`Successfully created action link for proxy ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Rotation configured successfully',
      action_link: {
        id: actionLinkResult.actionLink.id,
        link: actionLinkResult.actionLink.link,
      },
    });
  } catch (error) {
    console.error('Error setting up rotation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
