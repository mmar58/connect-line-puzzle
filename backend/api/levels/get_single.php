<?php
/**
 * GET /api/levels/{id}
 * Fetch single level by ID
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    sendError('Invalid level ID', 400);
}

$levelModel = new Level($pdo);
$level = $levelModel->getById($id);

if (!$level) {
    sendError('Level not found', 404);
}

sendSuccess($level);
