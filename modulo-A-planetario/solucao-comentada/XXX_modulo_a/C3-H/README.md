# C3-H · Reserva de assentos do planetário

PHP puro + `sessions.json` e `reservations.json` (dê permissão de escrita ao `reservations.json` no Linux). Fuso: America/Sao_Paulo.

## Rotas
- `GET /sessions/{id}/seats` → mapa `free`/`taken`
- `POST /sessions/{id}/reservations` `{"name","email","seats":["C4","C5"]}` → 201 · 400 · 404 · 422 · 409
- `PATCH /reservations/{id}/cancel` `{"email"}` → 200 · 400 · 403 · 404 · 409 · 422
- `GET /reservations?email=...` → reservas do e-mail, mais recentes primeiro

Para restaurar os dados originais, copie de volta o `reservations.json` do pacote.
