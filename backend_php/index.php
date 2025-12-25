<?php
/**
 * API Router
 * Main entry point for the API
 */

require_once 'utils/cors.php';
require_once 'utils/response.php';

// Get the request URI and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string and leading/trailing slashes
$path = parse_url($requestUri, PHP_URL_PATH);
$path = trim($path, '/');

// Simple routing
if ($path === 'api' || $path === '') {
    sendSuccess([
        'message' => 'Line Connect Puzzle API',
        'version' => '1.0.0',
        'endpoints' => [
            'GET /api/levels' => 'Get all levels',
            'GET /api/levels/{id}' => 'Get single level',
            'POST /api/levels' => 'Create level',
            'PUT /api/levels/{id}' => 'Update level',
            'DELETE /api/levels/{id}' => 'Delete level',
            'GET /api/sync/check' => 'Check for updates',
            'POST /api/progress' => 'Save progress',
            'GET /api/progress' => 'Get progress'
        ]
    ]);
}

// Route to appropriate endpoint
$routes = [
    'GET /api/levels' => 'api/levels/get.php',
    'POST /api/levels' => 'api/levels/create.php',
    'PUT /api/levels' => 'api/levels/update.php',
    'DELETE /api/levels' => 'api/levels/delete.php',
    'GET /api/sync/check' => 'api/sync/check.php',
    'POST /api/progress' => 'api/progress/save.php',
    'GET /api/progress' => 'api/progress/get.php'
];

$routeKey = "$requestMethod /$path";

// Check for level ID in path
if (preg_match('#^api/levels/(\d+)$#', $path, $matches)) {
    $_GET['id'] = $matches[1];
    
    if ($requestMethod === 'GET') {
        require_once 'api/levels/get_single.php';
        exit;
    } elseif ($requestMethod === 'PUT') {
        require_once 'api/levels/update.php';
        exit;
    } elseif ($requestMethod === 'DELETE') {
        require_once 'api/levels/delete.php';
        exit;
    }
}

// Check standard routes
if (isset($routes[$routeKey])) {
    require_once $routes[$routeKey];
    exit;
}

// 404 Not Found
sendError('Endpoint not found', 404);
