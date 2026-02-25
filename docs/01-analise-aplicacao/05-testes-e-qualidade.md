# Testes e Qualidade

## Estado atual
- Nao foram encontrados arquivos de teste automatizado (`test/spec`) em `src/`, `prisma/` e `scripts/`.
- Nao ha pipeline de testes unitarios/integracao/e2e configurado no `package.json`.

## Validacoes executadas
- `npm run lint`
  - Resultado: sem erros bloqueantes, somente warnings.
- `npm run build`
  - Resultado: build de producao concluido com sucesso.
  - Warnings iguais aos do lint (hooks deps e uso de `<img>`).

## Principais warnings do lint/build
- `react-hooks/exhaustive-deps` em paginas de fluxo de pedido/categoria/carrinho.
- `@next/next/no-img-element` em varias telas (potencial impacto em LCP e otimizacao).

## Riscos por ausencia de testes
- Regressao em checkout e webhook sem deteccao precoce.
- Risco alto de quebra em auth e ownership de pedidos.
- Refactors com baixa confianca por falta de rede de seguranca.

## Suite minima recomendada
1. Unitarios
- Validadores de senha e callback URL.
- Funcoes de calculo de total/frete.

2. Integracao API
- `/api/checkout` com validacao de preco server-side.
- `/api/orders/session/[sessionId]` exigindo auth.
- `/api/auth/*` (register, verify, reset) com cenarios de erro.

3. E2E
- Cadastro -> verificacao -> login.
- Adicionar carrinho -> checkout -> retorno sucesso/falha.
- Pedido historico e detalhe com controle de ownership.

## Meta de qualidade (sugestao)
- Cobertura minima inicial: 60% em modulos criticos (`auth`, `checkout`, `orders`).
- Cobertura alvo fase 2: 75% com E2E dos fluxos principais.
