/**
 * Integração com API da Receita Federal para consulta de CNPJ
 * Usando a API pública: https://www.receitaws.com.br/
 */

export interface CNPJData {
  cnpj: string
  nome: string
  fantasia: string
  abertura: string
  situacao: string
  tipo: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
  capital_social: string
  qsa?: Array<{
    nome: string
    qual: string
  }>
}

/**
 * Busca dados do CNPJ na Receita Federal
 * Usa API alternativa caso a principal falhe
 */
export async function buscarCNPJ(cnpj: string): Promise<CNPJData> {
  // Remove formatação do CNPJ
  const cnpjLimpo = cnpj.replace(/\D/g, "")

  if (cnpjLimpo.length !== 14) {
    throw new Error("CNPJ inválido. Deve conter 14 dígitos")
  }

  // Tenta primeiro com a API receitaws.com.br
  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Adiciona timeout
      signal: AbortSignal.timeout(10000), // 10 segundos
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "ERROR") {
      throw new Error(data.message || "CNPJ não encontrado")
    }

    return {
      cnpj: data.cnpj,
      nome: data.nome,
      fantasia: data.fantasia || data.nome,
      abertura: data.abertura,
      situacao: data.situacao,
      tipo: data.tipo,
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      municipio: data.municipio || "",
      uf: data.uf || "",
      cep: data.cep || "",
      telefone: data.telefone || "",
      email: data.email || "",
      capital_social: data.capital_social || "0",
      qsa: data.qsa || [],
    }
  } catch (error: any) {
    // Se falhar, tenta API alternativa
    try {
      const responseAlt = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!responseAlt.ok) {
        throw new Error(`Erro HTTP: ${responseAlt.status}`)
      }

      const data = await responseAlt.json()

      return {
        cnpj: data.cnpj || cnpjLimpo,
        nome: data.razao_social || data.nome || "",
        fantasia: data.nome_fantasia || data.razao_social || "",
        abertura: data.data_inicio_atividade || "",
        situacao: data.descricao_situacao_cadastral || "",
        tipo: data.descricao_tipo_logradouro || "",
        logradouro: data.logradouro || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        cep: data.cep || "",
        telefone: data.ddd_telefone_1 || "",
        email: data.email || "",
        capital_social: data.capital_social || "0",
        qsa: [],
      }
    } catch (errorAlt: any) {
      throw new Error(
        errorAlt.message || "Erro ao consultar CNPJ. Tente novamente mais tarde ou preencha manualmente."
      )
    }
  }
}

