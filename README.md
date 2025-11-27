# EveMaster - Plataforma de Ingressos para Eventos Esportivos

Plataforma SaaS de venda de ingressos nichada em eventos esportivos (corridas de rua, maratonas, triatlon, ciclismo).

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript
- **Estilização:** Tailwind CSS + Shadcn/UI + Lucide React
- **Backend/DB:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
- **Gerenciamento de Estado:** Zustand + TanStack Query
- **Formulários:** React Hook Form + Zod
- **Datas:** date-fns

## Estrutura de Perfis (RBAC)

1. **ADMIN:** Gerencia a plataforma, aprova eventos, vê faturamento global
2. **ORGANIZADOR:** Cria eventos, gere inscritos, define kits, vê financeiro
3. **AFILIADO:** Divulga eventos via link/cupom, acompanha conversão
4. **ATLETA:** Compra inscrições, gerencia histórico, acessa comprovantes

## Estrutura de Pastas

```
app/
├── (public)/          # Landing page, busca de eventos, página do evento
├── (auth)/            # Login, Registro, Recuperar senha
├── dashboard/
│   ├── organizer/     # Área do organizador
│   ├── affiliate/     # Área do afiliado
│   └── admin/         # Área do admin
└── my-account/        # Área do atleta
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas credenciais do Supabase
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## Próximos Passos

- [ ] Configurar Supabase localmente (Docker)
- [ ] Criar schema do banco de dados
- [ ] Implementar autenticação
- [ ] Criar componentes Shadcn/UI
- [ ] Implementar dashboards por perfil
