-- Clean Dashboard Database Schema
-- This file contains the corrected schema for the dashboard application

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS dashboard;
USE dashboard;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS `cl_data_raw`;
DROP TABLE IF EXISTS `dv_data_raw`;
DROP TABLE IF EXISTS `pd_data_raw`;
DROP TABLE IF EXISTS `project_users`;
DROP TABLE IF EXISTS `project_domains`;
DROP TABLE IF EXISTS `tb_dev`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `domains`;

-- Create user_roles table
CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create domains table
CREATE TABLE `domains` (
  `id` int NOT NULL AUTO_INCREMENT,
  `short_code` varchar(10) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_code` (`short_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_picture` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create projects table
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_name` varchar(100) NOT NULL,
  `description` text,
  `status` enum('active','completed','on_hold','cancelled') DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `start_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create project_domains junction table
CREATE TABLE `project_domains` (
  `project_id` int NOT NULL,
  `domain_id` int NOT NULL,
  PRIMARY KEY (`project_id`,`domain_id`),
  KEY `domain_id` (`domain_id`),
  CONSTRAINT `project_domains_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_domains_ibfk_2` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create project_users table
CREATE TABLE `project_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role_in_project` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`,`user_id`),
  KEY `idx_project_users_project` (`project_id`),
  KEY `idx_project_users_user` (`user_id`),
  CONSTRAINT `project_users_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `project_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--

-- Create pd_data_raw table
CREATE TABLE `pd_data_raw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `domain_id` int NOT NULL,
  `block_name` varchar(100) DEFAULT NULL,
  `experiment` varchar(100) DEFAULT NULL,
  `RTL_tag` varchar(100) DEFAULT NULL,
  `run_directory` text,
  `run_end_time` datetime DEFAULT NULL,
  `stage` varchar(100) DEFAULT NULL,
  `internal_timing` varchar(100) DEFAULT NULL,
  `interface_timing` varchar(100) DEFAULT NULL,
  `max_tran_wns_nvp` varchar(100) DEFAULT NULL,
  `max_cap_wns_nvp` varchar(100) DEFAULT NULL,
  `noise` varchar(100) DEFAULT NULL,
  `mpw_min_period_double_switching` varchar(100) DEFAULT NULL,
  `congestion_drc_metrics` varchar(100) DEFAULT NULL,
  `area_um2` varchar(50) DEFAULT NULL,
  `inst_count` varchar(50) DEFAULT NULL,
  `utilization` varchar(50) DEFAULT NULL,
  `logs_errors_warnings` text,
  `run_status` enum('pass','fail','continue_with_error','running','aborted') DEFAULT 'running',
  `runtime_seconds` varchar(50) DEFAULT NULL,
  `ai_summary` text,
  `ir_static` varchar(100) DEFAULT NULL,
  `em_power_signal` varchar(100) DEFAULT NULL,
  `pv_drc` text,
  `lvs` varchar(100) DEFAULT NULL,
  `lec` varchar(100) DEFAULT NULL,
  `collected_by` int DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_name` varchar(100) NOT NULL DEFAULT '',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `domain_id` (`domain_id`),
  KEY `collected_by` (`collected_by`),
  KEY `idx_pd_data_project` (`project_id`),
  KEY `idx_pd_data_run_end_time` (`run_end_time`),
  KEY `idx_pd_data_run_status` (`run_status`),
  KEY `idx_pd_data_block_name` (`block_name`),
  CONSTRAINT `pd_data_raw_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `pd_data_raw_ibfk_2` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`),
  CONSTRAINT `pd_data_raw_ibfk_3` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dv_data_raw table
CREATE TABLE `dv_data_raw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `domain_id` int NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `tb_dev_total` int DEFAULT NULL,
  `tb_dev_coded` int DEFAULT NULL,
  `test_total` int DEFAULT NULL,
  `test_coded` int DEFAULT NULL,
  `test_pass` int DEFAULT NULL,
  `test_fail` int DEFAULT NULL,
  `assert_total` int DEFAULT NULL,
  `assert_coded` int DEFAULT NULL,
  `assert_pass` int DEFAULT NULL,
  `assert_fail` int DEFAULT NULL,
  `code_coverage_percent` decimal(5,2) DEFAULT NULL,
  `functional_coverage_percent` decimal(5,2) DEFAULT NULL,
  `req_total` int DEFAULT NULL,
  `req_covered` int DEFAULT NULL,
  `req_uncovered` int DEFAULT NULL,
  `block_status` enum('pass','fail','in_progress','blocked','not_started','partial','complete') DEFAULT 'not_started',
  `collected_by` int DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `domain_id` (`domain_id`),
  KEY `collected_by` (`collected_by`),
  KEY `idx_dv_data_project` (`project_id`),
  KEY `idx_dv_data_module` (`module`),
  KEY `idx_dv_data_block_status` (`block_status`),
  KEY `idx_dv_data_code_coverage` (`code_coverage_percent`),
  KEY `idx_dv_data_functional_coverage` (`functional_coverage_percent`),
  CONSTRAINT `dv_data_raw_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `dv_data_raw_ibfk_2` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`),
  CONSTRAINT `dv_data_raw_ibfk_3` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cl_data_raw table
CREATE TABLE `cl_data_raw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `domain_id` int NOT NULL,
  `phase` varchar(50) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `block_name` varchar(100) DEFAULT NULL,
  `floor_plan` varchar(100) DEFAULT NULL,
  `routing` varchar(100) DEFAULT NULL,
  `area_um2` decimal(15,2) DEFAULT NULL,
  `pv_drc` text,
  `pv_lvs_erc` varchar(100) DEFAULT NULL,
  `run_directory` text,
  `runtime_seconds` int DEFAULT NULL,
  `run_end_time` datetime DEFAULT NULL,
  `ai_summary` text,
  `ir_static` varchar(100) DEFAULT NULL,
  `ir_dynamic` varchar(100) DEFAULT NULL,
  `em_power_signal` varchar(100) DEFAULT NULL,
  `em_rms_power_signal` varchar(100) DEFAULT NULL,
  `pv_perc` varchar(100) DEFAULT NULL,
  `logs_errors_warnings` text,
  `run_status` enum('pass','fail','continue_with_error','running','aborted') DEFAULT 'running',
  `user_id` int NOT NULL,
  `collected_by` int DEFAULT NULL,
  `collected_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `domain_id` (`domain_id`),
  KEY `user_id` (`user_id`),
  KEY `collected_by` (`collected_by`),
  CONSTRAINT `cl_data_raw_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `cl_data_raw_ibfk_2` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`),
  CONSTRAINT `cl_data_raw_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `cl_data_raw_ibfk_4` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default data for user_roles
INSERT INTO `user_roles` (`role_name`, `description`) VALUES
('Admin', 'System administrator with full access to all projects and data'),
('Engineer', 'Technical engineer with access to assigned projects and data collection'),
('Lead', 'Project lead with oversight responsibilities for assigned projects'),
('Program Manager', 'Program manager with project management and reporting access'),
('Customer', 'Customer with limited read-only access to relevant project data');

-- Insert default data for domains
INSERT INTO `domains` (`short_code`, `full_name`, `description`) VALUES
('PD', 'Physical Design', 'Physical design and layout optimization'),
('RTL', 'Register Transfer Level', 'RTL design and synthesis'),
('DV', 'Design Verification', 'Design verification and validation'),
('CD', 'Clock Design', 'Clock tree synthesis and optimization'),
('CL', 'Custom Layout', 'Custom layout design'),
('DFT', 'Design for Testability', 'Design for test and scan insertion');

-- Insert default admin user (password: admin123)
INSERT INTO `users` (`name`, `email`, `password`, `role_id`) VALUES
('admin', 'admin@dashboard.com', '$2a$10$sTjvjX3UobbBnfxuDC/gvuL.uNEN40tAInnqjWqmQ5W1gCUJIyqWa', 1); 