# Contrato da API – Zela Bairro

Este é o combinado entre o pacote P1 (API) e os pacotes de front-end. Os pacotes P2 a P5 podem começar **antes** de a API existir, usando os arquivos de `dados/seed/` como resposta de exemplo.

- Base: `api/` (ex.: `http://IP/TEAM_X_modulo_g/api/chamados`)
- Toda resposta é JSON (`Content-Type: application/json; charset=utf-8`), inclusive os erros.
- Erro: `{ "mensagem": "texto" }`. O 422 traz também `"erros": { "campo": "mensagem", ... }` com **todos** os campos inválidos.
- Datas: texto `"AAAA-MM-DD HH:MM:SS"` no horário de Brasília.
- Rota que não existe: 404. Rota que existe com método errado: 405.

## Recursos

| Método | Caminho | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| GET | `api/categorias` | – | 200, lista de categorias | – |
| GET | `api/chamados` | – (filtros opcionais `?status=&categoria=&busca=`) | 200, lista do mais novo para o mais antigo | – |
| GET | `api/chamados/{id}` | – | 200, um chamado com `historico` | 404 |
| POST | `api/chamados` | multipart: `titulo`, `descricao`, `categoria_id`, `rua`, `x`, `y`, `foto` (opcional) | 201, o chamado criado | 422 |
| PATCH | `api/chamados/{id}/status` | JSON `{ "status": "...", "nota": "..." }` + cabeçalho `Authorization: Bearer <token>` | 200, o chamado atualizado | 401, 404, 409, 422 |
| POST | `api/chamados/{id}/apoios` | JSON `{ "dispositivo": "<id do aparelho>" }` | 201, o chamado atualizado | 404, 409, 422 |
| GET | `api/indicadores` | – | 200, números do painel | – |
| POST | `api/login` | JSON `{ "usuario": "...", "senha": "..." }` | 200, `{ "token": "...", "nome": "..." }` | 401 |

## Chamado (como a API devolve)

```json
{
  "id": 1,
  "protocolo": "ZB-2026-0001",
  "titulo": "Cratera em frente à padaria",
  "descricao": "Buraco grande perto da faixa...",
  "categoria_id": 1,
  "categoria": "Buraco na via",
  "rua": "Av. das Palmeiras, 410",
  "x": 30.0,
  "y": 46.9,
  "foto": null,
  "status": "execucao",
  "aberto_em": "2026-11-09 08:12:00",
  "concluido_em": null,
  "prazo_em": "2026-11-14 08:12:00",
  "atrasado": true,
  "concluido_no_prazo": null,
  "apoios": 14,
  "historico": [
    { "de": null, "para": "aberto", "em": "2026-11-09 08:12:00", "por": "Morador", "nota": "Chamado aberto pelo site." }
  ]
}
```

- `x` e `y`: posição no mapa em **porcentagem** (0 a 100) da largura e da altura de `img/mapa-bairro.svg`.
- `prazo_em` = `aberto_em` + `prazo_dias` da categoria.
- `atrasado` = situação ainda em andamento (aberto, triagem ou execução) **e** prazo vencido.
- `concluido_no_prazo` = só para concluídos: `concluido_em` ≤ `prazo_em`; nos outros, `null`.
- `apoios` = quantidade. A lista de quem apoiou **não** sai na resposta.

## Situações (status) e transições permitidas

| De | Pode ir para |
|---|---|
| `aberto` | `triagem`, `cancelado` |
| `triagem` | `execucao`, `cancelado`, `aberto` (devolver) |
| `execucao` | `concluido`, `triagem` (devolver) |
| `concluido` | nenhuma (final) |
| `cancelado` | nenhuma (final) |

- Transição fora da tabela: **409**.
- Status que não existe: **422** (`erros.status`).
- Cancelar ou devolver exige `nota` com 10 caracteres ou mais: **422** (`erros.nota`).
- Ordem das verificações: 401 → 404 → 422 → 409.
- Cada mudança acrescenta `{ de, para, em, por, nota }` ao `historico`; ao concluir, grava `concluido_em`.

## Regras de criação (422)

| Campo | Regra | Mensagem |
|---|---|---|
| `titulo` | 5 a 80 caracteres | O título deve ter entre 5 e 80 caracteres. |
| `descricao` | 15 caracteres ou mais | Descreva o problema com pelo menos 15 caracteres. |
| `categoria_id` | id existente | Escolha uma categoria válida. |
| `rua` | obrigatório | Informe a rua ou o ponto de referência. |
| `local` (x e y) | números de 0 a 100 | Marque o local no mapa. |
| `foto` | opcional; JPG, PNG ou WEBP verdadeiro; até 2 MB | A foto deve ser JPG, PNG ou WEBP. / A foto deve ter no máximo 2 MB. |

Protocolo: `ZB-` + ano + `-` + id com 4 dígitos (`ZB-2026-0017`). Novo chamado nasce `aberto`, com `historico` de uma linha.

## Apoios

- `dispositivo`: texto de 8 a 40 caracteres, só `a-f`, `0-9` e `-`. Senão, 422.
- O mesmo dispositivo apoiando de novo: 409 "Você já apoiou este chamado."
- Chamado concluído ou cancelado: 409 "Este chamado já foi encerrado."

## Indicadores

```json
{
  "total": 16,
  "por_status": { "aberto": 5, "triagem": 3, "execucao": 3, "concluido": 4, "cancelado": 1 },
  "por_categoria": [ { "id": 1, "nome": "Buraco na via", "total": 3 } ],
  "atrasados": 4,
  "percentual_no_prazo": 50,
  "tempo_medio_dias": 3.3
}
```

`por_categoria` vem da maior para a menor. `percentual_no_prazo` é inteiro (0 a 100). `tempo_medio_dias` tem uma casa decimal (média de `concluido_em − aberto_em` dos concluídos).

## Usuários da equipe de zeladoria (carga inicial)

| usuario | senha | nome |
|---|---|---|
| marta | Zela@2026 | Marta Lins |
| paulo | Zela@2026 | Paulo Reis |

A senha está guardada com `password_hash` em `dados/seed/usuarios.json`.
