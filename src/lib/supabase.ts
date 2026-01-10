import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if credentials are provided
let supabase: SupabaseClient | null = null
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
}

export { supabase }

// Types
export interface StampUser {
  id: string
  name: string
  phone_full: string
  phone_last4: string
  stamps: number
  created_at: string
  updated_at: string
}

// Search users by last 4 digits
export async function searchUsersByLast4(last4: string): Promise<StampUser[]> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured. Using mock data.')
    return []
  }

  if (!supabase) return []
  
  const { data, error } = await supabase
    .from('stamp_users')
    .select('*')
    .eq('phone_last4', last4)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error searching users:', error)
    return []
  }
  return data || []
}

// Register new user
export async function registerUser(name: string, phoneFull: string): Promise<StampUser | null> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured.')
    return null
  }

  if (!supabase) return null
  
  const phoneLast4 = phoneFull.replace(/\D/g, '').slice(-4)
  const cleanedPhone = phoneFull.replace(/\D/g, '')
  
  // Check for duplicate phone number
  const { data: existing } = await supabase
    .from('stamp_users')
    .select('*')
    .eq('phone_full', cleanedPhone)
    .single()
  
  if (existing) {
    throw new Error('Phone number already registered')
  }
  
  const { data, error } = await supabase
    .from('stamp_users')
    .insert({
      name: name.trim(),
      phone_full: cleanedPhone,
      phone_last4: phoneLast4,
      stamps: 0
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error registering user:', error)
    throw error
  }
  return data
}

// Verify user by name (when multiple users have same last4)
export async function verifyUserByName(name: string, phoneLast4: string): Promise<StampUser | null> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const { data, error } = await supabase
    .from('stamp_users')
    .select('*')
    .eq('phone_last4', phoneLast4)
    .ilike('name', `%${name.trim()}%`)
    .single()
  
  if (error || !data) return null
  return data
}

// Search users by name or last4 (for employees)
export async function searchUsers(query: string): Promise<StampUser[]> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const isNumeric = /^\d+$/.test(query)
  
  if (isNumeric && query.length === 4) {
    // Search by last 4 digits
    return searchUsersByLast4(query)
  } else {
    // Search by name
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('stamp_users')
      .select('*')
      .ilike('name', `%${query.trim()}%`)
      .limit(10)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error searching users:', error)
      return []
    }
    return data || []
  }
}

// Add stamp to user
export async function addStamp(userId: string): Promise<StampUser | null> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Get current stamps
  const { data: user } = await supabase
    .from('stamp_users')
    .select('stamps')
    .eq('id', userId)
    .single()
  
  if (!user) throw new Error('User not found')
  
  const newStamps = Math.min(user.stamps + 1, 10) // Cap at 10
  
  const { data, error } = await supabase
    .from('stamp_users')
    .update({ 
      stamps: newStamps,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding stamp:', error)
    throw error
  }
  
  // Optional: Log to history (if table exists)
  try {
    await supabase
      .from('stamp_history')
      .insert({ user_id: userId, added_by: 'employee' })
  } catch (err) {
    // Ignore if table doesn't exist
  }
  
  return data
}

// Get user by ID
export async function getUserById(userId: string): Promise<StampUser | null> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const { data, error } = await supabase
    .from('stamp_users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error || !data) return null
  return data
}
