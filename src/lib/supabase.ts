import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY, copy .env.example to .env')
}

export const supabase = createClient(url, key)

export type SharedItem = {
  id: string
  owner_id: string
  title: string
  recipient: string
  content: string
  created_at: string
  updated_at: string
  item_restrictions: ItemRestriction[]
}

export type ItemRestriction = {
  id: string
  item_id: string
  restriction_type: RestrictionType
  value: string
}

export type RestrictionType =
  | 'NUM_VIEWERS'
  | 'MAX_VIEWERS'
  | 'ALLOW_PEOPLE'
  | 'DENY_PEOPLE'
  | 'VIEW_TOGETHER'
  | 'ALLOWED_LOCATION'
  | 'NO_EXT_RECORDING'
  | 'NO_EXT_DISPLAY'
  | 'RECORD_SA'
