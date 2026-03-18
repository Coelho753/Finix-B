# Finix-B Backend

Backend em Node.js + Express + MongoDB para simulação de empréstimos com:

- Login para **Terceiros**, **Sócios** e **Admin**.
- Promoção de **Terceiro -> Sócio** via código.
- Admin para editar conteúdo da página de empréstimos.
- Coleta de solicitações e relatório com **média**, **moda** e dados para gráfico.
- Endpoints legados (`/auth`, `/admin`, etc.) e com prefixo `/api`.

## Como rodar

```bash
npm install
cp .env.example .env
npm start
```

## Endpoints principais

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (Bearer token)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/promote-to-socio` (Bearer token, somente terceiro)

### Admin
- `PUT /api/admin/content/emprestimos` (Bearer admin)
- `POST /api/admin/promotion-codes` (Bearer admin)

### Site content
- `GET /api/site-content`
- `PUT /api/site-content/:id` (Bearer admin)

### Conteúdo
- `GET /api/content/emprestimos`

### Empréstimos
- `POST /api/loans` (Bearer)
- `GET /api/loans/report` (Bearer admin)

### Transações
- `POST /api/transactions` (Bearer)
- `GET /api/transactions` (Bearer)
- `GET /api/transactions/mine` (Bearer)
- `PUT /api/transactions/:id` (Bearer)
- `DELETE /api/transactions/:id` (Bearer)

### Notificações de pagamento
- `POST /api/payment-notifications` (Bearer)
- `GET /api/payment-notifications` (Bearer)
- `PUT /api/payment-notifications/:id` (Bearer admin)
- `DELETE /api/payment-notifications/:id` (Bearer)

### Usuários
- `GET /api/users` (Bearer admin)
- `POST /api/users` (Bearer admin)
- `PUT /api/users/:id` (Bearer admin)
- `DELETE /api/users/:id` (Bearer admin)
- `GET /api/users/socios` (Bearer)

### Solicitações de fiador
- `POST /api/fiador-requests` (Bearer)
- `GET /api/fiador-requests/mine` (Bearer)
- `GET /api/fiador-requests/for-me` (Bearer)
- `PUT /api/fiador-requests/:id` (Bearer do fiador)
- `DELETE /api/fiador-requests/:id` (Bearer)

### Códigos
- `GET /api/membership-codes` (Bearer admin)
- `POST /api/membership-codes` (Bearer admin)
- `GET /api/membership-codes/validate/:code`
- `POST /api/membership-codes/use` (Bearer terceiro)
- `GET /api/fiador-codes/validate/:code`
- `POST /api/fiador-codes/consume`

## Regras de autenticação

### Cadastro (`POST /api/auth/register`)
Aceita payload com e retorna `{ user: { id, email, name, role }, token }`:

```json
{
  "name": "Nome",
  "email": "email@finix.com",
  "password": "Senha@123",
  "role": "terceiro | socio",
  "membershipCode": "FINIX75345609"
}
```

- Senha obrigatoriamente com: maiúscula, minúscula, número, caractere especial e mínimo de 8 caracteres.
- Inputs passam por sanitização removendo: `< > " ' ; ( ) { }`.
- Para `role: "socio"`, o `membershipCode` deve ser `FINIX75345609`.

### Admin padrão
Ao iniciar o servidor, caso não exista admin com `admin@finix.com`, é criado automaticamente com senha `#75345609Ef`.

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
`GET /api/loans/report` retorna:
- Quantidade de solicitações.
- Média e moda do valor solicitado.
- Média e moda do valor total.
- `graficoMensalValoresSolicitados` com `labels` e `values`.
