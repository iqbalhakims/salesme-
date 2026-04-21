const { recordRequest } = require('../utils/metricsStore');

module.exports = function requestMetrics(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    recordRequest(res.statusCode, Date.now() - start);
  });
  next();
};
