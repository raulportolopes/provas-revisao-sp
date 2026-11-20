# Como a Torque Certo foi feita (guia de estudo)

Leia junto com o código. A ordem abaixo é a ordem em que vale a pena construir na prova.

## 1. Base: JSON, login e perfis (30 min)
- `bootstrap/app.php`: toda rota `api/*` responde JSON (401 sem token, nunca 302), 404, 405, 422 e 403 com mensagem.
- Um único tipo de usuário (`users.role`). O token não precisa de habilidades: quem decide é o **middleware `Role`** (`app/Http/Middleware/Role.php`).
- Nas rotas (`routes/api.php`), os grupos já dizem quem entra: `role:admin,atendente` e `role:admin`. O mecânico recebe 403 sem nenhum `if` no controller.
- Regras finas ficam no service: mecânico só conclui a própria OS; atendente dá até 10% de desconto.

## 2. Dinheiro em centavos
- O banco guarda `price_cents` e `unit_price_cents` (inteiros). Somar `0.1 + 0.2` em float dá `0.30000000000000004`: com centavos isso nunca acontece.
- **Um método só** calcula os totais: `ServiceOrder::totals()`. O detalhe, a lista e o faturamento usam o mesmo método.
- Desconto: `round($sub * $percentual / 100, 0, PHP_ROUND_HALF_UP)`; total = subtotal − desconto.
- Formatação: `ServiceOrder::brl()` com `number_format($c / 100, 2, ',', '.')` dá `R$ 1.461,60`.
- O item guarda o preço da hora do orçamento (`unit_price_cents`). Se o catálogo mudar amanhã, o orçamento de hoje não muda.

## 3. Regras da OS num service (`app/Services/OrdemServico.php`)
| Método | Faz |
|---|---|
| `proximoNumero()` | OS-AAAA-NNNN: maior número do ano + 1, contando a lixeira (`withTrashed`) |
| `adicionarItem()` | só com a OS aberta; mesma peça soma na linha; serviço repetido 409 |
| `aplicarDesconto()` | só aberta ou orçada; atendente até 10% (403) |
| `transicionar()` | máquina de estados, permissão, pré-requisitos, estoque e histórico |

A ordem dentro de `transicionar()`: **existe a transição?** (409 com `allowed`) → **quem pode?** (403) → **pré-requisitos** (409/422) → **transação** (estoque, situação e evento).

## 4. Estoque sem vender a mesma peça duas vezes
```php
$pecas = Part::whereIn('id', $ids)->lockForUpdate()->get()->keyBy('id');
// 1º confere TODAS; se faltar alguma, 409 com a lista e nada muda
// 2º só então decrement() em cada uma
```
Tudo dentro de `DB::transaction`. O `lockForUpdate` faz a segunda aprovação esperar a primeira. Cancelar uma OS que já tinha baixado estoque devolve as peças (`increment`).

## 5. Lixeira com SoftDeletes
- `use SoftDeletes;` no model e a coluna `deleted_at`. O `delete()` só preenche a data; as consultas normais passam a ignorar a OS (404 no detalhe, fora da lista).
- `onlyTrashed()` lista a lixeira. Para restaurar, o route model binding não acha a OS excluída: a rota recebe `{id}` e o controller usa `withTrashed()->findOrFail($id)`.

## 6. Rotas aninhadas seguras
`/orders/{order}/items/{item}` com `->scopeBindings()`: o Laravel procura o item **dentro** daquela OS. Item de outra OS dá 404 automático.

## 7. Lista com filtros e ordenação por total
- `when()` para cada filtro opcional. `to` vai até `23:59:59` do dia, senão o último dia some.
- O mecânico só enxerga as OS dele: um `when($u->isMechanic(), ...)` na consulta e 403 no detalhe.
- Ordenar por total: o total é calculado **no banco** com uma subconsulta (`comTotal()`), aí o `orderBy` funciona antes do `paginate`. Ordenar a coleção depois de paginar ordenaria só a página.

## 8. Fotos com miniatura (GD)
- Validação: `mimes:jpg,jpeg,png` (olha o conteúdo do arquivo, não só a extensão), `max:4096` e `dimensions:min_width=320,min_height=200`.
- Nome gerado (`Str::uuid()`), disco `public` (`storage/app/public`, servido em `/storage` depois do `storage:link`).
- `app/Services/Miniatura.php`: `imagecreatetruecolor` com 320 de largura e altura proporcional, `imagecopyresampled` e `imagejpeg` com qualidade 80.

## 9. Relatórios
- Faturamento: busca as OS entregues no ano, agrupa pelo mês da entrega e monta os **12 meses** com `range(1, 12)`, inclusive os zerados.
- Estoque baixo: scope `lowStock()` (`whereColumn('stock_qty', '<', 'min_stock')`), ordem por estoque ÷ mínimo e sugestão `2 × mínimo − estoque`.

## 10. Normalização de entrada
Antes de validar, o controller limpa os dados com `$request->merge(...)`: CPF e telefone só com números, placa em maiúsculas sem hífen. Assim o `unique` compara igual com igual.
