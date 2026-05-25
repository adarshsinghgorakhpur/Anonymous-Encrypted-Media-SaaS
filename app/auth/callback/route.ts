import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } catch (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
