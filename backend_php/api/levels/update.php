<?php
/**
 * PUT /api/levels/{id}
 * Update an existing level
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/validation.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method not allowed', 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    sendError('Invalid level ID', 400);
}

$data = getJsonInput();
validateLevel($data);

$levelModel = new Level($pdo);
$result = $levelModel->update($id, $data);

if (!$result) {
    sendError('Level not found or update failed', 404);
}

sendSuccess([
    'message' => 'Level updated successfully'
]);
