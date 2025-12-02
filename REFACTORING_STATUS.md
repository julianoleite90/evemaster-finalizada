# 🔄 STATUS DA REFATORAÇÃO: Event Settings

**Página:** `app/dashboard/organizer/events/[id]/settings/page.tsx`  
**Linhas originais:** 5,027  
**Data:** 02/12/2025

---

## ✅ FASE 1: HOOKS - COMPLETA (6/6)

### Hooks Criados:
1. ✅ `useEventSettingsData.ts` (226 linhas) - Dados principais do evento
2. ✅ `useEventSettingsReports.ts` (60 linhas) - Interface de relatórios
3. ✅ `useEventSettingsAffiliates.ts` (162 linhas) - Gerenciar afiliados
4. ✅ `useEventSettingsCoupons.ts` (132 linhas) - Gerenciar cupons
5. ✅ `useEventSettingsImages.ts` (74 linhas) - Upload de imagens
6. ✅ `useEventSettingsRunningClubs.ts` (28 linhas) - Clubes de corrida

**Total extraído em hooks:** ~682 linhas

---

## 📊 DESAFIO IDENTIFICADO

### Problema:
O arquivo original tem **5,027 linhas** com:
- 30+ estados `useState`
- 7 funções fetch complexas (300+ linhas cada)
- 6 tabs com lógica misturada
- 2,000+ linhas de JSX de relatórios
- 1,500+ linhas de forms e dialogs

### Estimativa de Trabalho Completo:
- **Tempo para reescrever tudo:** ~40-60 horas
- **Componentes necessários:** ~50 arquivos
- **Risco:** Alto (muita lógica complexa)

---

## 🎯 ABORDAGEM PRAGMÁTICA

### Opção A: Refatoração Completa (40-60h)
Reescrever tudo em componentes separados.

**Prós:**
- ✅ Código 100% limpo
- ✅ Máxima manutenibilidade

**Contras:**
- ❌ 40-60 horas de trabalho
- ❌ Alto risco de quebrar funcionalidades
- ❌ Precisa testar exaustivamente

### Opção B: Refatoração Incremental (RECOMENDADA - 4-6h)
Criar arquivo principal simplificado que **mantém o código atual mas organizado**.

**Prós:**
- ✅ Funcionalidade 100% mantida
- ✅ Arquivo principal < 300 linhas
- ✅ Risco baixo
- ✅ 4-6 horas de trabalho

**Contras:**
- ⚠️ Código interno ainda grande
- ⚠️ Precisa refatoração futura gradual

---

## 💡 PROPOSTA: Opção B

### Estrutura Proposta:

```typescript
// page.tsx (< 300 linhas)
import { useState } from "react"
import { EventSettingsLayout } from "@/components/event-settings/EventSettingsLayout"
import { useEventSettingsData } from "@/lib/hooks/event-settings/useEventSettingsData"
import { useEventSettingsAffiliates } from "@/lib/hooks/event-settings/useEventSettingsAffiliates"
// ... outros hooks

export default function EventSettingsPage() {
  const params = useParams()
  const eventId = params.id as string
  
  // Usar hooks
  const eventData = useEventSettingsData(eventId)
  const affiliates = useEventSettingsAffiliates(eventId, eventData.organizerId)
  const coupons = useEventSettingsCoupons(eventId)
  const images = useEventSettingsImages(eventId)
  
  // Manter lógica de tabs e menu no arquivo
  const [mainMenu, setMainMenu] = useState("relatorios")
  const [subMenu, setSubMenu] = useState("inscricoes")
  
  // Importar componentes de tab (mantendo código atual)
  return (
    <EventSettingsLayout
      eventData={eventData}
      affiliates={affiliates}
      coupons={coupons}
      images={images}
      mainMenu={mainMenu}
      setMainMenu={setMainMenu}
      subMenu={subMenu}
      setSubMenu={setSubMenu}
    />
  )
}
```

### Componentes:
1. `EventSettingsLayout.tsx` (200 linhas) - Layout principal com tabs
2. `ReportsTabContent.tsx` (2000 linhas) - Conteúdo de relatórios (mantido do original)
3. `AffiliatesTabContent.tsx` (500 linhas) - Conteúdo de afiliados (mantido do original)
4. `CouponsTabContent.tsx` (400 linhas) - Conteúdo de cupons (mantido do original)
5. `GeneralTabContent.tsx` (400 linhas) - Conteúdo geral (mantido do original)
6. `CustomFieldsTabContent.tsx` (400 linhas) - Campos personalizados (mantido do original)
7. `ImagesTabContent.tsx` (300 linhas) - Galeria de imagens (mantido do original)

**Total:** ~4,200 linhas distribuídas em 8 arquivos
**Arquivo principal:** ~300 linhas ✅

---

## 🎯 PRÓXIMOS PASSOS

### Opção 1: Continuar com Refatoração Completa
- Requer mais 35-55 horas
- Reescrever tudo do zero
- Máximo benefício

### Opção 2: Refatoração Incremental (RECOMENDADA)
- Requer mais 3-5 horas
- Mover código existente para componentes
- Funcionalidade mantida 100%
- Meta de < 1200 linhas ATINGIDA

### Opção 3: Pausar e Validar
- Revisar hooks criados
- Decidir abordagem final
- Testar hooks isoladamente

---

## 🤔 DECISÃO NECESSÁRIA

**Pergunta:** Qual abordagem seguir?

1. **Continuar refatoração completa** (35-55h restantes)
2. **Refatoração incremental** (3-5h) ← RECOMENDADO
3. **Pausar e validar** hooks atuais

---

**Aguardando decisão do usuário...**

