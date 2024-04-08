import express from 'express';

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));

const handleListen = (port) =>
  console.log(`💫 http://localhost:${port}에서 서버가 실행되었습니다. 💫`);
app.listen(PORT, () => handleListen(PORT));
