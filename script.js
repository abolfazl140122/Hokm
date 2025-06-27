// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, deleteDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpVHnjF5gdTm3vJiHEoAZCowsRkTapj_4",
    authDomain: "hokm-d6911.firebaseapp.com",
    projectId: "hokm-d6911",
    storageBucket: "hokm-d6911.appspot.com",
    messagingSenderId: "128133280011",
    appId: "1:128133280011:web:c9fe28f5201eef7a3a320e",
    measurementId: "G-LN0S9W86MK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables for Firebase context
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
// ... other DOM element variables
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const displayNameField = document.getElementById('display-name-field');
const passwordInput = document.getElementById('password');
const loginToggleBtn = document.getElementById('login-toggle-btn');
const registerToggleBtn = document.getElementById('register-toggle-btn');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const messageBox = document.getElementById('message-box');
const headerDisplayName = document.getElementById('header-display-name');
const headerUserId = document.getElementById('header-user-id');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn');
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn');
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn');
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileSummary = document.getElementById('profile-summary');
const playerSlotsGrid = lobbyDetailScreen.querySelector('.player-slots-grid');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const detailPlayerCount = document.getElementById('detail-player-count');
const startGameBtn = document.getElementById('start-game-btn');

// Voice Chat Elements
const toggleMuteBtn = document.getElementById('toggle-mute-btn');
const voiceChatUsersContainer = document.getElementById('voice-chat-users');
const remoteAudioContainer = document.getElementById('remote-audio-container');


// State variables
let currentActiveScreen = loadingScreen;
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
let currentLobbyId = null;
let authMode = 'login';

// --- Voice Chat State Variables ---
let localStream = null;
let peerConnections = {}; // key: remoteUserId, value: RTCPeerConnection
let isMuted = false;
let signalingUnsubscribe = null;

// WebRTC STUN servers configuration
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// --- Core App Logic ---

// Function to transition between screens
function setActiveScreen(newScreen) {
    if (currentActiveScreen) {
        currentActiveScreen.classList.add('hidden');
    }
    newScreen.classList.remove('hidden');
    currentActiveScreen = newScreen;
}

// Function to show custom message box
function showMessageBox(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    const typeClasses = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        info: 'bg-blue-500 text-white',
    };
    messageBox.classList.add(...(typeClasses[type] || typeClasses.info).split(' '));
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 5000);
}

// Firebase Authentication State Listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserData = { uid: user.uid, email: user.email, ...userDocSnap.data() };
        } else {
            currentUserData = { uid: user.uid, email: user.email, displayName: user.email.split('@')[0] };
        }
        headerDisplayName.textContent = currentUserData.displayName;
        headerUserId.textContent = `ID: ${user.uid.substring(0, 8)}...`;
        setActiveScreen(mainScreen);
    } else {
        currentUserData = null;
        setActiveScreen(authScreen);
        cleanupVoiceChat(); // Clean up voice chat on logout
    }
});

// Auth form submission logic
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    const displayName = displayNameInput.value;

    try {
        if (authMode === 'register') {
            if (!displayName) {
                showMessageBox("لطفا نام نمایشی را وارد کنید.", "error");
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
            await setDoc(userDocRef, { displayName, email });
            showMessageBox("ثبت نام موفقیت آمیز بود!", "success");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showMessageBox("با موفقیت وارد شدید!", "success");
        }
    } catch (error) {
        showMessageBox(error.message, 'error');
    }
});

loginToggleBtn.addEventListener('click', () => {
    authMode = 'login';
    displayNameField.classList.add('hidden');
    submitAuthBtn.textContent = 'ورود';
});

registerToggleBtn.addEventListener('click', () => {
    authMode = 'register';
    displayNameField.classList.remove('hidden');
    submitAuthBtn.textContent = 'ثبت نام';
});

profileLogoutBtn.addEventListener('click', () => signOut(auth));


// --- Lobby Logic ---

// Navigate to lobby screen
friendlyGameBtn.addEventListener('click', () => {
    setActiveScreen(lobbyScreen);
    if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = setupLobbyListener();
});

// Back to main screen
backToMainBtn.addEventListener('click', () => {
    setActiveScreen(mainScreen);
    if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = null;
});

// Show create lobby modal
addIconBtn.addEventListener('click', () => createLobbyModal.classList.remove('hidden'));
closeCreateLobbyModalBtn.addEventListener('click', () => createLobbyModal.classList.add('hidden'));

// Create a new lobby
createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    if (!lobbyName || !currentUserData) return;

    try {
        const newLobbyRef = await addDoc(collection(db, 'global_lobbies'), {
            name: lobbyName,
            hostId: currentUserData.uid,
            status: "waiting",
            players: [{ uid: currentUserData.uid, displayName: currentUserData.displayName }],
            kickedPlayers: [],
            createdAt: serverTimestamp(),
            gameSettings: { maxPlayers: 4 }
        });
        createLobbyModal.classList.add('hidden');
        createLobbyForm.reset();
        // Automatically join the lobby detail screen
        joinLobby(newLobbyRef.id, currentUserData.uid, currentUserData.displayName);
    } catch (error) {
        showCreateLobbyMessageBox(error.message, 'error');
    }
});

// Refresh lobby list
refreshLobbiesBtn.addEventListener('click', () => {
     if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = setupLobbyListener();
    showMessageBox("لیست لابی‌ها بروزرسانی شد.", "info");
});

// Setup real-time listener for lobbies
function setupLobbyListener() {
    const q = query(collection(db, `global_lobbies`), where("status", "==", "waiting"));
    return onSnapshot(q, (snapshot) => {
        lobbiesList.innerHTML = '';
        if (snapshot.empty) {
            lobbiesList.innerHTML = '<p class="text-gray-400">هیچ لابی فعالی وجود ندارد.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item';
            const playerCount = lobby.players.length;
            const maxPlayers = lobby.gameSettings.maxPlayers;
            const hostDisplayName = lobby.players[0]?.displayName || 'ناشناس';

            lobbyItem.innerHTML = `
                <div class="flex-grow text-right">
                    <h3 class="text-xl font-bold">${lobby.name}</h3>
                    <p class="text-sm">سازنده: ${hostDisplayName}</p>
                    <p class="text-sm">بازیکنان: ${playerCount}/${maxPlayers}</p>
                </div>
                <div class="lobby-actions">
                    <button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic" ${playerCount >= maxPlayers ? 'disabled' : ''}>
                        ورود
                    </button>
                </div>
            `;
            lobbiesList.appendChild(lobbyItem);
        });

        lobbiesList.querySelectorAll('.join-lobby-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const lobbyId = e.currentTarget.dataset.lobbyId;
                joinLobby(lobbyId, currentUserData.uid, currentUserData.displayName);
            });
        });
    });
}

// Join a lobby and transition to detail screen
async function joinLobby(lobbyId, userId, displayName) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) {
        showMessageBox("لابی یافت نشد", "error");
        return;
    }
    const lobbyData = lobbySnap.data();

    if (!lobbyData.players.some(p => p.uid === userId)) {
        if (lobbyData.players.length >= lobbyData.gameSettings.maxPlayers) {
            showMessageBox("لابی پر است.", "error");
            return;
        }
        await updateDoc(lobbyRef, {
            players: [...lobbyData.players, { uid: userId, displayName: displayName }]
        });
    }

    currentLobbyId = lobbyId;
    setActiveScreen(lobbyDetailScreen);
    if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
    unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);
}

// Setup listener for a single lobby's details
function setupLobbyDetailListener(lobbyId) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    initVoiceChat(lobbyId); // Initialize voice chat when entering a lobby
    return onSnapshot(lobbyRef, (docSnap) => {
        if (!docSnap.exists()) {
            showMessageBox("این لابی بسته شده است.", "info");
            setActiveScreen(lobbyScreen);
            cleanupVoiceChat(); // Clean up voice chat when lobby is gone
            if (unsubscribeLobbies) unsubscribeLobbies();
            unsubscribeLobbies = setupLobbyListener();
            return;
        }

        const lobbyData = docSnap.data();
        detailLobbyName.textContent = lobbyData.name;
        detailHostName.textContent = `سازنده: ${lobbyData.players[0]?.displayName || 'ناشناس'}`;
        const playerCount = lobbyData.players.length;
        const maxPlayers = lobbyData.gameSettings.maxPlayers;
        detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${maxPlayers}`;

        // Render player slots
        playerSlotsGrid.innerHTML = '';
        for (let i = 0; i < maxPlayers; i++) {
            const player = lobbyData.players[i];
            const playerSlot = document.createElement('div');
            playerSlot.className = `player-slot ${player ? 'filled' : ''}`;
            playerSlot.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="player-avatar" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>
                <span>${player ? player.displayName : 'جایگاه خالی'}</span>`;
            playerSlotsGrid.appendChild(playerSlot);
        }
        
        // Update voice chat UI
        updateVoiceChatUI(lobbyData.players);

        // Enable start button for host if lobby is full
        if (lobbyData.hostId === currentUserData.uid) {
            startGameBtn.style.display = 'block';
            startGameBtn.disabled = playerCount !== maxPlayers;
        } else {
            startGameBtn.style.display = 'none';
        }
    });
}

// Leave the current lobby
leaveLobbyBtn.addEventListener('click', async () => {
    if (!currentLobbyId || !currentUserData) return;

    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (lobbySnap.exists()) {
        const lobbyData = lobbySnap.data();
        // If host leaves, delete the lobby
        if (lobbyData.hostId === currentUserData.uid) {
            await deleteDoc(lobbyRef);
             // Also delete signaling subcollection
            const signalingQuery = query(collection(db, `global_lobbies/${currentLobbyId}/signaling`));
            const signalingDocs = await getDocs(signalingQuery);
            const batch = writeBatch(db);
            signalingDocs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

        } else {
            // If player leaves, remove them from the players array
            const updatedPlayers = lobbyData.players.filter(p => p.uid !== currentUserData.uid);
            await updateDoc(lobbyRef, { players: updatedPlayers });
        }
    }
    
    // Cleanup and navigate away
    cleanupVoiceChat();
    currentLobbyId = null;
    setActiveScreen(lobbyScreen);
    if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = setupLobbyListener();
});


// --- WebRTC Voice Chat Logic ---

// 1. Initialize Voice Chat and Get Mic Access
async function initVoiceChat(lobbyId) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Initially mute self to prevent immediate feedback loops
        toggleMute(true); 
        updateMuteButton();
        
        // Setup listener for signaling messages from other users
        const signalingRef = collection(db, `global_lobbies/${lobbyId}/signaling`);
        const q = query(signalingRef, where("to", "==", currentUserData.uid));

        signalingUnsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const signal = change.doc.data();
                    const fromId = signal.from;

                    // Ensure a peer connection exists
                    if (!peerConnections[fromId]) {
                        await createPeerConnection(fromId, lobbyId);
                    }
                    
                    const pc = peerConnections[fromId];

                    if (signal.offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        const answerSignalRef = doc(collection(db, `global_lobbies/${lobbyId}/signaling`));
                        await setDoc(answerSignalRef, { from: currentUserData.uid, to: fromId, answer: pc.localDescription });
                    }

                    if (signal.answer && pc.signalingState !== 'stable') {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
                    }

                    if (signal.iceCandidate) {
                        try {
                           await pc.addIceCandidate(new RTCIceCandidate(signal.iceCandidate));
                        } catch(e){
                            console.error('Error adding received ice candidate', e);
                        }
                    }

                    // Delete signal doc after processing
                    await deleteDoc(change.doc.ref);
                }
            });
        });

    } catch (err) {
        console.error("Could not get mic access:", err);
        showMessageBox("برای چت صوتی نیاز به دسترسی میکروفون است.", "error");
    }
}


// 2. Create a Peer Connection for a specific user
async function createPeerConnection(remoteUserId, lobbyId) {
    if (peerConnections[remoteUserId]) return;

    peerConnections[remoteUserId] = new RTCPeerConnection(servers);
    const pc = peerConnections[remoteUserId];

    // Add local stream tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    }

    // Handle incoming remote tracks
    pc.ontrack = event => {
        let audioEl = document.getElementById(`audio-${remoteUserId}`);
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = `audio-${remoteUserId}`;
            audioEl.autoplay = true;
            remoteAudioContainer.appendChild(audioEl);
        }
        audioEl.srcObject = event.streams[0];
        updateSpeakingIndicator(remoteUserId, true, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = event => {
        if (event.candidate) {
            const iceCandidateRef = doc(collection(db, `global_lobbies/${lobbyId}/signaling`));
            setDoc(iceCandidateRef, {
                from: currentUserData.uid,
                to: remoteUserId,
                iceCandidate: event.candidate.toJSON()
            });
        }
    };
    
    // Create an offer to initiate connection
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const offerSignalRef = doc(collection(db, `global_lobbies/${lobbyId}/signaling`));
    await setDoc(offerSignalRef, { from: currentUserData.uid, to: remoteUserId, offer: pc.localDescription });

}


// 3. Update the UI for Voice Chat users
function updateVoiceChatUI(players) {
    if (!voiceChatUsersContainer) return;
    voiceChatUsersContainer.innerHTML = '';
    players.forEach(player => {
        const isSelf = player.uid === currentUserData.uid;
        
        const userDiv = document.createElement('div');
        userDiv.id = `voice-user-${player.uid}`;
        userDiv.className = 'voice-user-indicator';
        
        userDiv.innerHTML = `
            <svg class="voice-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
            <span class="voice-name">${player.displayName}</span>
        `;
        voiceChatUsersContainer.appendChild(userDiv);
        
        if (isSelf && isMuted) {
            userDiv.classList.add('muted');
        }

        // Call createPeerConnection for new players
        if (!isSelf && !peerConnections[player.uid] && localStream) {
            createPeerConnection(player.uid, currentLobbyId);
        }
    });

    // Cleanup connections for players who left
    const playerIds = players.map(p => p.uid);
    for (const remoteId in peerConnections) {
        if (!playerIds.includes(remoteId)) {
            peerConnections[remoteId].close();
            delete peerConnections[remoteId];
            const audioEl = document.getElementById(`audio-${remoteId}`);
            if (audioEl) audioEl.remove();
        }
    }
}


// 4. Mute/Unmute Logic
toggleMuteBtn.addEventListener('click', () => toggleMute());

function toggleMute(forceMute = null) {
    isMuted = forceMute !== null ? forceMute : !isMuted;
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });
    }
    updateMuteButton();
    const selfIndicator = document.getElementById(`voice-user-${currentUserData.uid}`);
    if(selfIndicator){
        selfIndicator.classList.toggle('muted', isMuted);
    }
}

function updateMuteButton() {
    toggleMuteBtn.innerHTML = isMuted ?
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>` :
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    toggleMuteBtn.classList.toggle('btn-red-classic', isMuted);
    toggleMuteBtn.classList.toggle('btn-blue-classic', !isMuted);
}

// Simple speaking indicator (optional bonus)
function updateSpeakingIndicator(userId, isSpeaking, stream) {
    const indicator = document.getElementById(`voice-user-${userId}`);
    if (indicator) {
        // A more advanced implementation would use AnalyserNode.
        // For now, we'll just toggle based on track existence.
        indicator.classList.toggle('speaking', isSpeaking);
    }
}


// 5. Cleanup Voice Chat
function cleanupVoiceChat() {
    // Stop local media tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Close all peer connections
    for (const userId in peerConnections) {
        if (peerConnections[userId]) {
            peerConnections[userId].close();
        }
    }
    peerConnections = {};

    // Unsubscribe from signaling
    if (signalingUnsubscribe) {
        signalingUnsubscribe();
        signalingUnsubscribe = null;
    }

    // Remove remote audio elements
    remoteAudioContainer.innerHTML = '';
}


// --- Initial Load ---
window.onload = () => {
    setActiveScreen(loadingScreen);
    // onAuthStateChanged will handle the rest of the flow
};
