/**
 * Authentication Service
 * Serviço completo de autenticação e gestão de usuários
 */

import { createClient } from '@supabase/supabase-js'
import { getSupabaseServer, getSupabaseService } from '@/lib/supabase/server'
import { getSupabaseClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

export interface Profile {
  id: string
  user_id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'customer'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  user_id: string
  type: 'shipping' | 'billing'
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
  phone?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface LoginHistory {
  id: string
  user_id: string
  email: string
  ip_address?: string
  user_agent?: string
  success: boolean
  failure_reason?: string
  created_at: string
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !profile) return null

    return profile as Profile
  } catch (error) {
    console.error('[Auth] Error getting current profile:', error)
    return null
  }
}

/**
 * Verifica se o usuário atual é admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin' || profile?.role === 'manager'
}

/**
 * Login com email e senha
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = await getSupabaseServer()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Registra tentativa falha
      await recordLoginAttempt(email, false, error.message)
      throw error
    }

    // Registra tentativa bem-sucedida
    await recordLoginAttempt(email, true)

    return data
  } catch (error) {
    console.error('[Auth] Sign in error:', error)
    throw error
  }
}

/**
 * Registro de novo usuário
 */
export async function signUp(email: string, password: string, fullName?: string) {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('[Auth] Sign up error:', error)
    throw error
  }
}

/**
 * Logout
 */
export async function signOut() {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    // Limpa cookies
    const cookieStore = await cookies()
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')
  } catch (error) {
    console.error('[Auth] Sign out error:', error)
    throw error
  }
}

/**
 * Reset de senha
 */
export async function resetPassword(email: string) {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) throw error

    return true
  } catch (error) {
    console.error('[Auth] Reset password error:', error)
    throw error
  }
}

/**
 * Atualizar senha
 */
export async function updatePassword(newPassword: string) {
  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return true
  } catch (error) {
    console.error('[Auth] Update password error:', error)
    throw error
  }
}

/**
 * Atualizar perfil do usuário
 */
export async function updateProfile(updates: Partial<Profile>) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) throw new Error('User not authenticated')

    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single()

    if (error) throw error

    return data as Profile
  } catch (error) {
    console.error('[Auth] Update profile error:', error)
    throw error
  }
}

/**
 * Obter endereços do cliente
 */
export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  try {
    const profile = await getCurrentProfile()
    if (!profile) throw new Error('User not authenticated')

    const supabase = await getSupabaseServer()

    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as CustomerAddress[]
  } catch (error) {
    console.error('[Auth] Get addresses error:', error)
    throw error
  }
}

/**
 * Criar ou atualizar endereço
 */
export async function upsertAddress(address: Omit<CustomerAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) throw new Error('User not authenticated')

    const supabase = await getSupabaseServer()

    // Se for default, remove default dos outros endereços do mesmo tipo
    if (address.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', profile.user_id)
        .eq('type', address.type)
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .upsert({
        ...address,
        user_id: profile.user_id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return data as CustomerAddress
  } catch (error) {
    console.error('[Auth] Upsert address error:', error)
    throw error
  }
}

/**
 * Excluir endereço
 */
export async function deleteAddress(addressId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) throw new Error('User not authenticated')

    const supabase = await getSupabaseServer()

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', profile.user_id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('[Auth] Delete address error:', error)
    throw error
  }
}

/**
 * Registra tentativa de login
 */
async function recordLoginAttempt(email: string, success: boolean, failureReason?: string) {
  try {
    const supabase = getSupabaseService()
    if (!supabase) return

    await supabase
      .from('login_history')
      .insert({
        email,
        success,
        failure_reason: failureReason,
        created_at: new Date().toISOString(),
      })
  } catch (error) {
    console.error('[Auth] Record login attempt error:', error)
  }
}

/**
 * Obter histórico de login (admin)
 */
export async function getLoginHistory(limit = 50) {
  try {
    const supabase = getSupabaseService()
    if (!supabase) throw new Error('Service client not available')

    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data as LoginHistory[]
  } catch (error) {
    console.error('[Auth] Get login history error:', error)
    throw error
  }
}

/**
 * Listar todos os perfis (admin)
 */
export async function getAllProfiles() {
  try {
    const supabase = getSupabaseService()
    if (!supabase) throw new Error('Service client not available')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as Profile[]
  } catch (error) {
    console.error('[Auth] Get all profiles error:', error)
    throw error
  }
}

/**
 * Atualizar role de usuário (admin)
 */
export async function updateUserRole(userId: string, role: Profile['role']) {
  try {
    const supabase = getSupabaseService()
    if (!supabase) throw new Error('Service client not available')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return data as Profile
  } catch (error) {
    console.error('[Auth] Update user role error:', error)
    throw error
  }
}

/**
 * Middleware para validar admin
 */
export async function requireAdmin(request?: Request) {
  const profile = await getCurrentProfile()

  if (!profile) {
    return { error: 'Not authenticated', status: 401 }
  }

  if (!['admin', 'manager'].includes(profile.role)) {
    return { error: 'Access denied', status: 403 }
  }

  if (!profile.is_active) {
    return { error: 'Account deactivated', status: 403 }
  }

  return { profile }
}

export default {
  getCurrentProfile,
  isAdmin,
  signIn,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  updateProfile,
  getCustomerAddresses,
  upsertAddress,
  deleteAddress,
  getLoginHistory,
  getAllProfiles,
  updateUserRole,
  requireAdmin,
}
