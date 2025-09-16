function success(res, code, message, data = null) {
  return res.status(code).json({ code, message, data });
}

function error(res, code, message, data = null) {
  return res.status(code).json({ code, message, data });
}

module.exports = { success, error };
