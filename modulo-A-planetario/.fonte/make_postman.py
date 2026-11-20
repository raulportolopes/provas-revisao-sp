# Gera as coleções do Postman (v2.1) a partir de roteiros.py.
import json, os, sys, uuid
sys.path.insert(0, os.path.dirname(__file__))
import roteiros as RT, conteudo as C

def colecao(P, tid, lista):
    itens = []
    for n, r in enumerate(lista, 1):
        nome, m, rota, auth, corpo, espera, confere = r[:7]
        cab = []
        if auth: cab.append({"key": "Authorization", "value": "Bearer " + ("abc" if auth == 'abc' else "{{token_%s}}" % auth)})
        rq = {"method": m, "header": cab, "url": {"raw": "{{baseUrl}}" + rota, "host": ["{{baseUrl}}"],
              "path": [p for p in rota.split('?')[0].split('/') if p]}}
        if '?' in rota:
            rq["url"]["query"] = [dict(zip(("key", "value"), q.split('=', 1))) for q in rota.split('?')[1].split('&')]
        if isinstance(corpo, dict):
            rq["body"] = {"mode": "raw", "raw": json.dumps(corpo, ensure_ascii=False, indent=2), "options": {"raw": {"language": "json"}}}
            cab.append({"key": "Content-Type", "value": "application/json"})
        elif isinstance(corpo, tuple) and corpo[0] == 'raw':
            rq["body"] = {"mode": "raw", "raw": corpo[1]}; cab.append({"key": "Content-Type", "value": "application/json"})
        elif isinstance(corpo, tuple) and corpo[0] == 'file':
            rq["body"] = {"mode": "formdata", "formdata": [{"key": "file", "type": "file", "src": corpo[1]}]}
        testes = [f"pm.test('Status {espera}', () => pm.response.to.have.status({espera}));"]
        if len(r) > 7:
            testes.append(f"if (pm.response.code === 200) pm.collectionVariables.set('token_{r[7]}', pm.response.json().token);")
        itens.append({"name": f"{n:02d} · {nome} (espera {espera})", "request": rq,
                      "event": [{"listen": "test", "script": {"type": "text/javascript", "exec": testes}}],
                      "description": "Conferir: " + confere})
    t = next(x for x in P['tarefas'] if x['id'] == tid)
    vars_ = [{"key": "baseUrl", "value": f"http://000.000.00.00/XXX_modulo_a/{tid}"}]
    for r in lista:
        if len(r) > 7: vars_.append({"key": f"token_{r[7]}", "value": ""})
    return {"info": {"_postman_id": str(uuid.uuid5(uuid.NAMESPACE_URL, P['slug'] + tid)),
                     "name": f"{tid} · {t['titulo']} ({P['nome']})",
                     "description": "Rode na ordem (Runner ou uma a uma). Antes de começar, restaure os arquivos JSON originais da pasta assets. Ajuste baseUrl na aba Variables e salve.",
                     "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
            "item": itens, "variable": vars_}

def gerar(P, roteiro, dst):
    os.makedirs(dst, exist_ok=True)
    for tid, lista in roteiro.items():
        json.dump(colecao(P, tid, lista), open(f"{dst}/collection_{tid.replace('-', '').lower()}.json", 'w'), ensure_ascii=False, indent=2)

if __name__ == '__main__':
    gerar(C.P1, RT.P1, sys.argv[1]); gerar(C.P2, RT.P2, sys.argv[2]); print('ok')
