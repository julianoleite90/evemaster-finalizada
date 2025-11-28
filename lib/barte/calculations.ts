/**
 * Cálculos de taxas para integração com Barte
 */

// Taxa da plataforma (10% sobre o valor do ingresso)
export const PLATFORM_FEE_PERCENTAGE = 0.10

// Taxas de parcelamento por número de parcelas
export const INSTALLMENT_FEES: Record<number, number> = {
  1: 0.00,
  2: 4.51,
  3: 6.04,
  4: 7.59,
  5: 9.15,
  6: 10.72,
  7: 10.72,
  8: 13.92,
  9: 15.54,
  10: 17.17,
  11: 18.82,
  12: 20.48,
}

/**
 * Calcula o valor final com taxas da plataforma
 * @param ticketValue Valor original do ingresso
 * @param installments Número de parcelas (1 para PIX ou à vista)
 * @returns Valor final a ser cobrado do consumidor
 */
export function calculateFinalValue(ticketValue: number, installments: number = 1): number {
  // Taxa da plataforma (10%)
  const platformFee = ticketValue * PLATFORM_FEE_PERCENTAGE
  
  // Taxa de parcelamento (se aplicável)
  const installmentFeePercentage = INSTALLMENT_FEES[installments] || 0
  const installmentFee = ticketValue * (installmentFeePercentage / 100)
  
  // Valor final = valor do ingresso + taxa da plataforma + taxa de parcelamento
  const finalValue = ticketValue + platformFee + installmentFee
  
  return Math.round(finalValue * 100) / 100 // Arredondar para 2 casas decimais
}

/**
 * Calcula o valor da taxa da plataforma
 * @param ticketValue Valor original do ingresso
 * @returns Valor da taxa (10%)
 */
export function calculatePlatformFee(ticketValue: number): number {
  return Math.round(ticketValue * PLATFORM_FEE_PERCENTAGE * 100) / 100
}

/**
 * Calcula o valor da taxa de parcelamento
 * @param ticketValue Valor original do ingresso
 * @param installments Número de parcelas
 * @returns Valor da taxa de parcelamento
 */
export function calculateInstallmentFee(ticketValue: number, installments: number): number {
  const feePercentage = INSTALLMENT_FEES[installments] || 0
  return Math.round(ticketValue * (feePercentage / 100) * 100) / 100
}

/**
 * Calcula o valor que o organizador receberá (valor do ingresso)
 * @param ticketValue Valor original do ingresso
 * @returns Valor que o organizador recebe
 */
export function calculateOrganizerValue(ticketValue: number): number {
  return ticketValue
}

/**
 * Calcula o valor que a plataforma receberá (taxa + parcelamento)
 * @param ticketValue Valor original do ingresso
 * @param installments Número de parcelas
 * @returns Valor total que a plataforma recebe
 */
export function calculatePlatformValue(ticketValue: number, installments: number = 1): number {
  const platformFee = calculatePlatformFee(ticketValue)
  const installmentFee = calculateInstallmentFee(ticketValue, installments)
  return Math.round((platformFee + installmentFee) * 100) / 100
}

/**
 * Calcula o valor que o afiliado receberá (comissão)
 * @param ticketValue Valor original do ingresso
 * @param commissionType Tipo de comissão ('percentage' ou 'fixed')
 * @param commissionValue Valor da comissão
 * @returns Valor que o afiliado recebe
 */
export function calculateAffiliateValue(
  ticketValue: number,
  commissionType: 'percentage' | 'fixed',
  commissionValue: number
): number {
  if (commissionType === 'percentage') {
    return Math.round(ticketValue * (commissionValue / 100) * 100) / 100
  } else {
    return commissionValue
  }
}

/**
 * Calcula o valor que o organizador receberá após descontar comissão do afiliado
 * @param ticketValue Valor original do ingresso
 * @param affiliateCommission Comissão do afiliado (se houver)
 * @returns Valor que o organizador recebe
 */
export function calculateOrganizerValueAfterAffiliate(
  ticketValue: number,
  affiliateCommission: number = 0
): number {
  return Math.round((ticketValue - affiliateCommission) * 100) / 100
}

