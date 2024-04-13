import http from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.render('/'));

const handleListen = () =>
  console.log(`💫 http://localhost:${PORT}에서 서버가 실행되었습니다. 💫`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

httpServer.listen(3000, handleListen);
