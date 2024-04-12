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

wss.on('connection', (socket) => {
  console.log('Connected to Browser ✅');
  socket.on('close', () => console.log('Disconnected from the Browser'));
  socket.on('message', (message) => {
    console.log(message.toString('utf8'));
  });
  socket.send('hello~');
});

server.listen(3000, handleListen);
