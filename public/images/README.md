# Pasta de Imagens

Esta pasta contém todas as imagens estáticas do projeto.

## Estrutura

```
public/images/
├── logo/          # Logos do projeto
│   ├── logo.png   # Logo principal (PNG)
│   └── logo.svg   # Logo principal (SVG - opcional)
└── ...
```

## Como usar o logo

1. Adicione seu arquivo de logo em `public/images/logo/`
2. **Nomeie o arquivo como `logo.png`** (ou `logo.svg`)
3. O logo será exibido automaticamente no menu lateral

### Formatos suportados
- PNG (recomendado) ✅
- SVG (melhor qualidade)
- JPG/JPEG

### Tamanhos recomendados
- Logo no menu: altura de 32px (largura proporcional)
- O logo será redimensionado automaticamente mantendo a proporção

## Acesso às imagens

No código, acesse as imagens usando o caminho relativo a `public/`:

```tsx
// Exemplo com Next.js Image
<Image src="/images/logo/logo.png" alt="Logo" width={32} height={32} />

// Exemplo com tag img
<img src="/images/logo/logo.png" alt="Logo" />
```

