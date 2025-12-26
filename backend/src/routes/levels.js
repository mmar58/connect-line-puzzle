import express from 'express';
import { LevelModel } from '../models/levelModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = req.query.perPage || 100;
        const result = await LevelModel.getAll(page, perPage);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Get levels error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch levels' });
    }
});

router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data.name || !data.gridWidth || !data.gridHeight || !data.dots || !data.requiredConnections) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const levelId = await LevelModel.create(data);
        res.json({ success: true, data: { levelId, message: 'Level created successfully' } });
    } catch (error) {
        console.error('Create level error:', error);
        res.status(500).json({ success: false, error: 'Failed to create level' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const level = await LevelModel.getById(req.params.id);
        if (!level) {
            return res.status(404).json({ success: false, error: 'Level not found' });
        }
        res.json({ success: true, data: level });
    } catch (error) {
        console.error('Get level error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch level' });
    }
});

export default router;
