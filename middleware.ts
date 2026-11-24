import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  if (pathname.startsWith('/admin')) {
    const { data: isOwner, error: ownerError } = await supabase.rpc('is_owner')

    if (!ownerError) {
      if (!isOwner) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      return response
    }

    console.error('Unable to verify owner with database function:', ownerError.message)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Unable to verify admin session:', authError.message)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Unable to verify admin role:', error.message)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (profile?.role !== 'owner') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}