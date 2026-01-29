import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email?: string
  phone?: string
  remainingWords: number
  isFirstUser: boolean
}

export interface LoginResponse {
  message: string
  user: User
  isFirstUser: boolean
}

/**
 * 发送邮箱验证码（Supabase）
 */
export async function sendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 登录（兼容你原来的 Login.tsx）
 */
export async function login(params: {
  email: string
  code: string
  inviteCode?: string
}): Promise<LoginResponse> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: params.email,
    token: params.code,
    type: 'email',
  })

  if (error || !data.user) {
    throw new Error(error?.message || '登录失败')
  }

  const isFirstUser = true

  return {
    message: '登录成功',
    isFirstUser,
    user: {
      id: data.user.id,
      email: data.user.email || '',
      phone: '',
      remainingWords: 500,
      isFirstUser,
    },
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  return {
    id: data.user.id,
    email: data.user.email || '',
    phone: '',
    remainingWords: 500,
    isFirstUser: false,
  }
}
