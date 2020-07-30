'use strict'
var audioinput = document.querySelector("select#audioinput")
var audiooutput = document.querySelector("select#audiooutput")
var videoinput = document.querySelector("select#videoinput")
var filtersSelect = document.querySelector("select#filter")
var videoplay = document.querySelector("video#player")
var snapshot = document.querySelector("button#snapshot")
var picture = document.querySelector("canvas#picture")
var audioplay = document.querySelector("audio#audioplayer")
var divConstraints = document.querySelector("div#constraints");

var recvideo = document.querySelector("video#recplayer");
var btnRecord = document.querySelector("button#record");
var btnPlay = document.querySelector("button#recplay");
var btnDownload = document.querySelector("button#download");

var buffer;
var mediaRecorder;

var first = window.localStorage.getItem("first")
if ( first == null ) {
    if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
        //调用用户媒体设备, 访问摄像头
        getUserMedia({video: {width: 480, height: 320}, audio: {width: 480, height: 320}}, success, error);
    } else {
        alert('不支持访问用户媒体');
    }
}

function getDevices(deviceInfos) {
    deviceInfos.forEach(function(deviceInfo){
        console.log(
            deviceInfo.kind + ": label = "
            + deviceInfo.label + ": id = "
            + deviceInfo.deviceId + ": groupId = "
            + deviceInfo.groupId);

        var option = document.createElement('option');
        option.text = deviceInfo.label;
        option.value = deviceInfo.deviceId;
        if ( deviceInfo.kind === 'audioinput' ) {
            audioinput.appendChild(option);
        } else if ( deviceInfo.kind === "audiooutput") {
            audiooutput.appendChild(option)
        } else if ( deviceInfo.kind === "videoinput") {
            videoinput.appendChild(option)
        }
    })
}

function start() {
    if ( ! navigator.mediaDevices ||  ! navigator.mediaDevices.getUserMedia) {
        console.log("enumerateDevices is not supported!")
    } else {
        var constrants = {
            video: {
                width: 640,
                height: 480,
                frameRate: {
                    min: 15,
                    max: 30
                },
                //facingMode: 'environment'
            },
            // audio: {
            //     echoCancellation: true,
            //     noiseSuppression: true
            // }
            //audio: true
        }
        var audioConstraints = {
            audio: false,
            video: true
        }
        // navigator.mediaDevices.getUserMedia(constrants).then(goMediaStream).catch(handleError);
        // getUserMedia(constrants, goMediaStream, handleError)
        navigator.mediaDevices
            .getUserMedia(constrants)
            //.getDisplayMedia(audioConstraints)
            .then(goMediaStream)
            .then(getDevices)
            .catch(error);
    }
}


function goMediaStream(stream) {
    videoplay.srcObject = stream;

    var videoTrack = stream.getVideoTracks()[0];
    var videoConstraints = videoTrack.getSettings();
    divConstraints.textContent = JSON.stringify(videoConstraints, null, 2);
    //audioplay.srcObject = stream;
    window.stream = stream
    return navigator.mediaDevices.enumerateDevices();
}

function handleError(err) {
    console.log("getUserMedia error: ", err);
}

function getUserMedia(constraints, success, error) {
    if (navigator.mediaDevices.getUserMedia) {
        //最新的标准API
        navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
    } else if (navigator.webkitGetUserMedia) {
        //webkit核心浏览器
        navigator.webkitGetUserMedia(constraints, success, error)
    } else if (navigator.mozGetUserMedia) {
        //firfox浏览器
        navigator.mozGetUserMedia(constraints, success, error);
    } else if (navigator.getUserMedia) {
        //旧版API
        navigator.getUserMedia(constraints, success, error);
    }
}
function success(stream) {
    console.log(stream);
    window.localStorage.setItem('first',"false");
    window.location.reload();
}
function error(error) {
    console.log(`Faile to access Media${error.name}, ${error.message}`);
}

start();
videoinput.onchange = start;
filtersSelect.onchange = function() {
    videoplay.className = filtersSelect.value;
}
snapshot.onclick = function() {
    picture.className = filtersSelect.value;
    picture.getContext('2d').drawImage(videoplay, 0, 0, 320, 240);
}

btnRecord.onclick = function() {
    if ( btnRecord.textContent === 'Start Record') {
        startRecord();
        btnRecord.textContent = "Stop Record";
        btnPlay.disabled = true;
        btnDownload.disabled = true;
    } else {
        stopRecord();
        btnRecord.textContent = "Start Record";
        btnPlay.disabled = false;
        btnDownload.disabled = false;
    }
};

function startRecord() {
    buffer = [];
    var options = {
        mimeType: 'video/webm;codecs=vp8'
    }
    if ( ! MediaRecorder.isTypeSupported(options.mimeType) ) {
        console.error(`${options.mimeType} is not supported!`);
        return;
    }
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error("Failed to create MediaRecorder:", e);
        return;
    }
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
}

function handleDataAvailable(e) {
    if ( e && e.data && e.data.size > 0) {
        buffer.push(e.data);
    }
}

function stopRecord() {
    mediaRecorder.stop();
}

btnDownload.onclick = function () {
    var blob = new Blob(buffer, {type: "video/webm"});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');

    a.href = url;
    a.style.display = 'none';
    a.download = 'aaa.webm';
    a.click();
}

btnPlay.onclick = () => {
    var blob = new Blob(buffer, {type: "video/webm"});
    recvideo.src = window.URL.createObjectURL(blob);
    recvideo.srcObject = null;
    recvideo.controls = true;
    recvideo.play();
}