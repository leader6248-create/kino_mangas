import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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

export async function POST(req: NextRequest) {
  try {
    const { movieId } = await req.json()

    const { data: movie, error } = await supabase
      .from("movies")
      .select("id, title, price")
      .eq("id", movieId)
      .single()

    if (error || !movie) {
      return NextResponse.json({ error: "Кино олдсонгүй" }, { status: 404 })
    }

    const token = await getQpayToken()

    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/qpay/callback`

    const invoiceRes = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_code: process.env.QPAY_INVOICE_CODE,
        sender_invoice_no: `m_${String(movieId).slice(0, 8)}_${Date.now()}`,
        invoice_receiver_code: "terminal",
        invoice_description: movie.title,
        amount: movie.price,
        callback_url: callbackUrl,
      }),
    })

    if (!invoiceRes.ok) {
      const err = await invoiceRes.text()
      console.error("QPay invoice error:", err)
      return NextResponse.json({ error: "Invoice үүсгэхэд алдаа гарлаа" }, { status: 500 })
    }

    const invoice = await invoiceRes.json()
    return NextResponse.json(invoice)
  } catch (err) {
    console.error("QPay create error:", err)
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 })
  }
}
