const auth = (req, res, next) => {
  const key = req.headers['x-admin-key'];

  if (key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

module.exports = auth;