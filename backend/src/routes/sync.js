import express from 'express';
import { LevelModel } from '../models/levelModel.js';

const router = express.Router();

router.get('/check.php', async (req, res) => {
    try {
        const since = req.query.since || '1970-01-01 00:00:00';
        // Validate timestamp format if strict, or just trust date string for now

        const timestamp = new Date(since);
        if (isNaN(timestamp.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid timestamp format' });
        }

        // Format to SQL timestamp string
        const formattedDate = timestamp.toISOString().slice(0, 19).replace('T', ' ');

        const changes = await LevelModel.getUpdatedSince(formattedDate);
        const hasUpdates = changes.created.length > 0 || changes.updated.length > 0 || changes.deleted.length > 0;

        res.json({
            success: true,
            data: {
                hasUpdates,
                created: changes.created,
                updated: changes.updated,
                deleted: changes.deleted,
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Sync check error:', error);
        res.status(500).json({ success: false, error: 'Failed to check sync' });
    }
});

// Alias
router.get('/check', async (req, res) => {
    try {
        const since = req.query.since || '1970-01-01 00:00:00';
        const timestamp = new Date(since);

        if (isNaN(timestamp.getTime())) {
            return res.status(400).json({ success: false, error: 'Invalid timestamp format' });
        }

        const formattedDate = timestamp.toISOString().slice(0, 19).replace('T', ' ');

        const changes = await LevelModel.getUpdatedSince(formattedDate);
        const hasUpdates = changes.created.length > 0 || changes.updated.length > 0 || changes.deleted.length > 0;

        res.json({
            success: true,
            data: {
                hasUpdates,
                created: changes.created,
                updated: changes.updated,
                deleted: changes.deleted,
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Sync check error:', error);
        res.status(500).json({ success: false, error: 'Failed to check sync' });
    }
});

export default router;
