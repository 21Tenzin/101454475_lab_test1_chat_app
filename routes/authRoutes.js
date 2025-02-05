const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { username, firstname, lastname, password } = req.body;

        if (!username || !firstname || !lastname || !password) {
            return res.status(400).send('All fields are required');
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        const user = new User({ 
            username: username, 
            firstname: firstname, 
            lastname: lastname, 
            password: password });

        await user.save();
        console.log('User stored in MongoDb: ', user);
        res.redirect('/login.html');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user: ' + error.message);
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });

    if (user && user.password === req.body.password) {
        req.session.user = user;
        res.redirect('/join.html');
    } else {
        res.send('Invalid login credentials.');
    }
});

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

module.exports = router;
