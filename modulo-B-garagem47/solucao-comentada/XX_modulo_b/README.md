# Garagem 47 · solução comentada (Módulo B, revisão)

Laravel 12 + MySQL/MariaDB, MVC com Blade. Publicado em `http://servidor/XX_modulo_b/`.

## Instalação
1. Crie o banco `XX_modulo_b` (utf8mb4) e importe `garagem47_db.sql` (assets da prova).
2. `composer install` (ou copie a pasta `vendor` de outro projeto Laravel 12).
3. `cp .env.example .env` e ajuste `APP_URL=http://servidor/XX_modulo_b`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. Depois `php artisan key:generate`.
4. `php artisan storage:link` (cria `public/storage` para as fotos).
5. Copie a pasta inteira para `htdocs/XX_modulo_b`. O `index.php` e o `.htaccess` da raiz fazem o projeto abrir sem `/public` na URL.
6. Permissão de escrita em `storage/` e `bootstrap/cache/` (no Linux: `chown -R www-data storage bootstrap/cache`).

Não rode `php artisan migrate`: o banco já vem pronto (inclusive a tabela `sessions`).

## Usuários (senha `ProvaB2026!`)
| Cargo | E-mail |
|---|---|
| gerente | gerente.prova@garagem47.com |
| atendente | atendente.prova@garagem47.com |
| mecânico (Carlos) | mecanico.prova@garagem47.com |
| mecânica (Bruna) | mecanico2.prova@garagem47.com |
| inativo | inativo.prova@garagem47.com |

## Onde está cada regra
| Regra | Arquivo |
|---|---|
| Rotas em português, grupos `auth` e `can:` | `routes/web.php` |
| `/criar` e `/editar` no lugar de create/edit; Gates por cargo | `app/Providers/AppServiceProvider.php` |
| Quem pode ver/editar/apagar ordem, peças e fotos | `app/Policies/WorkOrderPolicy.php`, `PhotoPolicy.php` |
| Máquina de estados da ordem (transições, quem, efeitos) | `app/Services/FluxoOrdem.php` |
| Validação (CPF, placa, km, prazo, veículo ocupado, serviço inativo) | `app/Http/Requests/*.php` |
| Filtros, ordenação, paginação, CSV | `WorkOrderController@index/filtrar/exportar` |
| Preço congelado na pivot (`sync` com dados) | `WorkOrderController@sincronizarServicos` |
| Estoque com trava (`lockForUpdate`) | `WorkOrderItemController` |
| Upload com tipo real e tamanho, limite por ordem | `PhotoController` |
| Atraso, total, scopes | `app/Models/WorkOrder.php` |
| R$, dd/mm/aaaa, CPF e telefone com máscara | `app/Support/Formato.php` (alias `Formato` em `config/app.php`) |
| Mensagens de validação em português | `lang/pt_BR/validation.php` |
| Páginas 403 e 404 | `resources/views/errors/` |
