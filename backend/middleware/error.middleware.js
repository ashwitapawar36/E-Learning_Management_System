const errorHandler = (err, req, res, next) => {
  console.error('Error encountered:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Multer error handling
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // PostgreSQL specific error codes
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      success: false,
      message: 'A record with this unique identifier or email already exists.',
      detail: err.detail
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      detail: err.detail
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = { errorHandler };
