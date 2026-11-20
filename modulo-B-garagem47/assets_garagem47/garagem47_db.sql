-- Garagem 47 · banco da prova (Módulo B, revisão) · Raul Porto Lopes (Avaliador)
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

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `active`, `created_at`, `updated_at`) VALUES
(1, 'Helena Duarte', 'gerente.prova@garagem47.com', '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK', 'gerente', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(2, 'Otávio Lins', 'atendente.prova@garagem47.com', '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK', 'atendente', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(3, 'Carlos Menezes', 'mecanico.prova@garagem47.com', '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK', 'mecanico', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(4, 'Bruna Siqueira', 'mecanico2.prova@garagem47.com', '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK', 'mecanico', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(5, 'Jair Pontes', 'inativo.prova@garagem47.com', '$2y$12$76yVNtfAKg3ejZZUbMegYO51hSeMqdWc9wTDz/edXSjmlJjWjKsUK', 'mecanico', 0, '2026-10-01 08:00:00', '2026-10-01 08:00:00');

INSERT INTO `customers` (`id`, `name`, `cpf`, `phone`, `email`, `created_at`, `updated_at`) VALUES
(1, 'Ana Beatriz Rocha', '52601815906', '15996903000', 'ana.1@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(2, 'Marcos Vinícius Teles', '19834441703', '15992048998', 'marcos.2@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(3, 'Juliana Prado', '26647378219', '15998217327', 'juliana.3@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(4, 'Ricardo Okamoto', '12892327687', '15998611334', NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(5, 'Fernanda Albuquerque', '85252464928', '15996762466', 'fernanda.5@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(6, 'Paulo Henrique Sá', '10433218100', '15995318923', 'paulo.6@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(7, 'Larissa Moura', '15615880082', '15999597389', 'larissa.7@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(8, 'Tiago Brandão', '80784863164', '15997485351', 'tiago.8@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(9, 'Cecília Nogueira', '77447161160', '15997583637', NULL, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(10, 'Rogério Antunes', '14772512942', '15991686334', 'rogerio.10@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(11, 'Patrícia Quintela', '45333147833', '15998021811', 'patricia.11@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(12, 'Eduarda Fontes', '40708537740', '15991396946', 'eduarda.12@email.com', '2026-10-01 08:00:00', '2026-10-01 08:00:00');

INSERT INTO `vehicles` (`id`, `customer_id`, `plate`, `brand`, `model`, `year`, `created_at`, `updated_at`) VALUES
(1, 1, 'FJK2B31', 'Fiat', 'Argo', 2021, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(2, 1, 'EOP4471', 'Volkswagen', 'Gol', 2014, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(3, 2, 'GHT8C12', 'Chevrolet', 'Onix', 2022, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(4, 3, 'BRA2E19', 'Hyundai', 'HB20', 2020, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(5, 4, 'DKQ9031', 'Ford', 'Ka', 2016, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(6, 5, 'RTY5F88', 'Toyota', 'Corolla', 2023, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(7, 6, 'CVB1H04', 'Renault', 'Kwid', 2022, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(8, 7, 'MNO3J56', 'Jeep', 'Renegade', 2021, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(9, 8, 'LPA6K77', 'Honda', 'Civic', 2019, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(10, 8, 'HZX2L90', 'Honda', 'Fit', 2015, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(11, 9, 'QWE7M13', 'Nissan', 'Kicks', 2024, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(12, 10, 'ASD4N45', 'Fiat', 'Strada', 2023, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(13, 11, 'ZXC8P21', 'Volkswagen', 'T-Cross', 2022, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(14, 3, 'POI1Q66', 'Peugeot', '208', 2021, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(15, 12, 'UYT3R02', 'Chevrolet', 'Tracker', 2024, '2026-10-01 08:00:00', '2026-10-01 08:00:00');

INSERT INTO `services` (`id`, `name`, `price`, `active`, `created_at`, `updated_at`) VALUES
(1, 'Troca de óleo e filtro', '89.90', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(2, 'Alinhamento', '120.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(3, 'Balanceamento (4 rodas)', '90.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(4, 'Revisão do sistema de freios', '250.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(5, 'Troca de pastilhas de freio', '180.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(6, 'Diagnóstico eletrônico', '150.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(7, 'Higienização do ar-condicionado', '130.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(8, 'Troca da correia dentada', '420.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(9, 'Revisão da suspensão dianteira', '380.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(10, 'Lavagem simples', '40.00', 0, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(11, 'Troca de lâmpadas', '35.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00');

INSERT INTO `parts` (`id`, `sku`, `name`, `price`, `stock`, `created_at`, `updated_at`) VALUES
(1, 'OLE-5W30', 'Óleo 5W30 sintético (litro)', '42.50', 40, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(2, 'FIL-OLE01', 'Filtro de óleo', '28.90', 12, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(3, 'PAS-DIA01', 'Jogo de pastilhas dianteiras', '159.00', 6, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(4, 'DIS-FRE02', 'Disco de freio ventilado', '210.00', 4, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(5, 'COR-DEN01', 'Kit correia dentada', '389.00', 2, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(6, 'AMO-DIA01', 'Amortecedor dianteiro', '465.00', 4, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(7, 'LAM-H4', 'Lâmpada H4', '24.90', 20, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(8, 'FIL-AR01', 'Filtro de ar do motor', '39.90', 8, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(9, 'FIL-CAB01', 'Filtro de cabine', '45.00', 0, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(10, 'FLU-FRE01', 'Fluido de freio DOT4 (500 ml)', '32.00', 10, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(11, 'BAT-60AH', 'Bateria 60 Ah', '599.00', 1, '2026-10-01 08:00:00', '2026-10-01 08:00:00'),
(12, 'PAL-PAR01', 'Palheta do para-brisa (par)', '69.90', 9, '2026-10-01 08:00:00', '2026-10-01 08:00:00');

INSERT INTO `work_orders` (`id`, `code`, `vehicle_id`, `mechanic_id`, `created_by`, `status`, `km`, `complaint`, `opened_at`, `due_date`, `finished_at`, `delivered_at`, `cancel_reason`, `created_at`, `updated_at`) VALUES
(1, 'OS-2026-0001', 1, 3, 2, 'entregue', 41230, 'Revisão dos 40 mil km.', '2026-10-01 08:12:00', '2026-10-02', '2026-10-02 16:40:00', '2026-10-03 09:10:00', NULL, '2026-10-01 08:12:00', '2026-10-03 09:10:00'),
(2, 'OS-2026-0002', 3, 4, 2, 'entregue', 18990, 'Barulho ao frear.', '2026-10-05 10:00:00', '2026-10-07', '2026-10-06 15:00:00', '2026-10-06 17:30:00', NULL, '2026-10-05 10:00:00', '2026-10-06 17:30:00'),
(3, 'OS-2026-0003', 5, 3, 1, 'cancelada', 132400, 'Cliente desistiu do orçamento da suspensão.', '2026-10-08 09:30:00', '2026-10-12', NULL, NULL, 'Cliente desistiu após o orçamento.', '2026-10-08 09:30:00', '2026-10-08 09:30:00'),
(4, 'OS-2026-0004', 6, 4, 2, 'concluida', 9800, 'Primeira revisão.', '2026-11-03 08:05:00', '2026-11-04', '2026-11-04 11:20:00', NULL, NULL, '2026-11-03 08:05:00', '2026-11-04 11:20:00'),
(5, 'OS-2026-0005', 8, 3, 2, 'em_execucao', 52110, 'Luz da injeção acesa.', '2026-11-10 13:40:00', '2026-11-12', NULL, NULL, NULL, '2026-11-10 13:40:00', '2026-11-10 13:40:00'),
(6, 'OS-2026-0006', 9, 4, 1, 'aguardando_peca', 87500, 'Troca da correia dentada.', '2026-11-11 08:30:00', '2026-11-25', NULL, NULL, NULL, '2026-11-11 08:30:00', '2026-11-11 08:30:00'),
(7, 'OS-2026-0007', 11, NULL, 2, 'aberta', 15020, 'Ar-condicionado com cheiro.', '2026-11-16 09:00:00', '2026-11-18', NULL, NULL, NULL, '2026-11-16 09:00:00', '2026-11-16 09:00:00'),
(8, 'OS-2026-0008', 12, 3, 2, 'aberta', 30400, 'Alinhamento e balanceamento.', '2026-11-17 14:20:00', '2026-11-30', NULL, NULL, NULL, '2026-11-17 14:20:00', '2026-11-17 14:20:00'),
(9, 'OS-2026-0009', 2, NULL, 2, 'aberta', 160300, 'Lâmpada do farol queimada.', '2026-11-18 10:10:00', '2026-11-19', NULL, NULL, NULL, '2026-11-18 10:10:00', '2026-11-18 10:10:00'),
(10, 'OS-2026-0010', 13, 4, 1, 'em_execucao', 44100, 'Revisão de freios e fluido.', '2026-11-17 08:00:00', '2026-11-26', NULL, NULL, NULL, '2026-11-17 08:00:00', '2026-11-17 08:00:00'),
(11, 'OS-2026-0011', 4, 3, 2, 'entregue', 60200, 'Troca de óleo.', '2026-11-02 08:00:00', '2026-11-02', '2026-11-02 10:00:00', '2026-11-02 12:00:00', NULL, '2026-11-02 08:00:00', '2026-11-02 12:00:00'),
(12, 'OS-2026-0012', 7, 4, 2, 'concluida', 21000, 'Pastilhas gastas.', '2026-11-12 09:00:00', '2026-11-13', '2026-11-13 16:00:00', NULL, NULL, '2026-11-12 09:00:00', '2026-11-13 16:00:00'),
(13, 'OS-2026-0013', 10, 3, 2, 'aguardando_peca', 98760, 'Bateria descarregando.', '2026-11-13 11:00:00', '2026-11-14', NULL, NULL, NULL, '2026-11-13 11:00:00', '2026-11-13 11:00:00'),
(14, 'OS-2026-0014', 14, NULL, 1, 'aberta', 33000, 'Palhetas e filtro de cabine.', '2026-11-19 08:00:00', '2026-11-21', NULL, NULL, NULL, '2026-11-19 08:00:00', '2026-11-19 08:00:00'),
(15, 'OS-2026-0015', 1, 4, 2, 'cancelada', 43010, 'Orçamento de amortecedores recusado.', '2026-11-05 15:00:00', '2026-11-07', NULL, NULL, 'Valor acima do esperado pelo cliente.', '2026-11-05 15:00:00', '2026-11-05 15:00:00'),
(16, 'OS-2026-0016', 3, 3, 2, 'em_execucao', 19500, 'Vibração no volante.', '2026-11-18 08:40:00', '2026-11-18', NULL, NULL, NULL, '2026-11-18 08:40:00', '2026-11-18 08:40:00');

INSERT INTO `service_work_order` (`work_order_id`, `service_id`, `price`) VALUES
(1, 1, '89.90'),
(1, 2, '120.00'),
(1, 3, '90.00'),
(2, 4, '250.00'),
(2, 5, '180.00'),
(3, 9, '380.00'),
(4, 1, '89.90'),
(4, 7, '130.00'),
(5, 6, '150.00'),
(6, 8, '420.00'),
(6, 1, '89.90'),
(7, 7, '130.00'),
(8, 2, '120.00'),
(8, 3, '90.00'),
(9, 11, '35.00'),
(10, 4, '250.00'),
(11, 1, '89.90'),
(12, 5, '180.00'),
(13, 6, '150.00'),
(14, 7, '130.00'),
(14, 11, '35.00'),
(15, 9, '380.00'),
(16, 2, '120.00'),
(16, 3, '90.00');

INSERT INTO `part_work_order` (`id`, `work_order_id`, `part_id`, `quantity`, `unit_price`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4, '42.50', '2026-10-01 08:12:00', '2026-10-01 08:12:00'),
(2, 1, 2, 1, '28.90', '2026-10-01 08:12:00', '2026-10-01 08:12:00'),
(3, 2, 3, 1, '159.00', '2026-10-05 10:00:00', '2026-10-05 10:00:00'),
(4, 2, 10, 1, '32.00', '2026-10-05 10:00:00', '2026-10-05 10:00:00'),
(5, 4, 1, 4, '42.50', '2026-11-03 08:05:00', '2026-11-03 08:05:00'),
(6, 4, 2, 1, '28.90', '2026-11-03 08:05:00', '2026-11-03 08:05:00'),
(7, 6, 1, 4, '42.50', '2026-11-11 08:30:00', '2026-11-11 08:30:00'),
(8, 10, 10, 2, '32.00', '2026-11-17 08:00:00', '2026-11-17 08:00:00'),
(9, 11, 1, 4, '42.50', '2026-11-02 08:00:00', '2026-11-02 08:00:00'),
(10, 11, 2, 1, '28.90', '2026-11-02 08:00:00', '2026-11-02 08:00:00'),
(11, 12, 3, 1, '159.00', '2026-11-12 09:00:00', '2026-11-12 09:00:00');

INSERT INTO `work_order_status_logs` (`id`, `work_order_id`, `user_id`, `from_status`, `to_status`, `note`, `created_at`) VALUES
(1, 1, 2, NULL, 'aberta', NULL, '2026-10-01 08:12:00'),
(2, 1, 3, 'aberta', 'em_execucao', NULL, '2026-10-01 08:12:00'),
(3, 1, 3, 'em_execucao', 'concluida', NULL, '2026-10-02 16:40:00'),
(4, 1, 2, 'concluida', 'entregue', NULL, '2026-10-03 09:10:00'),
(5, 2, 2, NULL, 'aberta', NULL, '2026-10-05 10:00:00'),
(6, 2, 4, 'aberta', 'em_execucao', NULL, '2026-10-05 10:00:00'),
(7, 2, 4, 'em_execucao', 'concluida', NULL, '2026-10-06 15:00:00'),
(8, 2, 2, 'concluida', 'entregue', NULL, '2026-10-06 17:30:00'),
(9, 3, 1, NULL, 'aberta', NULL, '2026-10-08 09:30:00'),
(10, 3, 1, 'aberta', 'cancelada', 'Cliente desistiu após o orçamento.', '2026-10-08 09:30:00'),
(11, 4, 2, NULL, 'aberta', NULL, '2026-11-03 08:05:00'),
(12, 4, 4, 'aberta', 'em_execucao', NULL, '2026-11-03 08:05:00'),
(13, 4, 4, 'em_execucao', 'concluida', NULL, '2026-11-04 11:20:00'),
(14, 5, 2, NULL, 'aberta', NULL, '2026-11-10 13:40:00'),
(15, 5, 3, 'aberta', 'em_execucao', NULL, '2026-11-10 13:40:00'),
(16, 6, 1, NULL, 'aberta', NULL, '2026-11-11 08:30:00'),
(17, 6, 4, 'aberta', 'em_execucao', NULL, '2026-11-11 08:30:00'),
(18, 6, 4, 'em_execucao', 'aguardando_peca', 'Peça encomendada ao fornecedor.', '2026-11-11 08:30:00'),
(19, 7, 2, NULL, 'aberta', NULL, '2026-11-16 09:00:00'),
(20, 8, 2, NULL, 'aberta', NULL, '2026-11-17 14:20:00'),
(21, 9, 2, NULL, 'aberta', NULL, '2026-11-18 10:10:00'),
(22, 10, 1, NULL, 'aberta', NULL, '2026-11-17 08:00:00'),
(23, 10, 4, 'aberta', 'em_execucao', NULL, '2026-11-17 08:00:00'),
(24, 11, 2, NULL, 'aberta', NULL, '2026-11-02 08:00:00'),
(25, 11, 3, 'aberta', 'em_execucao', NULL, '2026-11-02 08:00:00'),
(26, 11, 3, 'em_execucao', 'concluida', NULL, '2026-11-02 10:00:00'),
(27, 11, 2, 'concluida', 'entregue', NULL, '2026-11-02 12:00:00'),
(28, 12, 2, NULL, 'aberta', NULL, '2026-11-12 09:00:00'),
(29, 12, 4, 'aberta', 'em_execucao', NULL, '2026-11-12 09:00:00'),
(30, 12, 4, 'em_execucao', 'concluida', NULL, '2026-11-13 16:00:00'),
(31, 13, 2, NULL, 'aberta', NULL, '2026-11-13 11:00:00'),
(32, 13, 3, 'aberta', 'em_execucao', NULL, '2026-11-13 11:00:00'),
(33, 13, 3, 'em_execucao', 'aguardando_peca', 'Peça encomendada ao fornecedor.', '2026-11-13 11:00:00'),
(34, 14, 1, NULL, 'aberta', NULL, '2026-11-19 08:00:00'),
(35, 15, 2, NULL, 'aberta', NULL, '2026-11-05 15:00:00'),
(36, 15, 2, 'aberta', 'cancelada', 'Valor acima do esperado pelo cliente.', '2026-11-05 15:00:00'),
(37, 16, 2, NULL, 'aberta', NULL, '2026-11-18 08:40:00'),
(38, 16, 3, 'aberta', 'em_execucao', NULL, '2026-11-18 08:40:00');
