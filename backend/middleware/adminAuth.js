const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(auth, process.env.ADMIN_JWT_SECRET);
    if (!decoded.admin) throw new Error();
    next();
  } catch {
    res.status(403).json({ message: 'Forbidden' });
  }
}
