const express = require('express');
const GroupMessage = require('../models/GroupMessage');
const PrivateMessage = require('../models/PrivateMessage');
const router = express.Router();

// Save group messages
router.post('/group-message', async (req, res) => {
    try {
        console.log(' Received request:', req.body); // Log request body

        const { from_user, room, message } = req.body;
        if (!from_user || !room || !message) {
            console.log(' Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Save to MongoDB
        const newMessage = new GroupMessage({ from_user, room, message });
        await newMessage.save();

        console.log(' Message saved:', newMessage);
        res.status(201).json({ message: 'Group message saved successfully!' });

    } catch (error) {
        console.error(' Error saving group message:', error);
        res.status(500).json({ error: error.message });
    }
});


// Save private messages
router.post('/private-message', async (req, res) => {
    try {
        const { from_user, to_user, message } = req.body;
        const newMessage = new PrivateMessage({ from_user, to_user, message });
        await newMessage.save();
        res.status(201).json({ message: 'Private message saved' });
    } catch (error) {
        res.status(500).json({ error: 'Error saving message' });
    }
});

module.exports = router;
