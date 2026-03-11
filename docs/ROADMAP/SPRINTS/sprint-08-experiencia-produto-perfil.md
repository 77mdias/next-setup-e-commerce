# Sprint 08 - Experiencia de Produto e Perfil

## Objetivo

Fechar lacunas visiveis de UX na jornada de compra e conta (conteudo real de produto, perfil e seguranca do usuario).

## Etapa 1 - Discovery

- Levantar componentes com placeholder/mock na UI de produto e perfil.
- Definir fonte canonica para especificacoes, descricao tecnica e avaliacoes.
- Revisar jornada de conta para seguranca e autogestao do usuario.

## Etapa 2 - Design

- Definir schema para atributos tecnicos de produto e estrutura de reviews.
- Definir UX de abas de produto com fallback elegante para dados ausentes.
- Definir fluxo de perfil para:
  - alteracao de senha;
  - historico de sessoes/dispositivos (MVP);
  - preferencias de conta.
- Definir padrao de mensagens de erro/sucesso orientadas a acao.

## Etapa 3 - Implementacao

- Substituir conteudo mock das abas de produto por dados reais.
- Implementar carga e renderizacao de especificacoes tecnicas por categoria.
- Implementar modulo de reviews (listagem, nota media e envio autenticado MVP).
- Completar secoes de perfil hoje incompletas:
  - seguranca da conta;
  - metodos de pagamento (MVP alinhado ao fluxo Stripe);
  - gestao de preferencias.
- Padronizar estados de loading/empty/error nas paginas de conta e produto.

## Etapa 4 - Testes e homologacao (S08-UX-003)

- Testes de integracao para contrato de produto (abas + reviews).
- Testes de integracao para APIs de perfil e seguranca.
- Testes E2E da jornada completa: produto -> carrinho -> pedido -> perfil.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 60 minutos.

### Checklist manual de homologacao (S08-UX-003)

| Cenario | Resultado esperado | Evidencia tecnica | Status |
| --- | --- | --- | --- |
| Aba de especificacoes de produto | Dados reais por categoria sem placeholder | Suite de produto + inspecao manual | [ ] |
| Reviews de produto | Usuario autenticado consegue avaliar e listar reviews | Suite de reviews + smoke manual | [ ] |
| Seguranca no perfil | Usuario altera senha e visualiza info de seguranca | Suite de perfil/auth | [ ] |
| Estados de erro/empty/loading | Mensagens consistentes e sem quebra visual | Testes de componente + E2E | [ ] |

### Plano de rollback (S08-UX-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Gatilhos:**
  - regressao de compra por erro em pagina de produto;
  - quebra de perfil/autenticacao em producao;
  - queda de conversao apos release atribuida a regressao de UX.
- **Passos de rollback:**
  1. Reverter release para versao estavel anterior.
  2. Desativar modulos novos por feature flag quando aplicavel.
  3. Executar smoke de produto, checkout e perfil.
  4. Registrar incidente e backlog de correcao.
- **Responsaveis:** engenharia frontend/fullstack, QA e produto.

## Criterios de aceite

- Pagina de produto nao possui mais conteudo mock nas abas principais.
- Perfil do usuario possui secoes de seguranca e preferencias funcionais.
- Reviews de produto em MVP operacional com autenticacao.
- Jornada principal continua estavel com cobertura automatizada.
- Checklist e plano de rollback formalizados.
