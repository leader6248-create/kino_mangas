import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

async function getQpayToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`
  ).toString("base64")

  const res = await fetch("https://merchant.qpay.mn/v2/auth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
  })

  if (!res.ok) throw new Error("QPay token авахад алдаа гарлаа")
  const data = await res.json()
  return data.access_token
}

async function verifyQpayPayment(invoiceId: string): Promise<boolean> {
  const token = await getQpayToken()
  const res = await fetch("https://merchant.qpay.mn/v2/payment/check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  })

  if (!res.ok) return false
  const data = await res.json()
  return (data.count || 0) > 0 &&
    (data.rows || []).some((r: any) => r.payment_status === "PAID")
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || ""
    const accessToken = authHeader.replace("Bearer ", "")

    if (!accessToken) {
      console.warn("[record-purchase] missing auth")
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 })
    }

    // Validate user with anon client + their token
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      console.warn("[record-purchase] user lookup failed:", userErr?.message)
      return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 401 })
    }

    const { movieId, invoiceId } = await req.json()
    console.log("[record-purchase]", { user: user.id.slice(0, 8), movieId: String(movieId).slice(0, 8), invoiceId })
    if (!movieId || !invoiceId) {
      return NextResponse.json({ error: "movieId ба invoiceId шаардлагатай" }, { status: 400 })
    }

    // Verify QPay payment server-side
    const paid = await verifyQpayPayment(invoiceId)
    console.log("[record-purchase] QPay verify ->", paid, " invoice:", invoiceId)
    if (!paid) {
      return NextResponse.json({ error: "Төлбөр баталгаажаагүй байна" }, { status: 402 })
    }

    // Use service role to bypass RLS for the insert
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Get movie price
    const { data: movie } = await adminClient
      .from("movies")
      .select("price")
      .eq("id", movieId)
      .single()

    if (!movie) {
      return NextResponse.json({ error: "Кино олдсонгүй" }, { status: 404 })
    }

    const paidAt = new Date().toISOString()

    // qpay_invoice_id has a UNIQUE constraint. If this invoice was already
    // recorded (e.g. the client polled + clicked "check" for the same invoice),
    // this is an idempotent retry — just make sure it's marked paid and succeed
    // instead of crashing on the duplicate-key violation.
    const { data: existingByInvoice } = await adminClient
      .from("purchases")
      .select("id")
      .eq("qpay_invoice_id", invoiceId)
      .maybeSingle()

    if (existingByInvoice) {
      await adminClient
        .from("purchases")
        .update({ status: "paid", paid_at: paidAt })
        .eq("id", existingByInvoice.id)
      return NextResponse.json({ success: true })
    }

    const { error: insertErr } = await adminClient
      .from("purchases")
      .upsert({
        user_id: user.id,
        movie_id: movieId,
        qpay_invoice_id: invoiceId,
        amount: movie.price,
        status: "paid",
        paid_at: paidAt,
      }, { onConflict: "user_id,movie_id" })

    if (insertErr) {
      // 23505 = unique violation: a concurrent request just recorded the same
      // invoice. The purchase is recorded, so treat it as success.
      if (insertErr.code === "23505") {
        return NextResponse.json({ success: true })
      }
      console.error("Purchase insert error:", insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Record purchase error:", err)
    return NextResponse.json({ error: err.message || "Дотоод алдаа" }, { status: 500 })
  }
}
