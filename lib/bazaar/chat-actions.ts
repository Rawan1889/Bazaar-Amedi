'use server'

import { createBazaarServer } from './supabase-server'
import { getBazaarUser } from './auth'

export interface ChatMessage {
  id: string
  order_id: string
  sender_id: string
  sender_role: string
  body: string
  created_at: string
}

export async function getMessages(orderId: string): Promise<ChatMessage[]> {
  const user = await getBazaarUser()
  if (!user) return []
  const supabase = await createBazaarServer()
  // RLS restricts this to orders the user participates in.
  const { data } = await supabase
    .from('bazaar_messages')
    .select('id, order_id, sender_id, sender_role, body, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  return (data as ChatMessage[]) || []
}

export async function sendMessage(orderId: string, body: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }
  const text = body.trim()
  if (!text) return { error: 'Message is empty.' }
  if (text.length > 1000) return { error: 'Message is too long.' }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_messages')
    .insert({ order_id: orderId, sender_id: user.id, sender_role: user.role, body: text })

  if (error) return { error: error.message }
  return { success: true }
}
