"use strict"

var createOffer  = document.querySelector("button#createOffer");

var pc1 = new RTCPeerConnection();
var pc2 = new RTCPeerConnection();

function getAnswer(desc) {
    console.log("answer: ", desc.sdp);

    pc2.setLocalDescription(desc);
    pc1.setRemoteDescription(desc);
}

function getOffer(desc) {
    console.log("offer: ", desc.sdp);
    pc1.setLocalDescription(desc);

    pc2.setRemoteDescription(desc);
    pc2.createAnswer().then(getAnswer).catch(handleError);
}

function getMediaStream(stream) {
    stream.getTracks().forEach((track)=> {
        pc1.addTrack(track);
    });

    var options = {
        offerToRecieveAudio: 0,
        offerTORecieveVideo: 1,
        // iceRestart: false
        iceRestart: true
    }

    pc1.createOffer(options).then(getOffer).catch(handleError);
}

function getStream() {
    var constraints = {
        audio: false,
        video: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
                            .then(getMediaStream)
                            .catch(handleError);
}

function handleError(error) {
    console.error(error);
}

function test() {
    if ( !pc1 ) {
        console.error("pc1 is null!");
        return;
    }

    getStream();
    return;
}

createOffer.onclick = test;
