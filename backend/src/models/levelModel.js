import pool from '../config/db.js';

export class LevelModel {
    static async getAll(page = 1, perPage = 100) {
        const offset = (page - 1) * perPage;

        const [rows] = await pool.execute(`
      SELECT id, name, grid_width as gridWidth, grid_height as gridHeight,
             dots, required_connections as requiredConnections,
             is_official as isOfficial, created_by as createdBy,
             version, updated_at as updatedAt
      FROM levels
      ORDER BY is_official DESC, id ASC
      LIMIT ? OFFSET ?
    `, [String(perPage), String(offset)]);

        const levels = rows.map(level => ({
            ...level,
            dots: typeof level.dots === 'string' ? JSON.parse(level.dots) : level.dots,
            requiredConnections: typeof level.requiredConnections === 'string' ? JSON.parse(level.requiredConnections) : level.requiredConnections,
            isOfficial: Boolean(level.isOfficial)
        }));

        const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM levels');
        const total = countRows[0].total;

        return {
            levels,
            total,
            page: Number(page),
            perPage: Number(perPage)
        };
    }

    static async getById(id) {
        const [rows] = await pool.execute(`
      SELECT id, name, grid_width as gridWidth, grid_height as gridHeight,
             dots, required_connections as requiredConnections,
             is_official as isOfficial, created_by as createdBy,
             version, updated_at as updatedAt
      FROM levels
      WHERE id = ?
    `, [id]);

        if (rows.length === 0) return null;

        const level = rows[0];
        return {
            ...level,
            dots: typeof level.dots === 'string' ? JSON.parse(level.dots) : level.dots,
            requiredConnections: typeof level.requiredConnections === 'string' ? JSON.parse(level.requiredConnections) : level.requiredConnections,
            isOfficial: Boolean(level.isOfficial)
        };
    }

    static async create(data) {
        const { name, gridWidth, gridHeight, dots, requiredConnections, isOfficial = false, createdBy = 'anonymous' } = data;

        const [result] = await pool.execute(`
            INSERT INTO levels (name, grid_width, grid_height, dots, required_connections, 
                              is_official, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            name,
            gridWidth,
            gridHeight,
            JSON.stringify(dots),
            JSON.stringify(requiredConnections),
            isOfficial,
            createdBy
        ]);

        const levelId = result.insertId;
        await this.logSync(levelId, 'created');

        return levelId;
    }

    static async logSync(levelId, action) {
        await pool.execute(`
            INSERT INTO level_sync (level_id, action)
            VALUES (?, ?)
        `, [levelId, action]);
    }

    static async getUpdatedSince(timestamp) {
        const [rows] = await pool.execute(`
            SELECT DISTINCT level_id, action, MAX(timestamp) as timestamp
            FROM level_sync
            WHERE timestamp > ?
            GROUP BY level_id, action
            ORDER BY timestamp DESC
        `, [timestamp]);

        const result = {
            created: [],
            updated: [],
            deleted: []
        };

        rows.forEach(change => {
            if (result[change.action]) {
                result[change.action].push(change.level_id);
            }
        });

        return result;
    }
}
