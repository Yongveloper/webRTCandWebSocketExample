import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import express from 'express';

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));

const handleListen = () =>
  console.log(`💫 http://localhost:${PORT}에서 서버가 실행되었습니다. 💫`);

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ['https://admin.socket.io'],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

const publicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
};

const countRooms = (roomName) => {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
};

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anon';
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName);
    done();
    wsServer
      .to(roomName)
      .emit('welcome', socket.nickname, countRooms(roomName));
    wsServer.sockets.emit('room_change', publicRooms());
  });
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      // 방에서 자신을 포함한 모든 유저에게 메시지를 전달
      wsServer.to(room).emit('bye', socket.nickname, countRooms(room) - 1)
    );
  });
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms());
  });
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on('nickname', (nickname) => (socket['nickname'] = nickname));
});

/* 
const wss = new WebSocket.Server({ server });
const sockets = [];

wss.on('connection', (socket) => {
  sockets.push(socket);
  socket['nickname'] = 'Anon';
  console.log('Connected to Browser ✅');
  socket.on('close', onSocketClose);
  socket.on('message', (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case 'new_message':
        sockets.forEach((aSocket) =>
          aSocket.send(
            `${socket.nickname}: ${message.payload.toString('utf8')}`
          )
        );
      case 'nickname':
        socket['nickname'] = message.payload;
    }
  });
}); */

httpServer.listen(3000, handleListen);
