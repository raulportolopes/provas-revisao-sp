#!/bin/bash
# Testes de API do Copa Code. Uso: bash testes-api.sh http://IP/TEAM_X_modulo_g/api
# Rode com o banco recém-importado (banco/copacode.sql). Cada linha: esperado | obtido | caso.
B=${1:-http://localhost/TEAM_X_modulo_g/api}
t() { local esp=$1; shift; local nome=$1; shift; local cod=$(curl -s -o /tmp/copa-resp.json -w "%{http_code}" "$@"); printf "%s | %s | %s %s\n" "$esp" "$cod" "$nome" "$([ "$esp" = "$cod" ] && echo OK || echo '<<< DIFERENTE')"; }
J=(-H "Content-Type: application/json")
eq() { # nome tag escola nick1 nascimento1
cat <<JSON
{"name":"$1","tag":"$2","school_id":$3,"players":[
 {"nickname":"$4","full_name":"Ana Souza","birth_date":"$5","role":"captain"},
 {"nickname":"${4}b","full_name":"Bia Lima","birth_date":"2010-01-10","role":"player"},
 {"nickname":"${4}c","full_name":"Caio Reis","birth_date":"2010-02-10","role":"player"},
 {"nickname":"${4}d","full_name":"Davi Melo","birth_date":"2010-03-10","role":"player"},
 {"nickname":"${4}e","full_name":"Eva Dias","birth_date":"2010-04-10","role":"player"}]}
JSON
}
t 200 "GET teams" "$B/teams"
t 422 "POST vazio" -X POST "$B/teams" "${J[@]}" -d '{}'; cat /tmp/copa-resp.json; echo
t 422 "idade 13 e tag ruim" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Nova Era' 'n-e' 4 Nov1 2014-01-01)"; cat /tmp/copa-resp.json; echo
t 409 "nome repetido" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Kernel Panic' 'NEW' 4 Nov1 2010-01-01)"
t 409 "escola com 2 equipes" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Nova Era' 'NEW' 1 Nov1 2010-01-01)"
t 201 "POST valida" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Nova Era' 'NEW' 4 Nov1 2010-01-01)"
t 409 "nick ja inscrito" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Outra Era' 'OUT' 5 Nov1 2010-01-01)"
t 401 "check-in sem token" -X POST "$B/teams/8/check-in"
t 200 "login" -X POST "$B/login" "${J[@]}" -d '{"username":"org","password":"Copa@2026"}'
TK=$(grep -o '"token":"[^"]*"' /tmp/copa-resp.json | cut -d'"' -f4); H="Authorization: Bearer $TK"
t 409 "chaveamento com 7" -X POST "$B/bracket" -H "$H"; cat /tmp/copa-resp.json; echo
t 409 "check-in repetido" -X POST "$B/teams/1/check-in" -H "$H"
t 200 "check-in da 8a" -X POST "$B/teams/8/check-in" -H "$H"
t 409 "check-in da 9a" -X POST "$B/teams/9/check-in" -H "$H"
t 201 "gera chaveamento" -X POST "$B/bracket" -H "$H"
t 409 "chaveamento repetido" -X POST "$B/bracket" -H "$H"
t 409 "inscricao fechada" -X POST "$B/teams" "${J[@]}" -d "$(eq 'Tarde Demais' 'TD' 6 Late1 2010-01-01)"
t 409 "excluir apos chaveamento" -X DELETE "$B/teams/9" -H "$H"
t 200 "GET matches" "$B/matches"
python3 -c "import json;[print('   ',m['id'],m['stage'],m['position'],m['team_a'] and m['team_a']['tag'],'x',m['team_b'] and m['team_b']['tag'],m['starts_at'],m['status']) for m in json.load(open('/tmp/copa-resp.json'))]"
QF=$(python3 -c "import json;print([m['id'] for m in json.load(open('/tmp/copa-resp.json')) if m['stage']=='quarterfinal'][0])")
SF=$(python3 -c "import json;print([m['id'] for m in json.load(open('/tmp/copa-resp.json')) if m['stage']=='semifinal'][0])")
t 422 "placar 3x0" -X PATCH "$B/matches/$QF/score" -H "$H" "${J[@]}" -d '{"score_a":3,"score_b":0}'
t 409 "semi sem equipes" -X PATCH "$B/matches/$SF/score" -H "$H" "${J[@]}" -d '{"score_a":2,"score_b":0}'
t 200 "placar QF1 2x1" -X PATCH "$B/matches/$QF/score" -H "$H" "${J[@]}" -d '{"score_a":2,"score_b":1}'
t 200 "corrige QF1 0x2" -X PATCH "$B/matches/$QF/score" -H "$H" "${J[@]}" -d '{"score_a":0,"score_b":2}'
t 200 "placar QF2 2x0" -X PATCH "$B/matches/$((QF+1))/score" -H "$H" "${J[@]}" -d '{"score_a":2,"score_b":0}'
t 200 "placar SF1 2x0" -X PATCH "$B/matches/$SF/score" -H "$H" "${J[@]}" -d '{"score_a":2,"score_b":0}'
t 409 "QF1 nao muda mais" -X PATCH "$B/matches/$QF/score" -H "$H" "${J[@]}" -d '{"score_a":2,"score_b":0}'
t 409 "desfazer chaveamento com placar" -X DELETE "$B/bracket" -H "$H"
t 405 "PUT teams" -X PUT "$B/teams"
t 404 "rota inexistente" "$B/xyz"
