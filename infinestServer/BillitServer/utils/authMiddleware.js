const jwt = require('jsonwebtoken');


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided." });


    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token." });
       
        try {
            req.user = {
                userId: decoded.userId,
                mongoPlanId: decoded.mongoPlanId, // ✅ pass it
                shop_id: decoded.shop_id          // ✅ pass shop id if needed
            };
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Error processing token." });
        }
    });
}


module.exports = authenticateToken;




