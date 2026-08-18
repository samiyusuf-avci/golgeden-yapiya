-- Gölgeden Yapıya Database DDL Schema
-- Compatible with PostgreSQL & SQLite

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('contractor', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    contractor_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    total_budget NUMERIC(14, 2) NOT NULL DEFAULT 0,
    visibility VARCHAR(30) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'protected', 'public')),
    show_financials_to_clients BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Collaborators Table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    assigned_unit_id VARCHAR(36) NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Building Floors Table
CREATE TABLE IF NOT EXISTS building_floors (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    floor_number INT NOT NULL,
    name VARCHAR(100) DEFAULT '',
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Units Table
CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(36) PRIMARY KEY,
    floor_id VARCHAR(36) NOT NULL,
    unit_number INT NOT NULL,
    name VARCHAR(100) DEFAULT '',
    owner_id VARCHAR(36) NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (floor_id) REFERENCES building_floors(id) ON DELETE CASCADE
);

-- Stages Table (Temel, Kolon, Duvar, Tesisat, İnce İşler, vb.)
CREATE TABLE IF NOT EXISTS stages (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    floor_id VARCHAR(36) NULL,
    unit_id VARCHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
    weight_percentage INT NOT NULL DEFAULT 10,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('material', 'labor', 'official', 'subcontractor')),
    amount NUMERIC(14, 2) NOT NULL,
    invoice_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
