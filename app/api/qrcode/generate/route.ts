import { apiLogger as logger } from "@/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get("url")
    const eventName = searchParams.get("eventName") || "evento"

    if (!url) {
      return NextResponse.json(
        { error: "URL é obrigatória" },
        { status: 400 }
      )
    }

    // Gerar QR code como data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })

    // Retornar como JSON com data URL
    // O cliente irá processar e adicionar o logo
    return NextResponse.json({
      dataUrl: qrCodeDataUrl,
      url: url,
      eventName: eventName,
    })
  } catch (error: any) {
    logger.error("Erro ao gerar QR code:", error)
    return NextResponse.json(
      { error: "Erro ao gerar QR code", details: error.message },
      { status: 500 }
    )
  }
}

