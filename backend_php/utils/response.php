<?php
/**
 * Response Helper Functions
 * Standardizes API responses
 */

function sendSuccess($data, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON input', 400);
    }
    
    return $data;
}

function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            sendError("Missing required field: $field", 400);
        }
    }
}
