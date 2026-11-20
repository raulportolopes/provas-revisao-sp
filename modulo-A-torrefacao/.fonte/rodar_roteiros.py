# Restaura os dados originais e roda os roteiros contra a solução (php -S nas portas 8101/8102).
import json, shutil, sys, urllib.request, uuid, os
sys.path.insert(0, os.path.dirname(__file__))
import roteiros as RT
R = '/home/user/rev'
RESET = {'p1': {'C2-M/tokens.json': None, 'C3-H/reservations.json': 'fonte/p1_reservations_original.json'},
         'p2': {'C2-M/orders.json': 'fonte/p2_orders_original.json', 'C3-H/transactions.json': 'fonte/p2_transactions_original.json', 'C3-H/tokens.json': None}}
ARQ = {'p1': f'{R}/out/p1/assets_planetario/C1-E'}

def reset(k):
    for dst, src in RESET[k].items():
        p = f'{R}/{k}/sol/XXX_modulo_a/{dst}'
        if src: shutil.copy(f'{R}/{src}', p)
        else: open(p, 'w').write('[]\n')

def req(base, m, rota, tok, corpo):
    h = {}; data = None
    if tok: h['Authorization'] = 'Bearer ' + tok
    if isinstance(corpo, dict): data = json.dumps(corpo).encode(); h['Content-Type'] = 'application/json'
    elif isinstance(corpo, tuple) and corpo[0] == 'raw': data = corpo[1].encode(); h['Content-Type'] = 'application/json'
    elif isinstance(corpo, tuple) and corpo[0] == 'file':
        b = uuid.uuid4().hex; fn = corpo[1]
        data = (f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{fn}"\r\nContent-Type: text/csv\r\n\r\n').encode() + open(f"{ARQ['p1']}/{fn}", 'rb').read() + f'\r\n--{b}--\r\n'.encode()
        h['Content-Type'] = f'multipart/form-data; boundary={b}'
    rq = urllib.request.Request(base + rota, data=data, method=m, headers=h)
    try:
        with urllib.request.urlopen(rq) as r: return r.status, r.read().decode()
    except urllib.error.HTTPError as e: return e.code, e.read().decode()

falhas = 0
for k, P, port in (('p1', RT.P1, 8101), ('p2', RT.P2, 8102)):
    reset(k)
    for tid, lista in P.items():
        toks = {}
        base = f'http://127.0.0.1:{port}/XXX_modulo_a/{tid}'
        for n, r in enumerate(lista, 1):
            nome, m, rota, auth, corpo, espera, confere = r[:7]
            tok = 'abc' if auth == 'abc' else toks.get(auth)
            st, body = req(base, m, rota, tok, corpo)
            if len(r) > 7 and st == 200: toks[r[7]] = json.loads(body)['token']
            ok = st == espera; falhas += not ok
            print(f"{'OK ' if ok else 'XX '} {k} {tid} #{n:02d} {st} {nome}: {body[:230]}")
    reset(k)
print('FALHAS', falhas)
