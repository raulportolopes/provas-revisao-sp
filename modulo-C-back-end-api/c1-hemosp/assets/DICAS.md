# Dicas – HemoSP (Módulo C, prova de revisão)

## Começo (15 min)
- `composer create-project laravel/laravel XX_modulo_c`, importe o `hemosp_db.sql`, ajuste o `.env` e rode `php artisan install:api`.
- Nunca rode `migrate:fresh`: ele apaga as tabelas que vieram prontas.
- Fuso: `'timezone' => 'America/Sao_Paulo'` no `config/app.php`.
- Erros em JSON: em `bootstrap/app.php`, use `withExceptions` com `shouldRenderJsonWhen` e `render` para `AuthenticationException` (401), `NotFoundHttpException` (404) e `ValidationException` (422).

## Dois tipos de usuário
- Doador e equipe estão em tabelas diferentes. Um model pode receber token se estender `Illuminate\Foundation\Auth\User` e usar `HasApiTokens`.
- `createToken('nome', ['donor'])` grava uma habilidade no token. O middleware `abilities:donor` (alias de `CheckAbilities` do Sanctum) barra os outros tokens. A exceção que ele lança é a `MissingAbilityException`: transforme em 403.

## Datas
- Carbon 3: `diffInYears`, `diffInDays` devolvem número quebrado. Use `(int)`.
- `Carbon::createFromFormat('Y-m-d H:i', ...)` para o horário do agendamento; a validação `date_format:Y-m-d H:i` já rejeita o formato errado.
- `toIso8601String()` devolve `2026-12-01T08:20:00-03:00`.
- Teste de dia: `isSunday()`, `isSaturday()`. Data inválida como 2026-02-30: `date_format:Y-m-d` rejeita.

## Grade de 20 minutos
- Monte a lista de inícios com um laço: começa na abertura e soma 20 minutos enquanto `início + 20 <= fechamento`.
- Vagas ocupadas: conte por horário os agendamentos que não estão cancelados (`countBy` na coleção ajuda).

## Elegibilidade
- Escreva as regras numa classe só (um service) e use nas duas rotas que precisam dela (`/me` e o agendamento).
- Junte TODOS os motivos num array antes de responder.
- Janela de 12 meses: doações com data maior que `dia - 365 dias`.

## Concorrência e protocolo
- `DB::transaction` + `lockForUpdate()` em uma linha (por exemplo a da unidade) faz duas requisições ao mesmo tempo esperarem uma pela outra.
- Protocolo sequencial: procure o maior protocolo do ano (`like 'HEMO-2026-%'`) e some 1.

## Máquina de estados
- Uma constante com "de onde pode ir para onde" resolve a validação de transição em uma linha.
- Toda mudança grava uma linha em `appointment_events`.

## CSV
- BOM: `"\u{FEFF}"` no começo. Separador `;`, linha `\r\n`.
- Cabeçalhos: `Content-Type: text/csv; charset=UTF-8` e `Content-Disposition: attachment; filename="..."`.

## Upload de documento pessoal
- `storeAs('pasta', $nome, 'local')` grava em `storage/app/private` (sem URL pública). Gere o nome (`Str::uuid()`), não use o nome original.
