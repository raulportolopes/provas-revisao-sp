# HemoSP API – solução de referência (Módulo C, prova de revisão)

API RESTful em Laravel para agendamento de doação de sangue. Leia o `COMO-FOI-FEITO.md` para entender a solução passo a passo.

## Instalação
1. `composer install`
2. Copie `.env.example` para `.env` e ajuste `DB_DATABASE=hemosp_db`, usuário e senha do MySQL. Rode `php artisan key:generate`.
3. Importe `hemosp_db.sql` (phpMyAdmin ou `mysql -u root < hemosp_db.sql`).
4. `php artisan migrate` (cria só a tabela `personal_access_tokens` do Sanctum).
5. Publique a pasta: `http://servidor/XX_modulo_c/public/api` (ou `php artisan serve` e `http://127.0.0.1:8000/api`).

Sem MySQL: `DB_CONNECTION=sqlite`, `touch database/database.sqlite` e `php artisan migrate --seed` (o `BaseSeeder` carrega os mesmos dados do `.sql`).

## Usuários de teste
- Doadores: `ana@doador.test` … `paula@doador.test`, senha `Doador@2026`.
- Equipe: `admin@hemosp.test` (admin) e `triagem@hemosp.test` (triagem), senha `Hemo@2026`.

## Conferência
`php checar-hemosp.php http://127.0.0.1:8000/api` (importe o SQL de novo antes de cada execução). Resultado esperado: 84 de 84.

## Rotas
| Método | Rota | Quem |
|---|---|---|
| GET | `/api`, `/api/blood-stock`, `/api/centers`, `/api/centers/{id}/slots?date=` | público |
| POST | `/api/register`, `/api/login`, `/api/staff/login` | público |
| POST | `/api/logout` | qualquer token |
| GET | `/api/me`, `/api/me/appointments` | doador |
| POST | `/api/me/appointments`, `/api/me/guardian-document` | doador |
| DELETE | `/api/me/appointments/{id}` | doador |
| GET | `/api/staff/appointments`, `/api/staff/appointments/export?date=`, `/api/staff/appointments/{id}/history` | equipe |
| PATCH | `/api/staff/appointments/{id}/status` | equipe |
| GET | `/api/staff/reports/monthly?month=` | admin |
