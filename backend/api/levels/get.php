<?php
/**
 * GET /api/levels
 * Fetch all levels with pagination
 */

require_once '../../utils/cors.php';
require_once '../../utils/response.php';
require_once '../../config/database.php';
require_once '../../models/Level.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = isset($_GET['perPage']) ? (int)$_GET['perPage'] : 100;

$levelModel = new Level($pdo);
$result = $levelModel->getAll($page, $perPage);

sendSuccess($result);
