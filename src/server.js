import http from 'http';
import WebSocket from 'ws';
import express from 'express';

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));

const handleListen = () =>
  console.log(`💫 http://localhost:${PORT}에서 서버가 실행되었습니다. 💫`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const onSocketClose = () => {
  console.log('Disconnected from the Browser');
};

const sockets = [];

wss.on('connection', (socket) => {
  sockets.push(socket);
  console.log('Connected to Browser ✅');
  socket.on('close', onSocketClose);
  socket.on('message', (message) => {
    sockets.forEach((aSocket) => aSocket.send(message.toString('utf8')));
  });
});

server.listen(3000, handleListen);
