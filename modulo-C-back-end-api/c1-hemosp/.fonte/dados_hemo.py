# Dados da prova de revisão HemoSP (Módulo C, API Laravel).
# Gera: hemosp_db.sql (MySQL, datas RELATIVAS à data da importação), base.json (para o BaseSeeder da solução)
# e esperado.json (valores que o script de conferência usa).
import json, os, sys, random, subprocess
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rnd = random.Random(2026)

def dv_cpf(base9):
    d = [int(c) for c in base9]
    s = sum(v * w for v, w in zip(d, range(10, 1, -1))); d1 = (s * 10 % 11) % 10
    d.append(d1); s = sum(v * w for v, w in zip(d, range(11, 1, -1))); d2 = (s * 10 % 11) % 10
    return base9 + str(d1) + str(d2)
def cpf(i): return dv_cpf(f"{231000000 + i * 104729:09d}"[:9])

blood_types = [  # id, code, meta de estoque em ml
 (1, 'A+', 15000), (2, 'A-', 5000), (3, 'B+', 6000), (4, 'B-', 3000),
 (5, 'AB+', 3000), (6, 'AB-', 2000), (7, 'O+', 20000), (8, 'O-', 8000)]
BT = {c: i for i, c, _ in blood_types}
centers = [  # id, nome, bairro, endereço, seg-sex abre/fecha, sáb abre/fecha, capacidade por horário, ativo
 (1, 'Hemocentro Paulista', 'Cerqueira César', 'Av. Dr. Enéas Carvalho de Aguiar, 155', '07:00', '18:00', '08:00', '12:00', 3, 1),
 (2, 'Posto de Coleta Mooca', 'Mooca', 'Rua da Mooca, 2100', '08:00', '17:00', None, None, 2, 1),
 (3, 'Posto de Coleta Santo Amaro', 'Santo Amaro', 'Av. Adolfo Pinheiro, 820', '08:00', '16:00', '08:00', '12:00', 2, 1),
 (4, 'Posto de Coleta Itaquera', 'Itaquera', 'Av. Itaquera, 4500', '08:00', '17:00', None, None, 2, 0)]
closures = [  # centro (None = todos), data, motivo
 (None, '2026-11-20', 'Consciência Negra'), (None, '2026-12-25', 'Natal'), (2, '2026-12-08', 'Dedetização da unidade'),
 (None, '2027-01-01', 'Confraternização Universal'), (None, '2027-01-25', 'Aniversário de São Paulo'),
 (None, '2027-02-08', 'Carnaval'), (None, '2027-02-09', 'Carnaval'), (None, '2027-03-26', 'Sexta-feira Santa'),
 (None, '2027-04-21', 'Tiradentes'), (None, '2027-05-01', 'Dia do Trabalho'), (None, '2027-05-27', 'Corpus Christi'),
 (None, '2027-07-09', 'Revolução Constitucionalista'), (None, '2027-09-07', 'Independência'),
 (None, '2027-10-12', 'Nossa Senhora Aparecida'), (None, '2027-11-02', 'Finados'), (None, '2027-11-15', 'Proclamação da República'),
 (None, '2027-11-20', 'Consciência Negra'), (None, '2027-12-25', 'Natal'), (3, '2027-01-15', 'Manutenção elétrica')]
users = [(1, 'Raul Avaliador', 'admin@hemosp.test', 'admin'), (2, 'Tânia Triagem', 'triagem@hemosp.test', 'triagem')]
SENHA_STAFF = 'Hemo@2026'; SENHA = 'Doador@2026'

# doadores do roteiro: id, nome, e-mail, sexo, (anos, dias) de idade, peso, tipo, documento do responsável
donors = [
 (1, 'Ana Beatriz Souza', 'ana@doador.test', 'F', (28, 40), 62.0, 'O+', None),
 (2, 'Bruno Carvalho', 'bruno@doador.test', 'M', (35, 10), 80.5, 'A+', None),
 (3, 'Camila Ferreira', 'camila@doador.test', 'F', (41, 200), 58.0, 'O-', None),
 (4, 'Diego Martins', 'diego@doador.test', 'M', (45, 90), 90.0, 'B+', None),
 (5, 'Eduarda Lima', 'eduarda@doador.test', 'F', (17, 100), 55.0, None, None),
 (6, 'Felipe Rocha', 'felipe@doador.test', 'M', (17, 150), 68.0, None, 'guardians/felipe-rocha-autorizacao.pdf'),
 (7, 'Gabriela Nunes', 'gabriela@doador.test', 'F', (25, 60), 48.0, 'A-', None),
 (8, 'Heitor Alves', 'heitor@doador.test', 'M', (63, 20), 75.0, None, None),
 (9, 'Isabel Prado', 'isabel@doador.test', 'F', (66, 120), 60.0, 'B-', None),
 (10, 'João Pedro Teixeira', 'joao@doador.test', 'M', (70, 30), 77.0, 'O+', None),
 (11, 'Karina Duarte', 'karina@doador.test', 'F', (30, 15), 65.0, 'AB+', None),
 (12, 'Lucas Andrade', 'lucas@doador.test', 'M', (22, 5), 72.0, 'A-', None),
 (13, 'Marcos Vinícius Lopes', 'marcos@doador.test', 'M', (50, 70), 85.0, 'O+', None),
 (14, 'Natália Ribeiro', 'natalia@doador.test', 'F', (33, 33), 59.0, 'B-', None),
 (15, 'Otávio Mendes', 'otavio@doador.test', 'M', (29, 300), 77.0, None, None),
 (16, 'Paula Castro', 'paula@doador.test', 'F', (38, 180), 61.0, 'A+', None),
]
# doadores do histórico (17 a 40): alimentam o estoque e o relatório de junho de 2025
NOMES = ['Rafael Moreira', 'Sabrina Gomes', 'Tiago Barros', 'Úrsula Campos', 'Vinícius Pires', 'Wesley Santana', 'Yara Fontes',
 'Zeca Antunes', 'Alícia Mota', 'Bernardo Reis', 'Cecília Araújo', 'Davi Moura', 'Elisa Batista', 'Fábio Cunha', 'Giovana Freitas',
 'Hugo Sales', 'Ingrid Melo', 'Júlio Cesar Dias', 'Larissa Pacheco', 'Mateus Viana', 'Nicole Arruda', 'Orlando Brito', 'Priscila Lacerda', 'Renan Siqueira']
TIPOS = ['O+', 'O+', 'A+', 'A+', 'B+', 'O-', 'A-', 'AB+', 'B-', 'O+', 'A+', 'B+', 'O-', 'A+', 'AB+', 'B+', 'O-', 'A+', 'B+', 'A-', 'AB+', 'B+', 'O-', 'A+']
for k, nome in enumerate(NOMES):
    i = 17 + k
    sexo = 'F' if nome.split()[0][-1] in 'ae' and nome.split()[0] not in ('Zeca', 'Orlando') else 'M'
    if nome.split()[0] in ('Ingrid', 'Úrsula', 'Yara', 'Nicole', 'Priscila', 'Alícia', 'Cecília', 'Elisa', 'Sabrina', 'Larissa', 'Giovana'): sexo = 'F'
    if nome.split()[0] in ('Davi', 'Hugo', 'Júlio', 'Renan', 'Wesley', 'Tiago', 'Rafael', 'Bernardo', 'Fábio', 'Mateus', 'Orlando', 'Vinícius', 'Zeca'): sexo = 'M'
    email = nome.split()[0].lower().translate(str.maketrans('áéíóúúçãõâêô', 'aeiouucaoaeo')) + f'{i}@doador.test'
    donors.append((i, nome, email, sexo, (22 + (k * 7) % 35, (k * 37) % 300), 60.0 + (k * 3) % 30, TIPOS[k], None))

# ---- agendamentos. Datas: ('abs', 'Y-m-d H:i') | ('day', dias, 'H:i') relativo a hoje | ('min', minutos) relativo a agora
appts = []  # dict
def ap(donor, center, when, status, vol=None, reason=None):
    appts.append(dict(donor=donor, center=center, when=when, status=status, vol=vol, reason=reason))

# histórico dos doadores do roteiro (relativo)
ap(1, 1, ('day', -120, '09:00'), 'donated', 450); ap(1, 1, ('day', -260, '10:20'), 'donated', 440)
ap(2, 2, ('day', -30, '08:40'), 'donated', 460)
ap(3, 1, ('day', -70, '14:00'), 'donated', 430)
for d in (-300, -230, -160, -75): ap(4, 3, ('day', d, '09:20'), 'donated', 450)
ap(9, 1, ('day', -200, '11:00'), 'donated', 420)
ap(10, 1, ('day', -400, '09:00'), 'donated', 450)
ap(11, 1, ('day', 3, '10:00'), 'scheduled')
ap(12, 1, ('min', 60), 'scheduled')
ap(13, 1, ('min', -120), 'scheduled')
ap(14, 1, ('min', 10), 'scheduled')
ap(15, 1, ('min', -5), 'attended')
ap(16, 2, ('day', -10, '13:00'), 'donated', 450)
ap(7, 2, ('day', -40, '15:00'), 'unfit', None, 'Peso abaixo do mínimo na triagem')
ap(5, 3, ('day', -20, '09:00'), 'cancelled')
ap(8, 3, ('day', -15, '10:00'), 'no_show')
# estoque: doações dos últimos 35 dias (doadores do histórico) por tipo
QUER = {'O+': 3, 'O-': 4, 'A+': 9, 'A-': 3, 'B+': 8, 'B-': 2, 'AB+': 4, 'AB-': 0}
JA = {'A+': 2, 'A-': 0, 'O+': 0, 'B-': 0}  # Bruno (A+ há 30 dias) e Paula (A+ há 10 dias) já contam
pool = {}
for d in donors[16:]: pool.setdefault(d[6], []).append(d[0])
dia = -2
for tipo, n in QUER.items():
    n -= JA.get(tipo, 0)
    ids = pool.get(tipo, [])
    for j in range(n):
        ap(ids[j % len(ids)], 1 + (j % 3), ('day', -(2 + (dia * 7 + j * 5) % 33), f'{8 + j % 8:02d}:{(j % 3) * 20:02d}'), 'donated', 420 + (j * 13) % 60)
        dia += 1
# junho de 2025 (absoluto): relatório mensal e listagem da equipe
ST = ['donated'] * 9 + ['unfit'] * 2 + ['no_show'] * 2 + ['cancelled'] * 2
usados = set()
dias_jun = [d for d in range(1, 31) if __import__('datetime').date(2025, 6, d).weekday() < 5]
for k in range(70):
    c = 1 + (k % 3)
    d = 10 if k < 14 else dias_jun[(k * 7) % len(dias_jun)]
    while True:
        h = 8 + rnd.randrange(0, 7); m = rnd.choice((0, 20, 40))
        key = (c, d, h, m)
        if key not in usados: usados.add(key); break
    st = ST[rnd.randrange(len(ST))]
    ap(17 + rnd.randrange(24), c, ('abs', f'2025-06-{d:02d} {h:02d}:{m:02d}'), st,
       420 + rnd.randrange(0, 60) if st == 'donated' else None, 'Hemoglobina baixa' if st == 'unfit' else None)

# ---- conversões
import datetime as dt
HOJE = dt.date.today()
def py_dt(w):
    if w[0] == 'abs': return dt.datetime.strptime(w[1], '%Y-%m-%d %H:%M')
    if w[0] == 'day': return dt.datetime.combine(HOJE + dt.timedelta(days=w[1]), dt.datetime.strptime(w[2], '%H:%M').time())
    return None
def sql_dt(w):
    if w[0] == 'abs': return f"'{w[1]}:00'"
    if w[0] == 'day': return f"TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL {w[1]} DAY), '{w[2]}:00')"
    return f"DATE_FORMAT(DATE_ADD(NOW(), INTERVAL {w[1]} MINUTE), '%Y-%m-%d %H:%i:00')"
def sql_created(w):
    if w[0] == 'abs': return f"DATE_SUB('{w[1]}:00', INTERVAL 3 DAY)"
    if w[0] == 'day': return f"TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL {w[1] - 3} DAY), '10:00:00')"
    return "TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00')"
def created_spec(w):
    if w[0] == 'abs': return ['abs', (dt.datetime.strptime(w[1], '%Y-%m-%d %H:%M') - dt.timedelta(days=3)).strftime('%Y-%m-%d %H:%M')]
    if w[0] == 'day': return ['day', w[1] - 3, '10:00']
    return ['day', -1, '10:00']
# ordem de criação = ordem do protocolo
ordem = sorted(range(len(appts)), key=lambda i: (0 if appts[i]['when'][0] == 'abs' else 1, appts[i]['when'][1] if appts[i]['when'][0] != 'min' else 9999))
for n, i in enumerate(ordem, start=1):
    appts[i]['n'] = n
appts.sort(key=lambda a: a['n'])
for idx, a in enumerate(appts, start=1): a['id'] = idx

# ---- valores esperados (conferência)
def estoque():
    vols = {c: 0 for _, c, _ in blood_types}
    tipo = {d[0]: d[6] for d in donors}
    for a in appts:
        if a['status'] == 'donated' and a['when'][0] == 'day' and -35 < a['when'][1] <= 0:
            vols[tipo[a['donor']]] += a['vol']
    out = []
    for _, c, goal in blood_types:
        pct = round(vols[c] * 100 / goal, 1)
        out.append(dict(blood_type=c, volume_ml=vols[c], goal_ml=goal, percent=pct, level='critico' if pct < 25 else ('alerta' if pct < 50 else 'ok')))
    out.sort(key=lambda x: (x['percent'], x['blood_type']))
    return out
def relatorio():
    rows = []
    for cid, nome, *_ in centers:
        L = [a for a in appts if a['center'] == cid and a['when'][0] == 'abs' and a['when'][1].startswith('2025-06')]
        cnt = lambda s: sum(1 for a in L if a['status'] == s)
        validos = len(L) - cnt('cancelled')
        rows.append(dict(center_id=cid, center=nome, total=len(L), donated=cnt('donated'), unfit=cnt('unfit'), no_show=cnt('no_show'),
                         cancelled=cnt('cancelled'), no_show_rate=round(cnt('no_show') * 100 / validos, 1) if validos else 0.0,
                         volume_liters=round(sum(a['vol'] or 0 for a in L if a['status'] == 'donated') / 1000, 2)))
    return rows
dia10 = [a for a in appts if a['when'][0] == 'abs' and a['when'][1].startswith('2025-06-10')]
nomes = {d[0]: d[1] for d in donors}
esperado = dict(estoque=estoque(), relatorio_2025_06=relatorio(), total_10_06=len(dia10),
                primeiro_10_06=sorted(dia10, key=lambda a: (a['when'][1], a['center']))[0]['n'],
                maior_numero=len(appts), cpfs={d[1]: cpf(d[0]) for d in donors[:16]})
json.dump(esperado, open(OUT + '/esperado.json', 'w'), ensure_ascii=False, indent=1)

# ---- base.json (BaseSeeder da solução: mesmas regras de data relativa)
H = lambda s: subprocess.run(["php", "-r", "echo password_hash($argv[1], PASSWORD_BCRYPT, [\"cost\" => 10]);", s], capture_output=True, text=True).stdout
hs, hd = H(SENHA_STAFF), H(SENHA)
base = dict(
 users=[dict(id=i, name=n, email=e, role=r, password=hs) for i, n, e, r in users],
 blood_types=[dict(id=i, code=c, stock_goal_ml=g) for i, c, g in blood_types],
 centers=[dict(id=c[0], name=c[1], neighborhood=c[2], address=c[3], weekday_opens_at=c[4], weekday_closes_at=c[5],
               saturday_opens_at=c[6], saturday_closes_at=c[7], slot_capacity=c[8], active=c[9]) for c in centers],
 closures=[dict(id=k + 1, center_id=c, date=d, reason=r) for k, (c, d, r) in enumerate(closures)],
 donors=[dict(id=d[0], name=d[1], cpf=cpf(d[0]), email=d[2], password=hd, sex=d[3], birth=list(d[4]), weight_kg=d[5],
              blood_type_id=BT.get(d[6]), guardian_document_path=d[7]) for d in donors],
 appointments=[dict(id=a['id'], n=a['n'], donor_id=a['donor'], center_id=a['center'], when=list(a['when']), created=created_spec(a['when']),
                    status=a['status'], volume_ml=a['vol'], unfit_reason=a['reason']) for a in appts])
json.dump(base, open(OUT + '/base.json', 'w'), ensure_ascii=False, indent=0)

# ---- SQL MySQL
q = lambda v: 'NULL' if v is None else (str(v) if isinstance(v, (int, float)) else "'" + str(v).replace("'", "''") + "'")
NOW = "'2026-11-19 09:00:00'"
L = ["""-- HemoSP – banco base da prova de revisão (Módulo C – Back-end API, treino #17)
-- MySQL 8 / MariaDB 10.4+. Padrão Laravel: id BIGINT UNSIGNED, chaves estrangeiras tabela_id, created_at/updated_at.
-- IMPORTANTE: as datas dos doadores e dos agendamentos são RELATIVAS ao dia em que você importa este arquivo
-- (CURDATE() e NOW()). Por isso as regras de intervalo e de estoque sempre funcionam. Importe de novo para recomeçar.
-- Não contém personal_access_tokens: ela é criada pelo php artisan install:api (Sanctum).
-- O banco está completo: você NÃO precisa criar migrations nesta prova.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '-03:00';
DROP DATABASE IF EXISTS hemosp_db;
CREATE DATABASE hemosp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hemosp_db;
""", """CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','triagem') NOT NULL DEFAULT 'triagem',
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
""", """CREATE TABLE blood_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE,
  stock_goal_ml INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE centers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  weekday_opens_at TIME NOT NULL,
  weekday_closes_at TIME NOT NULL,
  saturday_opens_at TIME NULL,
  saturday_closes_at TIME NULL,
  slot_capacity TINYINT UNSIGNED NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE closures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  center_id BIGINT UNSIGNED NULL COMMENT 'NULL = todas as unidades',
  date DATE NOT NULL,
  reason VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY closures_center_id_date_unique (center_id, date),
  CONSTRAINT closures_center_id_foreign FOREIGN KEY (center_id) REFERENCES centers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE donors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  sex ENUM('M','F') NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  blood_type_id BIGINT UNSIGNED NULL,
  guardian_document_path VARCHAR(255) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT donors_blood_type_id_foreign FOREIGN KEY (blood_type_id) REFERENCES blood_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  protocol VARCHAR(20) NOT NULL UNIQUE,
  donor_id BIGINT UNSIGNED NOT NULL,
  center_id BIGINT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  status ENUM('scheduled','attended','donated','unfit','no_show','cancelled') NOT NULL DEFAULT 'scheduled',
  volume_ml SMALLINT UNSIGNED NULL,
  unfit_reason VARCHAR(255) NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  INDEX appointments_center_id_starts_at_index (center_id, starts_at),
  CONSTRAINT appointments_donor_id_foreign FOREIGN KEY (donor_id) REFERENCES donors (id),
  CONSTRAINT appointments_center_id_foreign FOREIGN KEY (center_id) REFERENCES centers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE appointment_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  appointment_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(20) NULL,
  to_status VARCHAR(20) NOT NULL,
  user_id BIGINT UNSIGNED NULL COMMENT 'NULL = feito pelo próprio doador',
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  CONSTRAINT appointment_events_appointment_id_foreign FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
  CONSTRAINT appointment_events_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""]
def ins(t, cols, rows):
    L.append(f"INSERT INTO {t} ({', '.join(cols)}) VALUES\n" + ",\n".join("  (" + ", ".join(rows_v) + ")" for rows_v in rows) + ";")
ins('users', ['id', 'name', 'email', 'password', 'role', 'created_at', 'updated_at'], [[q(i), q(n), q(e), q(hs), q(r), NOW, NOW] for i, n, e, r in users])
ins('blood_types', ['id', 'code', 'stock_goal_ml', 'created_at', 'updated_at'], [[q(i), q(c), q(g), NOW, NOW] for i, c, g in blood_types])
ins('centers', ['id', 'name', 'neighborhood', 'address', 'weekday_opens_at', 'weekday_closes_at', 'saturday_opens_at', 'saturday_closes_at', 'slot_capacity', 'active', 'created_at', 'updated_at'],
    [[q(c[0]), q(c[1]), q(c[2]), q(c[3]), q(c[4] + ':00'), q(c[5] + ':00'), q(c[6] and c[6] + ':00'), q(c[7] and c[7] + ':00'), q(c[8]), q(c[9]), NOW, NOW] for c in centers])
ins('closures', ['id', 'center_id', 'date', 'reason', 'created_at', 'updated_at'], [[q(k + 1), q(c), q(d), q(r), NOW, NOW] for k, (c, d, r) in enumerate(closures)])
ins('donors', ['id', 'name', 'cpf', 'email', 'password', 'birth_date', 'sex', 'weight_kg', 'blood_type_id', 'guardian_document_path', 'created_at', 'updated_at'],
    [[q(d[0]), q(d[1]), q(cpf(d[0])), q(d[2]), q(hd), f"DATE_SUB(DATE_SUB(CURDATE(), INTERVAL {d[4][0]} YEAR), INTERVAL {d[4][1]} DAY)", q(d[3]), q(d[5]), q(BT.get(d[6])), q(d[7]), NOW, NOW] for d in donors])
rows = []
for a in appts:
    cr = sql_created(a['when'])
    rows.append([q(a['id']), f"CONCAT('HEMO-', YEAR({cr}), '-', LPAD({a['n']}, 5, '0'))", q(a['donor']), q(a['center']), sql_dt(a['when']), q(a['status']), q(a['vol']), q(a['reason']),
                 (cr if a['status'] == 'cancelled' else 'NULL'), cr, cr])
ins('appointments', ['id', 'protocol', 'donor_id', 'center_id', 'starts_at', 'status', 'volume_ml', 'unfit_reason', 'cancelled_at', 'created_at', 'updated_at'], rows)
ev = []
PASSOS = {'scheduled': [], 'attended': ['attended'], 'donated': ['attended', 'donated'], 'unfit': ['attended', 'unfit'], 'no_show': ['no_show'], 'cancelled': ['cancelled']}
for a in appts:
    cr = sql_created(a['when'])
    ev.append([q(a['id']), 'NULL', q('scheduled'), 'NULL', q('Agendado pelo doador'), cr, cr])
    prev = 'scheduled'
    for s in PASSOS[a['status']]:
        quando = sql_dt(a['when']) if a['when'][0] != 'min' else 'NOW()'
        ev.append([q(a['id']), q(prev), q(s), 'NULL' if s == 'cancelled' else '2', 'NULL', quando, quando]); prev = s
ins('appointment_events', ['appointment_id', 'from_status', 'to_status', 'user_id', 'note', 'created_at', 'updated_at'], ev)
L.append("""CREATE TABLE migrations (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255) NOT NULL, batch INT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO migrations (id, migration, batch) VALUES
  (1, '0001_01_01_000000_create_users_table', 1),
  (2, '0001_01_01_000001_create_cache_table', 1),
  (3, '0001_01_01_000002_create_jobs_table', 1),
  (4, '2026_11_20_000001_create_hemosp_tables', 1);
SET FOREIGN_KEY_CHECKS = 1;
""")
open(OUT + '/hemosp_db.sql', 'w', encoding='utf-8').write("\n".join(L) + "\n")
print('agendamentos', len(appts), 'doadores', len(donors))
print(json.dumps(esperado['estoque'], ensure_ascii=False))
print(json.dumps(esperado['relatorio_2025_06'], ensure_ascii=False), esperado['total_10_06'])
