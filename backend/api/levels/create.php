<?php
/**
 * POST /api/levels
 * Create a new level
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../utils/validation.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getJsonInput();
validateLevel($data);

$levelModel = new Level($pdo);
$levelId = $levelModel->create($data);

sendSuccess([
    'id' => $levelId,
    'message' => 'Level created successfully'
], 201);
