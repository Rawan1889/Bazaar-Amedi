'use server'

import { revalidatePath } from 'next/cache'
import { createBazaarServer, createBazaarAdmin } from './supabase-server'
import { getBazaarUser } from './auth'
import { sendPushToUser, sendPushToRole } from './push-notifications'

export interface SupportThread {
  id: string
  opener_id: string
  opener_role: string
  subject: string
  status: 'open' | 'closed'
  last_message_at: string
  unread_for_admin: boolean
  unread_for_opener: boolean
  created_at: string
  opener?: { full_name: string; phone: string | null } | null
}

export interface SupportMessage {
  id: string
  thread_id: string
  sender_id: string
  sender_role: string
  body: string
  created_at: string
}

export async function openSupportThread(subject: string, firstMessage: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }
  const s = subject.trim()
  const m = firstMessage.trim()
  if (!s || !m) return { error: 'Subject and message are required.' }
  if (s.length > 120) return { error: 'Subject is too long.' }
  if (m.length > 2000) return { error: 'Message is too long.' }

  const supabase = await createBazaarServer()
  const { data: thread, error } = await supabase
    .from('bazaar_support_threads')
    .insert({
      opener_id: user.id,
      opener_role: user.role,
      subject: s,
      unread_for_admin: true,
      unread_for_opener: false,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !thread) return { error: error?.message || 'Could not open ticket.' }

  await supabase
    .from('bazaar_support_messages')
    .insert({ thread_id: thread.id, sender_id: user.id, sender_role: user.role, body: m })

  sendPushToRole('super_admin', {
    type: 'support',
    title: `New support ticket — ${user.role}`,
    body: s,
    url: `/admin/support/${thread.id}`,
  })

  revalidatePath('/support')
  revalidatePath('/admin/support')
  return { success: true, id: thread.id as string }
}

export async function sendSupportMessage(threadId: string, body: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }
  const text = body.trim()
  if (!text) return { error: 'Message is empty.' }
  if (text.length > 2000) return { error: 'Message is too long.' }

  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_support_messages')
    .insert({ thread_id: threadId, sender_id: user.id, sender_role: user.role, body: text })
  if (error) return { error: error.message }

  const admin = createBazaarAdmin()
  const fromAdmin = user.role === 'super_admin'
  await admin
    .from('bazaar_support_threads')
    .update({
      last_message_at: new Date().toISOString(),
      unread_for_admin: fromAdmin ? false : true,
      unread_for_opener: fromAdmin ? true : false,
      status: 'open',
    })
    .eq('id', threadId)

  const { data: thread } = await admin
    .from('bazaar_support_threads')
    .select('opener_id, subject')
    .eq('id', threadId)
    .single()

  if (thread) {
    if (fromAdmin) {
      sendPushToUser(thread.opener_id, {
        type: 'support',
        title: 'Support reply',
        body: text.slice(0, 100),
        url: `/support/${threadId}`,
      })
    } else {
      sendPushToRole('super_admin', {
        type: 'support',
        title: `Support — ${thread.subject}`,
        body: text.slice(0, 100),
        url: `/admin/support/${threadId}`,
      })
    }
  }

  revalidatePath(`/support/${threadId}`)
  revalidatePath(`/admin/support/${threadId}`)
  revalidatePath('/support')
  revalidatePath('/admin/support')
  return { success: true }
}

export async function getMySupportThreads(): Promise<SupportThread[]> {
  const user = await getBazaarUser()
  if (!user) return []
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_support_threads')
    .select('*')
    .eq('opener_id', user.id)
    .order('last_message_at', { ascending: false })
  return (data as SupportThread[]) || []
}

export async function getAllSupportThreads(): Promise<SupportThread[]> {
  const user = await getBazaarUser()
  if (!user || user.role !== 'super_admin') return []
  const supabase = await createBazaarServer()
  const { data } = await supabase
    .from('bazaar_support_threads')
    .select('*, opener:bazaar_profiles!bazaar_support_threads_opener_id_fkey(full_name, phone)')
    .order('last_message_at', { ascending: false })
  return (data as SupportThread[]) || []
}

export async function getSupportThread(threadId: string) {
  const user = await getBazaarUser()
  if (!user) return null
  const supabase = await createBazaarServer()
  const { data: thread } = await supabase
    .from('bazaar_support_threads')
    .select('*, opener:bazaar_profiles!bazaar_support_threads_opener_id_fkey(full_name, phone)')
    .eq('id', threadId)
    .single()
  if (!thread) return null

  const { data: messages } = await supabase
    .from('bazaar_support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  // Mark read for the viewer's side.
  const admin = createBazaarAdmin()
  const patch = user.role === 'super_admin'
    ? { unread_for_admin: false }
    : thread.opener_id === user.id
      ? { unread_for_opener: false }
      : null
  if (patch) await admin.from('bazaar_support_threads').update(patch).eq('id', threadId)

  return {
    thread: thread as SupportThread,
    messages: (messages as SupportMessage[]) || [],
  }
}

export async function closeSupportThread(threadId: string) {
  const user = await getBazaarUser()
  if (!user) return { error: 'Please sign in.' }
  const supabase = await createBazaarServer()
  const { error } = await supabase
    .from('bazaar_support_threads')
    .update({ status: 'closed' })
    .eq('id', threadId)
  if (error) return { error: error.message }
  revalidatePath('/support')
  revalidatePath('/admin/support')
  revalidatePath(`/support/${threadId}`)
  revalidatePath(`/admin/support/${threadId}`)
  return { success: true }
}
