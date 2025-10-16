import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Plan } from '@/types/plan';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create Supabase client at runtime (not at module load time)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Retry logic to handle intermittent SSL/TLS connection issues
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        const { data: plans, error } = await supabaseAdmin
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_usd_month', { ascending: true });

        if (error) {
          throw error;
        }

        return NextResponse.json({ plans: plans as Plan[] });
      } catch (err) {
        lastError = err;
        attempts++;

        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    // If all retries failed
    console.error('Error fetching plans after retries:', lastError);
    const errorMessage = lastError instanceof Error ? lastError.message : 'Database error';
    return NextResponse.json(
      { error: `Database error: ${errorMessage}` },
      { status: 500 }
    );
  } catch (error) {
    console.error('Unexpected error in /api/plans:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
