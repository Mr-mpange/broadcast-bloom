-- MySQL Database Setup for Radio Recordings
-- Run this on your Hostinger MySQL database: u232077031_dj_db

USE u232077031_dj_db;

-- Main recordings table
CREATE TABLE radio_recordings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supabase_session_id VARCHAR(255) NOT NULL,
    supabase_user_id VARCHAR(255) NOT NULL,
    dj_name VARCHAR(255),
    show_title VARCHAR(255),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    duration_seconds INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INT DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    status ENUM('processing', 'ready', 'error') DEFAULT 'processing',
    
    -- Indexes for performance
    INDEX idx_user_id (supabase_user_id),
    INDEX idx_session_id (supabase_session_id),
    INDEX idx_public (is_public, recorded_at),
    INDEX idx_status (status)
);

-- Optional: Download tracking table
CREATE TABLE download_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recording_id INT NOT NULL,
    downloaded_by VARCHAR(255),
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (recording_id) REFERENCES radio_recordings(id) ON DELETE CASCADE,
    INDEX idx_recording_id (recording_id),
    INDEX idx_downloaded_at (downloaded_at)
);