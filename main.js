const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Import Models
const GroupMessage = require('./models/GroupMessage');
const PrivateMessage = require('./models/PrivateMessage');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'view')));
app.use(session({ secret: 'chatappsecret', resave: true, saveUninitialized: true }));
app.use((req, res, next) => {
    if (!req.session.user && req.path !== "/login.html" && req.path !== "/signup.html") {
        return res.redirect('/login.html'); 
    }
    next();
});

// MongoDB Connection
const DB_NAME = 'chat_app_db';
const DB_USER_NAME = 'tenzint';
const DB_PASSWORD = 'comp3133';
const CLUSTER_DOMAIN = 'comp3133.kztiu.mongodb.net';

const DB_CONNECTION_STRING = `mongodb+srv://${DB_USER_NAME}:${DB_PASSWORD}@${CLUSTER_DOMAIN}/${DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(' Database connected');
}).catch(error => console.log(' Error connecting to MongoDB:', error));

// WebSocket logic
io.on('connection', (socket) => {
    console.log(' New WebSocket connection');

    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        console.log(`${username} joined ${room}`);
        socket.broadcast.to(room).emit('message', { username: 'System', message: `${username} joined the chat.` });
    });

    socket.on('chatMessage', async ({ message, username, room }) => {
        try {
            // Store message in MongoDB
            const newMessage = new GroupMessage({ from_user: username, room, message });
            await newMessage.save();

            // Broadcast message to all users in the room
            io.to(room).emit('message', { username, message });
        } catch (error) {
            console.error(' Error saving message:', error);
        }
    });

    socket.on('typing', ({ username, room }) => {
        console.log(`✏ ${username} is typing in ${room}`);
        socket.broadcast.to(room).emit('userTyping', { username });
    });

    socket.on('stopTyping', ({ room }) => {
        socket.broadcast.to(room).emit('userStoppedTyping');
    });

    socket.on('disconnect', () => {
        console.log(' User disconnected');
    });
});

// Use Routes
app.use(express.json());
const chatRoutes = require('./routes/chatRoutes');
app.use('/chat', chatRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
