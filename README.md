# Solo Contest

Assistente de estudos para concursos públicos (React + Vite + Tailwind).

Dois modos, escolhidos automaticamente:
- **Com conta (produção):** com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurados (ver `.env.example`),
  cada pessoa tem login e o progresso fica salvo no Supabase, sincronizado entre site e celular.
  O banco é criado com `supabase/schema.sql`.
- **Local (testes):** sem as chaves, não há login e os dados ficam só no aparelho (IndexedDB).

## Rodar no computador
```bash
npm install
npm run dev      # abre em http://localhost:5173
```

## Gerar a versão final (pasta dist/)
```bash
npm run build
npm run preview
```

## Onde fica o "banco de dados"?
- `src/api/remoteClient.js` — Supabase (tabela `records`, protegida por RLS: cada pessoa só vê o que é dela)
- `src/api/localClient.js` — modo local (IndexedDB)
- `src/api/client.js` — escolhe qual usar
- Valores padrão de cada tipo: `src/api/entityDefaults.json`

## Versão em arquivo único
```bash
npm run build:single   # gera dist-single/index.html (abre com dois cliques no Chrome)
```
