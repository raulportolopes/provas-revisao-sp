# C1-E · Conversor de registros de observação

PHP puro, sem banco. Requer Apache com `mod_rewrite` (o `.htaccess` manda tudo para o `index.php`).

## Rota
`POST http://<ip>/XXX_modulo_a/C1-E/convert` com `multipart/form-data`, campo `file` (arquivo `.csv`, separador `;`).

## Respostas
| Situação | Status | Corpo |
|---|---|---|
| CSV convertido | 200 | `{"total": n, "data": [...], "errors": [{"line": 6, "error": "Invalid date"}]}` |
| Sem arquivo | 400 | `{"error": "No file uploaded"}` |
| Não é .csv | 415 | `{"error": "Invalid file type"}` |
| Só cabeçalho ou vazio | 422 | `{"error": "Empty file"}` |

## Testar
```
curl -F "file=@observacoes.csv" http://<ip>/XXX_modulo_a/C1-E/convert
```
