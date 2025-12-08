<?php
/**
 * Database Configuration
 * Establishes PDO connection to MySQL database
 */

$host = getenv('DB_HOST') ?: '192.168.0.2';
$dbname = getenv('DB_NAME') ?: 'line_puzzle';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '123456';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
    exit;
}
