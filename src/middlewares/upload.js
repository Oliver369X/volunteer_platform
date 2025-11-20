'use strict';

const multer = require('multer');
const { ValidationError } = require('../core/api-error');

// Configurar almacenamiento en memoria (temporal)
const storage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ValidationError('Solo se permiten archivos de imagen'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Middleware para single file
const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware para múltiples archivos
const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

// Handler de errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'El archivo es muy grande. Máximo 5MB',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Campo de archivo inesperado',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleMulterError,
};

