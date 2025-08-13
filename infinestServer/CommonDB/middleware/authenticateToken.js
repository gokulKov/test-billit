
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided." });

    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);

        const subscription = await prisma.subscription.findFirst({
            where: { userId: decodedUser.userId, status: "ACTIVE" },
            include: { plan: true }
        });

        req.user = {
            userId: decodedUser.userId,
            email: decodedUser.email,
            subscription: subscription || null
        };

        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

module.exports = authenticateToken;
