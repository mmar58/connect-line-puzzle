<?php
/**
 * Level Model
 * Handles database operations for levels
 */

class Level {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function getAll($page = 1, $perPage = 100) {
        $offset = ($page - 1) * $perPage;
        
        $stmt = $this->pdo->prepare("
            SELECT id, name, grid_width as gridWidth, grid_height as gridHeight,
                   dots, required_connections as requiredConnections,
                   is_official as isOfficial, created_by as createdBy,
                   version, updated_at as updatedAt
            FROM levels
            ORDER BY is_official DESC, id ASC
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$perPage, $offset]);
        $levels = $stmt->fetchAll();
        
        // Decode JSON fields
        foreach ($levels as &$level) {
            $level['dots'] = json_decode($level['dots'], true);
            $level['requiredConnections'] = json_decode($level['requiredConnections'], true);
            $level['isOfficial'] = (bool)$level['isOfficial'];
        }
        
        // Get total count
        $countStmt = $this->pdo->query("SELECT COUNT(*) as total FROM levels");
        $total = $countStmt->fetch()['total'];
        
        return [
            'levels' => $levels,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage
        ];
    }
    
    public function getById($id) {
        $stmt = $this->pdo->prepare("
            SELECT id, name, grid_width as gridWidth, grid_height as gridHeight,
                   dots, required_connections as requiredConnections,
                   is_official as isOfficial, created_by as createdBy,
                   version, updated_at as updatedAt
            FROM levels
            WHERE id = ?
        ");
        
        $stmt->execute([$id]);
        $level = $stmt->fetch();
        
        if (!$level) {
            return null;
        }
        
        $level['dots'] = json_decode($level['dots'], true);
        $level['requiredConnections'] = json_decode($level['requiredConnections'], true);
        $level['isOfficial'] = (bool)$level['isOfficial'];
        
        return $level;
    }
    
    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO levels (name, grid_width, grid_height, dots, required_connections, 
                              is_official, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            sanitizeString($data['name']),
            $data['gridWidth'],
            $data['gridHeight'],
            json_encode($data['dots']),
            json_encode($data['requiredConnections']),
            $data['isOfficial'] ?? false,
            $data['createdBy'] ?? 'anonymous'
        ]);
        
        $levelId = $this->pdo->lastInsertId();
        
        // Log sync event
        $this->logSync($levelId, 'created');
        
        return $levelId;
    }
    
    public function update($id, $data) {
        // Check if level exists and is not official (officials can't be updated via API)
        $existing = $this->getById($id);
        if (!$existing) {
            return false;
        }
        
        if ($existing['isOfficial']) {
            sendError('Cannot update official levels', 403);
        }
        
        $stmt = $this->pdo->prepare("
            UPDATE levels
            SET name = ?, grid_width = ?, grid_height = ?,
                dots = ?, required_connections = ?,
                version = version + 1
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            sanitizeString($data['name']),
            $data['gridWidth'],
            $data['gridHeight'],
            json_encode($data['dots']),
            json_encode($data['requiredConnections']),
            $id
        ]);
        
        if ($result) {
            $this->logSync($id, 'updated');
        }
        
        return $result;
    }
    
    public function delete($id) {
        // Check if level exists and is not official
        $existing = $this->getById($id);
        if (!$existing) {
            return false;
        }
        
        if ($existing['isOfficial']) {
            sendError('Cannot delete official levels', 403);
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM levels WHERE id = ?");
        $result = $stmt->execute([$id]);
        
        if ($result) {
            $this->logSync($id, 'deleted');
        }
        
        return $result;
    }
    
    private function logSync($levelId, $action) {
        $stmt = $this->pdo->prepare("
            INSERT INTO level_sync (level_id, action)
            VALUES (?, ?)
        ");
        $stmt->execute([$levelId, $action]);
    }
    
    public function getUpdatedSince($timestamp) {
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT level_id, action, MAX(timestamp) as timestamp
            FROM level_sync
            WHERE timestamp > ?
            GROUP BY level_id, action
            ORDER BY timestamp DESC
        ");
        
        $stmt->execute([$timestamp]);
        $changes = $stmt->fetchAll();
        
        $result = [
            'created' => [],
            'updated' => [],
            'deleted' => []
        ];
        
        foreach ($changes as $change) {
            $result[$change['action']][] = (int)$change['level_id'];
        }
        
        return $result;
    }
}
