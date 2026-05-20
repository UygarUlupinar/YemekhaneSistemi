const jwt = require('jsonwebtoken');

// Giriş yapmış mı kontrolü
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Yetkisiz erişim.' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token geçersiz.' });
  }
};

// Rol kontrolü (admin, staff_worker vs.)
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
  next();
};