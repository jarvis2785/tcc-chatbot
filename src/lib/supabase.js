import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function testConnection() {
  const { error } = await supabase.from('leads').select('count').limit(1)
  if (error) {
    console.error('Supabase connection failed:', error.message)
    return false
  }
  console.log('Supabase connection successful')
  return true
}

export async function saveLead(data) {
  console.log('[Supabase] saveLead:', data)
  try {
    const { data: inserted, error } = await supabase
      .from('leads')
      .insert([data])
      .select()

    if (error) {
      console.error('[Supabase] insert error:', error.message, error)
      return false
    }

    console.log('[Supabase] inserted:', inserted)
    return true
  } catch (err) {
    console.error('[Supabase] unexpected insert error:', err)
    return false
  }
}

export async function updateLead(email, data) {
  console.log('[Supabase] updateLead:', email, data)
  try {
    const { data: updated, error } = await supabase
      .from('leads')
      .update(data)
      .eq('email', email)
      .select()

    if (error) {
      console.error('[Supabase] update error:', error.message, error)
      return false
    }

    console.log('[Supabase] updated:', updated)
    return true
  } catch (err) {
    console.error('[Supabase] unexpected update error:', err)
    return false
  }
}
