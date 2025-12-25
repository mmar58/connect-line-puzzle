<?php
/**
 * GET /api/progress
 * Get user progress
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../config/database.php';
require_once '../../models/Progress.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$userId = isset($_GET['userId']) ? $_GET['userId'] : '';

if (empty($userId)) {
    sendError('User ID is required', 400);
}

$progressModel = new Progress($pdo);
$progress = $progressModel->getByUser($userId);

sendSuccess([
    'progress' => $progress
]);
