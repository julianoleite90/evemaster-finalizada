# 🎯 PLANO DE REFATORAÇÃO: Máximo 1200 Linhas por Arquivo

**Objetivo:** Dividir todas as páginas com mais de 1200 linhas em componentes menores, mantendo funcionalidade 100%

**Estratégia:** Refatoração incremental e testada, sem quebrar o sistema

---

## 📊 PÁGINAS QUE PRECISAM DE REFATORAÇÃO

| # | Arquivo | Linhas | Prioridade | Complexidade |
|---|---------|--------|------------|--------------|
| 1 | `events/[id]/settings/page.tsx` | 5,027 | 🔴 CRÍTICA | 🔴 Muito Alta |
| 2 | `inscricao/[eventId]/page.tsx` | 3,115 | 🔴 CRÍTICA | 🔴 Alta |
| 3 | `events/new/page.tsx` | 2,156 | 🟡 ALTA | 🟡 Alta |
| 4 | `organizer/settings/page.tsx` | 1,698 | 🟡 MÉDIA | 🟢 Média |
| 5 | `registrations/page.tsx` | 1,461 | 🟡 MÉDIA | 🟢 Média |

**Total a refatorar:** 13,457 linhas → ~50 componentes

---

## 🎯 ESTRATÉGIA GERAL

### Princípios de Refatoração
1. ✅ **Incremental:** Uma página por vez
2. ✅ **Testada:** Validar antes de prosseguir
3. ✅ **Reversível:** Manter backup da versão original
4. ✅ **Não-destrutiva:** Sistema continua funcionando durante refatoração
5. ✅ **Documentada:** Cada mudança explicada

### Estrutura de Divisão
```
página-principal.tsx (< 200 linhas)
├── components/
│   ├── NomePaginaSections/
│   │   ├── Section1.tsx (< 300 linhas)
│   │   ├── Section2.tsx (< 300 linhas)
│   │   └── Section3.tsx (< 300 linhas)
│   ├── NomePaginaForms/
│   │   ├── Form1.tsx (< 200 linhas)
│   │   └── Form2.tsx (< 200 linhas)
│   └── NomePaginaDialogs/
│       ├── Dialog1.tsx (< 150 linhas)
│       └── Dialog2.tsx (< 150 linhas)
├── hooks/
│   ├── useNomePaginaData.ts (< 200 linhas)
│   └── useNomePaginaActions.ts (< 200 linhas)
└── lib/
    └── NomePaginaUtils.ts (< 200 linhas)
```

---

## 🔴 PRIORIDADE 1: Event Settings Page (5,027 linhas)

### 📋 Análise da Estrutura Atual
```typescript
// Estrutura identificada:
- Estado (50+ useState)
- Dados (10+ fetch functions)
- Tabs (6 principais):
  1. Configurações Gerais
  2. Campos Personalizados
  3. Afiliados
  4. Cupons
  5. Relatórios
  6. Imagens
```

### 🎯 Estratégia de Divisão

#### FASE 1: Extrair Hooks (Dia 1)
```
lib/hooks/event-settings/
├── useEventSettingsData.ts       // ~200 linhas - fetch data
├── useEventSettingsGeneral.ts    // ~150 linhas - configurações gerais
├── useEventSettingsFields.ts     // ~150 linhas - campos personalizados
├── useEventSettingsAffiliates.ts // ~200 linhas - afiliados
├── useEventSettingsCoupons.ts    // ~150 linhas - cupons
├── useEventSettingsReports.ts    // ~200 linhas - relatórios
└── useEventSettingsImages.ts     // ~150 linhas - imagens
```

**Total estimado:** ~1,200 linhas de hooks

#### FASE 2: Extrair Componentes de Tab (Dia 2-3)
```
components/event-settings/
├── EventSettingsLayout.tsx       // ~100 linhas
├── tabs/
│   ├── GeneralTab.tsx            // ~300 linhas
│   ├── CustomFieldsTab.tsx       // ~400 linhas
│   ├── AffiliatesTab.tsx         // ~500 linhas
│   ├── CouponsTab.tsx            // ~400 linhas
│   ├── ReportsTab.tsx            // ~600 linhas
│   └── ImagesTab.tsx             // ~300 linhas
```

**Total estimado:** ~2,600 linhas de componentes

#### FASE 3: Extrair Sub-componentes (Dia 4-5)
```
components/event-settings/
├── affiliates/
│   ├── AffiliatesList.tsx        // ~200 linhas
│   ├── AffiliateInviteDialog.tsx // ~150 linhas
│   ├── AffiliateEditDialog.tsx   // ~150 linhas
│   └── AffiliateStats.tsx        // ~100 linhas
├── coupons/
│   ├── CouponsList.tsx           // ~200 linhas
│   ├── CouponCreateDialog.tsx    // ~150 linhas
│   └── CouponEditDialog.tsx      // ~100 linhas
├── reports/
│   ├── ReportsOverview.tsx       // ~200 linhas
│   ├── ReportsCharts.tsx         // ~200 linhas
│   └── ReportsExport.tsx         // ~150 linhas
├── custom-fields/
│   ├── FieldsList.tsx            // ~150 linhas
│   ├── FieldEditor.tsx           // ~150 linhas
│   └── FieldPreview.tsx          // ~100 linhas
└── images/
    ├── ImageUploader.tsx         // ~150 linhas
    └── ImageGallery.tsx          // ~150 linhas
```

**Total estimado:** ~2,400 linhas de sub-componentes

#### FASE 4: Arquivo Principal (Dia 6)
```typescript
// app/dashboard/organizer/events/[id]/settings/page.tsx
// ~150 linhas apenas!

import { EventSettingsLayout } from '@/components/event-settings/EventSettingsLayout'
import { useEventSettingsData } from '@/lib/hooks/event-settings/useEventSettingsData'

export default function EventSettingsPage() {
  const params = useParams()
  const eventId = params?.id as string
  
  const {
    loading,
    eventData,
    organizerId,
    // ... outros dados
  } = useEventSettingsData(eventId)
  
  if (loading) return <LoadingSpinner />
  
  return (
    <EventSettingsLayout
      eventId={eventId}
      eventData={eventData}
      organizerId={organizerId}
    />
  )
}
```

### ✅ Checklist de Validação
- [ ] Todas as tabs funcionam
- [ ] Afiliados podem ser convidados/editados
- [ ] Cupons podem ser criados/editados
- [ ] Relatórios carregam corretamente
- [ ] Upload de imagens funciona
- [ ] Não há erros no console
- [ ] Performance mantida ou melhorada

---

## 🔴 PRIORIDADE 2: Checkout Page (3,115 linhas)

### 📋 Análise da Estrutura Atual
```typescript
// Estrutura identificada:
- Steps (4 principais):
  1. Seleção de participantes
  2. Dados dos participantes
  3. Pagamento
  4. Confirmação
- Forms complexos
- Validações
- Integrações (PIX, cartão)
```

### 🎯 Estratégia de Divisão

#### FASE 1: Extrair Hooks (Dia 1)
```
lib/hooks/checkout/
├── useCheckoutData.ts            // ~200 linhas - fetch event/tickets
├── useCheckoutParticipants.ts    // ~200 linhas - gerenciar participantes
├── useCheckoutPayment.ts         // ~250 linhas - lógica de pagamento
├── useCheckoutValidation.ts      // ~150 linhas - validações
└── useCheckoutSubmit.ts          // ~200 linhas - finalizar inscrição
```

**Total estimado:** ~1,000 linhas de hooks

#### FASE 2: Extrair Steps (Dia 2-3)
```
components/checkout/
├── CheckoutLayout.tsx            // ~150 linhas
├── steps/
│   ├── Step1SelectParticipants.tsx   // ~300 linhas
│   ├── Step2ParticipantData.tsx      // ~400 linhas
│   ├── Step3Payment.tsx              // ~350 linhas
│   └── Step4Confirmation.tsx         // ~200 linhas
```

**Total estimado:** ~1,400 linhas de componentes

#### FASE 3: Extrair Forms e Dialogs (Dia 4)
```
components/checkout/
├── forms/
│   ├── ParticipantForm.tsx       // ~300 linhas
│   ├── AddressForm.tsx           // ~150 linhas
│   ├── EmergencyContactForm.tsx  // ~100 linhas
│   └── PaymentMethodForm.tsx     // ~200 linhas
├── dialogs/
│   ├── TermsDialog.tsx           // ~100 linhas
│   ├── RunningClubDialog.tsx     // ~150 linhas
│   └── CouponDialog.tsx          // ~100 linhas
└── payment/
    ├── PixPayment.tsx            // ~150 linhas
    ├── CreditCardPayment.tsx     // ~150 linhas
    └── PaymentSummary.tsx        // ~150 linhas
```

**Total estimado:** ~1,550 linhas de sub-componentes

#### FASE 4: Arquivo Principal (Dia 5)
```typescript
// app/(public)/inscricao/[eventId]/page.tsx
// ~150 linhas apenas!

import { CheckoutLayout } from '@/components/checkout/CheckoutLayout'
import { useCheckoutData } from '@/lib/hooks/checkout/useCheckoutData'
import { CheckoutErrorBoundary } from '@/components/error/CheckoutErrorBoundary'

export default function CheckoutPage() {
  const params = useParams()
  const eventId = params?.eventId as string
  
  return (
    <CheckoutErrorBoundary eventId={eventId}>
      <Suspense fallback={<CheckoutLoading />}>
        <CheckoutContent eventId={eventId} />
      </Suspense>
    </CheckoutErrorBoundary>
  )
}

function CheckoutContent({ eventId }: { eventId: string }) {
  const checkoutData = useCheckoutData(eventId)
  
  if (checkoutData.loading) return <LoadingSpinner />
  
  return <CheckoutLayout {...checkoutData} />
}
```

### ✅ Checklist de Validação
- [ ] Todos os 4 steps funcionam
- [ ] Validação de campos funciona
- [ ] Adicionar/remover participantes funciona
- [ ] Cupons aplicam desconto
- [ ] Pagamento PIX funciona
- [ ] Pagamento cartão funciona
- [ ] Finalização cria inscrição
- [ ] Redirecionamento para obrigado funciona
- [ ] Error logging funciona

---

## 🟡 PRIORIDADE 3: Event Creation Page (2,156 linhas)

### 🎯 Estratégia de Divisão

#### FASE 1: Extrair Hooks
```
lib/hooks/event-creation/
├── useEventForm.ts               // ~200 linhas
├── useTicketBatches.ts           // ~200 linhas
├── useEventSettings.ts           // ~150 linhas
└── useEventSubmit.ts             // ~200 linhas
```

#### FASE 2: Extrair Sections
```
components/event-creation/
├── EventCreationLayout.tsx       // ~150 linhas
├── sections/
│   ├── BasicInfoSection.tsx      // ~300 linhas
│   ├── LocationSection.tsx       // ~200 linhas
│   ├── TicketsSection.tsx        // ~400 linhas
│   ├── DescriptionSection.tsx    // ~200 linhas
│   └── SettingsSection.tsx       // ~300 linhas
```

#### FASE 3: Extrair Components
```
components/event-creation/
├── tickets/
│   ├── TicketBatchCard.tsx       // ~150 linhas
│   ├── TicketEditor.tsx          // ~200 linhas
│   └── TicketPreview.tsx         // ~100 linhas
└── forms/
    ├── EventInfoForm.tsx         // ~200 linhas
    ├── LocationForm.tsx          // ~150 linhas
    └── SettingsForm.tsx          // ~200 linhas
```

#### FASE 4: Arquivo Principal (~150 linhas)

---

## 🟡 PRIORIDADE 4: Organizer Settings (1,698 linhas)

### 🎯 Estratégia de Divisão

#### FASE 1: Extrair Hooks
```
lib/hooks/organizer-settings/
├── useOrganizerData.ts           // ~150 linhas
├── useOrganizerUsers.ts          // ~200 linhas
└── useOrganizerBank.ts           // ~150 linhas
```

#### FASE 2: Extrair Tabs
```
components/organizer-settings/
├── tabs/
│   ├── CompanyTab.tsx            // ~300 linhas
│   ├── BankTab.tsx               // ~250 linhas
│   └── UsersTab.tsx              // ~400 linhas
```

#### FASE 3: Extrair Components
```
components/organizer-settings/
├── users/
│   ├── UsersList.tsx             // ~200 linhas
│   ├── UserInviteDialog.tsx      // ~200 linhas
│   └── UserPermissionsForm.tsx   // ~200 linhas
```

#### FASE 4: Arquivo Principal (~150 linhas)

---

## 🟡 PRIORIDADE 5: Registrations Page (1,461 linhas)

### 🎯 Estratégia de Divisão

#### FASE 1: Extrair Hooks
```
lib/hooks/registrations/
├── useRegistrationsData.ts       // ~200 linhas
├── useRegistrationsFilter.ts     // ~150 linhas
└── useRegistrationsExport.ts     // ~150 linhas
```

#### FASE 2: Extrair Components
```
components/registrations/
├── RegistrationsList.tsx         // ~300 linhas
├── RegistrationsFilters.tsx      // ~200 linhas
├── RegistrationCard.tsx          // ~150 linhas
├── RegistrationDialog.tsx        // ~200 linhas
└── RegistrationsExport.tsx       // ~150 linhas
```

#### FASE 3: Arquivo Principal (~150 linhas)

---

## 📅 CRONOGRAMA DE EXECUÇÃO

### Semana 1: Event Settings (5 dias)
- **Dia 1:** Extrair hooks (1,200 linhas)
- **Dia 2-3:** Extrair tabs (2,600 linhas)
- **Dia 4-5:** Extrair sub-componentes (2,400 linhas)
- **Dia 6:** Integração e testes

### Semana 2: Checkout (4 dias)
- **Dia 1:** Extrair hooks (1,000 linhas)
- **Dia 2-3:** Extrair steps (1,400 linhas)
- **Dia 4:** Extrair forms (1,550 linhas)
- **Dia 5:** Integração e testes

### Semana 3: Event Creation (3 dias)
- **Dia 1:** Extrair hooks
- **Dia 2:** Extrair sections
- **Dia 3:** Integração e testes

### Semana 4: Settings + Registrations (3 dias)
- **Dia 1:** Organizer Settings
- **Dia 2:** Registrations
- **Dia 3:** Testes finais

**Total: 4 semanas**

---

## 🔄 PROCESSO DE REFATORAÇÃO SEGURA

### Para Cada Página:

#### 1. PREPARAÇÃO (30 min)
```bash
# Criar backup
cp página-original.tsx página-original.BACKUP.tsx

# Criar branch
git checkout -b refactor/nome-pagina

# Criar estrutura de pastas
mkdir -p components/nome-pagina/{sections,forms,dialogs}
mkdir -p lib/hooks/nome-pagina
```

#### 2. EXTRAÇÃO DE HOOKS (2-3 horas)
- ✅ Identificar todos os `useState`
- ✅ Identificar todas as funções de fetch
- ✅ Criar hooks customizados
- ✅ Testar hooks isoladamente

#### 3. EXTRAÇÃO DE COMPONENTES (4-6 horas)
- ✅ Identificar seções principais
- ✅ Criar componentes de seção
- ✅ Extrair forms
- ✅ Extrair dialogs
- ✅ Testar cada componente

#### 4. INTEGRAÇÃO (1-2 horas)
- ✅ Atualizar arquivo principal
- ✅ Importar novos componentes
- ✅ Passar props necessárias
- ✅ Remover código duplicado

#### 5. VALIDAÇÃO (1-2 horas)
- ✅ Executar checklist de funcionalidade
- ✅ Testar fluxos principais
- ✅ Verificar console de erros
- ✅ Testar em diferentes navegadores

#### 6. FINALIZAÇÃO (30 min)
```bash
# Commit
git add .
git commit -m "refactor: Dividir página X em componentes menores"

# Merge
git checkout main
git merge refactor/nome-pagina

# Push
git push origin main

# Remover backup (se tudo ok)
rm página-original.BACKUP.tsx
```

---

## ✅ CHECKLIST POR PÁGINA

### Event Settings
- [ ] Tab Geral funciona
- [ ] Tab Campos funciona
- [ ] Tab Afiliados funciona
- [ ] Tab Cupons funciona
- [ ] Tab Relatórios funciona
- [ ] Tab Imagens funciona
- [ ] Salvar configurações funciona
- [ ] Convidar afiliado funciona
- [ ] Criar cupom funciona
- [ ] Upload de imagem funciona

### Checkout
- [ ] Step 1 (seleção) funciona
- [ ] Step 2 (dados) funciona
- [ ] Step 3 (pagamento) funciona
- [ ] Step 4 (confirmação) funciona
- [ ] Validações funcionam
- [ ] Adicionar participante funciona
- [ ] Remover participante funciona
- [ ] Aplicar cupom funciona
- [ ] PIX funciona
- [ ] Cartão funciona
- [ ] Finalização funciona

### Event Creation
- [ ] Informações básicas funcionam
- [ ] Localização funciona
- [ ] Lotes de ingressos funcionam
- [ ] Adicionar ingresso funciona
- [ ] Remover ingresso funciona
- [ ] Descrição funciona
- [ ] Configurações funcionam
- [ ] Salvar rascunho funciona
- [ ] Publicar evento funciona

### Organizer Settings
- [ ] Tab Empresa funciona
- [ ] Tab Banco funciona
- [ ] Tab Usuários funciona
- [ ] Editar dados funciona
- [ ] Convidar usuário funciona
- [ ] Editar permissões funciona
- [ ] Remover usuário funciona

### Registrations
- [ ] Lista carrega
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] Paginação funciona
- [ ] Ver detalhes funciona
- [ ] Exportar funciona
- [ ] Enviar email funciona

---

## 🎯 MÉTRICAS DE SUCESSO

### Antes da Refatoração
- 🔴 5 arquivos > 1200 linhas
- 🔴 Total: 13,457 linhas
- 🔴 Maior arquivo: 5,027 linhas
- 🔴 Manutenibilidade: BAIXA
- 🔴 Testabilidade: DIFÍCIL

### Depois da Refatoração
- 🟢 0 arquivos > 1200 linhas
- 🟢 Total: ~13,500 linhas (distribuídas em ~50 arquivos)
- 🟢 Maior arquivo: < 400 linhas
- 🟢 Manutenibilidade: ALTA
- 🟢 Testabilidade: FÁCIL

### Metas
- ✅ Arquivo principal: < 200 linhas
- ✅ Componentes de seção: < 400 linhas
- ✅ Hooks: < 200 linhas
- ✅ Forms: < 300 linhas
- ✅ Dialogs: < 200 linhas

---

## 🚨 RISCOS E MITIGAÇÃO

### Risco 1: Quebrar funcionalidade existente
**Mitigação:**
- ✅ Sempre manter backup (.BACKUP.tsx)
- ✅ Trabalhar em branch separada
- ✅ Testar exaustivamente antes de merge
- ✅ Fazer refatoração incremental

### Risco 2: Performance degradar
**Mitigação:**
- ✅ Usar React.memo para componentes pesados
- ✅ Usar useMemo/useCallback onde necessário
- ✅ Testar performance antes/depois
- ✅ Monitorar bundle size

### Risco 3: Props drilling excessivo
**Mitigação:**
- ✅ Usar Context API quando apropriado
- ✅ Manter hooks com lógica
- ✅ Passar apenas props necessárias

### Risco 4: Tempo de execução maior que esperado
**Mitigação:**
- ✅ Focar nas prioridades críticas primeiro
- ✅ Se necessário, adiar prioridades baixas
- ✅ Pedir ajuda se necessário

---

## 📚 CONVENÇÕES E PADRÕES

### Nomenclatura de Componentes
```typescript
// Componente de página (principal)
EventSettingsPage

// Layout wrapper
EventSettingsLayout

// Componentes de seção (tabs, sections)
GeneralTab, AffiliatesTab

// Sub-componentes
AffiliatesList, AffiliateInviteDialog

// Forms
ParticipantForm, AddressForm

// Hooks
useEventSettingsData, useCheckoutPayment
```

### Estrutura de Props
```typescript
// Props tipadas
interface ComponentNameProps {
  // Props obrigatórias primeiro
  id: string
  name: string
  
  // Props opcionais depois
  description?: string
  
  // Callbacks por último
  onSave?: (data: any) => void
  onCancel?: () => void
}
```

### Padrão de Hooks
```typescript
// Hook retorna objeto com dados e funções
export function useFeatureName() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  
  const fetchData = async () => {
    // ...
  }
  
  return {
    // Estado primeiro
    loading,
    data,
    error,
    
    // Funções depois
    fetchData,
    refetch: fetchData
  }
}
```

---

## 🎉 RESULTADO ESPERADO

```
📦 Antes:
app/dashboard/organizer/events/[id]/settings/page.tsx (5,027 linhas)

📦 Depois:
app/dashboard/organizer/events/[id]/settings/
├── page.tsx (150 linhas) ✅
components/event-settings/
├── EventSettingsLayout.tsx (100 linhas) ✅
├── tabs/ (6 arquivos, ~2,600 linhas) ✅
├── affiliates/ (4 arquivos, ~600 linhas) ✅
├── coupons/ (3 arquivos, ~450 linhas) ✅
├── reports/ (3 arquivos, ~550 linhas) ✅
├── custom-fields/ (3 arquivos, ~400 linhas) ✅
└── images/ (2 arquivos, ~300 linhas) ✅
lib/hooks/event-settings/
└── (7 hooks, ~1,200 linhas) ✅
```

**Total:** ~50 componentes organizados e manuteníveis! 🚀

---

## 📝 PRÓXIMOS PASSOS

1. **Revisar este plano** ✅
2. **Aprovar cronograma** ⏳
3. **Começar pela Event Settings** ⏳
4. **Executar fase por fase** ⏳
5. **Validar continuamente** ⏳
6. **Celebrar ao final!** 🎉

---

**Criado em:** 02/12/2025  
**Status:** 📋 PLANO APROVADO - AGUARDANDO INÍCIO  
**Próxima ação:** Começar Semana 1 - Event Settings

