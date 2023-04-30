const socket = io('/');
const leaveMeeting = document.getElementById('leave-meeting');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

var peer = new Peer()

let myVideoStream;
let currentUserID;
let peers = {};
let peersID = [];
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function openStream(){
    const config = { audio: false, video: true };
    return navigator.mediaDevices.getUserMedia(config);
}


openStream()
.then((stream) => {
    myVideoStream = stream;
    // addVideoStream(myVideo, stream);
    setTimeout(addVideoStream, 1000, myVideo, stream);
})

socket.on('user-connected', (userID) => {
    console.log('new user connected: ' + userID);
    if(userID != currentUserID || peersID.includes(userID)==false) {
        openStream()
        .then(stream => {
            connectToNewUser(userID, stream);
        })
    }
})
socket.on('user-call', userID => {
    console.log('user call: ' + userID);
    if(peersID.includes(userID)){    
        console.log('user already present: ' + userID);
    } else {
        openStream()
        .then(stream => {
            connectToNewUser(userID, stream);
        })
    }
})

socket.on('user-disconnected', userID =>{
    if (peers[userID]){
        console.log('user leave: '+userID);
        document.getElementById(userID).outerHTML = "";
        peersID.splice(peersID.indexOf(userID),1)
        peers[userID].close();
        showAlert(`${userID} has left`);
    }
})


peer.on('open', id => {
    currentUserID = id;
    socket.emit('join-room', roomID, id)
})

// answer
peer.on('call', call => {
    openStream()
    .then(stream => {
        console.log('answer stream')
        call.answer(stream);
    })
})

function connectToNewUser(userID, stream){
    socket.emit('call-from', currentUserID);
    // call
    const call = peer.call(userID, stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
        console.log('calling stream');
        addVideoStream(video, userVideoStream, userID);
    })
    
    call.on('close', () => {
        video.remove();
    })
    
    peersID.push(userID);
    peers[userID] = call;
}


const addVideoStream = (video, stream, id = "me") => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    })

    let videoUser = document.createElement("div");
    videoUser.style.margin = '10px'
    videoUser.id = id;
    videoUser.append(video);
    if(id == 'me'){
        videoUser.append(`me (${currentUserID})`);
    } else {
        videoUser.append(id)
    }
    videoGrid.append(videoUser);
    let users = document.getElementsByTagName("video");
    if(users.length > 0){
        users.foreach(u => {
            u.style.width = 100 / users.length+"%";
        })
    }
}

const btnPlayStop = document.getElementById('playPauseButton');
btnPlayStop.addEventListener('click', () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setStopVideo();
    } else {
        setPlayVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
})

const btnMute = document.getElementById('muteButton');
btnMute.addEventListener('click', () => {
    let enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        setMuteButton();
    }
});

const showInvitePopup = () => {
    document.querySelector(".invitePop").classList.toggle("hide");
    document.querySelector(".overlay").classList.toggle("hide");
    document.getElementById("roomLink").value = window.location.href;
}

const hideInvitePopup = () => {
    document.querySelector(".invitePop").classList.add("hide");
    document.querySelector(".overlay").classList.add("hide");
}

const copyToClipboard = () => {
    var copyText = document.getElementById("roomLink");
    copyText.select();
    copyText.setSelectionRange(0, 99999)
    document.execCommand("copy");

    // alert("Copied: " + copyText.value);
    hideInvitePopup();
    showAlert("Link Copied");
}

const showAlert = (alert) => {
    document.querySelector('#alert').innerHTML = alert;
    document.querySelector('.main_alert').classList.remove("hide");
    setTimeout(() => {document.querySelector('.main_alert').classList.add("hide");}, 1500)
}

const setStopVideo = () => {
    const html = `<i class="unmute fas fa-video-slash"></i>`;
    document.getElementById("playPauseButton").innerHTML = html;
}

const setPlayVideo = () => {
    const html = `<i class=" fa fa-video-camera"></i>`;
    document.getElementById("playPauseButton").innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>`;
    document.getElementById("muteButton").innerHTML = html;
}
const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>`;
    document.getElementById("muteButton").innerHTML = html;
}