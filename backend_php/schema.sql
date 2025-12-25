-- Database Schema for Line Connect Puzzle
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS line_puzzle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE line_puzzle;

-- Levels table
CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grid_width INT NOT NULL DEFAULT 800,
    grid_height INT NOT NULL DEFAULT 600,
    dots JSON NOT NULL,
    required_connections JSON NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'anonymous',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version INT DEFAULT 1,
    INDEX idx_official (is_official),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    level_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    best_lives INT DEFAULT 0,
    attempts INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_level (user_id, level_id),
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    INDEX idx_user_completed (user_id, completed),
    INDEX idx_level (level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Level sync tracking table
CREATE TABLE IF NOT EXISTS level_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level_id INT NOT NULL,
    action ENUM('created', 'updated', 'deleted') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
    INDEX idx_timestamp (timestamp),
    INDEX idx_level_action (level_id, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample official levels
INSERT INTO levels (name, grid_width, grid_height, dots, required_connections, is_official, version) VALUES
('Tutorial', 800, 600, 
 '[{"id":1,"x":200,"y":200,"color":"#FF6B6B"},{"id":2,"x":600,"y":200,"color":"#FF6B6B"},{"id":3,"x":200,"y":400,"color":"#4ECDC4"},{"id":4,"x":600,"y":400,"color":"#4ECDC4"}]',
 '[{"dotId1":1,"dotId2":2},{"dotId1":3,"dotId2":4}]',
 TRUE, 1),
 
('Cross Path', 800, 600,
 '[{"id":1,"x":150,"y":150,"color":"#FF6B6B"},{"id":2,"x":650,"y":450,"color":"#FF6B6B"},{"id":3,"x":650,"y":150,"color":"#4ECDC4"},{"id":4,"x":150,"y":450,"color":"#4ECDC4"}]',
 '[{"dotId1":1,"dotId2":2},{"dotId1":3,"dotId2":4}]',
 TRUE, 1),
 
('Triple Trouble', 800, 600,
 '[{"id":1,"x":100,"y":150,"color":"#FF6B6B"},{"id":2,"x":700,"y":150,"color":"#FF6B6B"},{"id":3,"x":100,"y":300,"color":"#4ECDC4"},{"id":4,"x":700,"y":300,"color":"#4ECDC4"},{"id":5,"x":100,"y":450,"color":"#FFD93D"},{"id":6,"x":700,"y":450,"color":"#FFD93D"}]',
 '[{"dotId1":1,"dotId2":2},{"dotId1":3,"dotId2":4},{"dotId1":5,"dotId2":6}]',
 TRUE, 1);

-- Log initial sync events
INSERT INTO level_sync (level_id, action) 
SELECT id, 'created' FROM levels WHERE is_official = TRUE;

-- Display summary
SELECT 'Database setup complete!' as message;
SELECT COUNT(*) as total_levels FROM levels;
