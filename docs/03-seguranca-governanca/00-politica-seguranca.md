# Politica de Seguranca da Aplicacao

## Objetivo
Garantir confidencialidade, integridade e disponibilidade dos dados da plataforma de e-commerce.

## Principios
1. **Server authoritative**: preco, permissao e ownership sempre validados no backend.
2. **Least privilege**: endpoints administrativos so para usuarios `ADMIN`.
3. **Secret hygiene**: secrets apenas em variaveis de ambiente; nunca no client/localStorage.
4. **Safe defaults**: negar acesso por padrao quando contexto de auth for ausente.
5. **Observabilidade sem vazamento**: logs com redacao de PII e segredos.

## Dados sensiveis
- Credenciais de usuario (hash de senha)
- Tokens de verificacao/reset
- Dados pessoais (email, telefone, CPF, endereco)
- Chaves e IDs de pagamento

## Regras obrigatorias
- Nao usar `Math.random` para token de seguranca.
- Nao usar `rejectUnauthorized:false` em conexoes de producao.
- Nao expor endpoints de teste em producao.
- Nao retornar dados pessoais sem necessidade de negocio clara.
- Toda API de pedido/carrinho deve validar sessao e ownership.

## Controles de revisao
- Toda alteracao em checkout/auth exige revisao tecnica.
- Toda alteracao em API deve listar validacoes de auth e input.
- Toda alteracao em DB deve avaliar impacto em seguranca e privacidade.
