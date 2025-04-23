// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  // Expect token in header as "Bearer <token>"
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded payload (e.g., userId)
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
