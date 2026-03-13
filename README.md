# Finix-B Backend

Backend em Node.js + Express + MongoDB para simulação de empréstimos com:

- Login para **Terceiros**, **Sócios** e **Admin**.
- Promoção de **Terceiro -> Sócio** via código.
- Admin para editar conteúdo da página de empréstimos.
- Coleta de solicitações e relatório com **média**, **moda** e dados para gráfico.

## Como rodar

```bash
npm install
cp .env.example .env
npm start
```

## Endpoints principais

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/promote-to-socio` (Bearer token, somente terceiro)

### Admin
- `PUT /admin/content/emprestimos` (Bearer admin)
- `POST /admin/promotion-codes` (Bearer admin)

### Conteúdo
- `GET /content/emprestimos`

### Empréstimos
- `POST /loans` (Bearer)
- `GET /loans/report` (Bearer admin)

## Regras aplicadas

### Sócios
- R$ 200,00 mensais no dia 16.
- Pagamento até 20h; multa de 10% em atraso.
- Empréstimos:
  - 23% em até 12x.
  - 8% em até 30 dias.
- Até R$ 5.000: análise simples.
- Acima de R$ 5.000: análise cuidadosa e solicitação antecipada.

### Terceiros
- Fiador obrigatório.
- Fiador responde pela dívida em inadimplência.
- Comissão do fiador: 5%.
- Pagamento seg-sex, 08:00-20:00.
- Atraso: multa de 10% até 15 dias; depois 1% ao dia.
- Empréstimos:
  - 33% em até 12x.
  - 18% em até 30 dias.

## Relatório de dados
`GET /loans/report` retorna:
- Quantidade de solicitações.
- Média e moda do valor solicitado.
- Média e moda do valor total.
- `graficoMensalValoresSolicitados` com `labels` e `values`.
