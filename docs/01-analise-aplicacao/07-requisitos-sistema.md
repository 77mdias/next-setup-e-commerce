# Requisitos do Sistema

## Requisitos funcionais atuais
1. Cadastro e login com credenciais e OAuth.
2. Verificacao de email para ativacao de conta.
3. Recuperacao de senha por token.
4. Catalogo de produtos com filtros e ordenacao.
5. Carrinho e wishlist por usuario.
6. Checkout com Stripe.
7. Consulta de pedidos e detalhes.
8. Navegacao por loja (`slug`).

## Requisitos nao funcionais observados
1. Build de producao deve compilar sem erro.
2. Endpoints de listagem de produto devem manter boa performance (indices aplicados).
3. Rotas criticas devem exigir autenticacao.
4. Dados sensiveis nao devem ser expostos em logs/respostas desnecessarias.

## Requisitos de seguranca (obrigatorios)
1. Preco e total apenas calculados no backend.
2. Ownership de pedido por `userId` autenticado.
3. Tokens de seguranca gerados por fonte criptografica forte.
4. Endpoints administrativos restritos por role.
5. Segredos nunca enviados ao cliente.

## Requisitos de qualidade recomendados
1. Testes de integracao para checkout/auth/orders.
2. Testes E2E de fluxo de compra completo.
3. Pipeline CI com gate de lint, build e testes.
4. Observabilidade estruturada para incidentes.
