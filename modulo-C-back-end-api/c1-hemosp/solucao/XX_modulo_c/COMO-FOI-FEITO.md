# Como a HemoSP foi feita (guia de estudo)

Leia junto com o código. A ordem abaixo é a ordem em que vale a pena construir na prova.

## 1. Base (20 min): o que garante pontos logo de cara
- **Erros em JSON** (`bootstrap/app.php`): `shouldRenderJsonWhen` faz toda rota `api/*` responder JSON mesmo sem o cabeçalho `Accept`. Sem isso, a falta de token vira **302 para /login** e você perde todos os testes de 401.
- Cada exceção ganha sua mensagem: 401 `AuthenticationException`, 403 `MissingAbilityException`, 404 `NotFoundHttpException`, 405 `MethodNotAllowedHttpException`, 422 `ValidationException`.
- **Fuso** no `config/app.php`: `America/Sao_Paulo`. Daí `toIso8601String()` sai com `-03:00`.

## 2. Dois tipos de login com Sanctum
- `Donor` e `User` estendem `Authenticatable` e usam `HasApiTokens`. O Sanctum guarda o tipo do dono do token (`tokenable_type`), então as duas tabelas convivem.
- O token nasce com uma **habilidade**: `createToken('app', ['donor'])` ou `['staff']`.
- Nas rotas: `middleware(['auth:sanctum', 'abilities:donor'])`. O alias `abilities` é registrado no `bootstrap/app.php`.
- Resultado: token da equipe em `/me` dá 403 sem nenhum `if` nos controllers.

## 3. Regras em um só lugar (services)
| Arquivo | Responsável por |
|---|---|
| `app/Services/Grade.php` | expediente do dia (domingo, sábado, `closures`), lista de horários de 20 min, ocupação, validação de data e horário |
| `app/Services/Elegibilidade.php` | as 7 regras de quem pode doar e a próxima data |
| `app/Services/Agendamento.php` | criar agendamento (ordem das checagens, transação, protocolo) e mudar situação gravando o histórico |
| `app/Models/Appointment.php` | constantes `TRANSITIONS` (máquina de estados), `LABELS` e scopes `occupying()` e `donated()` |

A rota pública de vagas e o agendamento usam a **mesma** `Grade`. O `/me` e o agendamento usam a **mesma** `Elegibilidade`. Se a regra mudar, muda num lugar só.

## 4. A grade de 20 minutos
```php
while ($t->copy()->addMinutes(20)->lte($fim)) { $lista[] = $t->copy(); $t->addMinutes(20); }
```
O último horário é o que **termina** até o fechamento: 07:00–18:00 dá 33 horários (07:00 … 17:40).
Vagas: `slot_capacity - ocupados`, e cancelado não ocupa (`scopeOccupying`).

## 5. Elegibilidade: junte todos os motivos
Cada regra que falha entra num array `['code' => ..., 'message' => ...]`. Nada de `return` no primeiro erro: o doador precisa ver tudo.
- Idade: `(int) $birth->diffInYears($dia)`. **Carbon 3 devolve número quebrado**: 17,9 anos sem o `(int)` não é "17".
- Intervalo: última doação + 60 (M) ou 90 (F) dias.
- Limite anual: doações com data maior que `dia - 365`.
- Próxima data: o maior entre hoje, 16º aniversário, última + intervalo e (a 4ª ou 3ª doação mais recente + 365). Se o motivo for permanente (idade máxima, peso, primeira doação depois dos 60), `null`.

## 6. Agendamento: a ordem importa
1. `validate()` do formato (422 com `errors`).
2. `Grade::erroDeHorario()` (422 em `errors.starts_at`).
3. `Elegibilidade::motivos()` (422 com `reasons`).
4. Dentro de `DB::transaction`: `lockForUpdate()` na unidade, depois as checagens de 409 (agendamento em aberto, horário lotado) e o `create`.

O `lockForUpdate` faz a segunda requisição esperar a primeira terminar. Sem ele, duas pessoas pegam a última vaga ao mesmo tempo.

Para parar no meio de um service com uma resposta pronta: `throw new HttpResponseException(response()->json($corpo, 409))`.

**Protocolo sequencial**: maior protocolo do ano (`like 'HEMO-2026-%'`) + 1, com `sprintf('HEMO-%d-%05d', ...)`.

## 7. Cancelar não é apagar
`status = cancelled`, `cancelled_at = now()` e uma linha no histórico. A ordem dos códigos: não é seu (403) → inexistente já deu 404 pelo route model binding → situação (409) → prazo de 2 h (409).

## 8. Máquina de estados da equipe
```php
public const TRANSITIONS = ['scheduled' => ['attended','no_show','cancelled'], 'attended' => ['donated','unfit'], 'donated' => [], ...];
```
`canGoTo()` resolve o 409 em uma linha e a resposta já leva `allowed` com os destinos possíveis. Depois vêm as regras de tempo (30 min) e os campos obrigatórios de cada destino.

## 9. Listas com filtro, ordem e paginação
- `when($request->x, fn ($q, $v) => ...)` monta só os filtros que vieram.
- Busca por CPF ou nome: se o texto só tem números, ponto e traço, é CPF.
- Ordenar pelo nome do doador (outra tabela): `orderBy(Donor::select('name')->whereColumn('donors.id', 'appointments.donor_id'))`.
- `paginate(10)` e um `meta` montado à mão com `currentPage()`, `lastPage()`, `perPage()` e `total()`.

## 10. Somas no banco
- Estoque: `join` com `donors`, `groupBy('donors.blood_type_id')` e `SUM(volume_ml)`.
- Relatório: um `groupBy('center_id', 'status')` só, e depois a montagem por unidade em PHP (todas as unidades, inclusive as sem agendamento).
- Taxa de falta: faltas ÷ (total − cancelados).

## 11. CSV para Excel
BOM `"\u{FEFF}"`, separador `;`, linha `\r\n`, data `d/m/Y`, `Content-Disposition: attachment`.

## 12. Upload de documento pessoal
Disco `local` (`storage/app/private`), nome gerado com `Str::uuid()`, valida `mimes:pdf,jpg,jpeg,png|max:2048`. Documento de menor de idade nunca vai para `public/`.
