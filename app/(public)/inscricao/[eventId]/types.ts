// Tipos compartilhados para a página de checkout

export interface Participante {
  nome: string
  email: string
  telefone: string
  idade: string
  genero: string
  paisResidencia: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cpf: string
  tamanhoCamiseta: string
  aceiteTermo: boolean
  contatoEmergenciaNome: string
  contatoEmergenciaTelefone: string
}

export const participanteVazio: Participante = {
  nome: "",
  email: "",
  telefone: "",
  idade: "",
  genero: "",
  paisResidencia: "brasil",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cpf: "",
  tamanhoCamiseta: "",
  aceiteTermo: false,
  contatoEmergenciaNome: "",
  contatoEmergenciaTelefone: "",
}

// Tamanhos de camiseta
export const TAMANHOS_CAMISETA = ["PP", "P", "M", "G", "GG", "XG", "XXG"]

// Lista de países
export const PAISES = [
  { value: "brasil", label: "🇧🇷 Brasil", labelEs: "🇧🇷 Brasil", labelEn: "🇧🇷 Brazil" },
  { value: "argentina", label: "🇦🇷 Argentina", labelEs: "🇦🇷 Argentina", labelEn: "🇦🇷 Argentina" },
  { value: "chile", label: "🇨🇱 Chile", labelEs: "🇨🇱 Chile", labelEn: "🇨🇱 Chile" },
  { value: "uruguai", label: "🇺🇾 Uruguai", labelEs: "🇺🇾 Uruguay", labelEn: "🇺🇾 Uruguay" },
  { value: "paraguai", label: "🇵🇾 Paraguai", labelEs: "🇵🇾 Paraguay", labelEn: "🇵🇾 Paraguay" },
  { value: "peru", label: "🇵🇪 Peru", labelEs: "🇵🇪 Perú", labelEn: "🇵🇪 Peru" },
  { value: "colombia", label: "🇨🇴 Colômbia", labelEs: "🇨🇴 Colombia", labelEn: "🇨🇴 Colombia" },
  { value: "mexico", label: "🇲🇽 México", labelEs: "🇲🇽 México", labelEn: "🇲🇽 Mexico" },
  { value: "eua", label: "🇺🇸 Estados Unidos", labelEs: "🇺🇸 Estados Unidos", labelEn: "🇺🇸 United States" },
  { value: "outro", label: "🌍 Outro país", labelEs: "🌍 Otro país", labelEn: "🌍 Other country" },
]

// Função para normalizar o país do evento para o formato usado no Select
export const normalizarPais = (pais: string | null | undefined): string => {
  if (!pais) return "brasil"
  
  const paisLower = pais.toLowerCase().trim()
  
  const mapeamento: Record<string, string> = {
    "brasil": "brasil",
    "brazil": "brasil",
    "argentina": "argentina",
    "chile": "chile",
    "uruguai": "uruguai",
    "uruguay": "uruguai",
    "paraguai": "paraguai",
    "paraguay": "paraguai",
    "peru": "peru",
    "perú": "peru",
    "colombia": "colombia",
    "colômbia": "colombia",
    "mexico": "mexico",
    "méxico": "mexico",
    "eua": "eua",
    "estados unidos": "eua",
    "united states": "eua",
    "usa": "eua",
    "us": "eua",
  }
  
  return mapeamento[paisLower] || "brasil"
}

// Traduções completas do checkout
export const traducoes: Record<string, Record<string, string>> = {
  pt: {
    // Títulos e cabeçalhos
    titulo: "Inscrição",
    subtitulo: "Complete sua inscrição",
    pagamentoSeguro: "Pagamento 100% seguro",
    
    // Steps
    dadosPessoais: "Dados Pessoais",
    endereco: "Endereço",
    pagamento: "Pagamento",
    finalizarInscricao: "Finalizar Inscrição",
    
    // Campos pessoais
    nomeCompleto: "Nome Completo",
    email: "Email",
    telefone: "Telefone",
    cpf: "CPF",
    dni: "DNI",
    documento: "Documento",
    idade: "Idade",
    genero: "Gênero",
    masculino: "Masculino",
    feminino: "Feminino",
    outro: "Outro",
    prefiroNaoInformar: "Prefiro não informar",
    paisResidencia: "País de Residência",
    
    // Campos de endereço
    cep: "CEP",
    logradouro: "Logradouro",
    numero: "Número",
    complemento: "Complemento",
    bairro: "Bairro",
    cidade: "Cidade",
    estado: "Estado",
    pais: "País",
    
    // Camiseta e kit
    tamanhoCamiseta: "Tamanho da Camiseta",
    
    // Contato de emergência
    contatoEmergencia: "Contato de Emergência",
    nomeContato: "Nome do Contato",
    telefoneContato: "Telefone do Contato",
    contatoEmergenciaNome: "Nome do Contato",
    contatoEmergenciaTelefone: "Telefone do Contato",
    contatoEmergenciaDescricao: "Forneça um contato para emergências durante o evento",
    
    // Termos
    termoResponsabilidade: "Termo de Responsabilidade",
    liAceito: "Li e aceito o termo de responsabilidade",
    aceitoTermos: "Aceito os termos e condições",
    
    // Navegação
    voltar: "Voltar",
    continuar: "Continuar",
    anterior: "Anterior",
    proximo: "Próximo",
    finalizar: "Finalizar",
    finalizarPagar: "Finalizar e Pagar",
    processando: "Processando...",
    
    // Formas de pagamento
    formaPagamento: "Forma de Pagamento",
    pix: "PIX",
    pagamentoInstantaneo: "Pagamento instantâneo",
    cartaoCredito: "Cartão de Crédito",
    cartao: "Cartão de Crédito",
    parceleAte: "Parcele em até 12x",
    boleto: "Boleto Bancário",
    vencimento: "Vencimento em 3 dias úteis",
    selecionePagamento: "Selecione a forma de pagamento",
    
    // Resumo
    resumoInscricao: "Resumo da Inscrição",
    resumo: "Resumo do Pedido",
    subtotal: "Subtotal",
    taxaServico: "Taxa de serviço",
    total: "Total",
    desconto: "Desconto",
    cupomAplicado: "Cupom aplicado",
    aplicarCupom: "Aplicar Cupom",
    codigoCupom: "Código do cupom",
    gratis: "Grátis",
    
    // Participantes e ingressos
    participante: "Participante",
    de: "de",
    ingresso: "Ingresso",
    ingressos: "ingresso(s)",
    categoria: "Categoria",
    selecione: "Selecione",
    
    // Mensagens
    usuarioEncontrado: "Usuário encontrado no sistema",
    plataformaDescricao: "Plataforma para gestão, compra e venda de ingressos para eventos esportivos.",
    parceleAteCartao: "Parcelamento em até 12x no cartão",
  },
  es: {
    // Títulos e cabeçalhos
    titulo: "Inscripción",
    subtitulo: "Complete su inscripción",
    pagamentoSeguro: "Pago 100% seguro",
    
    // Steps
    dadosPessoais: "Datos Personales",
    endereco: "Dirección",
    pagamento: "Pago",
    finalizarInscricao: "Finalizar Inscripción",
    
    // Campos pessoais
    nomeCompleto: "Nombre Completo",
    email: "Correo Electrónico",
    telefone: "Teléfono",
    cpf: "CPF",
    dni: "DNI",
    documento: "Documento",
    idade: "Edad",
    genero: "Género",
    masculino: "Masculino",
    feminino: "Femenino",
    outro: "Otro",
    prefiroNaoInformar: "Prefiero no informar",
    paisResidencia: "País de Residencia",
    
    // Campos de endereço
    cep: "Código Postal",
    logradouro: "Dirección",
    numero: "Número",
    complemento: "Complemento",
    bairro: "Barrio",
    cidade: "Ciudad",
    estado: "Provincia/Estado",
    pais: "País",
    
    // Camiseta e kit
    tamanhoCamiseta: "Talla de Camiseta",
    
    // Contato de emergência
    contatoEmergencia: "Contacto de Emergencia",
    nomeContato: "Nombre del Contacto",
    telefoneContato: "Teléfono del Contacto",
    contatoEmergenciaNome: "Nombre del Contacto",
    contatoEmergenciaTelefone: "Teléfono del Contacto",
    contatoEmergenciaDescricao: "Proporcione un contacto para emergencias durante el evento",
    
    // Termos
    termoResponsabilidade: "Término de Responsabilidad",
    liAceito: "He leído y acepto el término de responsabilidad",
    aceitoTermos: "Acepto los términos y condiciones",
    
    // Navegação
    voltar: "Volver",
    continuar: "Continuar",
    anterior: "Anterior",
    proximo: "Siguiente",
    finalizar: "Finalizar",
    finalizarPagar: "Finalizar y Pagar",
    processando: "Procesando...",
    
    // Formas de pagamento
    formaPagamento: "Forma de Pago",
    pix: "PIX",
    pagamentoInstantaneo: "Pago instantáneo",
    cartaoCredito: "Tarjeta de Crédito",
    cartao: "Tarjeta de Crédito",
    parceleAte: "Hasta 12 cuotas",
    boleto: "Boleto Bancario",
    vencimento: "Vencimiento en 3 días hábiles",
    selecionePagamento: "Seleccione la forma de pago",
    
    // Resumo
    resumoInscricao: "Resumen de la Inscripción",
    resumo: "Resumen del Pedido",
    subtotal: "Subtotal",
    taxaServico: "Tarifa de servicio",
    total: "Total",
    desconto: "Descuento",
    cupomAplicado: "Cupón aplicado",
    aplicarCupom: "Aplicar Cupón",
    codigoCupom: "Código del cupón",
    gratis: "Gratis",
    
    // Participantes e ingressos
    participante: "Participante",
    de: "de",
    ingresso: "Entrada",
    ingressos: "entrada(s)",
    categoria: "Categoría",
    selecione: "Seleccione",
    
    // Mensagens
    usuarioEncontrado: "Usuario encontrado en el sistema",
    plataformaDescricao: "Plataforma para gestión, compra y venta de entradas para eventos deportivos.",
    parceleAteCartao: "Pago en hasta 12 cuotas con tarjeta",
  },
  en: {
    // Títulos e cabeçalhos
    titulo: "Registration",
    subtitulo: "Complete your registration",
    pagamentoSeguro: "100% Secure Payment",
    
    // Steps
    dadosPessoais: "Personal Information",
    endereco: "Address",
    pagamento: "Payment",
    finalizarInscricao: "Complete Registration",
    
    // Campos pessoais
    nomeCompleto: "Full Name",
    email: "Email",
    telefone: "Phone",
    cpf: "CPF",
    dni: "ID Number",
    documento: "ID Document",
    idade: "Age",
    genero: "Gender",
    masculino: "Male",
    feminino: "Female",
    outro: "Other",
    prefiroNaoInformar: "Prefer not to say",
    paisResidencia: "Country of Residence",
    
    // Campos de endereço
    cep: "Postal Code",
    logradouro: "Street Address",
    numero: "Number",
    complemento: "Apt/Suite",
    bairro: "Neighborhood",
    cidade: "City",
    estado: "State/Province",
    pais: "Country",
    
    // Camiseta e kit
    tamanhoCamiseta: "T-Shirt Size",
    
    // Contato de emergência
    contatoEmergencia: "Emergency Contact",
    nomeContato: "Contact Name",
    telefoneContato: "Contact Phone",
    contatoEmergenciaNome: "Contact Name",
    contatoEmergenciaTelefone: "Contact Phone",
    contatoEmergenciaDescricao: "Provide a contact for emergencies during the event",
    
    // Termos
    termoResponsabilidade: "Liability Waiver",
    liAceito: "I have read and accept the liability waiver",
    aceitoTermos: "I accept the terms and conditions",
    
    // Navegação
    voltar: "Back",
    continuar: "Continue",
    anterior: "Previous",
    proximo: "Next",
    finalizar: "Finish",
    finalizarPagar: "Complete & Pay",
    processando: "Processing...",
    
    // Formas de pagamento
    formaPagamento: "Payment Method",
    pix: "PIX",
    pagamentoInstantaneo: "Instant payment",
    cartaoCredito: "Credit Card",
    cartao: "Credit Card",
    parceleAte: "Up to 12 installments",
    boleto: "Bank Slip",
    vencimento: "Due in 3 business days",
    selecionePagamento: "Select payment method",
    
    // Resumo
    resumoInscricao: "Registration Summary",
    resumo: "Order Summary",
    subtotal: "Subtotal",
    taxaServico: "Service fee",
    total: "Total",
    desconto: "Discount",
    cupomAplicado: "Coupon applied",
    aplicarCupom: "Apply Coupon",
    codigoCupom: "Coupon code",
    gratis: "Free",
    
    // Participantes e ingressos
    participante: "Participant",
    de: "of",
    ingresso: "Ticket",
    ingressos: "ticket(s)",
    categoria: "Category",
    selecione: "Select",
    
    // Mensagens
    usuarioEncontrado: "User found in the system",
    plataformaDescricao: "Platform for management, purchase and sale of tickets for sporting events.",
    parceleAteCartao: "Installments up to 12x on card",
  },
}

export type Idioma = "pt" | "es" | "en"
export type Traducoes = typeof traducoes

// Função auxiliar para criar tradutor
export const createTranslator = (idioma: Idioma) => {
  return (key: string): string => traducoes[idioma]?.[key] || traducoes.pt[key] || key
}

