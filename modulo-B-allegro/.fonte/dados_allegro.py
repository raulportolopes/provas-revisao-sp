# Gera allegro_db.sql (MySQL/MariaDB). Uso: python3 dados_allegro.py saida.sql
import sys, random, datetime as dt
random.seed(1717)
HASH = '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK'  # ProvaB2026!
TS = '2026-02-01 08:00:00'
D = dt.date
def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)) and not isinstance(v, bool): return str(v)
    return "'" + str(v).replace("'", "''") + "'"
def ins(t, cols, rows):
    return f"INSERT INTO `{t}` (" + ', '.join(f'`{c}`' for c in cols) + ") VALUES\n" + ',\n'.join('(' + ', '.join(q(v) for v in r) + ')' for r in rows) + ';\n\n'

users = [(1, 'Beatriz Amaral', 'coordenacao.prova@allegro.com', 'coordenacao', 1),
         (2, 'Felipe Rangel', 'secretaria.prova@allegro.com', 'secretaria', 1),
         (3, 'Marta Ilha', 'professor.prova@allegro.com', 'professor', 1),
         (4, 'Davi Prates', 'professor2.prova@allegro.com', 'professor', 1),
         (5, 'Lúcia Ferraz', 'professor3.prova@allegro.com', 'professor', 1),
         (6, 'Renan Costa', 'inativo.prova@allegro.com', 'professor', 0)]
instruments = [(1, 'Violão'), (2, 'Piano'), (3, 'Canto'), (4, 'Violino'), (5, 'Guitarra'), (6, 'Teclado')]
rooms = [(1, 'Sala Villa-Lobos', 8), (2, 'Sala Chiquinha Gonzaga', 6), (3, 'Estúdio Tom Jobim', 4), (4, 'Auditório', 20)]
# id, code, instrument, teacher, room, level, weekday, start, end, capacity, fee, active
classes = [
 (1, 'VIO-BAS-SEG18', 1, 3, 1, 'basico', 1, '18:00', '19:30', 6, '180.00', 1),
 (2, 'VIO-INT-QUA18', 1, 3, 1, 'intermediario', 3, '18:00', '19:30', 6, '200.00', 1),
 (3, 'PIA-BAS-TER14', 2, 4, 3, 'basico', 2, '14:00', '15:00', 3, '260.00', 1),
 (4, 'PIA-AVA-QUI19', 2, 4, 3, 'avancado', 4, '19:00', '20:30', 2, '320.00', 1),
 (5, 'CAN-BAS-SAB09', 3, 5, 4, 'basico', 6, '09:00', '11:00', 15, '150.00', 1),
 (6, 'VLN-BAS-SEG19', 4, 5, 2, 'basico', 1, '19:00', '20:00', 4, '240.00', 1),
 (7, 'GUI-INT-SEX20', 5, 3, 2, 'intermediario', 5, '20:00', '21:30', 5, '210.00', 1),
 (8, 'TEC-BAS-QUA15', 6, 4, 2, 'basico', 3, '15:00', '16:00', 5, '190.00', 0),
 (9, 'CAN-INT-TER19', 3, 5, 1, 'intermediario', 2, '19:00', '20:30', 6, '190.00', 1),
]
fee = {c[0]: float(c[10]) for c in classes}
nomes = ['Alice Monteiro', 'Bernardo Lago', 'Carolina Vidal', 'Daniel Rezende', 'Elisa Moraes', 'Fábio Toledo', 'Gabriela Neves',
 'Heitor Campos', 'Isabela Duarte', 'João Pedro Salles', 'Karina Lopes', 'Lucas Andrade', 'Manuela Franco', 'Nicolas Barros',
 'Olívia Pacheco', 'Pedro Henrique Dias', 'Rafaela Couto', 'Samuel Teixeira', 'Tainá Ribeiro', 'Úrsula Gomes', 'Vinícius Prado',
 'Yasmin Carvalho', 'Arthur Medeiros', 'Beatriz Quaresma', 'Caio Fonseca', 'Débora Simões', 'Enzo Martins', 'Flávia Rocha',
 'Gustavo Amorim', 'Helena Castro', 'Igor Seabra', 'Joana Bittencourt']
nasc = [D(2014, 3, 2), D(1990, 7, 15), D(2009, 11, 30), D(1985, 1, 9), D(2011, 5, 21), D(1978, 9, 3), D(2008, 11, 20),
        D(2001, 2, 14), D(2013, 8, 8), D(1999, 12, 1), D(1995, 6, 30), D(2012, 4, 17), D(2003, 10, 10), D(2015, 1, 25),
        D(1988, 3, 3), D(2010, 7, 7), D(1992, 9, 19), D(2007, 11, 19), D(1975, 5, 5), D(1969, 8, 28), D(2006, 12, 24),
        D(2016, 2, 29), D(1998, 4, 4), D(2002, 6, 6), D(2011, 11, 11), D(1983, 1, 31), D(2012, 12, 12), D(1994, 10, 2),
        D(2000, 3, 15), D(2014, 9, 9), D(1997, 7, 27), D(2010, 1, 1)]
HOJE = D(2026, 11, 19)
def idade(n, ref=HOJE): return ref.year - n.year - ((ref.month, ref.day) < (n.month, n.day))
students = []
for i, (n, b) in enumerate(zip(nomes, nasc), 1):
    menor = idade(b) < 18
    tel = f'1598{random.randint(1000000, 9999999)}'
    gn = ('Resp. ' + n.split()[-1]) if False else None
    if menor:
        gn = random.choice(['Ana', 'Paulo', 'Cláudia', 'Roberto', 'Sílvia', 'Marcelo']) + ' ' + n.split()[-1]
    em = None if i in (14, 22) else n.lower().split()[0].translate(str.maketrans('áéíóúãõçü', 'aeiouaocu')) + f'{i}@email.com'
    students.append((i, n, b.isoformat(), em, tel, gn, f'1599{random.randint(1000000, 9999999)}' if menor else None, TS, TS))

# matrículas: (student, class, status, enrolled_at, waitlisted_at, cancelled_at)
E = []
def at(s, c, ini, canc=None): E.append([s, c, 'cancelada' if canc else 'ativa', ini, None, canc])
def wl(s, c, quando): E.append([s, c, 'espera', None, quando, None])
at(1, 1, D(2026, 2, 3)); at(2, 1, D(2026, 2, 3)); at(3, 1, D(2026, 3, 10)); at(4, 1, D(2026, 5, 4)); at(5, 1, D(2026, 8, 3))
at(6, 2, D(2026, 2, 4)); at(7, 2, D(2026, 2, 4)); at(8, 2, D(2026, 6, 1)); at(9, 2, D(2026, 9, 2))
at(10, 3, D(2026, 2, 3)); at(11, 3, D(2026, 3, 3)); at(12, 3, D(2026, 4, 7))
wl(13, 3, '2026-09-15 10:00:00'); wl(14, 3, '2026-10-02 16:30:00')
at(15, 4, D(2026, 2, 5)); at(16, 4, D(2026, 7, 2))
for s, m in zip(range(17, 25), [2, 2, 3, 3, 4, 6, 8, 10]): at(s, 5, D(2026, m, 7))
at(25, 6, D(2026, 2, 2)); at(26, 6, D(2026, 3, 2)); at(27, 6, D(2026, 5, 4)); at(28, 6, D(2026, 6, 1))
wl(3, 6, '2026-08-20 09:00:00')   # Carolina: já está na VIO-BAS-SEG18 (seg 18:00-19:30) -> conflito, é pulada na promoção
wl(29, 6, '2026-09-01 14:00:00')
at(30, 7, D(2026, 4, 3)); at(31, 7, D(2026, 4, 3)); at(32, 7, D(2026, 10, 2))
at(2, 9, D(2026, 2, 3)); at(18, 9, D(2026, 3, 3)); at(20, 9, D(2026, 5, 5)); at(26, 9, D(2026, 8, 4)); at(29, 9, D(2026, 9, 1))
at(13, 1, D(2026, 2, 3), canc=D(2026, 6, 20))    # cancelada, com uma mensalidade vencida não paga (dívida)
at(31, 4, D(2026, 2, 5), canc=D(2026, 4, 30))    # cancelada, tudo pago
at(19, 6, D(2026, 2, 2), canc=D(2026, 9, 15))
enrollments = []
for i, (s, c, st, ini, w, canc) in enumerate(E, 1):
    created = (ini.isoformat() + ' 09:00:00') if ini else w
    enrollments.append((i, s, c, st, ini.isoformat() if ini else None, w, canc.isoformat() if canc else None, created, created))

def multa(valor, venc, pago):
    dias = (pago - venc).days
    if dias <= 0: return round(valor, 2)
    return round(valor * (1 + 0.02 + 0.01 * dias / 30), 2)
invoices = []; iid = 0
NAOPAGAS = {(5, 11), (9, 10), (9, 11), (16, 11), (24, 11), (28, 10), (28, 11), (32, 11)}  # (aluno, mês) vencidas sem pagar
for (eid, s, c, st, ini, w, canc, *_x) in enrollments:
    if not ini: continue
    ini = D.fromisoformat(ini); canc_d = D.fromisoformat(canc) if canc else None
    m, y = ini.month, ini.year
    first = True
    while (y, m) <= (2026, 12):
        ref = D(y, m, 1); venc = D(y, m, 10)
        if first and ini > venc: venc = ini + dt.timedelta(days=5)
        first = False
        if canc_d and venc >= canc_d:
            break  # mensalidades em aberto a partir do cancelamento foram apagadas
        iid += 1
        pago = None; valor_pago = None
        devendo = (s, m) in NAOPAGAS or (canc_d and s == 13 and m == 6)
        if venc < HOJE and not devendo:
            atraso = random.choice([0, 0, 0, -3, -1, 2, 6]) if (s + m) % 4 else 0
            pago = venc + dt.timedelta(days=atraso)
            valor_pago = f'{multa(fee[c], venc, pago):.2f}'
        invoices.append((iid, eid, ref.isoformat(), venc.isoformat(), f'{fee[c]:.2f}', pago.isoformat() if pago else None, valor_pago, TS, TS))
        m += 1
        if m > 12: m, y = 1, y + 1

SCHEMA = """-- Escola de Música Allegro · banco da prova (Módulo B, revisão) · Raul Porto Lopes (Avaliador)
-- Importe num banco vazio chamado XX_modulo_b (utf8mb4). Senha de todos os usuários: ProvaB2026!
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `invoices`, `enrollments`, `school_classes`, `students`, `rooms`, `instruments`, `sessions`, `cache`, `cache_locks`, `password_reset_tokens`, `users`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('secretaria','professor','coordenacao') NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (`email` varchar(150) NOT NULL, `token` varchar(255) NOT NULL, `created_at` timestamp NULL DEFAULT NULL, PRIMARY KEY (`email`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL, `user_id` bigint unsigned DEFAULT NULL, `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text, `payload` longtext NOT NULL, `last_activity` int NOT NULL,
  PRIMARY KEY (`id`), KEY `sessions_user_id_index` (`user_id`), KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cache` (`key` varchar(255) NOT NULL, `value` mediumtext NOT NULL, `expiration` int NOT NULL, PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cache_locks` (`key` varchar(255) NOT NULL, `owner` varchar(255) NOT NULL, `expiration` int NOT NULL, PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `instruments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(40) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `instruments_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `capacity` tinyint unsigned NOT NULL COMMENT 'lugares na sala',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `rooms_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(11) NOT NULL COMMENT 'só dígitos',
  `guardian_name` varchar(100) DEFAULT NULL COMMENT 'obrigatório para menor de 18 anos',
  `guardian_phone` varchar(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `students_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `school_classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `instrument_id` bigint unsigned NOT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `level` enum('basico','intermediario','avancado') NOT NULL,
  `weekday` tinyint unsigned NOT NULL COMMENT '1 = segunda ... 6 = sábado',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `capacity` tinyint unsigned NOT NULL COMMENT 'vagas da turma',
  `monthly_fee` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `school_classes_code_unique` (`code`),
  KEY `school_classes_instrument_id_foreign` (`instrument_id`),
  KEY `school_classes_teacher_id_foreign` (`teacher_id`),
  KEY `school_classes_room_id_foreign` (`room_id`),
  CONSTRAINT `school_classes_instrument_id_foreign` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `school_classes_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `school_classes_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `school_class_id` bigint unsigned NOT NULL,
  `status` enum('ativa','espera','cancelada') NOT NULL,
  `enrolled_at` date DEFAULT NULL COMMENT 'dia em que virou ativa',
  `waitlisted_at` datetime DEFAULT NULL COMMENT 'quando entrou na lista de espera (define a posição)',
  `cancelled_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enrollments_student_id_foreign` (`student_id`),
  KEY `enrollments_school_class_id_foreign` (`school_class_id`),
  CONSTRAINT `enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enrollments_school_class_id_foreign` FOREIGN KEY (`school_class_id`) REFERENCES `school_classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint unsigned NOT NULL,
  `reference_month` date NOT NULL COMMENT 'sempre o dia 1 do mês de referência',
  `due_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_at` date DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL COMMENT 'valor pago, com multa e juros quando houver',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_enrollment_id_reference_month_unique` (`enrollment_id`,`reference_month`),
  CONSTRAINT `invoices_enrollment_id_foreign` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

"""
SQL = SCHEMA
SQL += ins('users', ['id', 'name', 'email', 'password', 'role', 'active', 'created_at', 'updated_at'], [(i, n, e, HASH, r, a, TS, TS) for i, n, e, r, a in users])
SQL += ins('instruments', ['id', 'name', 'created_at', 'updated_at'], [(i, n, TS, TS) for i, n in instruments])
SQL += ins('rooms', ['id', 'name', 'capacity', 'created_at', 'updated_at'], [(i, n, c, TS, TS) for i, n, c in rooms])
SQL += ins('students', ['id', 'name', 'birth_date', 'email', 'phone', 'guardian_name', 'guardian_phone', 'created_at', 'updated_at'], students)
SQL += ins('school_classes', ['id', 'code', 'instrument_id', 'teacher_id', 'room_id', 'level', 'weekday', 'start_time', 'end_time', 'capacity', 'monthly_fee', 'active', 'created_at', 'updated_at'],
           [c + (TS, TS) for c in classes])
SQL += ins('enrollments', ['id', 'student_id', 'school_class_id', 'status', 'enrolled_at', 'waitlisted_at', 'cancelled_at', 'created_at', 'updated_at'], enrollments)
SQL += ins('invoices', ['id', 'enrollment_id', 'reference_month', 'due_date', 'amount', 'paid_at', 'paid_amount', 'created_at', 'updated_at'], invoices)
open(sys.argv[1], 'w', encoding='utf-8').write(SQL)
print('ok', len(students), 'alunos', len(enrollments), 'matrículas', len(invoices), 'mensalidades')
