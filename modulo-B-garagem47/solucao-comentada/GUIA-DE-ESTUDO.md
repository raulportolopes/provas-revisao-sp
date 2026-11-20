# Garagem 47 · guia de estudo da solução

Material de revisão do Eduardo · Módulo B (Back-end MVC em Laravel) · Raul Porto Lopes (Avaliador)

Leia com o projeto aberto no VS Code. Cada passo diz **o que o enunciado pede**, **onde está na solução** e **a armadilha** que custa ponto. A ordem é a ordem de ataque que eu usaria nas 4 horas.

---

## 0. Os 30 minutos de leitura

Monte a lista de requisitos com a CIS do lado. Nesta prova, mais da metade dos pontos está em **regra de estado** (quem pode o quê, em que situação) e não em tela. Marque com um círculo tudo que tem "403", "não pode", "só quando", "volta ao estoque". Esses são os pontos que você zerou na PetLar e no Módulo C do Mundial.

Ordem de ataque:

| Bloco | Tempo | Por quê |
|---|---|---|
| 1. Projeto rodando em /XX_modulo_b, login, logout, layout | 25 min | Sem isso nada é avaliado |
| 2. Models e relações | 15 min | Tudo depende delas |
| 3. Permissões (Gates e Policy) | 20 min | Muitos pontos, pouco código |
| 4. Listagem de ordens com filtros | 40 min | Maior subcritério |
| 5. Clientes e veículos | 30 min | CRUD conhecido, pontos garantidos |
| 6. Abrir e editar ordem | 35 min | Validações de estado |
| 7. Máquina de situações | 30 min | Regra de estado pura |
| 8. Peças e fotos | 25 min | |
| 9. Serviços, painel, CSV | 20 min | Rápidos |
| 10. Testar pelo roteiro e publicar | 20 min | Congelar código novo |

---

## 1. Projeto, login e layout

**Pedido:** abrir em `http://servidor/XX_modulo_b/`, login com a tabela `users` já pronta, usuário inativo não entra, toda rota exige login.

**Na solução:**
- `index.php` e `.htaccess` na raiz: o Apache entra na pasta, o `.htaccess` manda tudo para o `index.php`, que carrega o `public/index.php`. Assim a URL não precisa de `/public`.
- Atenção no `.htaccess`: a regra que manda `/storage/...` para `public/storage/...` precisa vir **antes** da regra que bloqueia a pasta `storage`. Se ficar depois, as fotos dão 403.
- `AuthController@entrar`: buscamos o usuário e usamos `Hash::check()` em vez de `Auth::attempt()` porque o enunciado quer uma mensagem **diferente** para usuário inativo. Depois `Auth::login($user)` e `session()->regenerate()`.
- `routes/web.php`: grupo `middleware('auth')`. A rota de login tem `->name('login')`, porque é para ela que o middleware manda o visitante.

**Armadilha:** esquecer `@csrf` em formulário dá erro 419. Logout é **POST** com `@csrf`, não link.

## 2. Models e relações

O banco já vem pronto em inglês. Os models só declaram as relações:

```php
// WorkOrder
public function vehicle()  { return $this->belongsTo(Vehicle::class); }
public function mechanic() { return $this->belongsTo(User::class, 'mechanic_id'); }   // FK com nome diferente
public function services() { return $this->belongsToMany(Service::class)->withPivot('price'); }
public function items()    { return $this->hasMany(WorkOrderItem::class); }

// Customer: ordens do cliente passando pelos veículos
public function workOrders() { return $this->hasManyThrough(WorkOrder::class, Vehicle::class); }
```

- `withPivot('price')`: sem isso `$servico->pivot->price` vem vazio.
- `part_work_order` tem id próprio e quantidade, então virou um model (`WorkOrderItem`) com `protected $table`.
- `StatusLog` não tem `updated_at`: `const UPDATED_AT = null;`.
- `casts()` com `'due_date' => 'date'` faz o campo virar Carbon, e aí `->format('d/m/Y')` e `->lt(today())` funcionam.

## 3. Permissões: Gate, Policy e as duas camadas

**Regra de ouro:** esconder o botão **não** protege. Toda permissão tem duas camadas:

1. **Servidor** (vale ponto de 403): `middleware('can:clientes')` na rota ou `$this->authorize('update', $ordem)` no controller.
2. **Tela** (vale ponto de "não mostra o botão"): `@can('update', $ordem) ... @endcan`.

- Regra só de cargo → **Gate** no `AppServiceProvider`: `Gate::define('clientes', fn ($u) => $u->ehBalcao());`
- Regra que depende do registro → **Policy** (`WorkOrderPolicy`). O mecânico só vê a ordem dele: `return ! $user->ehMecanico() || $ordem->mechanic_id === $user->id;`
- Policy de dono (`PhotoPolicy::delete`): só quem enviou a foto ou o gerente apaga.
- No Laravel 12 o `Controller` base vem vazio: coloque `use AuthorizesRequests;` nele, senão `$this->authorize()` não existe.
- Na listagem, o mecânico só vê as dele: `scopeVisiveisPara()` no model. Não basta proteger o detalhe.

## 4. Listagem de ordens (o maior bloco)

`WorkOrderController@filtrar` monta uma consulta só, e cada filtro entra com `->when()`:

```php
->when(array_key_exists($f['status'], WorkOrder::SITUACOES), fn ($q) => $q->where('status', $f['status']))
->when($f['busca'] !== '', function ($q) use ($f) {
    $q->where(function ($q) use ($f) {          // agrupa os OR!
        $q->where('code', 'like', ...)->orWhereHas('vehicle', ...)->orWhereHas('vehicle.customer', ...);
    });
})
->when($dataOk, fn ($q) => $q->whereDate('opened_at', '<=', $f['ate']))   // whereDate pega o dia inteiro
```

- **OR sem agrupar** é o erro clássico: `where status = aberta OR placa like ...` traz ordens de outras situações.
- **"Até" com whereDate**: com `where('opened_at', '<=', '2026-11-18')` a ordem aberta às 14h do dia 18 some.
- **Valor estranho na URL** (`?ordem=xyz`) cai no padrão. Nunca coloque o texto da URL direto num `orderBy`.
- **Ordenar por total**: o total não é coluna. O `scopeComTotal()` calcula no SQL com subconsultas e dá o apelido `total_calculado`.
- **Desempate pelo id** na mesma direção da ordenação.
- **Paginação**: `->paginate(10)->withQueryString()`. Sem o `withQueryString()`, a página 2 perde os filtros.
- **Filtro continua selecionado**: o controller devolve `$f` para a view e a view usa `@selected($f['status'] === $chave)` e `@checked($f['atrasadas'])`.
- **Atrasada**: prazo **antes de hoje** e situação ainda na oficina. Prazo igual a hoje ainda não é atraso. `diffInDays` para o "Atrasada há N dias", com "dia" no singular.
- **N+1**: `->with(['vehicle.customer', 'mechanic', 'services', 'items'])`. Sem isso, 10 linhas viram mais de 40 consultas.

## 5. Clientes e veículos

- **Normalizar antes de validar** (`prepareForValidation` no Form Request): CPF e telefone viram só dígitos; placa vira maiúscula sem hífen. Assim `123.456.789-09` e `12345678909` são o mesmo CPF para o `unique`.
- **Unique na edição**: `Rule::unique('customers', 'cpf')->ignore($id)`, senão salvar o cliente sem mudar nada dá "CPF já existe".
- **CPF válido**: regra própria em closure, com o algoritmo dos dois dígitos (`CustomerRequest::cpfValido`).
- **Exibir com máscara**: `Formato::cpf()` e `Formato::telefone()`. O banco guarda sem máscara.
- **Apagar com regra**: cliente com ordem não pode ser apagado (mensagem e o registro continua). Sem ordem, os veículos saem junto pelo `ON DELETE CASCADE` que já está no banco. Leia o SQL: o banco te conta as regras de cascata.
- **Página de confirmação** em GET `/clientes/{id}/apagar` e o DELETE só nela.

## 6. Abrir e editar ordem

Tudo em `WorkOrderRequest`. O mesmo Request serve para criar e editar: `$this->route('ordem')` é nulo na criação.

- `authorize()` do Request devolvendo `false` gera 403 sozinho.
- **Veículo ocupado**: closure que procura ordem do veículo fora de entregue/cancelada e cita o código na mensagem.
- **Km**: não pode ser menor que `max('km')` das ordens do veículo.
- **Prazo**: `after_or_equal:today` na criação; na edição, não pode ser antes da abertura.
- **Mecânico válido**: `Rule::exists('users', 'id')->where('role', 'mecanico')->where('active', 1)`.
- **Serviço inativo**: o formulário não mostra, **e** o servidor recusa se vier à força pelo DevTools.
- **Checkbox com old()**: depois de um erro, `old('services')` é o que foi enviado; se nada foi marcado, é nulo. Por isso a view usa `$errors->any() ? old('services', []) : $marcados`.
- **Código OS-2026-0017**: maior código do ano + 1, dentro da transação com `lockForUpdate()`. A sequência recomeça no ano novo.
- **Preço congelado na pivot**: `sync([$id => ['price' => ...]])`. Serviço que já estava na ordem mantém o preço antigo; serviço novo pega o preço atual. Mudar o preço no catálogo não mexe em ordem antiga.

## 7. Máquina de situações

Toda a regra está em **um lugar** (`app/Services/FluxoOrdem.php`). O controller só faz:

```php
abort_unless($fluxo->cargoPode($user, $ordem, $para), 403);   // cargo errado = 403
if ($erro = $fluxo->problema($ordem, $para)) {                 // situação errada = mensagem
    return back()->with('erro', $erro);
}
$fluxo->executar($user, $ordem, $para, $nota);                 // efeitos + histórico, numa transação
```

- **Duas perguntas diferentes:** "esse cargo pode?" (403) e "essa ordem aceita agora?" (mensagem, nada muda). Misturar as duas é o erro mais comum.
- **Efeitos colaterais:** concluir grava `finished_at`; entregar grava `delivered_at`; cancelar grava o motivo e **devolve as peças ao estoque**.
- **Histórico:** toda transição gera uma linha em `work_order_status_logs`, com de, para, quem e observação.
- Os botões da tela vêm de `$fluxo->opcoes()`, a mesma tabela de regras. Assim tela e servidor nunca discordam.

## 8. Peças e fotos

**Peças** (`WorkOrderItemController`):
- `DB::transaction` + `Part::lockForUpdate()`: lê o estoque travado, confere, baixa.
- Estoque insuficiente: `throw ValidationException::withMessages([...])` volta ao formulário com a mensagem como qualquer erro de validação.
- A mesma peça de novo **soma** na linha existente (`firstOrNew`). O banco tem `unique (work_order_id, part_id)`; inserir de novo daria erro 500.
- `Route::scopeBindings()`: `/ordens/5/pecas/9` dá 404 se o item 9 for de outra ordem.

**Fotos** (`PhotoController`):
- Formulário com `enctype="multipart/form-data"` e `name="fotos[]" multiple`.
- `'fotos.*' => ['file', 'mimes:jpg,jpeg,png,webp', 'max:2048']`. O `mimes` olha o **conteúdo** do arquivo, então um .txt renomeado para .jpg é recusado. `max` é em KB.
- Limite de 6 por ordem: `'fotos' => ['max:' . (6 - $jaTem)]`.
- `$arquivo->store('ordens/' . $ordem->id, 'public')` e `php artisan storage:link`.
- Apagar a foto apaga **o arquivo e o registro**. Apagar a ordem apaga a pasta (`deleteDirectory`), porque o CASCADE do banco não apaga arquivo.

## 9. Serviços, painel e CSV

- **Preço digitado no padrão brasileiro**: `Formato::numeroDigitado()` transforma `1.234,50` em `1234.50` antes de `numeric|decimal:0,2|gt:0`.
- **Checkbox desmarcado não é enviado**: `$this->boolean('active')` vira `false`.
- **Serviço em uso** não pode ser apagado; a mensagem manda desativar.
- **Painel**: contagem por situação em uma consulta (`groupBy('status')->pluck('total', 'status')`). Faturado só para o gerente.
- **CSV**: `response()->streamDownload()`, BOM `\xEF\xBB\xBF` no começo (o Excel abre os acentos), `fputcsv(..., ';')`, datas dd/mm/aaaa e valor com vírgula. Usa o **mesmo** `filtrar()` da listagem.

## 10. Formatos (ponto fácil que você já perdeu)

| O quê | Como | Exemplo |
|---|---|---|
| Data | `$data->format('d/m/Y')` | 19/11/2026 |
| Data e hora | `->format('d/m/Y H:i')` | 19/11/2026 14:05 |
| Dinheiro | `'R$ ' . number_format($v, 2, ',', '.')` | R$ 1.234,50 |
| Quilometragem | `number_format($km, 0, ',', '.')` | 132.400 km |

O `<input type="date">` sempre envia `AAAA-MM-DD`. O que aparece na tela, fora do input, é sempre `dd/mm/aaaa`.

---

## Para treinar depois de ler

1. Apague o `FluxoOrdem.php` e reescreva só olhando o diagrama do comentário no topo do arquivo. Rode o checador.
2. Troque a busca para aceitar também o telefone do cliente, sem quebrar os outros filtros.
3. Crie a regra "o gerente pode reabrir uma ordem cancelada há menos de 7 dias" (transição nova).
