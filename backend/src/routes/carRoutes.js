const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const upload = require('../middleware/upload');
const imageController = require('../controllers/imageController');

router.get('/', carController.getAll);
router.post('/', carController.create);
router.patch('/:id/status', carController.updateStatus);
router.delete('/:id', carController.delete);

// Image routes nested under /:id/images
router.get('/:id/images', imageController.getImages);
router.post('/:id/images', upload.single('image'), imageController.upload);
router.delete('/:id/images/:imageId', imageController.delete);

module.exports = router;
