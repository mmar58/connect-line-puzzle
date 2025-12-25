<?php
/**
 * POST /api/progress
 * Save user progress
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/validation.php';
require_once '../../config/database.php';
require_once '../../models/Progress.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getJsonInput();
validateProgress($data);

$progressModel = new Progress($pdo);
$result = $progressModel->save($data);

if (!$result) {
    sendError('Failed to save progress', 500);
}

sendSuccess([
    'message' => 'Progress saved successfully'
]);
