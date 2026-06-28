import { NextResponse } from 'next/server'
import { createBazaarAdmin } from '@/lib/bazaar/supabase-server'

export async function GET() {
  const admin = createBazaarAdmin()

  try {
    // 1. Fetch check constraints on bazaar_orders
    const { data: constraints, error: constraintsError } = await admin
      .rpc('inspect_constraints') // if custom RPC exists
      .select('*')
      .catch(() => ({ data: null, error: null }))

    // Let's run a query to get constraint names and definitions from information_schema
    const { data: rawConstraints, error: rawError } = await admin
      .from('bazaar_orders')
      .select('id')
      .limit(1)

    // Since we don't have a direct raw SQL executor exposed unless we use execute_sql,
    // let's try to insert or update a dummy order or check if we can run execute_sql.
    // Wait, let's look at the active constraints by querying pg_constraint via standard REST API?
    // PostgREST doesn't expose pg_catalog unless allowed. Let's see if we can query pg_constraint.
    
    // Let's try to update the order to 'ready' and capture the exact Postgres error!
    // We will search for a pending or confirmed order to try updating.
    const { data: order } = await admin
      .from('bazaar_orders')
      .select('id, status')
      .eq('status', 'confirmed')
      .limit(1)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({
        message: 'No confirmed order found to test update on. Please place/confirm an order first.'
      })
    }

    const { error: updateError } = await admin
      .from('bazaar_orders')
      .update({ status: 'ready' })
      .eq('id', order.id)

    return NextResponse.json({
      testOrderId: order.id,
      currentStatus: order.status,
      updateResult: updateError ? {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      } : 'Success! Order status successfully updated to ready.'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err })
  }
}
