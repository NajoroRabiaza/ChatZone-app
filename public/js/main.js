const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const chatSidebar = document.querySelector('.chat-sidebar');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
var notificationSound = document.getElementById('notification-sound');

//get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();

//join chatRoom
socket.emit('joinRoom', { username, room });

//get room and users
socket.on('roomUsers', ({ room, users,onlineUsers }) => {
    outputRoomName(room);
    outputUsers(users, onlineUsers);
});

//message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);
    notificationSound.play();

    io.to(user.room).emit('message', formatMessage(user.username, msg));
    

    //scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatSidebar.scrollTop = chatSidebar.scrollHeight;

});

// Message submit
chatForm.addEventListener('submit', (e) =>{
    e.preventDefault();

    //get message text
    const msg = e.target.elements.msg.value;

    //emit message to server
    socket.emit('chatMessage', msg);

    //clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

//output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

//add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

//add users to DOM
function outputUsers(users, onlineUsers) {
    userList.innerHTML = users
    .map(user => `<li class="${onlineUsers.includes(user.username) ? 'online' : 'offline'}">${user.username}</li>`)
    .join('');
}


