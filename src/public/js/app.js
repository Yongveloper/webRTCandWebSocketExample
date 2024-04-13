const socket = io();

const welcome = document.getElementById('welcome');
const roomNameForm = welcome.querySelector('#room-name');
const nicknameForm = welcome.querySelector('#nickname');
const room = document.getElementById('room');

room.hidden = true;

let roomName = '';

const addMessage = (messages) => {
  const ul = room.querySelector('ul');
  const li = document.createElement('li');
  li.innerText = messages;
  ul.appendChild(li);
};

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const input = room.querySelector('#msg input');
  const { value } = input;
  socket.emit('new_message', input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = '';
};

const handleNicknameSubmit = (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector('input');
  socket.emit('nickname', input.value);
};

const showRoom = () => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector('#msg');
  msgForm.addEventListener('submit', handleMessageSubmit);
};

const handleRoomSubmit = (event) => {
  event.preventDefault();
  const roomNameInput = roomNameForm.querySelector('input');
  roomName = roomNameInput.value;
  socket.emit('enter_room', roomNameInput.value, showRoom);
};

roomNameForm.addEventListener('submit', handleRoomSubmit);
nicknameForm.addEventListener('submit', handleNicknameSubmit);

socket.on('welcome', (user) => addMessage(`${user} arrived!`));

socket.on('bye', (left) => addMessage(`${left} left ㅠㅠ`));

socket.on('new_message', addMessage);
