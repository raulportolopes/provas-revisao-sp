# Dicas – Torque Certo (Módulo C, prova de revisão)

## Começo
- Importe o `torque_db.sql`, ajuste o `.env`, rode `php artisan install:api` e `php artisan storage:link`. Nunca `migrate:fresh`.
- Erros em JSON no `bootstrap/app.php` (`withExceptions`): 401, 404 e 422 em português.

## Perfis
- Um middleware próprio (`php artisan make:middleware Role`) que recebe a lista de perfis permitidos e responde 403 resolve quase todas as permissões nas rotas. Registre o alias no `bootstrap/app.php`.
- As regras finas (mecânico só conclui a própria OS, atendente até 10% de desconto) ficam na regra de negócio, não na rota.

## Dinheiro
- Trabalhe em centavos (inteiros). Para formatar: `number_format($centavos / 100, 2, ',', '.')`.
- `round($x, 0, PHP_ROUND_HALF_UP)` arredonda meio para cima.
- Um método só no model calcula os totais; o detalhe e o relatório chamam o mesmo método.

## Máquina de estados
- Uma constante "de onde pode ir para onde" e um método `canGoTo()` resolvem o 409.
- Estoque: `DB::transaction` + `lockForUpdate()` nas peças. Confira tudo antes de baixar qualquer coisa.
- `increment()` e `decrement()` mudam a quantidade direto no banco.

## Lixeira
- `use SoftDeletes;` no model. `onlyTrashed()`, `withTrashed()`, `restore()`, `trashed()`.
- O route model binding normal não acha registro excluído.

## Rotas aninhadas
- `->scopeBindings()` na rota `/orders/{order}/items/{item}` faz o Laravel procurar o item só dentro da OS (senão 404).

## Ordenar por um valor calculado
- Some no banco com uma subconsulta (`selectRaw`) e ordene por ela. Ordenar em PHP depois do `paginate` ordena só a página.

## Fotos
- Validação: `mimes:jpg,jpeg,png`, `max:4096`, `dimensions:min_width=...`.
- Miniatura com GD: `imagecreatefromjpeg`, `imagecreatetruecolor`, `imagecopyresampled`, `imagejpeg`.
- `Storage::disk('public')->put(...)` e `Storage::url(...)` para a URL.

## Datas
- `to=2026-11-12` precisa incluir até 23:59:59 desse dia.
