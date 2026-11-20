# Gera o banco do Copa Code: copacode.sql (MySQL, entregue à equipe) e copacode-sqlite.sql (só para teste aqui).
import sys, subprocess, random
OUT = sys.argv[1]   # pasta banco/
random.seed(17)
SCHOOLS = [
 (1, 'ETEC Fernando Prestes', 'Sorocaba', 'FPR', '#E11D48'),
 (2, 'SENAI Gaspar Ricardo Júnior', 'Sorocaba', 'GRJ', '#2563EB'),
 (3, 'EE Júlio Prestes de Albuquerque', 'Votorantim', 'JPA', '#16A34A'),
 (4, 'Colégio Técnico Itu', 'Itu', 'CTI', '#F59E0B'),
 (5, 'ETEC Rubens de Faria', 'Sorocaba', 'RFS', '#7C3AED'),
 (6, 'SESI Salto', 'Salto', 'SSA', '#0891B2'),
]
# (id, school, name, tag, status, checkin)
TEAMS = [
 (1, 1, 'Fênix Rubra', 'FNX', 'confirmed', '2026-11-18 18:02:00'),
 (2, 2, 'Bits Voadores', 'BITS', 'confirmed', '2026-11-18 18:05:00'),
 (3, 3, 'Lobos do Cerrado', 'LOBO', 'confirmed', '2026-11-18 18:11:00'),
 (4, 4, 'Trovão Itu', 'TRV', 'confirmed', '2026-11-18 18:14:00'),
 (5, 5, 'Código Roxo', 'CRX', 'confirmed', '2026-11-18 18:20:00'),
 (6, 6, 'Maré Alta', 'MARE', 'confirmed', '2026-11-18 18:26:00'),
 (7, 2, 'Kernel Panic', 'KP', 'confirmed', '2026-11-18 18:31:00'),
 (8, 1, 'Sorocrew', 'SRC', 'registered', None),
 (9, 3, 'Ipês Gamers', 'IPE', 'registered', None),
]
NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Kauã', 'Larissa', 'Mateus', 'Nicole', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vitória', 'Yuri', 'Beatriz', 'Caio', 'Débora', 'Enzo', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Júlia']
SOBRE = ['Almeida', 'Barbosa', 'Campos', 'Duarte', 'Esteves', 'Ferraz', 'Gomes', 'Haddad', 'Ikeda', 'Junqueira', 'Lima', 'Moraes', 'Nogueira', 'Oliveira', 'Prado', 'Queiroz', 'Rocha', 'Santos', 'Teixeira', 'Vieira']
PRE = ['Zap', 'Neo', 'Kai', 'Volt', 'Pixel', 'Nova', 'Rex', 'Lynx', 'Orbit', 'Echo', 'Byte', 'Flux', 'Hex', 'Jinx', 'Kira', 'Luma', 'Mako', 'Nyx', 'Onyx', 'Pulse', 'Quark', 'Rune', 'Sable', 'Tango', 'Umbra', 'Vex', 'Wisp', 'Xeno', 'Yeti', 'Zed']
players = []; pid = 0; usados = set()
for t in TEAMS:
    n = 6 if t[0] in (1, 4, 7) else 5
    for k in range(n):
        pid += 1
        while True:
            nick = random.choice(PRE) + str(random.randint(1, 99))
            if nick.lower() not in usados: usados.add(nick.lower()); break
        nome = f'{random.choice(NOMES)} {random.choice(SOBRE)}'
        ano = random.choice([2008, 2009, 2010, 2011])
        nasc = f'{ano}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}'
        role = 'captain' if k == 0 else ('substitute' if k == 5 else 'player')
        players.append((pid, t[0], nick, nome, nasc, role))
h = subprocess.check_output(['php', '-r', 'echo password_hash("Copa@2026", PASSWORD_BCRYPT);']).decode()

def q(v): return 'NULL' if v is None else ("'" + str(v).replace("'", "''") + "'")

def schema(sqlite):
    ai = 'INTEGER PRIMARY KEY AUTOINCREMENT' if sqlite else 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY'
    fk = 'INTEGER' if sqlite else 'BIGINT UNSIGNED'
    eng = '' if sqlite else ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    ts = 'DATETIME NULL'
    s = []
    if not sqlite:
        s += ['-- Copa Code – banco pronto (MySQL 8 / MariaDB). Importe no phpMyAdmin ou: mysql -u root < copacode.sql',
              'CREATE DATABASE IF NOT EXISTS copacode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', 'USE copacode;', 'SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS = 0;']
    for t in ['api_tokens', 'matches', 'players', 'teams', 'schools', 'organizers']:
        s.append(f'DROP TABLE IF EXISTS {t};')
    if not sqlite: s.append('SET FOREIGN_KEY_CHECKS = 1;')
    s.append(f'''CREATE TABLE schools (
  id {ai},
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  acronym VARCHAR(4) NOT NULL UNIQUE,
  color CHAR(7) NOT NULL,
  created_at {ts}, updated_at {ts}
){eng};''')
    s.append(f'''CREATE TABLE teams (
  id {ai},
  school_id {fk} NOT NULL,
  name VARCHAR(40) NOT NULL UNIQUE,
  tag VARCHAR(4) NOT NULL UNIQUE,
  status VARCHAR(12) NOT NULL DEFAULT 'registered',
  checked_in_at {ts},
  seed SMALLINT NULL,
  created_at {ts}, updated_at {ts},
  FOREIGN KEY (school_id) REFERENCES schools(id)
){eng};''')
    s.append(f'''CREATE TABLE players (
  id {ai},
  team_id {fk} NOT NULL,
  nickname VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(80) NOT NULL,
  birth_date DATE NOT NULL,
  role VARCHAR(12) NOT NULL,
  created_at {ts}, updated_at {ts},
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
){eng};''')
    s.append(f'''CREATE TABLE matches (
  id {ai},
  stage VARCHAR(12) NOT NULL,
  position SMALLINT NOT NULL,
  team_a_id {fk} NULL,
  team_b_id {fk} NULL,
  score_a SMALLINT NULL,
  score_b SMALLINT NULL,
  winner_id {fk} NULL,
  starts_at DATETIME NOT NULL,
  next_match_id {fk} NULL,
  next_slot CHAR(1) NULL,
  created_at {ts}, updated_at {ts},
  FOREIGN KEY (team_a_id) REFERENCES teams(id),
  FOREIGN KEY (team_b_id) REFERENCES teams(id),
  FOREIGN KEY (winner_id) REFERENCES teams(id),
  FOREIGN KEY (next_match_id) REFERENCES matches(id)
){eng};''')
    s.append(f'''CREATE TABLE organizers (
  id {ai},
  username VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at {ts}, updated_at {ts}
){eng};''')
    s.append(f'''CREATE TABLE api_tokens (
  id {ai},
  organizer_id {fk} NOT NULL,
  token CHAR(40) NOT NULL UNIQUE,
  created_at {ts},
  FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
){eng};''')
    now = "'2026-11-20 08:00:00'"
    s.append('INSERT INTO schools (id, name, city, acronym, color, created_at) VALUES\n' + ',\n'.join(f'({a}, {q(b)}, {q(c)}, {q(d)}, {q(e)}, {now})' for a, b, c, d, e in SCHOOLS) + ';')
    s.append('INSERT INTO teams (id, school_id, name, tag, status, checked_in_at, created_at) VALUES\n' + ',\n'.join(f'({a}, {b}, {q(c)}, {q(d)}, {q(e)}, {q(f)}, {now})' for a, b, c, d, e, f in TEAMS) + ';')
    s.append('INSERT INTO players (id, team_id, nickname, full_name, birth_date, role, created_at) VALUES\n' + ',\n'.join(f'({a}, {b}, {q(c)}, {q(d)}, {q(e)}, {q(f)}, {now})' for a, b, c, d, e, f in players) + ';')
    s.append(f"INSERT INTO organizers (id, username, name, password, created_at) VALUES (1, 'org', 'Coordenação da Copa', {q(h)}, {now});")
    return '\n\n'.join(s) + '\n'

open(f'{OUT}/copacode.sql', 'w').write(schema(False))
open(f'{OUT}/copacode-sqlite.sql', 'w').write(schema(True))
print(len(players), 'jogadores')
