const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const mirrorBtn = document.getElementById('mirror');
const camerasSelect = document.getElementById('cameras');
const peerFace = document.getElementById('peerFace');
const call = document.getElementById('call');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let mirrored = false;
let peerMirrored = false;
let roomName = '';
let myPeerConnection;
let myDataChannel;

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.error(e);
  }
};

const getMedia = async (deviceId) => {
  const initialConstrains = {
    audio: true,
    video: { facingMode: 'user' },
  };
  const cameraConstrains = {
    audio: true,
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.error(e);
  }
};

const handleMuteBtnClick = () => {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = 'Unmute';
    muted = true;
  } else {
    muteBtn.innerText = 'Mute';
    muted = false;
  }
};

const handleCameraClick = () => {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = 'Turn Camera Off';
    cameraOff = false;
  } else {
    cameraBtn.innerText = 'Turn Camera On';
    cameraOff = true;
  }
};

const handleCameraChange = async () => {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
  }
};

const handleMirrorClick = () => {
  if (mirrored) {
    myFace.style.transform = 'rotateY(0deg)';
    mirrorBtn.innerText = 'Mirror Mode Off';
    mirrored = false;
  } else {
    myFace.style.transform = 'rotateY(180deg)';
    mirrorBtn.innerText = 'Mirror Mode On';
    mirrored = true;
  }
  socket.emit('mirror_mode', roomName);
};

muteBtn.addEventListener('click', handleMuteBtnClick);
cameraBtn.addEventListener('click', handleCameraClick);
camerasSelect.addEventListener('input', handleCameraChange);
mirrorBtn.addEventListener('click', handleMirrorClick);

// Welcome Form (join a room)

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
};

const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initCall();
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
};

welcomeForm.addEventListener('submit', handleWelcomeSubmit);

// Socket code

socket.on('mirror_mode', () => {
  if (peerMirrored) {
    peerFace.style.transform = 'rotateY(0deg)';
    peerMirrored = false;
  } else {
    peerFace.style.transform = 'rotateY(180deg)';
    peerMirrored = true;
  }
});

// 주체에서 실행되는 코드
socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', console.log);
  console.log('made data channel');
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log('sent the offer');
  socket.emit('offer', offer, roomName);
});

// 입장주체에서 실행되는 코드
socket.on('offer', async (offer) => {
  myPeerConnection.addEventListener('datachannel', (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener('message', console.log);
  });
  console.log('received the offer');
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
  console.log('send the answer');
});

// 주체에서 실행되는 코드
socket.on('answer', (answer) => {
  console.log('received the answer');
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
  console.log('received candidate');
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code
const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  });
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('track', handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
};

const handleIce = (data) => {
  console.log('sent candidate');
  socket.emit('ice', data.candidate, roomName);
};

const handleAddStream = (data) => {
  const peerFace = document.getElementById('peerFace');
  console.log("Peer's Stream", data.streams[0]);
  peerFace.srcObject = data.streams[0];
};
