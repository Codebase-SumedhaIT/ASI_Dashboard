
-- DV Planned Work Schema (Components Separate from Test Coverage)
-- Components can be created and managed, but test coverage tables don't depend on them

-- 0. Module Table (Independent - should be created first in UI before components)
CREATE TABLE dv_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL,
    module_engineer VARCHAR(100),
    project_id INT NOT NULL,
    domain_id INT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (domain_id) REFERENCES domains(id)
);

-- 1. Component Table (Keep for component management)
CREATE TABLE dv_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component_name VARCHAR(255) NOT NULL,
    component_engineer VARCHAR(100),
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 1. Planned Requirements Table (No Component Dependency)
CREATE TABLE dv_planned_requirements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    domain_id INT NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    testcase_id INT,
    assertion_id INT,
    coverpoint_id INT,
    description TEXT,
    status ENUM('planned', 'in_progress', 'completed', 'blocked') DEFAULT 'planned',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (domain_id) REFERENCES domains(id),
    FOREIGN KEY (testcase_id) REFERENCES dv_planned_testcases(id),
    FOREIGN KEY (assertion_id) REFERENCES dv_planned_assertions(id),
    FOREIGN KEY (coverpoint_id) REFERENCES dv_planned_functional_coverage(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. Planned Testcases Table (No Component Dependency)
CREATE TABLE dv_planned_testcases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    domain_id INT NOT NULL,
    testcase_name VARCHAR(255) NOT NULL,
    testcase_engineer VARCHAR(100),
    testcase_description TEXT,
    status ENUM('planned', 'in_progress', 'completed', 'blocked') DEFAULT 'planned',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (domain_id) REFERENCES domains(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. Planned Assertions Table (No Component Dependency)
CREATE TABLE dv_planned_assertions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    domain_id INT NOT NULL,
    assertion_name VARCHAR(255) NOT NULL,
    assertion_engineer VARCHAR(100),
    assertion_description TEXT,
    status ENUM('planned', 'in_progress', 'completed', 'blocked') DEFAULT 'planned',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (domain_id) REFERENCES domains(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. Planned Functional Coverage Table (No Component Dependency)
CREATE TABLE dv_planned_functional_coverage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    domain_id INT NOT NULL,
    coverpoint_name VARCHAR(255) NOT NULL,
    coverpoint_engineer VARCHAR(100),
    coverpoint_description TEXT,
    status ENUM('planned', 'in_progress', 'completed', 'blocked') DEFAULT 'planned',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (domain_id) REFERENCES domains(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Performance Indexes
CREATE INDEX idx_dv_modules_created_by ON dv_modules(created_by);
CREATE INDEX idx_dv_modules_project ON dv_modules(project_id);
CREATE INDEX idx_dv_modules_domain ON dv_modules(domain_id);
CREATE INDEX idx_dv_components_created_by ON dv_components(created_by);

CREATE INDEX idx_dv_planned_req_project ON dv_planned_requirements(project_id);
CREATE INDEX idx_dv_planned_req_domain ON dv_planned_requirements(domain_id);
CREATE INDEX idx_dv_planned_req_testcase ON dv_planned_requirements(testcase_id);
CREATE INDEX idx_dv_planned_req_assertion ON dv_planned_requirements(assertion_id);
CREATE INDEX idx_dv_planned_req_coverpoint ON dv_planned_requirements(coverpoint_id);
CREATE INDEX idx_dv_planned_req_status ON dv_planned_requirements(status);
CREATE INDEX idx_dv_planned_req_assigned ON dv_planned_requirements(assigned_to);

CREATE INDEX idx_dv_planned_tc_project ON dv_planned_testcases(project_id);
CREATE INDEX idx_dv_planned_tc_domain ON dv_planned_testcases(domain_id);
CREATE INDEX idx_dv_planned_tc_status ON dv_planned_testcases(status);
CREATE INDEX idx_dv_planned_tc_assigned ON dv_planned_testcases(assigned_to);

CREATE INDEX idx_dv_planned_assert_project ON dv_planned_assertions(project_id);
CREATE INDEX idx_dv_planned_assert_domain ON dv_planned_assertions(domain_id);
CREATE INDEX idx_dv_planned_assert_status ON dv_planned_assertions(status);
CREATE INDEX idx_dv_planned_assert_assigned ON dv_planned_assertions(assigned_to);

CREATE INDEX idx_dv_planned_fc_project ON dv_planned_functional_coverage(project_id);
CREATE INDEX idx_dv_planned_fc_domain ON dv_planned_functional_coverage(domain_id);
CREATE INDEX idx_dv_planned_fc_status ON dv_planned_functional_coverage(status);
CREATE INDEX idx_dv_planned_fc_assigned ON dv_planned_functional_coverage(assigned_to);

-- Insert sample modules (should be created first in UI)
INSERT INTO dv_modules (module_name, module_engineer, project_id, domain_id, created_by) VALUES
('Processor Core', 'Alice', 1, 3, 1),
('Memory System', 'Bob', 1, 3, 1),
('I/O Interface', 'Charlie', 1, 3, 1);

-- Insert sample components (for component management)
INSERT INTO dv_components (component_name, component_engineer, description, created_by) VALUES
('ALU', 'Alice', 'Arithmetic Logic Unit component', 1),
('Memory Controller', 'Bob', 'Memory controller component', 1),
('Cache Unit', 'Charlie', 'Cache management unit', 1);

-- Insert sample data (No component dependencies in test tables)
-- First insert testcases, assertions, and coverpoints
INSERT INTO dv_planned_testcases (project_id, domain_id, testcase_name, testcase_engineer, testcase_description, status, priority, created_by) VALUES
(1, 3, 'TC_ALU_ADD', 'Alice', 'Test case for ALU addition operation', 'planned', 'high', 1),
(1, 3, 'TC_ALU_SUB', 'Alice', 'Test case for ALU subtraction operation', 'planned', 'high', 1),
(1, 3, 'TC_ALU_OVERFLOW', 'Bob', 'Test case for ALU overflow detection', 'planned', 'medium', 1);

INSERT INTO dv_planned_assertions (project_id, domain_id, assertion_name, assertion_engineer, assertion_description, status, priority, created_by) VALUES
(1, 3, 'ASSERT_ADD_RESULT', 'Bob', 'Assertion for ALU addition result verification', 'planned', 'high', 1),
(1, 3, 'ASSERT_SUB_RESULT', 'Bob', 'Assertion for ALU subtraction result verification', 'planned', 'high', 1),
(1, 3, 'ASSERT_OVERFLOW', 'Alice', 'Assertion for ALU overflow detection', 'planned', 'medium', 1);

INSERT INTO dv_planned_functional_coverage (project_id, domain_id, coverpoint_name, coverpoint_engineer, coverpoint_description, status, priority, created_by) VALUES
(1, 3, 'alu_op', 'Raj', 'Coverage point for ALU operations', 'planned', 'high', 1),
(1, 3, 'alu_flag', 'Raj', 'Coverage point for ALU flags', 'planned', 'medium', 1);

-- Now insert requirements with references to the IDs
INSERT INTO dv_planned_requirements (project_id, domain_id, requirement_name, testcase_id, assertion_id, coverpoint_id, description, status, priority, created_by) VALUES
(1, 3, 'Add operation', 1, 1, 1, 'ALU addition operation verification', 'planned', 'high', 1),
(1, 3, 'Sub operation', 2, 2, NULL, 'ALU subtraction operation verification', 'planned', 'high', 1),
(1, 3, 'Overflow detection', 3, 3, 2, 'ALU overflow detection verification', 'planned', 'medium', 1); 