#!/bin/bash
# Testes de API do Zela Bairro (G2). Uso: bash testes-api.sh http://IP/TEAM_X_modulo_g/api [foto.jpg]
# Rode com a carga inicial. Cada linha mostra: esperado | obtido | caso.
B=${1:-http://localhost/TEAM_X_modulo_g/api}; FOTO=$2
t() { local esp=$1; shift; local nome=$1; shift; local cod=$(curl -s -o /tmp/zela-resp.json -w "%{http_code}" "$@"); printf "%s | %s | %s %s\n" "$esp" "$cod" "$nome" "$([ "$esp" = "$cod" ] && echo OK || echo '<<< DIFERENTE')"; }
t 200 "GET chamados" "$B/chamados"
grep -q apoiadores /tmp/zela-resp.json && echo "    !!! a resposta expõe 'apoiadores'"
t 422 "POST vazio" -X POST "$B/chamados" -H "Content-Type: application/json" -d '{}'
cat /tmp/zela-resp.json; echo
printf 'isto nao e imagem' > /tmp/falso.jpg
t 422 "POST foto falsa" -X POST "$B/chamados" --form-string titulo="Teste de foto" --form-string descricao="Descrição com mais de quinze letras" --form-string categoria_id=1 --form-string rua="Rua X" --form-string x=10 --form-string y=10 -F foto=@/tmp/falso.jpg
ARGS=(--form-string titulo="Placa de rua caída" --form-string descricao="A placa caiu e está no chão da calçada." --form-string categoria_id=5 --form-string rua="Rua Paineira, 200" --form-string x=40 --form-string y=20)
[ -n "$FOTO" ] && ARGS+=(-F foto=@$FOTO)
t 201 "POST completo" -X POST "$B/chamados" "${ARGS[@]}"; grep -o '"protocolo":"[^"]*"' /tmp/zela-resp.json
t 401 "PATCH sem token" -X PATCH "$B/chamados/2/status" -d '{"status":"triagem"}'
t 401 "login senha errada" -X POST "$B/login" -d '{"usuario":"marta","senha":"x"}'
t 200 "login certo" -X POST "$B/login" -d '{"usuario":"marta","senha":"Zela@2026"}'
TK=$(grep -o '"token":"[^"]*"' /tmp/zela-resp.json | cut -d'"' -f4); H="Authorization: Bearer $TK"
t 409 "aberto -> concluido" -X PATCH "$B/chamados/2/status" -H "$H" -d '{"status":"concluido"}'
t 422 "status inexistente" -X PATCH "$B/chamados/2/status" -H "$H" -d '{"status":"voando"}'
t 422 "devolver sem nota" -X PATCH "$B/chamados/3/status" -H "$H" -d '{"status":"aberto"}'
t 200 "execucao -> concluido" -X PATCH "$B/chamados/1/status" -H "$H" -d '{"status":"concluido"}'
grep -o '"concluido_em":"[^"]*"' /tmp/zela-resp.json
t 409 "concluido e final" -X PATCH "$B/chamados/1/status" -H "$H" -d '{"status":"triagem","nota":"reabrir o chamado"}'
t 404 "chamado inexistente" -X PATCH "$B/chamados/999/status" -H "$H" -d '{"status":"triagem"}'
t 201 "apoio 1" -X POST "$B/chamados/4/apoios" -d '{"dispositivo":"abc12345"}'
t 409 "apoio repetido" -X POST "$B/chamados/4/apoios" -d '{"dispositivo":"abc12345"}'
t 409 "apoio em encerrado" -X POST "$B/chamados/7/apoios" -d '{"dispositivo":"abc99999"}'
t 405 "DELETE chamados" -X DELETE "$B/chamados"
t 404 "rota inexistente" "$B/xyz"
t 200 "indicadores" "$B/indicadores"; cat /tmp/zela-resp.json; echo
