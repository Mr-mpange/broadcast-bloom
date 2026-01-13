<?php
/**
 * Radio Recording API - Single File Handler
 * Handles all recording operations: upload, list, download, delete
 * Integrates with Supabase authentication and MySQL storage
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
$config = [
    'db_host' => 'localhost',                    // Hostinger uses localhost for shared hosting
    'db_name' => 'u232077031_dj_db',  // Replace with your actual database name  
    'db_user' => 'u232077031_dj',         // Replace with your actual MySQL username
    'db_pass' => 'Dj@123123',          // Replace with your actual MySQL password
    'upload_dir' => '../recordings/',            // Directory to store audio files
    'max_file_size' => 500 * 1024 * 1024,       // 500MB max file size
    'allowed_types' => ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'],
    'supabase_url' => 'https://cnysfutwvxfxuvawbybb.supabase.co', // Your Supabase URL (already correct)
    'supabase_anon_key' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueXNmdXR3dnhmeHV2YXdieWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3ODExNTAsImV4cCI6MjA4MzM1NzE1MH0.qWX_IaqSgFblmMQZ3nYYZh5R2rd4sjCoMmdtIHsXLgk' // Your Supabase anon key (already correct)
];

// Database connection
function getDbConnection($config) {
    try {
        $pdo = new PDO(
            "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
            $config['db_user'],
            $config['db_pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}

// Verify Supabase JWT token
function verifySupabaseToken($token, $config) {
    if (empty($token)) {
        return false;
    }
    
    // Simple token verification - you can enhance this
    $headers = [
        'Authorization: Bearer ' . $token,
        'apikey: ' . $config['supabase_anon_key']
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $config['supabase_url'] . '/auth/v1/user');
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $userData = json_decode($response, true);
        return $userData['id'] ?? false;
    }
    
    return false;
}

// Generate unique filename
function generateUniqueFilename($originalName) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid('recording_', true) . '.' . $extension;
}

// Get audio duration (requires ffmpeg or similar - optional)
function getAudioDuration($filePath) {
    // Simple implementation - you can enhance with ffmpeg
    return 0; // Return 0 for now, can be updated later
}

// Handle file upload
function handleUpload($config) {
    try {
        // Verify authentication
        $token = $_POST['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $token);
        
        $userId = verifySupabaseToken($token, $config);
        if (!$userId) {
            throw new Exception('Invalid authentication token');
        }
        
        // Validate required fields
        $sessionId = $_POST['session_id'] ?? '';
        $djName = $_POST['dj_name'] ?? 'Unknown DJ';
        $showTitle = $_POST['show_title'] ?? 'Live Recording';
        
        if (empty($sessionId)) {
            throw new Exception('Session ID is required');
        }
        
        // Validate file upload
        if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No audio file uploaded or upload error');
        }
        
        $file = $_FILES['audio'];
        
        // Check file size
        if ($file['size'] > $config['max_file_size']) {
            throw new Exception('File too large. Maximum size: ' . ($config['max_file_size'] / 1024 / 1024) . 'MB');
        }
        
        // Check file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $config['allowed_types'])) {
            throw new Exception('Invalid file type. Allowed: MP3, WAV');
        }
        
        // Create upload directory if it doesn't exist
        if (!is_dir($config['upload_dir'])) {
            mkdir($config['upload_dir'], 0755, true);
        }
        
        // Generate unique filename
        $filename = generateUniqueFilename($file['name']);
        $filePath = $config['upload_dir'] . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new Exception('Failed to save uploaded file');
        }
        
        // Get file info
        $fileSize = filesize($filePath);
        $duration = getAudioDuration($filePath);
        
        // Save to database
        $pdo = getDbConnection($config);
        $stmt = $pdo->prepare("
            INSERT INTO radio_recordings (
                supabase_session_id, supabase_user_id, dj_name, show_title,
                filename, original_filename, file_path, file_size, duration_seconds, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready')
        ");
        
        $stmt->execute([
            $sessionId, $userId, $djName, $showTitle,
            $filename, $file['name'], $filePath, $fileSize, $duration
        ]);
        
        $recordingId = $pdo->lastInsertId();
        
        return [
            'success' => true,
            'recording_id' => $recordingId,
            'filename' => $filename,
            'file_size' => $fileSize,
            'duration' => $duration,
            'message' => 'Recording uploaded successfully'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Handle listing recordings
function handleList($config) {
    try {
        // Get user ID from token or allow public listings
        $token = $_GET['token'] ?? '';
        $userId = null;
        
        if (!empty($token)) {
            $token = str_replace('Bearer ', '', $token);
            $userId = verifySupabaseToken($token, $config);
        }
        
        $pdo = getDbConnection($config);
        
        // Build query based on access level
        if ($userId) {
            // User can see their own recordings + public ones
            $stmt = $pdo->prepare("
                SELECT id, supabase_session_id, dj_name, show_title, filename,
                       file_size, duration_seconds, recorded_at, download_count, is_public
                FROM radio_recordings 
                WHERE (supabase_user_id = ? OR is_public = 1) AND status = 'ready'
                ORDER BY recorded_at DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
        } else {
            // Public access - only public recordings
            $stmt = $pdo->prepare("
                SELECT id, supabase_session_id, dj_name, show_title, filename,
                       file_size, duration_seconds, recorded_at, download_count
                FROM radio_recordings 
                WHERE is_public = 1 AND status = 'ready'
                ORDER BY recorded_at DESC
                LIMIT 20
            ");
            $stmt->execute();
        }
        
        $recordings = $stmt->fetchAll();
        
        // Add download URLs
        foreach ($recordings as &$recording) {
            $recording['download_url'] = '/api/recording_api.php?action=download&id=' . $recording['id'];
            $recording['file_size_mb'] = round($recording['file_size'] / 1024 / 1024, 2);
            $recording['duration_formatted'] = gmdate('H:i:s', $recording['duration_seconds']);
        }
        
        return [
            'success' => true,
            'recordings' => $recordings,
            'count' => count($recordings)
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Handle file download
function handleDownload($config) {
    try {
        $recordingId = $_GET['id'] ?? '';
        
        if (empty($recordingId)) {
            throw new Exception('Recording ID is required');
        }
        
        $pdo = getDbConnection($config);
        $stmt = $pdo->prepare("
            SELECT * FROM radio_recordings 
            WHERE id = ? AND status = 'ready'
        ");
        $stmt->execute([$recordingId]);
        $recording = $stmt->fetch();
        
        if (!$recording) {
            throw new Exception('Recording not found');
        }
        
        // Check if file is public or user has access
        if (!$recording['is_public']) {
            $token = $_GET['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = str_replace('Bearer ', '', $token);
            $userId = verifySupabaseToken($token, $config);
            
            if ($userId !== $recording['supabase_user_id']) {
                throw new Exception('Access denied');
            }
        }
        
        // Check if file exists
        if (!file_exists($recording['file_path'])) {
            throw new Exception('File not found on server');
        }
        
        // Update download count
        $updateStmt = $pdo->prepare("UPDATE radio_recordings SET download_count = download_count + 1 WHERE id = ?");
        $updateStmt->execute([$recordingId]);
        
        // Log download (optional)
        $logStmt = $pdo->prepare("
            INSERT INTO download_logs (recording_id, downloaded_by, ip_address, user_agent) 
            VALUES (?, ?, ?, ?)
        ");
        $logStmt->execute([
            $recordingId,
            $userId ?? 'anonymous',
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        // Serve file
        header('Content-Type: ' . mime_content_type($recording['file_path']));
        header('Content-Length: ' . filesize($recording['file_path']));
        header('Content-Disposition: attachment; filename="' . $recording['original_filename'] . '"');
        header('Cache-Control: no-cache, must-revalidate');
        
        readfile($recording['file_path']);
        exit;
        
    } catch (Exception $e) {
        header('HTTP/1.1 404 Not Found');
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit;
    }
}

// Handle delete recording
function handleDelete($config) {
    try {
        $token = $_POST['token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $token);
        
        $userId = verifySupabaseToken($token, $config);
        if (!$userId) {
            throw new Exception('Invalid authentication token');
        }
        
        $recordingId = $_POST['id'] ?? '';
        if (empty($recordingId)) {
            throw new Exception('Recording ID is required');
        }
        
        $pdo = getDbConnection($config);
        
        // Get recording info
        $stmt = $pdo->prepare("SELECT * FROM radio_recordings WHERE id = ? AND supabase_user_id = ?");
        $stmt->execute([$recordingId, $userId]);
        $recording = $stmt->fetch();
        
        if (!$recording) {
            throw new Exception('Recording not found or access denied');
        }
        
        // Delete file from filesystem
        if (file_exists($recording['file_path'])) {
            unlink($recording['file_path']);
        }
        
        // Delete from database
        $deleteStmt = $pdo->prepare("DELETE FROM radio_recordings WHERE id = ?");
        $deleteStmt->execute([$recordingId]);
        
        return [
            'success' => true,
            'message' => 'Recording deleted successfully'
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Main request handler
try {
    $action = $_REQUEST['action'] ?? '';
    
    switch ($action) {
        case 'upload':
            $result = handleUpload($config);
            break;
            
        case 'list':
            $result = handleList($config);
            break;
            
        case 'download':
            handleDownload($config); // This function handles its own output
            break;
            
        case 'delete':
            $result = handleDelete($config);
            break;
            
        default:
            $result = [
                'success' => false,
                'error' => 'Invalid action. Supported: upload, list, download, delete'
            ];
    }
    
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>