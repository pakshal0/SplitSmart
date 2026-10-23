import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'splitsmart_jwt_secure_super_secret_key_12345', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
};

export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction || process.env.COOKIE_SECURE === 'true',
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};
