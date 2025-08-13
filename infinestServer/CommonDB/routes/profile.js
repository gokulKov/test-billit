const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// ✅ GET /profile/get
router.get('/get', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;


        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                imageUrl: true,
            },
        });


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        res.json(user);
    } catch (err) {
        console.error('❌ Error fetching profile:', err);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});


// ✅ PATCH /profile/update
router.patch('/update', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone, address, imageUrl } = req.body;


        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name && name.trim() !== '' ? name : undefined,
                phone: phone && phone.trim() !== '' ? phone : undefined,
                address: address && address.trim() !== '' ? address : undefined,
                imageUrl: imageUrl && imageUrl.trim() !== '' ? imageUrl : undefined,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                imageUrl: true,
            },
        });


        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (err) {
        console.error('❌ Error updating profile:', err);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});


module.exports = router;
