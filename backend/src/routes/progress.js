import express from 'express';
import { ProgressModel } from '../models/progressModel.js';

const router = express.Router();

router.get('/get.php', async (req, res) => {
    // Legacy support for PHP-style routes if frontend calls /api/progress/get.php
    // We can rewrite this using middleware or just support query params here
    // Frontend config calls: /progress/get.php?userId=...
    // With current frontend code, it expects /progress/get.php

    // Actually, I should probably map the routes to match the PHP structure exactly
    // or update the frontend to use clean URLs. The task said "Update Frontend".
    // I'll stick to clean URLs in Node (/api/progress) but since frontend is using filenames,
    // I should probably alias them or update frontend. 
    // Plan task said "Update Frontend & Verify".
    // I will use clean URLs in backend and update frontend config/api calls.

    // BUT, the current plan routes.js uses `/api/progress`. 
    // I will implement standard REST-like endpoints here.

    // Wait, the plan check step: "Implement API Endpoints".
    // Let's support clean URLs.

    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        const progress = await ProgressModel.getByUser(userId);
        res.json({ success: true, data: { progress } });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch progress' });
    }
});

router.post('/save.php', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data.userId || !data.levelId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const success = await ProgressModel.save(data);
        if (success) {
            res.json({ success: true, data: { message: 'Progress saved successfully' } });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save progress' });
        }
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to save progress' });
    }
});

// Alias for clean usage if we switch frontend later
router.get('/', async (req, res) => {
    // Re-use logic or redirect
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        const progress = await ProgressModel.getByUser(userId);
        res.json({ success: true, data: { progress } });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch progress' });
    }
});

router.post('/', async (req, res) => {
    try {
        const data = req.body;
        if (!data.userId || !data.levelId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const success = await ProgressModel.save(data);
        if (success) {
            res.json({ success: true, data: { message: 'Progress saved successfully' } });
        } else {
            res.status(500).json({ success: false, error: 'Failed to save progress' });
        }
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to save progress' });
    }
});


export default router;
