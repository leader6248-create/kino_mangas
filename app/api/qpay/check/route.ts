import { NextRequest, NextResponse } from "next/server"

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

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get("invoice_id")
    console.log("[qpay/check] invoice_id =", invoiceId)

    if (!invoiceId) {
      return NextResponse.json({ error: "invoice_id шаардлагатай" }, { status: 400 })
    }

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

    if (!res.ok) {
      const errText = await res.text()
      console.error("[qpay/check] upstream not-ok:", res.status, errText)
      return NextResponse.json({ paid: false })
    }

    const data = await res.json()
    const rowStatuses = (data.rows || []).map((r: any) => r.payment_status)
    const paid = (data.count || 0) > 0 && rowStatuses.some((s: any) => s === "PAID")
    console.log(
      "[qpay/check]", invoiceId,
      "count=", data.count,
      "rowStatuses=", JSON.stringify(rowStatuses),
      "paid=", paid,
      "ms=", Date.now() - t0,
    )

    return NextResponse.json({ paid, data })
  } catch (err) {
    console.error("[qpay/check] error:", err)
    return NextResponse.json({ error: "Шалгахад алдаа гарлаа" }, { status: 500 })
  }
}
