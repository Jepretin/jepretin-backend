function success(res, code, message, data) {
  const response = { code, message };
  if (data !== undefined) {
    response.data = data;
  }
  return res.status(code).json(response);
}

function error(res, code, message, data) {
  const response = { code, message };
  if (data !== undefined) {
    response.data = data;
  }
  return res.status(code).json(response);
}

module.exports = { success, error };
