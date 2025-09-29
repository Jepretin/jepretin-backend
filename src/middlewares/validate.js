const AppError = require("../utils/appError");

module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const detail = error.details.map((err) => err.message).join(", ");
    // lempar ke error handler
    return next(new AppError(detail, 400));
  }

  next();
};
