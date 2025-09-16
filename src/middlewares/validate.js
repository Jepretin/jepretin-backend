module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: "Validasi gagal",
      errors: error.details.map((err) => err.message),
    });
  }
  next();
};
