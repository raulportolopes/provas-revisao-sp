# C2-M · Pedidos com máquina de estados

PHP puro + `products.json` e `orders.json` (no Linux: `chmod 666 orders.json`).

## Rotas
- `GET /orders[?status=received|preparing|ready|delivered|cancelled]`
- `GET /orders/{id}`
- `POST /orders` `{"customer":"Gil","items":[{"product_id":2,"size":"G","qty":2}]}` → 201 · 400 · 422
- `PATCH /orders/{id}/status` `{"status":"preparing"}` → 200 · 400 · 404 · 409 · 422

Transições: received → preparing | cancelled; preparing → ready | cancelled; ready → delivered.
Para restaurar os dados, copie de volta o `orders.json` do pacote.
