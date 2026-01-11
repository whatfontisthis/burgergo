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
  free_burger_available: boolean
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
      stamps: 0,
      free_burger_available: false
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
    console.error('Supabase not configured')
    throw new Error('Database not configured. Please check your environment variables.')
  }

  // Get current user data
  const { data: user, error: fetchError } = await supabase
    .from('stamp_users')
    .select('stamps, free_burger_available')
    .eq('id', userId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching user:', fetchError)
    throw new Error(`Failed to fetch user: ${fetchError.message}`)
  }
  
  if (!user) {
    throw new Error('User not found')
  }
  
  // Simply increment stamps - no cap, can keep counting beyond 10
  const newStamps = user.stamps + 1
  // Free burger available when user has 10+ stamps
  const newFreeBurgerAvailable = newStamps >= 10
  
  const { data, error } = await supabase
    .from('stamp_users')
    .update({ 
      stamps: newStamps,
      free_burger_available: newFreeBurgerAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding stamp:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to add stamp: ${error.message || 'Unknown error'}`)
  }
  
  if (!data) {
    throw new Error('Update succeeded but no data returned')
  }
  
  // Optional: Log to history (if table exists)
  try {
    await supabase
      .from('stamp_history')
      .insert({ user_id: userId, added_by: 'employee' })
  } catch (err) {
    // Ignore if table doesn't exist or insert fails
    console.warn('Could not log to stamp_history:', err)
  }
  
  return data
}

// Use free burger (redeem 10 stamps for 1 free burger)
export async function useFreeBurger(userId: string): Promise<StampUser | null> {
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
  
  // Subtract 10 stamps (redeem for free burger)
  const newStamps = Math.max(0, user.stamps - 10)
  const newFreeBurgerAvailable = newStamps >= 10

  const { data, error } = await supabase
    .from('stamp_users')
    .update({ 
      stamps: newStamps,
      free_burger_available: newFreeBurgerAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error using free burger:', error)
    throw error
  }
  
  // Log to history
  try {
    await supabase
      .from('stamp_history')
      .insert({ user_id: userId, added_by: 'free_burger_used' })
  } catch (err) {
    // Ignore if table doesn't exist
  }
  
  return data
}

// Buy burger when free burger is available (keep free burger, add new stamp)
export async function buyBurgerWithFreeAvailable(userId: string): Promise<StampUser | null> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Get current user data
  const { data: user } = await supabase
    .from('stamp_users')
    .select('stamps')
    .eq('id', userId)
    .single()
  
  if (!user) throw new Error('User not found')
  
  // Customer buys burger - add stamp (stamps can exceed 10)
  const newStamps = user.stamps + 1
  const newFreeBurgerAvailable = newStamps >= 10

  const { data, error } = await supabase
    .from('stamp_users')
    .update({ 
      stamps: newStamps,
      free_burger_available: newFreeBurgerAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error recording purchase:', error)
    throw error
  }
  
  // Log purchase (free burger not used)
  try {
    await supabase
      .from('stamp_history')
      .insert({ user_id: userId, added_by: 'purchase_with_free_available' })
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

// Stamp history interface
export interface StampHistory {
  id: string
  user_id: string
  added_by: string
  created_at: string
}

// Get stamp history for a user
export async function getStampHistory(userId: string): Promise<StampHistory[]> {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const { data, error } = await supabase
    .from('stamp_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error fetching stamp history:', error)
    return []
  }
  
  return data || []
}
