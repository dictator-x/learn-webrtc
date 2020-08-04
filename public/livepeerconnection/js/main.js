"use strict"

var localVideo  = document.querySelector("video#localvideo");
var remoteVideo = document.querySelector("video#remotevideo");

var btnConn = document.querySelector("button#connserver");
var btnLeave = document.querySelector("button#leave");
var toggleCamera = document.querySelector("button#camera");

var localStream = null;
var localAudioStream = null;

var roomid = "111111";
var socket = null;
var state = "init";

var pc = null;
var isShowDestop = false;

function show() {
  if ( isShowDestop ) {
    toggleCamera.innerText = "Camera";
  } else {
    toggleCamera.innerText = "Desktop";
  }
  isShowDestop = !isShowDestop;
}

function call() {
  if ( state === "joined_conn" ) {
    if ( pc ) {

      var options = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      }

      pc.createOffer(options)
        .then(getOffer)
        .catch(handleOfferError);
    }
  }
}

function sendMessage(roomid, data) {
  console.log("send p2p message", roomid, data);
  if ( socket ) {
    socket.emit("message", roomid, data);
  }
}

function handleOfferError(err) {
  console.error("Failed to get Offer", err);
}

function handleAnswerError(err) {
  console.error("Failed to get Answer!", err);
}

function getOffer(desc) {
  pc.setLocalDescription(desc);
  sendMessage(roomid, desc);
}

function getAnswer(desc) {
  pc.setLocalDescription(desc);
  sendMessage(roomid, desc);
}

function connSingnalServer() {
  start();
  return true;
}

function start() {
  if (
    ! navigator.mediaDevices ||
    ! navigator.mediaDevices.getUserMedia ||
    ! navigator.mediaDevices.getDisplayMedia
  ) {
    console.error("The getUserMedia is not supported!");
    return;
  } else {
    var constraints;

    if ( isShowDestop && shareDesk() ) {
      constraints = {
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
    } else {
      constraints = {
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
    }

    navigator.mediaDevices.getUserMedia(constraints)
          .then(getMediaStream)
          .catch(handleError);
  }
}

function shareDesk() {
  //TODO: check if it is PC
  navigator.mediaDevices.getDisplayMedia({video: true})
    .then(getDeskStream).catch(handleError);
	return true;
}

function getDeskStream(stream) {
  localStream = stream;
}

function getMediaStream(stream) {
  if ( localStream ) {
    stream.getAudioTracks().forEach((track) => {
      localStream.addTrack(track);
      stream.removeTrack(track);
    });
  } else {
    localStream = stream;
  }
  localVideo.srcObject = localStream;

  conn();
}
function conn() {
  socket = io.connect();

  socket.on("joined", (roomid, id) => {
    console.log("receive joined message: ", roomid, id);
    state = "joined";
    createPeerConnection();

    btnConn.disabled = true;
    btnLeave.disabled = false;
    toggleCamera.disabled = true;

    console.log("receive joined message:state=", state);
  });

  socket.on("otherjoin", (roomid, id) => {
    console.log("receive otherjoin message: ", roomid, id);
    if ( state === "joined_unbind" ) {
      createPeerConnection();
    }
    state = "joined_conn";
    // Media neogotiation.
    call();
    console.log("receive otherjoin message:state=", state);
  });

  socket.on("full", (roomid, id) => {
    console.log("receive full message: ", roomid, id);
    state = "leaved";
    console.log("receive full message:state=", state);
    socket.disconnect();

    alert("the room is full");

    btnConn.disabled = false;
    btnLeave.disabled = true;
    toggleCamera.disabled = false;
  });

  socket.on("leaved", (roomid, id) => {
    console.log("receive leaved message: ", roomid, id);
    state = "leaved";
    console.log("receive leaved message:state=", state);
    socket.disconnect();

    btnConn.disabled = false;
    btnLeave.disabled = true;
    toggleCamera.disabled = false;
  });

  socket.on("bye", (roomid, id) => {
    console.log("receive bye message: ", roomid, id);
    state = "joined_unbind";
    closePeerConnection();
    console.log("receive bye message:state=", state);
  });

  socket.on("message", (roomid, data) => {
    console.log("receive client message: ", roomid, data);

    if ( data === null || data === undefined ) {
      console.error("The message is invalid");
      return;
    }

    if ( data.hasOwnProperty("type") && data.type === "offer" ) {
      pc.setRemoteDescription(new RTCSessionDescription(data));
      pc.createAnswer()
        .then(getAnswer)
        .catch(handleAnswerError);

    } else if ( data.hasOwnProperty("type") && data.type === "answer" ) {
      pc.setRemoteDescription(new RTCSessionDescription(data));

    } else if ( data.hasOwnProperty("type") && data.type === "candidate" ) {
      var options = {
        sdpMLineIndex: data.label,
        candidate: data.candidate
      }
      var candidate = new RTCIceCandidate(options);
      pc.addIceCandidate(candidate);
    } else {
      console.error("The message is valid! ", data);
    }

  });

  socket.emit("join", "111111");

  return;
}

function getUserMediaStream(stream) {
  localVideo.srcObject = stream;
  localStream = stream;

  conn();
}

function createPeerConnection() {
  console.log("create RTCPeerConnection");
  if ( ! pc ) {
    var pcConfig = {
      "iceServers": [
        {
          "urls": "turn:127.0.0.1:3478?transport=udp",
          // "urls": "turn:192.168.1.219:3478?transport=udp",
          "credential": "root",
          "username": "root"
        }
      ]
    }
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = (e) => {
      if ( e.candidate ) {
        // Important step.
        console.log("find an new candidate", e.candidate);

        var options = {
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdmMid,
          candidate: e.candidate.candidate
        }

        sendMessage(roomid, options);
      }
    }
    pc.ontrack = (e) => {
      remoteVideo.srcObject = e.streams[0];
    }
  }

  if ( localAudioStream ) {
    localAudioStream.getTracks().forEach((track) => {
      pc.addTrack(track, localAudioStream);
    })
  }

  if ( localStream  ) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }
}

function closePeerConnection() {
  console.log("close RTCPeerConnection");
  if ( pc ) {
    pc.close();
    pc = null;
  }
}

function handleError(err) {
  console.error("Failed: ", err);
}

function closeLocalMedia() {
  if ( localStream && localStream.getTracks() ) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;

  if ( localAudioStream && localAudioStream.getTracks() ) {
    localAudioStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localAudioStream = null;
}

function leave() {
  if ( socket ) {
    socket.emit("leave", "111111");
  }

  closePeerConnection();
  closeLocalMedia();

  btnConn.disabled = false;
  btnLeave.disabled = true;
  toggleCamera.disabled = false;
}

btnConn.onclick = connSingnalServer;
btnLeave.onclick = leave;
toggleCamera.onclick = show;
