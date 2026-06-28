import { NextResponse } from 'next/server'
import { createBazaarAdmin } from '@/lib/bazaar/supabase-server'

export async function GET() {
  const admin = createBazaarAdmin()

  try {
    // Let's find any order that is 'confirmed' (or even 'pending') to test status update.
    const { data: order, error: fetchError } = await admin
      .from('bazaar_orders')
      .select('id, status')
      .in('status', ['confirmed', 'pending'])
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch test order', details: fetchError })
    }

    if (!order) {
      return NextResponse.json({
        message: 'No pending or confirmed order found to test update on. Please place/confirm an order first.'
      })
    }

    const { error: updateError } = await admin
      .from('bazaar_orders')
      .update({ status: 'ready' })
      .eq('id', order.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        testOrderId: order.id,
        currentStatus: order.status,
        error: {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        }
      })
    }

    // If it succeeds, let's revert it back to its original status so we don't mess up the database state.
    await admin
      .from('bazaar_orders')
      .update({ status: order.status })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      testOrderId: order.id,
      originalStatus: order.status,
      message: 'Database check passed! Status successfully updated to "ready" and reverted back.'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err })
  }
}
