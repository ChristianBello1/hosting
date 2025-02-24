// server/middleware/roleAuth.js
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Verifica solo che sia superadmin per la registrazione di nuovi admin
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only superadmin can register new admins'
    });
  }

  next();
};

module.exports = {
  isSuperAdmin
};