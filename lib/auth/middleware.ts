/**
 * Authentication Middleware
 * Middleware para proteger rotas e validar autenticação
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from './service'

/**
 * Middleware para rotas de admin
 */
export async function adminMiddleware(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    // Adiciona informações do usuário ao header para uso nas APIs
    const response = NextResponse.next()
    response.headers.set('x-user-id', result.profile!.user_id)
    response.headers.set('x-user-email', result.profile!.email)
    response.headers.set('x-user-role', result.profile!.role)
    
    return response
  } catch (error) {
    console.error('[Auth Middleware] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Middleware para rotas de cliente
 */
export async function customerMiddleware(request: NextRequest) {
  try {
    const { getCurrentProfile } = await import('./service')
    const profile = await getCurrentProfile()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account deactivated' },
        { status: 403 }
      )
    }

    const response = NextResponse.next()
    response.headers.set('x-user-id', profile.user_id)
    response.headers.set('x-user-email', profile.email)
    
    return response
  } catch (error) {
    console.error('[Auth Middleware] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Wrapper para proteger APIs de admin
 */
export function withAdminAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const authResult = await requireAdmin(req)
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Adiciona informações do usuário ao request
    ;(req as any).user = authResult.profile
    
    return handler(req, context)
  }
}

/**
 * Wrapper para proteger APIs de cliente
 */
export function withCustomerAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const { getCurrentProfile } = await import('./service')
    const profile = await getCurrentProfile()
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account deactivated' },
        { status: 403 }
      )
    }

    // Adiciona informações do usuário ao request
    ;(req as any).user = profile
    
    return handler(req, context)
  }
}

/**
 * Verifica se usuário tem permissão específica
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'customer': 0,
    'manager': 1,
    'admin': 2,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

/**
 * Wrapper para verificar permissões específicas
 */
export function withPermission(requiredRole: string) {
  return function(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
    return async (req: NextRequest, context?: any) => {
      const { getCurrentProfile } = await import('./service')
      const profile = await getCurrentProfile()
      
      if (!profile) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      if (!hasPermission(profile.role, requiredRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      ;(req as any).user = profile
      
      return handler(req, context)
    }
  }
}
