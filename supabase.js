import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kiwksgvhlygvinsxvlzl.supabase.co'
const supabaseAnonKey = 'sb_publishable_Bk6jmnQ58KNC-lyt5EO5Cg_i8P8TGMC'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
