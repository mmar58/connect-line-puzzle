<?php
/**
 * Progress Model
 * Handles database operations for user progress
 */

class Progress {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function save($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO user_progress (user_id, level_id, completed, best_lives, attempts, completed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                completed = VALUES(completed),
                best_lives = GREATEST(best_lives, VALUES(best_lives)),
                attempts = attempts + VALUES(attempts),
                completed_at = IF(VALUES(completed) = 1 AND completed_at IS NULL, VALUES(completed_at), completed_at),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        return $stmt->execute([
            $data['userId'],
            $data['levelId'],
            $data['completed'] ?? false,
            $data['bestLives'] ?? 0,
            $data['attempts'] ?? 1,
            ($data['completed'] ?? false) ? date('Y-m-d H:i:s') : null
        ]);
    }
    
    public function getByUser($userId) {
        $stmt = $this->pdo->prepare("
            SELECT level_id as levelId, completed, best_lives as bestLives,
                   attempts, completed_at as completedAt
            FROM user_progress
            WHERE user_id = ?
            ORDER BY level_id ASC
        ");
        
        $stmt->execute([$userId]);
        $progress = $stmt->fetchAll();
        
        foreach ($progress as &$p) {
            $p['completed'] = (bool)$p['completed'];
            $p['levelId'] = (int)$p['levelId'];
            $p['bestLives'] = (int)$p['bestLives'];
            $p['attempts'] = (int)$p['attempts'];
        }
        
        return $progress;
    }
    
    public function getByUserAndLevel($userId, $levelId) {
        $stmt = $this->pdo->prepare("
            SELECT level_id as levelId, completed, best_lives as bestLives,
                   attempts, completed_at as completedAt
            FROM user_progress
            WHERE user_id = ? AND level_id = ?
        ");
        
        $stmt->execute([$userId, $levelId]);
        $progress = $stmt->fetch();
        
        if (!$progress) {
            return null;
        }
        
        $progress['completed'] = (bool)$progress['completed'];
        $progress['levelId'] = (int)$progress['levelId'];
        $progress['bestLives'] = (int)$progress['bestLives'];
        $progress['attempts'] = (int)$progress['attempts'];
        
        return $progress;
    }
}
