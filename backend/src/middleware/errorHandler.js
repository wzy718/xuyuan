/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('错误:', err);

  // 默认错误响应
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    code: -1,
    msg: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = {
  errorHandler
};
