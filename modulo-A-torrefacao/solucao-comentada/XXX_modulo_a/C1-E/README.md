# C1-E · Relatório de vendas por dia

PHP puro, lê `vendas.csv`. Apache com `mod_rewrite` (o `.htaccess` manda tudo para o `index.php`).

## Rota
`GET http://<ip>/XXX_modulo_a/C1-E/report?from=dd/mm/aaaa&to=dd/mm/aaaa` (os dois parâmetros são opcionais)

| Situação | Status | Corpo |
|---|---|---|
| Relatório | 200 | `{"from","to","days":[...],"summary":{...}}` |
| Data fora do formato ou inexistente | 422 | `{"error": "Invalid date"}` |
| from depois de to | 422 | `{"error": "Invalid range"}` |
| Mais de 31 dias | 422 | `{"error": "Range too long"}` |

Exemplo: `curl "http://<ip>/XXX_modulo_a/C1-E/report?from=04/11/2026&to=06/11/2026"`
