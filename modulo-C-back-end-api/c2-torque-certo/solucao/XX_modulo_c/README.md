# Torque Certo API – solução de referência (Módulo C, prova de revisão)

API RESTful em Laravel para a oficina mecânica. Leia o `COMO-FOI-FEITO.md` para entender a solução passo a passo.

## Instalação
1. `composer install`
2. Copie `.env.example` para `.env`, ajuste `DB_DATABASE=torque_db`, usuário e senha. Rode `php artisan key:generate`.
3. Importe `torque_db.sql` (phpMyAdmin ou `mysql -u root < torque_db.sql`).
4. `php artisan migrate` (cria só a `personal_access_tokens` do Sanctum) e `php artisan storage:link`.
5. Publique: `http://servidor/XX_modulo_c/public/api` (ou `php artisan serve` e `http://127.0.0.1:8000/api`).

Sem MySQL: `DB_CONNECTION=sqlite`, `touch database/database.sqlite` e `php artisan migrate --seed`.

## Usuários (senha `Torque@2026`)
`admin@torque.test` (admin), `atendente@torque.test` (atendente), `joao@torque.test` e `pedro@torque.test` (mecânicos).

## Conferência
`php checar-torque.php http://127.0.0.1:8000/api` (importe o SQL de novo e apague `storage/app/public/orders` antes de cada execução). Resultado esperado: 71 de 71.

## Rotas
| Método | Rota | Perfis |
|---|---|---|
| POST | `/api/login` | público |
| POST/GET | `/api/logout`, `/api/me` | todos |
| GET | `/api/customers`, `/api/parts`, `/api/orders`, `/api/orders/{id}` | todos (mecânico só as OS dele) |
| POST | `/api/orders/{id}/transition`, `/api/orders/{id}/photos` | todos (mecânico só conclui a própria) |
| POST | `/api/customers`, `/api/customers/{id}/vehicles`, `/api/orders`, `/api/orders/{id}/items` | admin, atendente |
| DELETE | `/api/orders/{id}/items/{item}` | admin, atendente |
| PATCH | `/api/orders/{id}/discount` | admin, atendente |
| GET | `/api/reports/low-stock` | admin, atendente |
| GET | `/api/orders/trash`, `/api/reports/revenue?year=` | admin |
| DELETE | `/api/orders/{id}` | admin |
| POST | `/api/orders/{id}/restore` | admin |
