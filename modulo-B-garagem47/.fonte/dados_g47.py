# Gera garagem47_db.sql (MySQL/MariaDB). Uso: python3 dados_g47.py saida.sql
import sys, random
random.seed(47)
HASH = '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK'  # ProvaB2026!

def cpf(seed):
    r = random.Random(seed); d = [r.randint(0, 9) for _ in range(9)]
    for n in (10, 11):
        s = sum(v * (n - i) for i, v in enumerate(d)); dv = (s * 10) % 11; d.append(0 if dv == 10 else dv)
    return ''.join(map(str, d))
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return '1' if v else '0'
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"
def ins(t, cols, rows):
    out = [f"INSERT INTO `{t}` (" + ', '.join(f'`{c}`' for c in cols) + ") VALUES"]
    out.append(',\n'.join('(' + ', '.join(q(v) for v in r) + ')' for r in rows) + ';')
    return '\n'.join(out)
TS = '2026-10-01 08:00:00'

users = [  # id, name, email, role, active
 (1, 'Helena Duarte', 'gerente.prova@garagem47.com', 'gerente', 1),
 (2, 'Otávio Lins', 'atendente.prova@garagem47.com', 'atendente', 1),
 (3, 'Carlos Menezes', 'mecanico.prova@garagem47.com', 'mecanico', 1),
 (4, 'Bruna Siqueira', 'mecanico2.prova@garagem47.com', 'mecanico', 1),
 (5, 'Jair Pontes', 'inativo.prova@garagem47.com', 'mecanico', 0),
]
nomes = ['Ana Beatriz Rocha', 'Marcos Vinícius Teles', 'Juliana Prado', 'Ricardo Okamoto', 'Fernanda Albuquerque',
         'Paulo Henrique Sá', 'Larissa Moura', 'Tiago Brandão', 'Cecília Nogueira', 'Rogério Antunes',
         'Patrícia Quintela', 'Eduarda Fontes']
customers = []
for i, n in enumerate(nomes, 1):
    email = None if i in (4, 9) else n.split()[0].lower().replace('í', 'i').replace('é', 'e') + f'.{i}@email.com'
    customers.append((i, n, cpf(i * 7), '1599' + f'{random.randint(1000000, 9999999)}', email, TS, TS))
veic = [  # id, customer, plate, brand, model, year
 (1, 1, 'FJK2B31', 'Fiat', 'Argo', 2021), (2, 1, 'EOP4471', 'Volkswagen', 'Gol', 2014),
 (3, 2, 'GHT8C12', 'Chevrolet', 'Onix', 2022), (4, 3, 'BRA2E19', 'Hyundai', 'HB20', 2020),
 (5, 4, 'DKQ9031', 'Ford', 'Ka', 2016), (6, 5, 'RTY5F88', 'Toyota', 'Corolla', 2023),
 (7, 6, 'CVB1H04', 'Renault', 'Kwid', 2022), (8, 7, 'MNO3J56', 'Jeep', 'Renegade', 2021),
 (9, 8, 'LPA6K77', 'Honda', 'Civic', 2019), (10, 8, 'HZX2L90', 'Honda', 'Fit', 2015),
 (11, 9, 'QWE7M13', 'Nissan', 'Kicks', 2024), (12, 10, 'ASD4N45', 'Fiat', 'Strada', 2023),
 (13, 11, 'ZXC8P21', 'Volkswagen', 'T-Cross', 2022), (14, 3, 'POI1Q66', 'Peugeot', '208', 2021),
 (15, 12, 'UYT3R02', 'Chevrolet', 'Tracker', 2024),  # cliente 12 sem ordens (pode ser apagado)
]
vehicles = [(a, b, c, d, e, f, TS, TS) for a, b, c, d, e, f in veic]
serv = [  # id, name, price, active
 (1, 'Troca de óleo e filtro', '89.90', 1), (2, 'Alinhamento', '120.00', 1), (3, 'Balanceamento (4 rodas)', '90.00', 1),
 (4, 'Revisão do sistema de freios', '250.00', 1), (5, 'Troca de pastilhas de freio', '180.00', 1),
 (6, 'Diagnóstico eletrônico', '150.00', 1), (7, 'Higienização do ar-condicionado', '130.00', 1),
 (8, 'Troca da correia dentada', '420.00', 1), (9, 'Revisão da suspensão dianteira', '380.00', 1),
 (10, 'Lavagem simples', '40.00', 0), (11, 'Troca de lâmpadas', '35.00', 1),
]
services = [(a, b, c, d, TS, TS) for a, b, c, d in serv]
parts_ = [  # id, sku, name, price, stock
 (1, 'OLE-5W30', 'Óleo 5W30 sintético (litro)', '42.50', 40), (2, 'FIL-OLE01', 'Filtro de óleo', '28.90', 12),
 (3, 'PAS-DIA01', 'Jogo de pastilhas dianteiras', '159.00', 6), (4, 'DIS-FRE02', 'Disco de freio ventilado', '210.00', 4),
 (5, 'COR-DEN01', 'Kit correia dentada', '389.00', 2), (6, 'AMO-DIA01', 'Amortecedor dianteiro', '465.00', 4),
 (7, 'LAM-H4', 'Lâmpada H4', '24.90', 20), (8, 'FIL-AR01', 'Filtro de ar do motor', '39.90', 8),
 (9, 'FIL-CAB01', 'Filtro de cabine', '45.00', 0), (10, 'FLU-FRE01', 'Fluido de freio DOT4 (500 ml)', '32.00', 10),
 (11, 'BAT-60AH', 'Bateria 60 Ah', '599.00', 1), (12, 'PAL-PAR01', 'Palheta do para-brisa (par)', '69.90', 9),
]
parts = [(a, b, c, d, e, TS, TS) for a, b, c, d, e in parts_]

# ordens: id, vehicle, mechanic, created_by, status, km, complaint, opened, due, finished, delivered, cancel_reason, servicos, pecas[(part,qtd)]
O = [
 (1, 1, 3, 2, 'entregue', 41230, 'Revisão dos 40 mil km.', '2026-10-01 08:12:00', '2026-10-02', '2026-10-02 16:40:00', '2026-10-03 09:10:00', None, [1, 2, 3], [(1, 4), (2, 1)]),
 (2, 3, 4, 2, 'entregue', 18990, 'Barulho ao frear.', '2026-10-05 10:00:00', '2026-10-07', '2026-10-06 15:00:00', '2026-10-06 17:30:00', None, [4, 5], [(3, 1), (10, 1)]),
 (3, 5, 3, 1, 'cancelada', 132400, 'Cliente desistiu do orçamento da suspensão.', '2026-10-08 09:30:00', '2026-10-12', None, None, 'Cliente desistiu após o orçamento.', [9], []),
 (4, 6, 4, 2, 'concluida', 9800, 'Primeira revisão.', '2026-11-03 08:05:00', '2026-11-04', '2026-11-04 11:20:00', None, None, [1, 7], [(1, 4), (2, 1), (9, 0)]),
 (5, 8, 3, 2, 'em_execucao', 52110, 'Luz da injeção acesa.', '2026-11-10 13:40:00', '2026-11-12', None, None, None, [6], []),
 (6, 9, 4, 1, 'aguardando_peca', 87500, 'Troca da correia dentada.', '2026-11-11 08:30:00', '2026-11-25', None, None, None, [8, 1], [(1, 4)]),
 (7, 11, None, 2, 'aberta', 15020, 'Ar-condicionado com cheiro.', '2026-11-16 09:00:00', '2026-11-18', None, None, None, [7], []),
 (8, 12, 3, 2, 'aberta', 30400, 'Alinhamento e balanceamento.', '2026-11-17 14:20:00', '2026-11-30', None, None, None, [2, 3], []),
 (9, 2, None, 2, 'aberta', 160300, 'Lâmpada do farol queimada.', '2026-11-18 10:10:00', '2026-11-19', None, None, None, [11], []),
 (10, 13, 4, 1, 'em_execucao', 44100, 'Revisão de freios e fluido.', '2026-11-17 08:00:00', '2026-11-26', None, None, None, [4], [(10, 2)]),
 (11, 4, 3, 2, 'entregue', 60200, 'Troca de óleo.', '2026-11-02 08:00:00', '2026-11-02', '2026-11-02 10:00:00', '2026-11-02 12:00:00', None, [1], [(1, 4), (2, 1)]),
 (12, 7, 4, 2, 'concluida', 21000, 'Pastilhas gastas.', '2026-11-12 09:00:00', '2026-11-13', '2026-11-13 16:00:00', None, None, [5], [(3, 1)]),
 (13, 10, 3, 2, 'aguardando_peca', 98760, 'Bateria descarregando.', '2026-11-13 11:00:00', '2026-11-14', None, None, None, [6], []),
 (14, 14, None, 1, 'aberta', 33000, 'Palhetas e filtro de cabine.', '2026-11-19 08:00:00', '2026-11-21', None, None, None, [7, 11], []),
 (15, 1, 4, 2, 'cancelada', 43010, 'Orçamento de amortecedores recusado.', '2026-11-05 15:00:00', '2026-11-07', None, None, 'Valor acima do esperado pelo cliente.', [9], []),
 (16, 3, 3, 2, 'em_execucao', 19500, 'Vibração no volante.', '2026-11-18 08:40:00', '2026-11-18', None, None, None, [2, 3], []),
]
sp = {s[0]: s[2] for s in serv}; pp = {p[0]: p[3] for p in parts_}
orders, os_rows, op_rows, logs = [], [], [], []
lid = 0; opid = 0
FLOW = {'aberta': [], 'em_execucao': ['em_execucao'], 'aguardando_peca': ['em_execucao', 'aguardando_peca'],
        'concluida': ['em_execucao', 'concluida'], 'entregue': ['em_execucao', 'concluida', 'entregue'], 'cancelada': ['cancelada']}
for (i, v, m, cb, st, km, comp, op, due, fin, dlv, cr, ss, ps) in O:
    code = f'OS-2026-{i:04d}'
    orders.append((i, code, v, m, cb, st, km, comp, op, due, fin, dlv, cr, op, dlv or fin or op))
    for s in ss: os_rows.append((i, s, sp[s]))
    for p, qt in ps:
        if qt: opid += 1; op_rows.append((opid, i, p, qt, pp[p], op, op))
    prev = None; lid += 1
    logs.append((lid, i, cb, None, 'aberta', None, op))
    for k, s in enumerate(FLOW[st]):
        lid += 1
        who = cb if s in ('entregue', 'cancelada') else (m or cb)
        when = {'concluida': fin, 'entregue': dlv}.get(s) or op
        note = cr if s == 'cancelada' else ('Peça encomendada ao fornecedor.' if s == 'aguardando_peca' else None)
        logs.append((lid, i, who, (FLOW[st][k - 1] if k else 'aberta'), s, note, when))

SQL = f"""-- Garagem 47 · banco da prova (Módulo B, revisão) · Raul Porto Lopes (Avaliador)
-- Importe num banco vazio chamado XX_modulo_b (utf8mb4). Senha de todos os usuários: ProvaB2026!
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `work_order_photos`, `work_order_status_logs`, `part_work_order`, `service_work_order`, `work_orders`, `parts`, `services`, `vehicles`, `customers`, `sessions`, `cache`, `cache_locks`, `password_reset_tokens`, `users`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('atendente','mecanico','gerente') NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(150) NOT NULL, `token` varchar(255) NOT NULL, `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL, `user_id` bigint unsigned DEFAULT NULL, `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text, `payload` longtext NOT NULL, `last_activity` int NOT NULL,
  PRIMARY KEY (`id`), KEY `sessions_user_id_index` (`user_id`), KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (`key` varchar(255) NOT NULL, `value` mediumtext NOT NULL, `expiration` int NOT NULL, PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cache_locks` (`key` varchar(255) NOT NULL, `owner` varchar(255) NOT NULL, `expiration` int NOT NULL, PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `cpf` char(11) NOT NULL COMMENT 'só dígitos',
  `phone` varchar(11) NOT NULL COMMENT 'só dígitos (DDD + número)',
  `email` varchar(150) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_cpf_unique` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehicles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `plate` char(7) NOT NULL COMMENT 'maiúsculas, sem hífen',
  `brand` varchar(40) NOT NULL,
  `model` varchar(60) NOT NULL,
  `year` smallint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicles_plate_unique` (`plate`),
  KEY `vehicles_customer_id_foreign` (`customer_id`),
  CONSTRAINT `vehicles_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `services_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `parts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(20) NOT NULL,
  `name` varchar(80) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parts_sku_unique` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(12) NOT NULL COMMENT 'OS-AAAA-NNNN',
  `vehicle_id` bigint unsigned NOT NULL,
  `mechanic_id` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `status` enum('aberta','em_execucao','aguardando_peca','concluida','entregue','cancelada') NOT NULL DEFAULT 'aberta',
  `km` int unsigned NOT NULL,
  `complaint` varchar(500) NOT NULL,
  `opened_at` datetime NOT NULL,
  `due_date` date NOT NULL,
  `finished_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_orders_code_unique` (`code`),
  KEY `work_orders_vehicle_id_foreign` (`vehicle_id`),
  KEY `work_orders_mechanic_id_foreign` (`mechanic_id`),
  KEY `work_orders_created_by_foreign` (`created_by`),
  CONSTRAINT `work_orders_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `work_orders_mechanic_id_foreign` FOREIGN KEY (`mechanic_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `work_orders_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `service_work_order` (
  `work_order_id` bigint unsigned NOT NULL,
  `service_id` bigint unsigned NOT NULL,
  `price` decimal(10,2) NOT NULL COMMENT 'preço do serviço no momento em que entrou na ordem',
  PRIMARY KEY (`work_order_id`,`service_id`),
  KEY `service_work_order_service_id_foreign` (`service_id`),
  CONSTRAINT `service_work_order_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_work_order_service_id_foreign` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `part_work_order` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `work_order_id` bigint unsigned NOT NULL,
  `part_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  `unit_price` decimal(10,2) NOT NULL COMMENT 'preço da peça no momento em que entrou na ordem',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `part_work_order_work_order_id_part_id_unique` (`work_order_id`,`part_id`),
  KEY `part_work_order_part_id_foreign` (`part_id`),
  CONSTRAINT `part_work_order_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `part_work_order_part_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `work_order_status_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `work_order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `work_order_status_logs_work_order_id_foreign` (`work_order_id`),
  KEY `work_order_status_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `work_order_status_logs_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_order_status_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `work_order_photos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `work_order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `path` varchar(255) NOT NULL COMMENT 'caminho relativo ao disco public',
  `original_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `work_order_photos_work_order_id_foreign` (`work_order_id`),
  KEY `work_order_photos_user_id_foreign` (`user_id`),
  CONSTRAINT `work_order_photos_work_order_id_foreign` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_order_photos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

"""
SQL += ins('users', ['id', 'name', 'email', 'password', 'role', 'active', 'created_at', 'updated_at'],
           [(i, n, e, HASH, r, a, TS, TS) for i, n, e, r, a in users]) + '\n\n'
SQL += ins('customers', ['id', 'name', 'cpf', 'phone', 'email', 'created_at', 'updated_at'], customers) + '\n\n'
SQL += ins('vehicles', ['id', 'customer_id', 'plate', 'brand', 'model', 'year', 'created_at', 'updated_at'], vehicles) + '\n\n'
SQL += ins('services', ['id', 'name', 'price', 'active', 'created_at', 'updated_at'], services) + '\n\n'
SQL += ins('parts', ['id', 'sku', 'name', 'price', 'stock', 'created_at', 'updated_at'], parts) + '\n\n'
SQL += ins('work_orders', ['id', 'code', 'vehicle_id', 'mechanic_id', 'created_by', 'status', 'km', 'complaint', 'opened_at', 'due_date',
           'finished_at', 'delivered_at', 'cancel_reason', 'created_at', 'updated_at'], orders) + '\n\n'
SQL += ins('service_work_order', ['work_order_id', 'service_id', 'price'], os_rows) + '\n\n'
SQL += ins('part_work_order', ['id', 'work_order_id', 'part_id', 'quantity', 'unit_price', 'created_at', 'updated_at'], op_rows) + '\n\n'
SQL += ins('work_order_status_logs', ['id', 'work_order_id', 'user_id', 'from_status', 'to_status', 'note', 'created_at'], logs) + '\n'
open(sys.argv[1], 'w', encoding='utf-8').write(SQL)
print('ok', len(orders), 'ordens', len(customers), 'clientes')
