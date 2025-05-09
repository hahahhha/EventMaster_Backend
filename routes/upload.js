const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const path = require('path');

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded'
            });
        }

        // Относительный путь для сохранения в БД
        const relativePath = path.join('uploads', req.file.filename).replace(/\\/g, '/');

        res.json({
            success: true,
            message: 'File uploaded successfully',
            imagePath: relativePath,
            fullUrl: `${req.protocol}://${req.get('host')}/${relativePath}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed'
        });
    }
});

module.exports = router;