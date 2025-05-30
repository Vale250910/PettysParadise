const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configura Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: 'dddqqb10t',
    api_key: '643712797923328',
    api_secret: 'VaDYdqLTlqrPr1WLJi1iymf6anY'
});

// Configurar multer para recibir la imagen en memoria
const upload = multer({ storage: multer.memoryStorage() });

router.post('/image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
        }

        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'Mascotas' }, // Opcional: carpeta en Cloudinary
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(req.file.buffer);

        res.json({ success: true, url: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al subir la imagen' });
    }
});

module.exports = router;
