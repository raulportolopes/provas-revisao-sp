# C2-M · API de sessões com token

PHP puro + arquivos JSON (`users.json`, `sessions.json`, `tokens.json`). O Apache precisa de `mod_rewrite`; o `.htaccess` repassa o cabeçalho `Authorization` e bloqueia o download de `users.json` e `tokens.json`.
No Linux, dê permissão de escrita ao `tokens.json` (`chmod 666 tokens.json`).

## Usuários de teste
| E-mail | Senha |
|---|---|
| ana@estrelaguia.sp | Ceu2026! |
| bruno@estrelaguia.sp | Orion#77 |

## Rotas
- `POST /login` `{"email","password"}` → 200 `{"token","user"}` · 400 · 401
- `GET /sessions?date=AAAA-MM-DD&sort=date|-date&page=n` com `Authorization: Bearer <token>` → 200 · 401 · 422
- `POST /logout` com token → 204 · 401

## Testar
```
curl -X POST http://<ip>/XXX_modulo_a/C2-M/login -d '{"email":"ana@estrelaguia.sp","password":"Ceu2026!"}'
curl http://<ip>/XXX_modulo_a/C2-M/sessions -H "Authorization: Bearer <token>"
```
