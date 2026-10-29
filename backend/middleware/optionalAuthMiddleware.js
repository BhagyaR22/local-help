const jwt = require("jsonwebtoken");

function optionalAuthMiddleware(req, res, next) {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

module.exports = optionalAuthMiddleware;