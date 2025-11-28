/**
 * Cliente da API Barte
 */

const BARTE_API_URL = process.env.BARTE_API_URL || 'https://api.barte.com'
const BARTE_API_TOKEN = process.env.BARTE_API_TOKEN
const BARTE_SELLER_ID = process.env.BARTE_SELLER_ID // ID do seller principal (plataforma)

if (!BARTE_API_TOKEN) {
  console.warn('⚠️ BARTE_API_TOKEN não configurado')
}

if (!BARTE_SELLER_ID) {
  console.warn('⚠️ BARTE_SELLER_ID não configurado')
}

interface BarteOrder {
  startDate: string
  value: number
  installments?: number
  title: string
  description?: string
  payment: {
    method: 'pix' | 'credit_card'
    creditCard?: {
      number?: string
      cvv?: string
      expirationMonth?: string
      expirationYear?: string
      holderName?: string
      installments?: number
    }
  }
  uuidBuyer: string
}

interface BarteCharge {
  uuid: string
  status: string
  value: number
  [key: string]: any
}

interface BarteSplitSeller {
  idSeller: number
  value: number
  type: 'fixed' | 'percent'
}

interface BarteSplitRequest {
  sellers: BarteSplitSeller[]
}

interface BarteSplitResponse {
  uuid: string
  status: string
  chargeValue: number
  split: Array<{
    idSeller: number
    splitValue: number
  }>
  timestamp: string
}

/**
 * Criar pedido na Barte
 */
export async function createBarteOrder(orderData: BarteOrder): Promise<BarteCharge> {
  if (!BARTE_API_TOKEN) {
    throw new Error('BARTE_API_TOKEN não configurado')
  }

  const response = await fetch(`${BARTE_API_URL}/v2/orders`, {
    method: 'POST',
    headers: {
      'x-token-api': BARTE_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(`Erro ao criar pedido na Barte: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Criar split de pagamento na Barte
 */
export async function createBarteSplit(
  idSeller: number,
  chargeUuid: string,
  splitData: BarteSplitRequest
): Promise<BarteSplitResponse[]> {
  if (!BARTE_API_TOKEN) {
    throw new Error('BARTE_API_TOKEN não configurado')
  }

  const response = await fetch(
    `${BARTE_API_URL}/v2/seller/${idSeller}/charges/${chargeUuid}/split`,
    {
      method: 'POST',
      headers: {
        'x-token-api': BARTE_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(splitData),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(`Erro ao criar split na Barte: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Buscar charge na Barte
 */
export async function getBarteCharge(idSeller: number, chargeUuid: string): Promise<BarteCharge> {
  if (!BARTE_API_TOKEN) {
    throw new Error('BARTE_API_TOKEN não configurado')
  }

  const response = await fetch(
    `${BARTE_API_URL}/v2/seller/${idSeller}/charges/${chargeUuid}`,
    {
      method: 'GET',
      headers: {
        'x-token-api': BARTE_API_TOKEN,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(`Erro ao buscar charge na Barte: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Obter ID do seller principal (plataforma)
 */
export function getPlatformSellerId(): number {
  if (!BARTE_SELLER_ID) {
    throw new Error('BARTE_SELLER_ID não configurado')
  }
  return parseInt(BARTE_SELLER_ID, 10)
}

