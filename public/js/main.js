const chatForm      = document.getElementById('chat-form');
const chatMessages  = document.querySelector('.chat-messages');
const chatSidebar   = document.getElementById('chat-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay= document.getElementById('sidebar-overlay');
const roomName      = document.getElementById('room-name');
const userList      = document.getElementById('users');
const fileInput     = document.getElementById('file-input');
const fileBtn       = document.getElementById('file-btn');
const micBtn        = document.getElementById('mic-btn');
const notifSound    = document.getElementById('notification-sound');

let mediaRecorder = null;
let audioChunks   = [];

/* ── URL params ── */
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const socket = io();
socket.emit('joinRoom', { username, room });

/* ── Sidebar toggle (mobile) ── */
function openSidebar() {
    chatSidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
}
function closeSidebar() {
    chatSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

sidebarToggle.addEventListener('click', () => {
    chatSidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener('click', closeSidebar);

/* ── Room & users ── */
socket.on('roomUsers', ({ room, users, onlineUsers }) => {
    outputRoomName(room);
    outputUsers(users, onlineUsers);
});

/* ── Messages texte ── */
socket.on('message', message => {
    outputMessage(message);
    notifSound.play().catch(() => {});
    scrollDown();
});

/* ── Fichiers ── */
fileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
        alert('Fichier trop grand (max 5 Mo)');
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = e => socket.emit('chatFile', {
        name: file.name,
        data: e.target.result,
        type: file.type
    });
    reader.readAsDataURL(file);
    fileInput.value = '';
});

socket.on('fileMessage', message => {
    outputFileMessage(message);
    notifSound.play().catch(() => {});
    scrollDown();
});

/* ── Audio ── */
micBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.title = 'Enregistrer un audio';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data));

        mediaRecorder.addEventListener('stop', () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(t => t.stop());

            const reader = new FileReader();
            reader.onload = e => socket.emit('chatFile', {
                name: `audio_${Date.now()}.webm`,
                data: e.target.result,
                type: 'audio/webm'
            });
            reader.readAsDataURL(blob);
        });

        mediaRecorder.start();
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fas fa-stop"></i>';
        micBtn.title = 'Arrêter et envoyer';

    } catch {
        alert('Microphone inaccessible. Vérifie les permissions.');
    }
});

/* ── Envoi message texte ── */
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = e.target.elements.msg.value.trim();
    if (!msg) return;
    socket.emit('chatMessage', msg);
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

/* ════════════════════════
   Fonctions d'affichage
════════════════════════ */
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta">${escapeHtml(message.username)} <span>${message.time}</span></p>
        <p class="text">${escapeHtml(message.text)}</p>
    `;
    chatMessages.appendChild(div);
}

function outputFileMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    const isImage = message.fileType?.startsWith('image/');
    const isAudio = message.fileType?.startsWith('audio/');
    const content = isImage
        ? `<img src="${message.data}" alt="${escapeHtml(message.fileName)}" class="chat-image" loading="lazy" />`
        : isAudio
            ? `<audio controls src="${message.data}" class="chat-audio"></audio>`
            : `<a href="${message.data}" download="${escapeHtml(message.fileName)}" class="file-download">📎 ${escapeHtml(message.fileName)}</a>`;

    div.innerHTML = `
        <p class="meta">${escapeHtml(message.username)} <span>${message.time}</span></p>
        <div class="file-content">${content}</div>
    `;
    chatMessages.appendChild(div);
}

function outputRoomName(room) {
    roomName.innerText = room;
}

function outputUsers(users, onlineUsers) {
    userList.innerHTML = users
        .map(u => `<li class="${onlineUsers.includes(u.username) ? 'online' : 'offline'}">${escapeHtml(u.username)}</li>`)
        .join('');
}

function scrollDown() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
