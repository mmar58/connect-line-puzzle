import pool from '../config/db.js';

export class ProgressModel {
    static async save(data) {
        const { userId, levelId, completed = false, bestLives = 0, attempts = 1 } = data;
        const completedAt = completed ? new Date() : null;

        // Use ON DUPLICATE KEY UPDATE logic similar to PHP
        const query = `
      INSERT INTO user_progress (user_id, level_id, completed, best_lives, attempts, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        completed = VALUES(completed),
        best_lives = GREATEST(best_lives, VALUES(best_lives)),
        attempts = attempts + VALUES(attempts),
        completed_at = IF(VALUES(completed) = 1 AND completed_at IS NULL, VALUES(completed_at), completed_at),
        updated_at = CURRENT_TIMESTAMP
    `;

        const [result] = await pool.execute(query, [
            userId,
            levelId,
            completed,
            bestLives,
            attempts,
            completedAt
        ]);

        return result.affectedRows > 0;
    }

    static async getByUser(userId) {
        const [rows] = await pool.execute(`
      SELECT level_id as levelId, completed, best_lives as bestLives,
             attempts, completed_at as completedAt
      FROM user_progress
      WHERE user_id = ?
      ORDER BY level_id ASC
    `, [userId]);

        return rows.map(row => ({
            ...row,
            completed: Boolean(row.completed),
            levelId: Number(row.levelId),
            bestLives: Number(row.bestLives),
            attempts: Number(row.attempts)
        }));
    }
}
