const jwt = require("jsonwebtoken");

const JWT_SECRET = "tu_clave_secreta"; // Misma clave que en auth.js

function authenticateToken(req, res, next) {
  console.log("=== MIDDLEWARE AUTHENTICATE TOKEN ===");
  
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.sendStatus(403);
    }

    console.log("✅ Token válido. User:", decoded);
    
    // Ensure the decoded token has all required fields
    if (!decoded.id_usuario || !decoded.id_rol) {
      console.log("❌ Token missing required fields");
      return res.sendStatus(403);
    }

    req.user = {
      id_usuario: decoded.id_usuario,
      id_rol: decoded.id_rol,
      email: decoded.email
    };
    
    next();
  });
}

module.exports = authenticateToken;