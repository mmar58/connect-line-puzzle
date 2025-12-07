<?php
/**
 * Input Validation Functions
 */

function validateLevel($data) {
    $required = ['name', 'gridWidth', 'gridHeight', 'dots', 'requiredConnections'];
    validateRequired($data, $required);
    
    // Validate types
    if (!is_string($data['name']) || strlen($data['name']) < 1) {
        sendError('Level name must be a non-empty string', 400);
    }
    
    if (!is_numeric($data['gridWidth']) || $data['gridWidth'] < 100) {
        sendError('Grid width must be a number >= 100', 400);
    }
    
    if (!is_numeric($data['gridHeight']) || $data['gridHeight'] < 100) {
        sendError('Grid height must be a number >= 100', 400);
    }
    
    if (!is_array($data['dots']) || count($data['dots']) < 2) {
        sendError('Level must have at least 2 dots', 400);
    }
    
    if (!is_array($data['requiredConnections']) || count($data['requiredConnections']) < 1) {
        sendError('Level must have at least 1 connection', 400);
    }
    
    return true;
}

function validateProgress($data) {
    $required = ['userId', 'levelId'];
    validateRequired($data, $required);
    
    if (!is_string($data['userId']) || strlen($data['userId']) < 1) {
        sendError('User ID must be a non-empty string', 400);
    }
    
    if (!is_numeric($data['levelId'])) {
        sendError('Level ID must be a number', 400);
    }
    
    return true;
}

function sanitizeString($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}
