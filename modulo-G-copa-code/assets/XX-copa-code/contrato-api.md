# Contrato da API – Copa Code

Base: `http://IP/TEAM_X_modulo_g/api/`. Tudo em JSON (`Content-Type: application/json; charset=utf-8`), com nomes em inglês.
O banco já vem pronto em `banco/copacode.sql` (MySQL): não mude nomes de tabela nem de coluna.

## Regras gerais

- Rota que não existe: **404** `{"message": "Rota não encontrada."}`.
- Rota que existe com método errado: **405** `{"message": "Método não permitido."}`.
- Erro de validação: **422** com **todos** os erros de uma vez, no formato `campo => mensagem`:
  `{"message": "Dados inválidos.", "errors": {"name": "...", "players.2.nickname": "..."}}`
  Erro de um jogador usa a chave `players.<posição na lista, começando em 0>.<campo>`.
- Regra de negócio quebrada: **409** `{"message": "..."}`.
- Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`; sem token ou com token inválido: **401** `{"message": "Faça login como organizador."}`.
- Ordem das verificações: **401 → 404 → 422 → 409**.
- Erro de banco: **500** `{"message": "Erro no banco de dados."}` (o detalhe vai só para o log do servidor).
- Datas e horas no formato `AAAA-MM-DD HH:MM:SS`, horário de Brasília. Na tela, sempre `DD/MM/AAAA HH:MM`.

## Banco (resumo)

| Tabela | Colunas principais |
|---|---|
| `schools` | id, name, acronym, city, color |
| `teams` | id, school_id (FK), name (único), tag (única), status (`registered` \| `confirmed`), seed, checked_in_at |
| `players` | id, team_id (FK, ON DELETE CASCADE), nickname (único), full_name, birth_date, role (`captain` \| `player` \| `substitute`) |
| `matches` | id, stage (`quarterfinal` \| `semifinal` \| `final`), position, team_a_id, team_b_id, score_a, score_b, winner_id, starts_at, next_match_id (FK), next_slot (`a` \| `b`) |
| `organizers` | id, username, name, password (hash) |
| `api_tokens` | id, organizer_id (FK), token |

## Rotas

### GET schools
200 – lista ordenada por nome: `[{"id":4,"name":"Colégio Técnico Itu","acronym":"CTI","city":"Itu","color":"#F59E0B"}, ...]`

### GET teams
200 – lista de equipes, primeiro as confirmadas (por ordem de check-in), depois as outras (por id). Cada equipe:

```json
{
  "id": 1, "name": "Fênix Rubra", "tag": "FNX", "status": "confirmed", "seed": null,
  "checked_in_at": "2026-11-18 18:02:00",
  "school": {"id": 1, "name": "ETEC Fernando Prestes", "acronym": "FPR", "city": "Sorocaba", "color": "#E11D48"},
  "players": [
    {"id": 1, "team_id": 1, "nickname": "Mako54", "full_name": "Fernanda Junqueira", "birth_date": "2010-05-06", "role": "captain", "age": 16}
  ]
}
```

- `players` vem com o capitão primeiro, depois os titulares, depois o reserva.
- `age` = idade completa **no dia do torneio (28/11/2026)**, calculada pela API.
- `seed` só é preenchido quando o chaveamento é gerado.

### GET teams/{id}
200 – uma equipe no mesmo formato. 404 se não existir.

### POST teams
Corpo:

```json
{ "name": "Cometa Azul", "tag": "CMT", "school_id": 6,
  "players": [ {"nickname": "...", "full_name": "...", "birth_date": "2010-05-01", "role": "captain"}, ... ] }
```

Validação (422):

| Campo | Regra | Mensagem |
|---|---|---|
| name | 3 a 40 caracteres | O nome da equipe deve ter entre 3 e 40 caracteres. |
| tag | 2 a 4 letras maiúsculas ou números (a API converte para maiúsculas) | A tag deve ter de 2 a 4 letras ou números. |
| school_id | escola existente | Escolha uma escola válida. |
| players | 5 ou 6 jogadores | A equipe precisa de 5 titulares e pode ter 1 reserva. |
| players | exatamente 1 `captain` | Escolha exatamente um capitão. |
| players | no máximo 1 `substitute`; com 6 jogadores o 6.º é o reserva; com 5, nenhum reserva | Só pode haver um reserva. / O sexto jogador deve ser o reserva. / Com 5 jogadores, todos são titulares. |
| players.N.nickname | 3 a 20 letras, números ou _ ; sem repetir na equipe | Nick com 3 a 20 letras, números ou _. / Nick repetido na equipe. |
| players.N.full_name | 5+ caracteres e ao menos um espaço | Informe nome e sobrenome. |
| players.N.birth_date | data real AAAA-MM-DD | Data de nascimento inválida. |
| players.N.birth_date | 14 a 19 anos completos em 28/11/2026 | A idade no dia do torneio deve ser de 14 a 19 anos. |
| players.N.role | `captain`, `player` ou `substitute` | Função inválida. |

Regras de negócio (409), conferidas nesta ordem depois da validação:

1. Chaveamento já gerado → `Inscrições encerradas: o chaveamento já foi gerado.`
2. Nome repetido → `Já existe uma equipe com esse nome.`
3. Tag repetida → `Já existe uma equipe com essa tag.`
4. Escola com 2 equipes → `Esta escola já tem 2 equipes inscritas.`
5. Nick já usado em outra equipe → `Nick já inscrito em outra equipe: nick1, nick2.`

Sucesso: **201** com a equipe criada (formato do GET), `status` = `registered`. Equipe e jogadores são gravados juntos: se um falhar, nada fica gravado.

### POST teams/{id}/check-in 🔒
200 – equipe com `status` = `confirmed` e `checked_in_at` = agora.
404 se não existir. 409: chaveamento já gerado; `Esta equipe já fez check-in.`; `Já há 8 equipes confirmadas. Esta fica na lista de espera.`

### DELETE teams/{id} 🔒
204 sem corpo; os jogadores somem junto. 404 se não existir. 409 depois do chaveamento: `Não é possível excluir depois do chaveamento.`

### GET matches
200 – partidas em ordem de fase (quartas, semis, final) e `position`. Lista vazia antes do chaveamento.

```json
{
  "id": 4, "stage": "quarterfinal", "position": 1,
  "team_a": {"id": 1, "name": "Fênix Rubra", "tag": "FNX", "color": "#E11D48"},
  "team_b": {"id": 8, "name": "Sorocrew", "tag": "SRC", "color": "#E11D48"},
  "score_a": null, "score_b": null, "winner_id": null,
  "starts_at": "2026-11-28 09:00:00", "next_match_id": 2, "next_slot": "a",
  "status": "scheduled"
}
```

- `team_a` / `team_b` = `null` enquanto a equipe não está definida.
- `status` calculado: `waiting` (falta equipe), `scheduled` (as duas definidas, sem resultado), `finished` (tem vencedor).

### POST bracket 🔒
Gera o chaveamento. Exige **exatamente 8** equipes confirmadas (409: `São necessárias 8 equipes confirmadas. Há N.`); se já existe: 409 `O chaveamento já foi gerado.`

- `seed` = ordem de check-in (1 = primeiro a fazer check-in).
- Quartas (28/11/2026): Q1 seed 1 × seed 8 às 09:00; Q2 4 × 5 às 10:00; Q3 2 × 7 às 11:00; Q4 3 × 6 às 12:00.
- Semis: S1 = vencedor Q1 (lado a) × vencedor Q2 (lado b) às 14:00; S2 = Q3 × Q4 às 15:00.
- Final: S1 (a) × S2 (b) às 17:00.

201 com a lista de partidas (formato do GET matches).

### DELETE bracket 🔒
204 – desfaz o chaveamento (apaga partidas e seeds). 409 se algum placar já foi lançado.

### PATCH matches/{id}/score 🔒
Corpo: `{"score_a": 2, "score_b": 1}`. Melhor de 3: só valem **2×0, 2×1, 1×2 e 0×2** (números inteiros).

- 404 partida inexistente.
- 422 `{"errors": {"score": "Melhor de 3: o placar deve ser 2×0, 2×1, 1×2 ou 0×2."}}`
- 409 partida sem as duas equipes: `A partida ainda não tem as duas equipes definidas.`
- 409 a próxima partida já tem resultado: `A próxima partida já tem resultado: este placar não pode mais mudar.`
- 200 com **a lista inteira de partidas** atualizada: o vencedor já aparece no lado `next_slot` da partida `next_match_id`. Corrigir um placar (antes da próxima ser jogada) troca o vencedor lá também.

### POST login
Corpo `{"username": "org", "password": "Copa@2026"}` → 200 `{"token": "...", "name": "Coordenação da Copa"}`. Errado: 401 `Usuário ou senha incorretos.`
