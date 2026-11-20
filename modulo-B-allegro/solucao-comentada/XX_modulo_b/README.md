# Allegro · solução comentada (Módulo B, revisão)

Laravel 12 + MySQL/MariaDB, MVC com Blade. Publicado em `http://servidor/XX_modulo_b/`.

## Instalação
1. Crie o banco `XX_modulo_b` (utf8mb4) e importe `allegro_db.sql` (assets da prova).
2. `composer install` (ou copie a pasta `vendor` de outro projeto Laravel 12).
3. `cp .env.example .env` e ajuste `APP_URL=http://servidor/XX_modulo_b`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. Depois `php artisan key:generate`.
4. Copie a pasta inteira para `htdocs/XX_modulo_b`. O `index.php` e o `.htaccess` da raiz fazem o projeto abrir sem `/public` na URL.
5. Permissão de escrita em `storage/` e `bootstrap/cache/` (no Linux: `chown -R www-data storage bootstrap/cache`).

Não rode `php artisan migrate`: o banco já vem pronto (inclusive a tabela `sessions`). O fuso é `America/Sao_Paulo` (`config/app.php`): datas de vencimento e "hoje" dependem dele.

## Usuários (senha `ProvaB2026!`)
| Cargo | E-mail |
|---|---|
| coordenação (Beatriz) | coordenacao.prova@allegro.com |
| secretaria (Felipe) | secretaria.prova@allegro.com |
| professora (Marta) | professor.prova@allegro.com |
| professor (Davi) | professor2.prova@allegro.com |
| professora (Lúcia) | professor3.prova@allegro.com |
| inativo | inativo.prova@allegro.com |

## Onde está cada regra
| Regra | Arquivo |
|---|---|
| Rotas em português, grupos `auth` e `can:` | `routes/web.php` |
| `/criar` e `/editar`; Gates `alunos`, `financeiro`, `coordenacao` | `app/Providers/AppServiceProvider.php` |
| Professor só vê a turma dele (403 na dos outros) | `app/Policies/SchoolClassPolicy.php` + `SchoolClass::scopeVisiveisPara` |
| Conflito de sala e de professor (intervalos sobrepostos) | `app/Services/Grade.php` + `SchoolClass::scopeSobrepoe` |
| Validação da turma (horário, duração, vagas x sala, desativar) | `app/Http/Requests/SchoolClassRequest.php` (`after()`) |
| Responsável obrigatório para menor de 18 | `app/Http/Requests/StudentRequest.php` (`Rule::requiredIf`) |
| Matricular, lista de espera, cancelar, promover, gerar mensalidades | `app/Services/Matriculas.php` |
| Situação da mensalidade, multa e juros | `app/Models/Invoice.php` (`situacao`, `valorAtualizado`, `scopeNaSituacao`) |
| Filtros, totais, pagamento, estorno, CSV | `app/Http/Controllers/InvoiceController.php` |
| Inadimplência agrupada por aluno | `app/Http/Controllers/ReportController.php` |
| R$, dd/mm/aaaa, telefone com máscara | `app/Support/Formato.php` (alias `Formato` em `config/app.php`) |
| Mensagens de validação em português | `lang/pt_BR/validation.php` |
| Páginas 403 e 404 | `resources/views/errors/` |
