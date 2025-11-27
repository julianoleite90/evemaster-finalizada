# Instruções de Instalação

## 1. Instalar Dependências

```bash
npm install
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Configurar Supabase Localmente (Opcional)

Se você quiser desenvolver localmente com Supabase:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar Supabase local
supabase init

# Iniciar serviços locais
supabase start
```

## 4. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 5. Próximos Passos

- [ ] Configurar schema do banco de dados no Supabase
- [ ] Implementar autenticação completa
- [ ] Criar mais componentes Shadcn/UI conforme necessário
- [ ] Implementar os dashboards por perfil
- [ ] Configurar sistema de pagamentos




