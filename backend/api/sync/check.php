<?php
/**
 * GET /api/sync/check
 * Check for level updates since last sync
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$since = isset($_GET['since']) ? $_GET['since'] : '1970-01-01 00:00:00';

// Validate timestamp
$timestamp = strtotime($since);
if (!$timestamp) {
    sendError('Invalid timestamp format', 400);
}

$levelModel = new Level($pdo);
$changes = $levelModel->getUpdatedSince(date('Y-m-d H:i:s', $timestamp));

$hasUpdates = !empty($changes['created']) || !empty($changes['updated']) || !empty($changes['deleted']);

sendSuccess([
    'hasUpdates' => $hasUpdates,
    'created' => $changes['created'],
    'updated' => $changes['updated'],
    'deleted' => $changes['deleted'],
    'lastSync' => date('Y-m-d\TH:i:s\Z')
]);
