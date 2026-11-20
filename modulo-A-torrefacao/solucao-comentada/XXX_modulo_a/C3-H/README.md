# C3-H · Programa de fidelidade

PHP puro + JSON. O `.htaccess` repassa o `Authorization` e bloqueia `users.json`, `tokens.json` e `transactions.json`. No Linux: `chmod 666 tokens.json transactions.json`.

## Contas
| E-mail | Senha | Papel |
|---|---|---|
| ana@torra.sp | Cafe2026! | customer (197 pontos) |
| bruno@torra.sp | Graos#88 | customer (40 pontos) |
| carla@torra.sp | Balcao@3 | staff |

## Rotas
- `POST /login` · `POST /logout`
- `GET /me` · `GET /me/history` (customer)
- `POST /purchases` `{"customer_id","amount_cents"}` (staff)
- `POST /redeem` `{"reward_id"}` (customer)

Ordem dos erros: 401 → 403 → 400 → regras (404, 422, 409).
