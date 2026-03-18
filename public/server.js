const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { 
    userJoin, 
    getCurrentUser, 
    userLeave, 
    getRoomUsers 
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const onlineUsers = [];
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
//set static folder
app.use(express.static((__dirname)));

const botName = 'chatZone bot';

//run when clients connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        //welcome to the current user
        socket.emit('message', formatMessage(botName, 'Bienvenus dans ChatZone !!!'));

        //add user to online users
        onlineUsers.push(user.username);

    //broadcast when a user connect
    socket.broadcast
    .to(user.room)
    .emit(
        'message', formatMessage(botName, `${user.username} a rejoint le groupe de discussion`)
        );

        //send users and room info and send online users to the room
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room),
            onlineUsers
        });
    });

    //listen for chatMessage
    socket.on('chatMessage', msg =>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
     //runs when client disconnect
     socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            //remove user from online users
            const index = onlineUsers.indexOf(user.username);
            if (index !== -1) {
                onlineUsers.splice(index, 1);
            }

            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} a quitter la discussion`)
            );
                
            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room),
                onlineUsers
            });
         }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT , () => console.log(`Server running on port ${PORT}`));

