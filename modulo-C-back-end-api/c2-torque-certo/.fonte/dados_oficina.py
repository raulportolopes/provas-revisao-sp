# Dados da prova de revisão Torque Certo (oficina mecânica, Módulo C – API Laravel).
# Gera: torque_db.sql (MySQL), base.json (BaseSeeder da solução) e esperado.json (script de conferência).
import json, os, sys, random, subprocess, datetime as dt
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
rnd = random.Random(1707)

def dv_cpf(base9):
    d = [int(c) for c in base9]
    s = sum(v * w for v, w in zip(d, range(10, 1, -1))); d1 = (s * 10 % 11) % 10
    d.append(d1); s = sum(v * w for v, w in zip(d, range(11, 1, -1))); d2 = (s * 10 % 11) % 10
    return base9 + str(d1) + str(d2)
def cpf(i): return dv_cpf(f"{318000000 + i * 7727:09d}"[:9])

SENHA = 'Torque@2026'
users = [(1, 'Raul Avaliador', 'admin@torque.test', 'admin'), (2, 'Bianca Atendente', 'atendente@torque.test', 'atendente'),
         (3, 'João Mecânico', 'joao@torque.test', 'mecanico'), (4, 'Pedro Mecânico', 'pedro@torque.test', 'mecanico')]
customers = [  # id, nome, telefone, email
 (1, 'Adriana Soares', '11987654321', 'adriana@cliente.test'), (2, 'Bruno Esteves', '11976543210', None),
 (3, 'Célia Moraes', '1133224455', 'celia@cliente.test'), (4, 'Danilo Prates', '11965432109', 'danilo@cliente.test'),
 (5, 'Érica Fonseca', '11954321098', None), (6, 'Flávio Guedes', '11943210987', 'flavio@cliente.test'),
 (7, 'Gisele Andrade', '11932109876', None), (8, 'Henrique Bastos', '11921098765', 'henrique@cliente.test'),
 (9, 'Íris Carvalho', '11910987654', None), (10, 'Júlio Batista', '11909876543', 'julio@cliente.test')]
vehicles = [  # id, cliente, placa, marca, modelo, ano
 (1, 1, 'FTC3B21', 'Fiat', 'Argo', 2021), (2, 1, 'ABC1234', 'Volkswagen', 'Gol', 2014), (3, 2, 'GKP7E45', 'Chevrolet', 'Onix', 2022),
 (4, 3, 'DEF5678', 'Ford', 'Ka', 2017), (5, 4, 'HJK2C89', 'Hyundai', 'HB20', 2023), (6, 5, 'LMN4D12', 'Toyota', 'Corolla', 2020),
 (7, 6, 'QRS9F34', 'Honda', 'Civic', 2019), (8, 7, 'TUV1G56', 'Renault', 'Kwid', 2022), (9, 8, 'XYZ8H78', 'Jeep', 'Renegade', 2021),
 (10, 9, 'BRA2E19', 'Fiat', 'Mobi', 2023), (11, 10, 'GHI3456', 'Volkswagen', 'Fox', 2012), (12, 10, 'MER4C21', 'Nissan', 'Kicks', 2024)]
parts = [  # id, sku, nome, preço em centavos, estoque, mínimo
 (1, 'OLE-5W30', 'Óleo 5W30 sintético (litro)', 4890, 40, 20), (2, 'FIL-OLE01', 'Filtro de óleo', 3250, 12, 10),
 (3, 'FIL-AR01', 'Filtro de ar', 4590, 3, 8), (4, 'FIL-CAB01', 'Filtro de cabine', 3990, 9, 6),
 (5, 'PAS-DIA01', 'Pastilha de freio dianteira (jogo)', 18900, 2, 5), (6, 'DIS-FRE01', 'Disco de freio (unidade)', 21500, 6, 4),
 (7, 'VEL-IGN01', 'Vela de ignição', 2790, 30, 16), (8, 'COR-DEN01', 'Correia dentada', 15990, 1, 3),
 (9, 'BAT-60AH', 'Bateria 60 Ah', 54900, 4, 2), (10, 'LAM-H4', 'Lâmpada H4', 3490, 0, 6),
 (11, 'AMO-DIA01', 'Amortecedor dianteiro', 32990, 4, 4), (12, 'FLU-FRE01', 'Fluido de freio DOT4', 3790, 15, 6),
 (13, 'PAL-LIM01', 'Palheta do limpador (par)', 6990, 8, 5), (14, 'ADI-RAD01', 'Aditivo de radiador', 2990, 5, 6),
 (15, 'ROL-TEN01', 'Rolamento tensor', 8990, 7, 3)]
services = [  # id, nome, preço, minutos
 (1, 'Troca de óleo e filtro', 8000, 40), (2, 'Revisão de freios', 15000, 90), (3, 'Alinhamento e balanceamento', 12000, 60),
 (4, 'Troca de correia dentada', 28000, 180), (5, 'Diagnóstico eletrônico', 9500, 45), (6, 'Troca de amortecedores', 22000, 150),
 (7, 'Higienização do ar-condicionado', 11000, 50), (8, 'Troca de bateria', 4000, 20)]
PP = {p[0]: p[3] for p in parts}; SP = {s[0]: s[2] for s in services}

orders = []
def os_(num, veh, status, opened, items, disc=0.0, mech=None, delivered=None, deleted=None, complaint='Revisão geral'):
    orders.append(dict(number=num, vehicle=veh, status=status, opened=opened, items=items, disc=disc, mech=mech, delivered=delivered, deleted=deleted, complaint=complaint))
# 2025: histórico entregue (relatório de faturamento de 2025) + algumas canceladas
meses = [1, 1, 2, 3, 3, 3, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12]   # abril sem entregas (mês zerado no relatório)
for k, m in enumerate(meses, start=1):
    d = 3 + (k * 5) % 22
    its = [('s', 1 + (k % 8), 1)] + [('p', 1 + (k * 3 + j) % 15, 1 + (k + j) % 3) for j in range(k % 3 + 1)]
    os_(f'OS-2025-{k:04d}', 1 + k % 12, 'entregue', f'2025-{m:02d}-{d:02d} 08:30', its, disc=[0, 5, 0, 10, 0, 7.5][k % 6], mech=3 + k % 2,
        delivered=f'2025-{m:02d}-{min(d + 2, 28):02d} 17:00', complaint=['Barulho na suspensão', 'Revisão dos 30 mil km', 'Freio rangendo', 'Luz da injeção acesa'][k % 4])
os_('OS-2025-0019', 4, 'cancelada', '2025-04-10 09:00', [('s', 5, 1)], complaint='Cliente desistiu do orçamento')
os_('OS-2025-0020', 7, 'cancelada', '2025-11-05 10:00', [], complaint='Orçamento recusado')
# 2026: casos do roteiro (todas abertas em 2026)
os_('OS-2026-0001', 1, 'entregue', '2026-02-02 08:00', [('s', 1, 1), ('p', 1, 4), ('p', 2, 1)], mech=3, delivered='2026-02-02 16:00', complaint='Troca de óleo')
os_('OS-2026-0002', 3, 'aberta', '2026-11-10 08:15', [('s', 2, 1), ('p', 12, 1)], complaint='Pedal de freio baixo')          # edição de itens e desconto
os_('OS-2026-0003', 5, 'orcada', '2026-11-11 09:00', [('s', 2, 1), ('p', 5, 3), ('p', 10, 2)], complaint='Freio fazendo barulho')  # estoque insuficiente
os_('OS-2026-0004', 6, 'orcada', '2026-11-11 10:30', [('s', 1, 1), ('p', 1, 5), ('p', 2, 1)], disc=5, complaint='Revisão de rotina')  # aprovação ok
os_('OS-2026-0005', 8, 'aprovada', '2026-11-12 08:00', [('s', 7, 1), ('p', 4, 1)], complaint='Ar-condicionado com cheiro')     # precisa de mecânico
os_('OS-2026-0006', 9, 'em_execucao', '2026-11-12 11:00', [('s', 4, 1), ('p', 8, 1), ('p', 15, 1)], mech=3, complaint='Correia com 60 mil km')
os_('OS-2026-0007', 10, 'concluida', '2026-11-13 08:00', [('s', 8, 1), ('p', 9, 1)], mech=4, complaint='Carro não pega de manhã')
os_('OS-2026-0008', 11, 'entregue', '2026-11-03 14:00', [('s', 3, 1)], mech=4, delivered='2026-11-04 10:00', complaint='Carro puxando para a direita')
os_('OS-2026-0009', 12, 'aberta', '2026-11-14 09:00', [], complaint='Ruído no motor')                                          # sem itens
os_('OS-2026-0010', 2, 'cancelada', '2026-11-05 15:00', [('s', 5, 1)], complaint='Cliente vendeu o carro')                      # exclusão/lixeira
os_('OS-2026-0011', 4, 'cancelada', '2026-10-20 09:00', [('s', 6, 1), ('p', 11, 2)], deleted='2026-10-25 12:00', complaint='Orçamento recusado')  # já na lixeira
os_('OS-2026-0012', 7, 'aprovada', '2026-11-14 13:00', [('s', 6, 1), ('p', 11, 2)], complaint='Amortecedor vazando')             # cancelar devolve estoque
for i, o in enumerate(orders, start=1): o['id'] = i

# Estoque: OS aprovadas/em execução/concluídas/entregues JÁ baixaram estoque (o estoque da tabela parts é o atual).
def totais(o):
    pc = sum(PP[x] * q for t, x, q in o['items'] if t == 'p'); sc = sum(SP[x] * q for t, x, q in o['items'] if t == 's')
    sub = pc + sc; desc = int(sub * o['disc'] / 100 + 0.5)   # arredondamento comercial (meio para cima)
    return dict(parts_cents=pc, services_cents=sc, subtotal_cents=sub, discount_cents=desc, total_cents=sub - desc)
def brl(c):
    s = f'{c // 100:,}'.replace(',', '.'); return f'R$ {s},{c % 100:02d}'
rel = []
for m in range(1, 13):
    L = [o for o in orders if o['status'] == 'entregue' and o['delivered'].startswith(f'2025-{m:02d}') and not o['deleted']]
    rev = sum(totais(o)['total_cents'] for o in L)
    rel.append(dict(month=f'2025-{m:02d}', orders=len(L), revenue_cents=rev, average_ticket_cents=(int(rev / len(L) + 0.5) if L else 0)))
low = sorted([p for p in parts if p[4] < p[5]], key=lambda p: (p[4] / p[5], p[1]))
esperado = dict(
 revenue_2025=rel, revenue_2025_total=sum(r['revenue_cents'] for r in rel),
 totais={o['number']: totais(o) for o in orders}, brl={o['number']: brl(totais(o)['total_cents']) for o in orders},
 low_stock=[dict(sku=p[1], stock_qty=p[4], min_stock=p[5], suggested_purchase=2 * p[5] - p[4]) for p in low],
 ids={o['number']: o['id'] for o in orders}, cpfs={c[1]: cpf(c[0]) for c in customers},
 orders_total=len([o for o in orders if not o['deleted']]), parts=len(parts))
json.dump(esperado, open(OUT + '/esperado.json', 'w'), ensure_ascii=False, indent=1)

H = lambda s: subprocess.run(["php", "-r", "echo password_hash($argv[1], PASSWORD_BCRYPT, [\"cost\" => 10]);", s], capture_output=True, text=True).stdout
hs = H(SENHA)
NOW = '2026-11-19 09:00:00'
items_rows, events_rows = [], []
FLUXO = ['aberta', 'orcada', 'aprovada', 'em_execucao', 'concluida', 'entregue']
for o in orders:
    for t, x, q in o['items']:
        items_rows.append(dict(service_order_id=o['id'], part_id=x if t == 'p' else None, service_id=x if t == 's' else None,
                               quantity=q, unit_price_cents=PP[x] if t == 'p' else SP[x]))
    t0 = dt.datetime.strptime(o['opened'], '%Y-%m-%d %H:%M')
    events_rows.append(dict(service_order_id=o['id'], from_status=None, to_status='aberta', user_id=2, created_at=t0.strftime('%Y-%m-%d %H:%M:00')))
    if o['status'] == 'cancelada':
        events_rows.append(dict(service_order_id=o['id'], from_status='aberta', to_status='cancelada', user_id=2, created_at=(t0 + dt.timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:00')))
    else:
        for k in range(1, FLUXO.index(o['status']) + 1):
            quem = o['mech'] if FLUXO[k] == 'concluida' else 2
            quando = dt.datetime.strptime(o['delivered'], '%Y-%m-%d %H:%M') if FLUXO[k] == 'entregue' else t0 + dt.timedelta(hours=k)
            events_rows.append(dict(service_order_id=o['id'], from_status=FLUXO[k - 1], to_status=FLUXO[k], user_id=quem, created_at=quando.strftime('%Y-%m-%d %H:%M:00')))
base = dict(
 users=[dict(id=i, name=n, email=e, role=r, password=hs) for i, n, e, r in users],
 customers=[dict(id=c[0], name=c[1], cpf=cpf(c[0]), phone=c[2], email=c[3]) for c in customers],
 vehicles=[dict(id=v[0], customer_id=v[1], plate=v[2], brand=v[3], model=v[4], year=v[5]) for v in vehicles],
 parts=[dict(id=p[0], sku=p[1], name=p[2], price_cents=p[3], stock_qty=p[4], min_stock=p[5]) for p in parts],
 services=[dict(id=s[0], name=s[1], price_cents=s[2], minutes=s[3]) for s in services],
 service_orders=[dict(id=o['id'], number=o['number'], vehicle_id=o['vehicle'], mechanic_id=o['mech'], status=o['status'], complaint=o['complaint'],
                      discount_percent=o['disc'], opened_at=o['opened'] + ':00', delivered_at=o['delivered'] and o['delivered'] + ':00',
                      deleted_at=o['deleted'] and o['deleted'] + ':00') for o in orders],
 service_order_items=items_rows, service_order_events=events_rows)
json.dump(base, open(OUT + '/base.json', 'w'), ensure_ascii=False, indent=0)

q = lambda v: 'NULL' if v is None else (str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'")
L = ["""-- Torque Certo – banco base da prova de revisão (Módulo C – Back-end API, treino #17)
-- MySQL 8 / MariaDB 10.4+. Padrão Laravel: id BIGINT UNSIGNED, chaves estrangeiras tabela_id, created_at/updated_at.
-- Valores em dinheiro são INTEIROS em centavos (price_cents). O estoque de parts já está baixado para as OS aprovadas em diante.
-- Não contém personal_access_tokens: ela é criada pelo php artisan install:api (Sanctum).
-- O banco está completo: você NÃO precisa criar migrations nesta prova. Importe de novo para recomeçar.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS torque_db;
CREATE DATABASE torque_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE torque_db;
""", """CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','atendente','mecanico') NOT NULL DEFAULT 'atendente',
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE password_reset_tokens (email VARCHAR(255) NOT NULL PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE sessions (id VARCHAR(255) NOT NULL PRIMARY KEY, user_id BIGINT UNSIGNED NULL, ip_address VARCHAR(45) NULL, user_agent TEXT NULL, payload LONGTEXT NOT NULL, last_activity INT NOT NULL, INDEX sessions_user_id_index (user_id), INDEX sessions_last_activity_index (last_activity)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cache (`key` VARCHAR(255) NOT NULL PRIMARY KEY, value MEDIUMTEXT NOT NULL, expiration INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE cache_locks (`key` VARCHAR(255) NOT NULL PRIMARY KEY, owner VARCHAR(255) NOT NULL, expiration INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE jobs (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, queue VARCHAR(255) NOT NULL, payload LONGTEXT NOT NULL, attempts TINYINT UNSIGNED NOT NULL, reserved_at INT UNSIGNED NULL, available_at INT UNSIGNED NOT NULL, created_at INT UNSIGNED NOT NULL, INDEX jobs_queue_index (queue)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE job_batches (id VARCHAR(255) NOT NULL PRIMARY KEY, name VARCHAR(255) NOT NULL, total_jobs INT NOT NULL, pending_jobs INT NOT NULL, failed_jobs INT NOT NULL, failed_job_ids LONGTEXT NOT NULL, options MEDIUMTEXT NULL, cancelled_at INT NULL, created_at INT NOT NULL, finished_at INT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE failed_jobs (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(255) NOT NULL UNIQUE, connection TEXT NOT NULL, queue TEXT NOT NULL, payload LONGTEXT NOT NULL, exception LONGTEXT NOT NULL, failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""", """CREATE TABLE customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  phone VARCHAR(11) NOT NULL COMMENT 'só números, com DDD',
  email VARCHAR(255) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE vehicles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  plate CHAR(7) NOT NULL UNIQUE COMMENT 'maiúsculas, sem hífen',
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT vehicles_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE parts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  stock_qty INT UNSIGNED NOT NULL DEFAULT 0,
  min_stock INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price_cents INT UNSIGNED NOT NULL,
  minutes SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE service_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(12) NOT NULL UNIQUE,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  mechanic_id BIGINT UNSIGNED NULL,
  status ENUM('aberta','orcada','aprovada','em_execucao','concluida','entregue','cancelada') NOT NULL DEFAULT 'aberta',
  complaint TEXT NOT NULL,
  discount_percent DECIMAL(4,1) NOT NULL DEFAULT 0,
  opened_at DATETIME NOT NULL,
  delivered_at DATETIME NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT service_orders_vehicle_id_foreign FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  CONSTRAINT service_orders_mechanic_id_foreign FOREIGN KEY (mechanic_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE service_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  service_order_id BIGINT UNSIGNED NOT NULL,
  part_id BIGINT UNSIGNED NULL,
  service_id BIGINT UNSIGNED NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  unit_price_cents INT UNSIGNED NOT NULL COMMENT 'preço no momento do orçamento',
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT service_order_items_service_order_id_foreign FOREIGN KEY (service_order_id) REFERENCES service_orders (id) ON DELETE CASCADE,
  CONSTRAINT service_order_items_part_id_foreign FOREIGN KEY (part_id) REFERENCES parts (id),
  CONSTRAINT service_order_items_service_id_foreign FOREIGN KEY (service_id) REFERENCES services (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE service_order_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  service_order_id BIGINT UNSIGNED NOT NULL,
  path VARCHAR(255) NOT NULL,
  thumb_path VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT service_order_photos_service_order_id_foreign FOREIGN KEY (service_order_id) REFERENCES service_orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE service_order_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  service_order_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(20) NULL,
  to_status VARCHAR(20) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT service_order_events_service_order_id_foreign FOREIGN KEY (service_order_id) REFERENCES service_orders (id) ON DELETE CASCADE,
  CONSTRAINT service_order_events_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""]
def ins(t, rows):
    cols = list(rows[0].keys())
    L.append(f"INSERT INTO {t} ({', '.join(cols)}, created_at, updated_at) VALUES\n" if 'created_at' not in cols else f"INSERT INTO {t} ({', '.join(cols)}, updated_at) VALUES\n")
    L[-1] += ",\n".join("  (" + ", ".join(q(r[c]) for c in cols) + (f", '{NOW}', '{NOW}'" if 'created_at' not in cols else f", {q(r['created_at'])}") + ")" for r in rows) + ";"
for t in ('users', 'customers', 'vehicles', 'parts', 'services', 'service_orders', 'service_order_items', 'service_order_events'):
    ins(t, base[t])
L.append("""CREATE TABLE migrations (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255) NOT NULL, batch INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO migrations (id, migration, batch) VALUES
  (1, '0001_01_01_000000_create_users_table', 1),
  (2, '0001_01_01_000001_create_cache_table', 1),
  (3, '0001_01_01_000002_create_jobs_table', 1),
  (4, '2026_11_20_000002_create_torque_tables', 1);
SET FOREIGN_KEY_CHECKS = 1;
""")
open(OUT + '/torque_db.sql', 'w', encoding='utf-8').write("\n".join(L) + "\n")
print('OS', len(orders), 'itens', len(items_rows), 'eventos', len(events_rows))
print([(r['month'], r['orders'], r['revenue_cents']) for r in rel])
print(esperado['low_stock'])
