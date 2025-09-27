const jwt = require('jsonwebtoken');
require('dotenv').config();

// next is a function that passes the request to the next middleware or route handler
module.exports = function(req, res, next) {
  // 1. Get the token from the request header
  const token = req.header('Authorization');

  // 2. Check if token doesn't exist
  if (!token) {
    return res.status(403).json({ msg: 'Authorization denied, no token' });
  }

  // The token is typically in the format "Bearer <token>"
  // We need to remove "Bearer " to get the actual token string
  const actualToken = token.split(' ')[1];

  // 3. Verify the token
  try {
    // jwt.verify will decode the token. If it's invalid, it will throw an error.
    const payload = jwt.verify(actualToken, process.env.JWT_SECRET);

    // 4. Attach the user's ID to the request object
    // The payload contains the { id: user_id } we signed earlier
    req.user = payload.id;
    
    // 5. Call next() to proceed to the route handler
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};