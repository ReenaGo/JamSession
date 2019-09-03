const Video = Twilio.Video;

const joinRoomBlock = document.querySelector("#joinRoom");
const roomNameText = document.querySelector("#roomName");
const mediaContainer = document.getElementById("remote-media");
const userControls = document.getElementById("user-controls");
const leaveRoom = document.getElementById("leave-room");
const muteBtn = document.getElementById("mute-button");

let roomName = null;

/**
 * Connect to a Room with the Dominant Speaker API enabled.
 * This API is available only in Small Group or Group Rooms.
 * @param {string} token - Token for joining the Room
 * @returns {CancelablePromise<Room>}
 */
function connectToRoomWithDominantSpeaker(token, communityRoom) {
  return Video.connect(token, {
    dominantSpeaker: true,
    audio: true,
    video: { width: 320 },
    name: communityRoom
  });
}

/**
 * Listen to changes in the dominant speaker and update your application.
 * @param {Room} room - The Room you just joined
 * @param {function} updateDominantSpeaker - Updates the app UI with the new dominant speaker
 * @returns {void}
 */
function setupDominantSpeakerUpdates(room, updateDominantSpeaker) {
  room.on("dominantSpeakerChanged", function(participant) {
    console.log("A new RemoteParticipant is now the dominant speaker:", participant);
    updateDominantSpeaker(participant);
  });
}

/**
 * creates a button and adds to given container.
 */
function createButton(text, container) {
  const btn = document.createElement("button");
  btn.innerHTML = text;
  btn.classList.add("btn", "btn-outline-primary", "btn-sm");
  container.appendChild(btn);
  return btn;
}

/**
 *
 * creates controls for user to mute/unmute and disconnect
 * from the room.
 */
async function createUserControls(userIdentity) {
  const creds = await getRoomCredentials(userIdentity);
  let room = null;

  const currentUserControls = document.createElement("div");
  currentUserControls.classList.add("usercontrol");

  const title = document.createElement("h6");
  title.appendChild(document.createTextNode(creds.identity));
  currentUserControls.appendChild(title);

  // connect button
  const connectDisconnect = createButton("Connect", currentUserControls);
  connectDisconnect.onclick = async function(event) {
    connectDisconnect.disabled = true;
    const connected = room !== null;
    if (connected) {
      room.disconnect();
      room = null;
      muteBtn.innerHTML = "Mute";
    } else {
      room = await connectToRoom(creds);
    }
    connectDisconnect.innerHTML = connected ? "Connect" : "Disconnect";
    muteBtn.style.display = connected ? "none" : "inline";
    connectDisconnect.disabled = false;
  };

  // mute button.
  const muteBtn = createButton("Mute", currentUserControls);
  muteBtn.onclick = function() {
    const mute = muteBtn.innerHTML == "Mute";
    const localUser = room.localParticipant;
    getTracks(localUser).forEach(function(track) {
      if (track.kind === "audio") {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });
    muteBtn.innerHTML = mute ? "Unmute" : "Mute";
  };
  muteBtn.style.display = "none";
  userControls.appendChild(currentUserControls);
}

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom(creds) {
  const room = await Video.connect(creds.token, {
    name: roomName
  });

  return room;
}

/**
 * Get the Tracks of the given Participant.
 */
function getTracks(participant) {
  return Array.from(participant.tracks.values())
    .filter(function(publication) {
      return publication.track;
    })
    .map(function(publication) {
      return publication.track;
    });
}

/**
 * add/removes css attribute per dominant speaker change.
 * @param {?Participant} speaker - Participant
 * @returns {void}
 */
function updateDominantSpeaker(speaker) {
  const dominantSpeakerDiv = document.querySelector("div.dominant_speaker");
  if (dominantSpeakerDiv) {
    dominantSpeakerDiv.classList.remove("dominant_speaker");
  }
  if (speaker) {
    const newDominantSpeakerDiv = document.getElementById(speaker.sid);
    if (newDominantSpeakerDiv) {
      newDominantSpeakerDiv.classList.add("dominant_speaker");
    }
  }
}

/**
 * Get the Room credentials from the server.
 * @param {string} [identity] identitiy to use, if not specified server generates random one.
 * @returns {Promise<{identity: string, token: string}>}
 */
async function getRoomCredentials(identity) {
  const tokenUrl = "/videoToken" + (identity ? "?identity=" + identity : "");
  const response = await fetch(tokenUrl);
  return response.json();
}

(async function() {
  // Get the credentials to connect to the Room.

  // REPLACE THIS WITH THE SESSION IDENTITY FROM EXPRESS and COMMUNITY
  let participantIdentity = firstName;
  let communityRoom = jamSession;

  const creds = await getRoomCredentials(participantIdentity);

  // Connect to a random Room with no media. This Participant will
  // display the media of the other Participants that will enter
  // the Room and watch for dominant speaker updates.
  let someRoom = await connectToRoomWithDominantSpeaker(creds.token, communityRoom);

  setupDominantSpeakerUpdates(someRoom, updateDominantSpeaker);

  // Set the name of the Room to which the Participant that shares
  // media should join.
  joinRoomBlock.style.display = "inline-block";
  roomName = someRoom.name;
  roomNameText.appendChild(document.createTextNode(roomName));

  //   // create controls to connect few users
  //  createUserControls(participantIdentity);

  // Attach LocalParticipant's Tracks, if not already attached.
  Video.createLocalVideoTrack().then(track => {
    const localMediaContainer = document.getElementById("local-media");
    localMediaContainer.appendChild(track.attach());
  });

  // Attach the Tracks of the Room's Existing Participants.
  someRoom.participants.forEach(function(participant) {
    const participantdiv = document.createElement("div");
    participantdiv.id = participant.sid;
    const mediaDiv = document.createElement("div");
    mediaDiv.classList.add("mediadiv");

    const title = document.createElement("h6");
    title.appendChild(document.createTextNode(participant.identity));
    mediaDiv.appendChild(title);

    participant.on("trackSubscribed", function(track) {
      mediaDiv.appendChild(track.attach());
    });
    participantdiv.appendChild(mediaDiv);
    mediaContainer.appendChild(participantdiv);
  });

  someRoom.on("participantConnected", function(participant) {
    const participantdiv = document.createElement("div");
    participantdiv.id = participant.sid;
    const mediaDiv = document.createElement("div");
    mediaDiv.classList.add("mediadiv");

    const title = document.createElement("h6");
    title.appendChild(document.createTextNode(participant.identity));
    mediaDiv.appendChild(title);

    participant.on("trackSubscribed", function(track) {
      mediaDiv.appendChild(track.attach());
    });
    participantdiv.appendChild(mediaDiv);
    mediaContainer.appendChild(participantdiv);
  });

  someRoom.on("participantDisconnected", function(participant) {
    getTracks(participant).forEach(function(track) {
      track.detach().forEach(function(element) {
        element.remove();
      });
    });
    const participantDiv = document.getElementById(participant.sid);
    participantDiv.parentNode.removeChild(participantDiv);
  });

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    someRoom.disconnect();
    someRoom = null;
  };

  leaveRoom.addEventListener("click", () => {
    console.log(someRoom);
    if (someRoom) {
      someRoom.disconnect();
      someRoom = null;
      window.location.replace("https://dcjamsession.herokuapp.com/profilePage");
    }
  });

  muteBtn.addEventListener("click", () => {
    const mute = muteBtn.innerHTML == "Mute";
    const localUser = someRoom.localParticipant;
    getTracks(localUser).forEach(function(track) {
      if (track.kind === "audio") {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });
    muteBtn.innerHTML = mute ? "Unmute" : "Mute";
  });
})();
