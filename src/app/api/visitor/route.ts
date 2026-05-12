import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Use service role key (bypasses RLS), fall back to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing from environment')
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  try {
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Direct REST API call — bypasses the JS client library entirely
    // This works regardless of old/new key format
    const restUrl = `${supabaseUrl}/rest/v1/visitors`

    const res = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ name: name.trim() }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Supabase REST error:', res.status, errText)
      return NextResponse.json({ error: 'Failed to record visitor', detail: errText }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to record visitor' }, { status: 500 })
  }
}
