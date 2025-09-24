const { error } = require("./response");

const handleAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => {
    const status = err.statusCode || 500;
    const message = err.isOperational
      ? err.message
      : "Terjadi kesalahan server";
    return error(res, status, message, { detail: err.message });
  });
};

module.exports = handleAsync;
