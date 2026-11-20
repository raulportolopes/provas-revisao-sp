-- Copa Code – banco pronto (MySQL 8 / MariaDB). Importe no phpMyAdmin ou: mysql -u root < copacode.sql

CREATE DATABASE IF NOT EXISTS copacode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE copacode;

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS api_tokens;

DROP TABLE IF EXISTS matches;

DROP TABLE IF EXISTS players;

DROP TABLE IF EXISTS teams;

DROP TABLE IF EXISTS schools;

DROP TABLE IF EXISTS organizers;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE schools (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  acronym VARCHAR(4) NOT NULL UNIQUE,
  color CHAR(7) NOT NULL,
  created_at DATETIME NULL, updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(40) NOT NULL UNIQUE,
  tag VARCHAR(4) NOT NULL UNIQUE,
  status VARCHAR(12) NOT NULL DEFAULT 'registered',
  checked_in_at DATETIME NULL,
  seed SMALLINT NULL,
  created_at DATETIME NULL, updated_at DATETIME NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE players (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  nickname VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(80) NOT NULL,
  birth_date DATE NOT NULL,
  role VARCHAR(12) NOT NULL,
  created_at DATETIME NULL, updated_at DATETIME NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE matches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stage VARCHAR(12) NOT NULL,
  position SMALLINT NOT NULL,
  team_a_id BIGINT UNSIGNED NULL,
  team_b_id BIGINT UNSIGNED NULL,
  score_a SMALLINT NULL,
  score_b SMALLINT NULL,
  winner_id BIGINT UNSIGNED NULL,
  starts_at DATETIME NOT NULL,
  next_match_id BIGINT UNSIGNED NULL,
  next_slot CHAR(1) NULL,
  created_at DATETIME NULL, updated_at DATETIME NULL,
  FOREIGN KEY (team_a_id) REFERENCES teams(id),
  FOREIGN KEY (team_b_id) REFERENCES teams(id),
  FOREIGN KEY (winner_id) REFERENCES teams(id),
  FOREIGN KEY (next_match_id) REFERENCES matches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organizers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NULL, updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  organizer_id BIGINT UNSIGNED NOT NULL,
  token CHAR(40) NOT NULL UNIQUE,
  created_at DATETIME NULL,
  FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schools (id, name, city, acronym, color, created_at) VALUES
(1, 'ETEC Fernando Prestes', 'Sorocaba', 'FPR', '#E11D48', '2026-11-20 08:00:00'),
(2, 'SENAI Gaspar Ricardo Júnior', 'Sorocaba', 'GRJ', '#2563EB', '2026-11-20 08:00:00'),
(3, 'EE Júlio Prestes de Albuquerque', 'Votorantim', 'JPA', '#16A34A', '2026-11-20 08:00:00'),
(4, 'Colégio Técnico Itu', 'Itu', 'CTI', '#F59E0B', '2026-11-20 08:00:00'),
(5, 'ETEC Rubens de Faria', 'Sorocaba', 'RFS', '#7C3AED', '2026-11-20 08:00:00'),
(6, 'SESI Salto', 'Salto', 'SSA', '#0891B2', '2026-11-20 08:00:00');

INSERT INTO teams (id, school_id, name, tag, status, checked_in_at, created_at) VALUES
(1, 1, 'Fênix Rubra', 'FNX', 'confirmed', '2026-11-18 18:02:00', '2026-11-20 08:00:00'),
(2, 2, 'Bits Voadores', 'BITS', 'confirmed', '2026-11-18 18:05:00', '2026-11-20 08:00:00'),
(3, 3, 'Lobos do Cerrado', 'LOBO', 'confirmed', '2026-11-18 18:11:00', '2026-11-20 08:00:00'),
(4, 4, 'Trovão Itu', 'TRV', 'confirmed', '2026-11-18 18:14:00', '2026-11-20 08:00:00'),
(5, 5, 'Código Roxo', 'CRX', 'confirmed', '2026-11-18 18:20:00', '2026-11-20 08:00:00'),
(6, 6, 'Maré Alta', 'MARE', 'confirmed', '2026-11-18 18:26:00', '2026-11-20 08:00:00'),
(7, 2, 'Kernel Panic', 'KP', 'confirmed', '2026-11-18 18:31:00', '2026-11-20 08:00:00'),
(8, 1, 'Sorocrew', 'SRC', 'registered', NULL, '2026-11-20 08:00:00'),
(9, 3, 'Ipês Gamers', 'IPE', 'registered', NULL, '2026-11-20 08:00:00');

INSERT INTO players (id, team_id, nickname, full_name, birth_date, role, created_at) VALUES
(1, 1, 'Mako54', 'Fernanda Junqueira', '2010-05-06', 'captain', '2026-11-20 08:00:00'),
(2, 1, 'Umbra91', 'Caio Santos', '2010-02-01', 'player', '2026-11-20 08:00:00'),
(3, 1, 'Lynx50', 'Gustavo Oliveira', '2010-09-26', 'player', '2026-11-20 08:00:00'),
(4, 1, 'Byte82', 'Helena Nogueira', '2009-09-02', 'player', '2026-11-20 08:00:00'),
(5, 1, 'Pixel26', 'Elisa Santos', '2009-06-18', 'player', '2026-11-20 08:00:00'),
(6, 1, 'Volt92', 'Yuri Campos', '2010-07-03', 'substitute', '2026-11-20 08:00:00'),
(7, 2, 'Mako61', 'Yuri Vieira', '2009-11-26', 'captain', '2026-11-20 08:00:00'),
(8, 2, 'Jinx65', 'Júlia Lima', '2008-07-12', 'player', '2026-11-20 08:00:00'),
(9, 2, 'Onyx7', 'Igor Moraes', '2008-08-12', 'player', '2026-11-20 08:00:00'),
(10, 2, 'Onyx1', 'Helena Nogueira', '2009-02-18', 'player', '2026-11-20 08:00:00'),
(11, 2, 'Rex32', 'Rafael Moraes', '2008-05-03', 'player', '2026-11-20 08:00:00'),
(12, 3, 'Vex36', 'Gabriela Vieira', '2009-05-22', 'captain', '2026-11-20 08:00:00'),
(13, 3, 'Echo45', 'Kauã Ferraz', '2010-02-19', 'player', '2026-11-20 08:00:00'),
(14, 3, 'Onyx35', 'Kauã Almeida', '2008-06-01', 'player', '2026-11-20 08:00:00'),
(15, 3, 'Kira96', 'Isabela Queiroz', '2008-12-07', 'player', '2026-11-20 08:00:00'),
(16, 3, 'Echo34', 'Carla Queiroz', '2008-10-19', 'player', '2026-11-20 08:00:00'),
(17, 4, 'Mako88', 'Elisa Nogueira', '2011-12-19', 'captain', '2026-11-20 08:00:00'),
(18, 4, 'Wisp51', 'Felipe Gomes', '2010-03-22', 'player', '2026-11-20 08:00:00'),
(19, 4, 'Volt28', 'Bruno Santos', '2010-06-26', 'player', '2026-11-20 08:00:00'),
(20, 4, 'Byte7', 'Felipe Oliveira', '2008-12-25', 'player', '2026-11-20 08:00:00'),
(21, 4, 'Echo33', 'Beatriz Nogueira', '2011-02-18', 'player', '2026-11-20 08:00:00'),
(22, 4, 'Kai70', 'Yuri Haddad', '2009-09-09', 'substitute', '2026-11-20 08:00:00'),
(23, 5, 'Onyx21', 'Fernanda Junqueira', '2008-12-16', 'captain', '2026-11-20 08:00:00'),
(24, 5, 'Onyx51', 'Gustavo Queiroz', '2009-09-14', 'player', '2026-11-20 08:00:00'),
(25, 5, 'Mako81', 'Otávio Campos', '2011-04-08', 'player', '2026-11-20 08:00:00'),
(26, 5, 'Luma41', 'Gustavo Gomes', '2010-10-01', 'player', '2026-11-20 08:00:00'),
(27, 5, 'Tango74', 'Thiago Rocha', '2011-01-27', 'player', '2026-11-20 08:00:00'),
(28, 6, 'Byte75', 'Felipe Santos', '2009-10-11', 'captain', '2026-11-20 08:00:00'),
(29, 6, 'Flux23', 'Enzo Gomes', '2010-07-12', 'player', '2026-11-20 08:00:00'),
(30, 6, 'Kira76', 'Carla Rocha', '2008-09-01', 'player', '2026-11-20 08:00:00'),
(31, 6, 'Rex74', 'Igor Santos', '2009-08-15', 'player', '2026-11-20 08:00:00'),
(32, 6, 'Kira65', 'Elisa Santos', '2011-08-01', 'player', '2026-11-20 08:00:00'),
(33, 7, 'Nova2', 'Gustavo Prado', '2010-06-07', 'captain', '2026-11-20 08:00:00'),
(34, 7, 'Neo35', 'Diego Rocha', '2008-01-04', 'player', '2026-11-20 08:00:00'),
(35, 7, 'Luma91', 'Igor Junqueira', '2009-02-25', 'player', '2026-11-20 08:00:00'),
(36, 7, 'Zed4', 'Otávio Santos', '2009-11-01', 'player', '2026-11-20 08:00:00'),
(37, 7, 'Xeno52', 'Fernanda Duarte', '2011-01-24', 'player', '2026-11-20 08:00:00'),
(38, 7, 'Nyx8', 'Gabriela Santos', '2010-05-12', 'substitute', '2026-11-20 08:00:00'),
(39, 8, 'Flux70', 'Thiago Oliveira', '2011-01-17', 'captain', '2026-11-20 08:00:00'),
(40, 8, 'Umbra44', 'Carla Barbosa', '2010-06-11', 'player', '2026-11-20 08:00:00'),
(41, 8, 'Volt43', 'Elisa Santos', '2009-08-27', 'player', '2026-11-20 08:00:00'),
(42, 8, 'Echo57', 'Diego Ikeda', '2009-02-22', 'player', '2026-11-20 08:00:00'),
(43, 8, 'Jinx40', 'Beatriz Gomes', '2011-06-05', 'player', '2026-11-20 08:00:00'),
(44, 9, 'Rex65', 'Fernanda Teixeira', '2009-05-03', 'captain', '2026-11-20 08:00:00'),
(45, 9, 'Jinx57', 'Rafael Nogueira', '2009-11-18', 'player', '2026-11-20 08:00:00'),
(46, 9, 'Pixel22', 'Thiago Santos', '2010-08-26', 'player', '2026-11-20 08:00:00'),
(47, 9, 'Xeno37', 'Júlia Oliveira', '2008-10-08', 'player', '2026-11-20 08:00:00'),
(48, 9, 'Nova92', 'Elisa Haddad', '2011-09-11', 'player', '2026-11-20 08:00:00');

INSERT INTO organizers (id, username, name, password, created_at) VALUES (1, 'org', 'Coordenação da Copa', '$2y$10$MvrhlJXxuzS0dodSRUMixepN/pVTDiB71Yzige5rZHHfj0XjQFsxC', '2026-11-20 08:00:00');
