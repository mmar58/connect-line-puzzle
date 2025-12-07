<?php
/**
 * DELETE /api/levels/{id}
 * Delete a level
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Method not allowed', 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    sendError('Invalid level ID', 400);
}

$levelModel = new Level($pdo);
$result = $levelModel->delete($id);

if (!$result) {
    sendError('Level not found or deletion failed', 404);
}

sendSuccess([
    'message' => 'Level deleted successfully'
]);
