// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, deleteDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ---- FIREBASE & GLOBAL VARS ----
const firebaseConfig = {
    apiKey: "AIzaSyBpVHnjF5gdTm3vJiHEoAZCowsRkTapj_4",
    authDomain: "hokm-d6911.firebaseapp.com",
    projectId: "hokm-d6911",
    storageBucket: "hokm-d6911.appspot.com",
    messagingSenderId: "128133280011",
    appId: "1:128133280011:web:c9fe28f5201eef7a3a320e"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let currentActiveScreen, currentUserData, unsubscribeLobbies, unsubscribeLobbyDetail;
let currentLobbyId = null;

// ---- VOICE CHAT VARS ----
const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };
let localStream;
let peerConnections = {};
let voiceUnsubscribes = [];
let isMuted = false;

// ---- DOM ELEMENTS ----
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const lobbiesList = document.getElementById('lobbies-list');
const playerSlotsGrid = lobbyDetailScreen.querySelector('.player-slots-grid');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const addIconBtn = document.getElementById('add-icon-btn');
const createLobbyModal = document.getElementById('create-lobby-modal');
const createLobbyForm = document.getElementById('create-lobby-form');
const remoteAudiosContainer = document.getElementById('remote-audios');
const toggleMuteBtn = document.getElementById('toggle-mute-btn');
const voiceStatus = document.getElementById('voice-status');

// ---- UI & HELPER FUNCTIONS ----

function showMessageBox(message, type = 'info') {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.className = 'mt-5 p-3.5 rounded-xl text-base text-center'; // Reset classes
    const typeClasses = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    messageBox.classList.add(...(typeClasses[type] || typeClasses.info).split(' '));
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

function setActiveScreen(newScreen) {
    if (currentActiveScreen) {
        currentActiveScreen.classList.add('hidden');
    }
    newScreen.classList.remove('hidden');
    currentActiveScreen = newScreen;
}

// ---- VOICE CHAT FUNCTIONS ----

// SVG Icons for Mute/Unmute button
const micOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
const micOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;

async function initVoiceChat(lobbyId) {
    console.log(`Initializing voice chat for lobby: ${lobbyId}`);
    voiceStatus.textContent = 'در حال اتصال به چت صوتی...';
    toggleMuteBtn.innerHTML = micOnIcon;
    toggleMuteBtn.classList.remove('muted');
    isMuted = false;

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        voiceStatus.textContent = 'چت صوتی: فعال';

        const myId = auth.currentUser.uid;
        const voiceChannelRef = collection(db, 'voice_channels', lobbyId, 'members');

        // Announce presence
        await setDoc(doc(voiceChannelRef, myId), { name: currentUserData.displayName });

        // Listen for other members
        const membersUnsubscribe = onSnapshot(voiceChannelRef, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                const remoteId = change.doc.id;
                if (remoteId === myId) return;

                if (change.type === "added") {
                    console.log(`Peer ${remoteId} added. Creating connection.`);
                    peerConnections[remoteId] = createPeerConnection(lobbyId, myId, remoteId);
                    // The "polite" peer (lexicographically smaller ID) initiates the connection
                    if (myId < remoteId) {
                       await sendOffer(lobbyId, myId, remoteId);
                    }
                }
                if (change.type === "removed") {
                    console.log(`Peer ${remoteId} removed. Closing connection.`);
                    closePeerConnection(remoteId);
                }
            });
        });
        voiceUnsubscribes.push(membersUnsubscribe);

        // Listen for signals
        const signalsRef = collection(db, 'voice_channels', lobbyId, 'signals');
        const signalsQuery = query(signalsRef, where("to", "==", myId));
        const signalsUnsubscribe = onSnapshot(signalsQuery, (snapshot) => {
            snapshot.docs.forEach(async (document) => {
                const signalData = document.data();
                const remoteId = signalData.from;
                const pc = peerConnections[remoteId];

                if (!pc) return;

                try {
                    if (signalData.offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await sendSignal(lobbyId, myId, remoteId, { answer });
                    } else if (signalData.answer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
                    } else if (signalData.iceCandidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.iceCandidate));
                    }
                } catch (err) {
                    console.error("Error processing signal:", err);
                }
                 // Clean up processed signal
                await deleteDoc(document.ref);
            });
        });
        voiceUnsubscribes.push(signalsUnsubscribe);

    } catch (err) {
        console.error("Could not get microphone access:", err);
        voiceStatus.textContent = 'خطا در دسترسی به میکروفون';
        showMessageBox("برای استفاده از چت صوتی، لطفاً دسترسی به میکروفون را مجاز کنید.", "error");
    }
}

function createPeerConnection(lobbyId, myId, remoteId) {
    const pc = new RTCPeerConnection(servers);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal(lobbyId, myId, remoteId, { iceCandidate: event.candidate.toJSON() });
        }
    };

    pc.ontrack = (event) => {
        console.log(`Track received from ${remoteId}`);
        let audioEl = document.getElementById(`audio-${remoteId}`);
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = `audio-${remoteId}`;
            audioEl.autoplay = true;
            remoteAudiosContainer.appendChild(audioEl);
        }
        audioEl.srcObject = event.streams[0];
        setupAudioVisualizer(event.streams[0], remoteId);
    };

    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    return pc;
}

async function sendOffer(lobbyId, myId, remoteId) {
    const pc = peerConnections[remoteId];
    if (!pc) return;
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(lobbyId, myId, remoteId, { offer });
    } catch(err){
        console.error("Error creating offer:", err);
    }
}

async function sendSignal(lobbyId, fromId, toId, data) {
    const signalsRef = collection(db, 'voice_channels', lobbyId, 'signals');
    await addDoc(signalsRef, { ...data, from: fromId, to: toId });
}

function closePeerConnection(remoteId) {
    const pc = peerConnections[remoteId];
    if (pc) {
        pc.close();
        delete peerConnections[remoteId];
        const audioEl = document.getElementById(`audio-${remoteId}`);
        if (audioEl) audioEl.remove();
        const playerSlot = document.querySelector(`.player-slot[data-uid="${remoteId}"]`);
        if (playerSlot) playerSlot.classList.remove('speaking');
    }
}

async function hangupVoiceChat() {
    console.log("Hanging up voice chat.");
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    Object.keys(peerConnections).forEach(closePeerConnection);
    peerConnections = {};

    voiceUnsubscribes.forEach(unsub => unsub());
    voiceUnsubscribes = [];

    if (currentLobbyId && auth.currentUser) {
        const myMemberRef = doc(db, 'voice_channels', currentLobbyId, 'members', auth.currentUser.uid);
        await deleteDoc(myMemberRef).catch(err => console.error("Error removing self from voice members", err));
    }
    voiceStatus.textContent = 'چت صوتی: غیرفعال';
}

function setupAudioVisualizer(stream, remoteId) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function checkSpeaking() {
        if (!peerConnections[remoteId]) { // Stop if connection is closed
            return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = dataArray.reduce((a, b) => a + b, 0);
        let average = sum / bufferLength;

        const playerSlot = document.querySelector(`.player-slot[data-uid="${remoteId}"]`);
        if(playerSlot){
             if (average > 10) { // Speaking threshold
                playerSlot.classList.add('speaking');
            } else {
                playerSlot.classList.remove('speaking');
            }
        }
        requestAnimationFrame(checkSpeaking);
    }
    checkSpeaking();
}

toggleMuteBtn.addEventListener('click', () => {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    toggleMuteBtn.innerHTML = isMuted ? micOffIcon : micOnIcon;
    toggleMuteBtn.classList.toggle('muted', isMuted);
});

// ---- GAME LOGIC FUNCTIONS ----

// ... (Existing game logic from script.txt will be pasted here, with modifications)
// For brevity, I will only show the modified functions

async function joinLobby(lobbyId, userId, displayName) {
    // ... (existing joinLobby logic up to the success point)
    try {
        //... after successful Firestore update ...
        showMessageBox(`شما به لابی "${lobbyData.name}" وارد شدید.`, "success");
        currentLobbyId = lobbyId;
        setActiveScreen(lobbyDetailScreen);
        unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);

        // INITIATE VOICE CHAT
        await initVoiceChat(lobbyId);

    } catch (e) {
       // ... existing error handling
    }
}

async function leaveLobby() {
    // INITIATE VOICE HANGUP FIRST
    await hangupVoiceChat();
    // ... then the rest of the existing leaveLobby logic ...
    // ... e.g., deleting lobby doc or removing player from array
    // This ensures signaling is torn down before DB records are gone.

    if (!currentLobbyId || !auth.currentUser) return;
    const lobbyRef = doc(db, `global_lobbies`, currentLobbyId);
    // ... rest of original leaveLobby code
}


function setupLobbyDetailListener(lobbyId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    return onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            // ... (rest of the UI update logic)

            // Modify player slot rendering to include data-uid
            playerSlotsGrid.innerHTML = ''; // Clear existing slots
            for (let i = 0; i < maxPlayers; i++) {
                const player = players[i];
                const playerSlot = document.createElement('div');
                playerSlot.className = `player-slot ${player ? 'filled' : ''}`;
                
                // Add UID to dataset for voice indicator
                if (player) {
                    playerSlot.dataset.uid = player.uid;
                }

                playerSlot.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="player-avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>${player ? player.displayName : 'جایگاه خالی'}</span>
                `;
                // ... (rest of the player slot logic like adding click listener for host)
                playerSlotsGrid.appendChild(playerSlot);
            }
        } else {
            // Lobby was deleted, hang up voice chat
            hangupVoiceChat();
            // ... (rest of the logic to go back to lobby list)
        }
    });
}


// ---- EVENT LISTENERS ----
// All other event listeners from the original script remain the same.
// Only the ones that trigger lobby joining/leaving are affected and shown above.

window.onload = () => {
    setActiveScreen(loadingScreen);
    // ... (the rest of the initialization logic)
};

// Paste the REST of your original script.js here, replacing the functions shown above.
// The functions not shown (like authentication, modal management, etc.) remain unchanged.
// The key is to integrate the `initVoiceChat` and `hangupVoiceChat` calls at the correct points.

// NOTE: This is a partial script. You need to combine this with your existing script.js
// I have provided the NEW voice chat functions and pointed out WHERE to modify your
// existing `joinLobby`, `leaveLobby`, and `setupLobbyDetailListener` functions.
