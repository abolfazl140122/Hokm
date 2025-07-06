// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, deleteField, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; 

// Firebase Configuration (from user's input)
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

// Global variables for Firebase context (as per environment instructions)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- DOM Elements ---
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
// Auth
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const passwordInput = document.getElementById('password');
// Lobby List
const backToMainBtn = document.getElementById('back-to-main-btn');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn');
// Lobby Detail
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const playerListContainer = document.getElementById('player-list-container');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container');
const startGameBtn = document.getElementById('start-game-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatForm = document.getElementById('lobby-chat-form');
const lobbyChatInput = document.getElementById('lobby-chat-input');
const lobbyChatSendBtn = document.getElementById('lobby-chat-send-btn');
// Create Lobby Modal
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn');
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const roundDurationSelect = document.getElementById('round-duration-select'); // NEW
// Message Boxes
const messageBox = document.getElementById('message-box');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
// --- NEW Game Elements ---
const gameCountdownOverlay = document.getElementById('game-countdown-overlay');
const countdownTimerDisplay = document.getElementById('countdown-timer-display');
const gameInfoContainer = document.getElementById('game-info-container');
const roundTimerDisplay = document.getElementById('round-timer-display');
const myRoleDisplay = document.getElementById('my-role-display');
const votingModal = document.getElementById('voting-modal');
const votingOptionsContainer = document.getElementById('voting-options-container');
const submitVoteBtn = document.getElementById('submit-vote-btn');
const voteMessageBox = document.getElementById('vote-message-box');


// --- State Variables ---
let currentActiveScreen = loadingScreen;
let currentUserData = null;
let unsubscribeLobbyDetail = null;
let unsubscribeLobbyChat = null;
let currentLobbyId = null;
let myRole = null; // 'human', 'ai', or 'spectator'
let gameTimerInterval = null;
let selectedVoteTarget = null;


// --- Helper Functions ---
function showCustomMessage(element, message, type = 'info', duration = 5000) {
    element.textContent = message;
    element.className = 'p-3.5 rounded-xl text-base text-center';
    if (type === 'error') element.classList.add('bg-red-500', 'text-white');
    else if (type === 'success') element.classList.add('bg-green-500', 'text-white');
    else element.classList.add('bg-blue-500', 'text-white');
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), duration);
}
const showMessageBox = (msg, type) => showCustomMessage(messageBox, msg, type);

function setActiveScreen(newScreen) {
    if (currentActiveScreen === newScreen) return;
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeLobbyChat) { unsubscribeLobbyChat(); unsubscribeLobbyChat = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }
    
    currentActiveScreen.classList.add('page-transition-hidden');
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        newScreen.classList.remove('hidden');
        newScreen.classList.remove('page-transition-hidden');
        currentActiveScreen = newScreen;
    }, 600);
}


// --- Core Game Logic ---

/**
 * Checks if a message has a formal, AI-like tone using Gemini API.
 * @param {string} text - The message to check.
 * @returns {Promise<{is_ai_like: boolean}>} - The analysis result.
 */
async function checkMessageStyleWithAI(text) {
    const prompt = `You are a strict linguistic analyzer. Your task is to determine if the following Persian text sounds like it was written by a sophisticated, formal, literary AI. The tone should be "ادبی" and completely avoid modern slang, casual chat language, or overly simple sentences. Respond ONLY with a valid JSON object in this format: {"is_ai_like": boolean}. Do not add any other text or explanations. Text to analyze: "${text}"`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "is_ai_like": { "type": "BOOLEAN" } } } }
    };
    const apiKey = "AIzaSyDfMZwyWNnRFUDLHKR1t_hZ5cWv2c_KvvE"; // Replace with your actual key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { console.error("AI Style API HTTP Error:", response.status); return { is_ai_like: false }; }
        const result = await response.json();
        const jsonString = result.candidates[0]?.content?.parts[0]?.text;
        if (jsonString) {
            const parsedJson = JSON.parse(jsonString);
            return { is_ai_like: !!parsedJson.is_ai_like };
        }
        return { is_ai_like: false };
    } catch (error) {
        console.error("Error calling AI style checker:", error);
        // In case of API error, be lenient to not block the game.
        return { is_ai_like: true };
    }
}

/**
 * The host clicks "Start Game" and this function sets up the game state in Firestore.
 */
async function initiateGameStart(lobbyId) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) return;

    const lobbyData = lobbySnap.data();
    const playerIds = Object.keys(lobbyData.players);
    if (playerIds.length < 2) { // Minimum players check
        showMessageBox("برای شروع بازی حداقل به ۲ بازیکن نیاز است.", "error");
        return;
    }

    // Randomly select one player to be the AI
    const spyPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];

    const batch = writeBatch(db);
    batch.update(lobbyRef, {
        "game.status": "countdown",
        "game.spyPlayerId": spyPlayerId,
        "game.round": 1,
        "game.votes": {},
        "game.eliminatedPlayers": [],
        "game.winner": null,
    });
    
    await batch.commit();
}


/**
 * Displays the initial 5-second countdown for all players.
 * Only the host will update the state to 'discussion' afterwards.
 */
function showInitialCountdown(lobbyData) {
    gameCountdownOverlay.classList.remove('hidden');
    let count = 5;
    countdownTimerDisplay.textContent = count;

    const countdownInterval = setInterval(async () => {
        count--;
        countdownTimerDisplay.textContent = count;
        if (count <= 0) {
            clearInterval(countdownInterval);
            gameCountdownOverlay.classList.add('hidden');
            
            // Only the host transitions the game to the next state
            if (auth.currentUser?.uid === lobbyData.hostId) {
                const roundDuration = lobbyData.gameSettings.roundDuration || 90;
                const roundEndTime = new Date(Date.now() + roundDuration * 1000);
                
                await updateDoc(doc(db, 'global_lobbies', currentLobbyId), {
                    "game.status": "discussion",
                    "game.roundEndTime": roundEndTime
                });
            }
        }
    }, 1000);
}

/**
 * Starts the main round timer displayed in the sidebar.
 */
function startRoundTimer(endTime, lobbyId) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);

    gameTimerInterval = setInterval(async () => {
        const now = Date.now();
        const remaining = endTime.toMillis() - now;

        if (remaining <= 0) {
            clearInterval(gameTimerInterval);
            roundTimerDisplay.textContent = "00:00";
            
            // Host transitions the game to the voting phase
            const lobbySnap = await getDoc(doc(db, 'global_lobbies', lobbyId));
            if(lobbySnap.exists() && auth.currentUser?.uid === lobbySnap.data().hostId) {
                await updateDoc(doc(db, 'global_lobbies', lobbyId), {
                    "game.status": "voting"
                });
            }
        } else {
            const minutes = Math.floor((remaining / 1000) / 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            roundTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

/**
 * Handles the UI and logic for the discussion phase.
 */
function handleDiscussionPhase(lobbyData) {
    // Determine and display player's role
    if (lobbyData.game.spyPlayerId === auth.currentUser?.uid) {
        myRole = 'ai';
        myRoleDisplay.textContent = 'نقش شما: هوش مصنوعی';
        myRoleDisplay.className = 'font-semibold text-xl p-2 bg-black bg-opacity-30 rounded-lg role-ai';
    } else {
        myRole = 'human';
        myRoleDisplay.textContent = 'نقش شما: انسان';
        myRoleDisplay.className = 'font-semibold text-xl p-2 bg-black bg-opacity-30 rounded-lg role-human';
    }
    
    gameInfoContainer.classList.remove('hidden');
    lobbyChatInput.disabled = false;
    lobbyChatSendBtn.disabled = false;
    lobbyChatInput.placeholder = "با لحن ادبی و ماشینی صحبت کنید...";
    
    startRoundTimer(lobbyData.game.roundEndTime, currentLobbyId);
}

/**
 * Displays the voting modal and populates it with player options.
 */
function handleVotingPhase(lobbyData) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    lobbyChatInput.disabled = true;
    lobbyChatInput.placeholder = "رأی‌گیری در جریان است...";
    
    votingOptionsContainer.innerHTML = '';
    selectedVoteTarget = null;
    submitVoteBtn.disabled = true;
    
    const activePlayers = Object.entries(lobbyData.players).filter(([uid, _]) => !lobbyData.game.eliminatedPlayers.includes(uid));

    for (const [uid, displayName] of activePlayers) {
        if (uid === auth.currentUser.uid) continue; // Can't vote for self

        const option = document.createElement('button');
        option.className = 'vote-option';
        option.dataset.uid = uid;
        option.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>${displayName}</span>`;
        option.onclick = () => {
            document.querySelectorAll('.vote-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedVoteTarget = uid;
            submitVoteBtn.disabled = false;
        };
        votingOptionsContainer.appendChild(option);
    }
    
    votingModal.classList.remove('hidden');
}


/**
 * After everyone has voted, the host processes the results.
 */
async function processVotes(lobbyData) {
    const votes = lobbyData.game.votes;
    const voteCounts = {};
    for (const voterId in votes) {
        const targetId = votes[voterId];
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    }

    let maxVotes = 0;
    let eliminatedPlayerId = null;
    for (const playerId in voteCounts) {
        if (voteCounts[playerId] > maxVotes) {
            maxVotes = voteCounts[playerId];
            eliminatedPlayerId = playerId;
        }
    }
    
    // In case of a tie, for simplicity, we don't eliminate anyone.
    // A more complex game could have a re-vote.
    const tiedPlayers = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
    if (tiedPlayers.length > 1) {
        eliminatedPlayerId = null; 
    }
    
    // --- Check Win/Loss Conditions ---
    let winner = null;
    let finishReason = "";

    if (eliminatedPlayerId === lobbyData.game.spyPlayerId) {
        winner = 'humans';
        finishReason = `تیم انسان‌ها با شناسایی هوش مصنوعی (${lobbyData.players[eliminatedPlayerId]}) برنده شد!`;
    } else {
        const activePlayers = Object.keys(lobbyData.players).filter(uid => !lobbyData.game.eliminatedPlayers.includes(eliminatedPlayerId) && uid !== eliminatedPlayerId);
        if (activePlayers.length <= 2) {
            winner = 'ai';
            finishReason = `هوش مصنوعی با موفقیت در میان انسان‌ها باقی ماند و برنده شد!`;
        }
    }

    const updates = {};
    if (winner) {
        updates["game.status"] = "finished";
        updates["game.winner"] = winner;
        updates["game.finishReason"] = finishReason;
    } else {
        // Continue to next round
        updates["game.status"] = "discussion";
        updates["game.round"] = (lobbyData.game.round || 1) + 1;
        updates["game.votes"] = {};
        const roundDuration = lobbyData.gameSettings.roundDuration || 90;
        updates["game.roundEndTime"] = new Date(Date.now() + roundDuration * 1000);
    }

    if(eliminatedPlayerId) {
       updates["game.eliminatedPlayers"] = arrayUnion(eliminatedPlayerId);
    }
    
    await updateDoc(doc(db, 'global_lobbies', currentLobbyId), updates);
}

function handleFinishedPhase(lobbyData) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    votingModal.classList.add('hidden');
    gameInfoContainer.classList.add('hidden');
    
    const reason = lobbyData.game.finishReason;
    const winner = lobbyData.game.winner;
    
    if (winner === 'humans') {
        showMessageBox(`پایان بازی: ${reason}`, 'success', 10000);
    } else {
        showMessageBox(`پایان بازی: ${reason}`, 'error', 10000);
    }

    // After a delay, reset the lobby to 'waiting' state so a new game can be started.
    // Only the host does this.
    setTimeout(async () => {
        if (auth.currentUser?.uid === lobbyData.hostId) {
            await updateDoc(doc(db, 'global_lobbies', currentLobbyId), {
                "game": deleteField() // Removes the entire game object
            });
        }
    }, 10000);
}


// --- Main Firebase Listeners and Functions ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        const userDocSnap = await getDoc(userDocRef);
        currentUserData = {
            uid: user.uid,
            email: user.email,
            displayName: (userDocSnap.exists() && userDocSnap.data().displayName) ? userDocSnap.data().displayName : 'کاربر ناشناس'
        };
        setActiveScreen(mainScreen);
    } else {
        currentUserData = null;
        setActiveScreen(authScreen);
    }
});

// The main listener for the lobby, which acts as a state machine for the game.
function setupLobbyDetailListener(lobbyId) {
    currentLobbyId = lobbyId;
    myRole = null;
    
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    return onSnapshot(lobbyRef, (docSnap) => {
        if (!docSnap.exists()) {
            showMessageBox("لابی بسته شد.", "info");
            setActiveScreen(lobbyScreen);
            return;
        }

        const lobbyData = docSnap.data();
        const gameStatus = lobbyData.game?.status || 'waiting';

        // Update basic lobby info regardless of game state
        detailLobbyName.textContent = lobbyData.name;
        detailHostName.textContent = `سازنده: ${lobbyData.players[lobbyData.hostId] || 'ناشناس'}`;
        const playerCount = Object.keys(lobbyData.players).length;
        detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${lobbyData.gameSettings.maxPlayers}`;
        
        // Update player list visuals (e.g., show eliminated players)
        playerListContainer.innerHTML = '';
        Object.entries(lobbyData.players).forEach(([uid, name]) => {
            const item = document.createElement('div');
            item.className = 'player-list-item';
            if(lobbyData.game?.eliminatedPlayers?.includes(uid)) {
                item.classList.add('eliminated');
            }
            item.innerHTML = `<span>${name}</span>`;
            playerListContainer.appendChild(item);
        });

        // --- GAME STATE MACHINE ---
        switch (gameStatus) {
            case 'waiting':
                gameInfoContainer.classList.add('hidden');
                hostActionsContainer.style.display = (auth.currentUser?.uid === lobbyData.hostId) ? 'flex' : 'none';
                startGameBtn.disabled = playerCount < lobbyData.gameSettings.maxPlayers;
                lobbyChatInput.disabled = false;
                myRole = null;
                break;
            case 'countdown':
                hostActionsContainer.style.display = 'none';
                lobbyChatInput.disabled = true;
                showInitialCountdown(lobbyData);
                break;
            case 'discussion':
                hostActionsContainer.style.display = 'none';
                votingModal.classList.add('hidden');
                handleDiscussionPhase(lobbyData);
                break;
            case 'voting':
                hostActionsContainer.style.display = 'none';
                handleVotingPhase(lobbyData);
                break;
            case 'finished':
                hostActionsContainer.style.display = 'none';
                handleFinishedPhase(lobbyData);
                break;
        }

        // Check if all votes are in
        if (gameStatus === 'voting') {
            const activePlayersCount = Object.keys(lobbyData.players).filter(uid => !lobbyData.game.eliminatedPlayers.includes(uid)).length;
            const voteCount = Object.keys(lobbyData.game.votes).length;
            if (voteCount === activePlayersCount && auth.currentUser?.uid === lobbyData.hostId) {
                processVotes(lobbyData);
            }
        }
    });
}

// --- Event Listeners ---
startGameBtn.addEventListener('click', () => {
    if (startGameBtn.disabled) return;
    initiateGameStart(currentLobbyId);
});

lobbyChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = lobbyChatInput.value.trim();
    if (!text || !currentLobbyId) return;

    const lobbySnap = await getDoc(doc(db, 'global_lobbies', currentLobbyId));
    if (lobbySnap.data()?.game?.status !== 'discussion') {
        // If not in discussion, send message normally (or block)
        if(lobbySnap.data()?.game?.status === 'waiting') {
             sendLobbyMessage(currentLobbyId, text);
        }
        return;
    }

    lobbyChatSendBtn.disabled = true;
    lobbyChatInput.classList.add('is-thinking');
    
    const moderationResult = await checkMessageStyleWithAI(text);
    if (moderationResult.is_ai_like) {
        await sendLobbyMessage(currentLobbyId, text);
    } else {
        showMessageBox("پیام شما به اندازه کافی ادبی یا ماشینی نیست. لطفاً دوباره تلاش کنید.", "error");
    }

    lobbyChatSendBtn.disabled = false;
    lobbyChatInput.classList.remove('is-thinking');
    lobbyChatInput.value = '';
});

submitVoteBtn.addEventListener('click', async () => {
    if (!selectedVoteTarget || !currentLobbyId) return;
    submitVoteBtn.disabled = true;
    showCustomMessage(voteMessageBox, 'رأی شما ثبت شد. منتظر بقیه بازیکنان بمانید...', 'info', 10000);
    
    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    await updateDoc(lobbyRef, {
        [`game.votes.${auth.currentUser.uid}`]: selectedVoteTarget
    });
});

createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    const duration = roundDurationSelect.value;
    // ... validation logic ...
    
    const newLobbyData = {
        name: lobbyName,
        hostId: auth.currentUser.uid,
        status: "waiting", // Game status, not lobby status
        players: { [auth.currentUser.uid]: currentUserData.displayName },
        createdAt: serverTimestamp(),
        gameSettings: {
            maxPlayers: 4,
            roundDuration: parseInt(duration, 10),
        },
        // game: {} will be added on start
    };

    const newLobbyRef = await addDoc(collection(db, 'global_lobbies'), newLobbyData);
    closeCreateLobbyModal();
    setActiveScreen(lobbyDetailScreen);
    unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyRef.id);
});

async function sendLobbyMessage(lobbyId, text) {
    if (!text.trim() || !auth.currentUser) return;
    const messagesRef = collection(db, `global_lobbies/${lobbyId}/messages`);
    await addDoc(messagesRef, {
        text: text,
        senderUid: auth.currentUser.uid,
        senderName: currentUserData.displayName,
        timestamp: serverTimestamp(),
    });
}

// Initialize the app when the window loads
window.onload = () => {
    // Other initializations...
    if (initialAuthToken) {
        signInWithCustomToken(auth, initialAuthToken).catch(err => console.error(err));
    }
};

// ... (other functions like joinLobby, createLobby, modals, etc. would be here, I've omitted them for brevity but they are needed) ...
// The provided code focuses on the NEW game logic. You need to merge this with your existing code.
// For example, you still need your full onAuthStateChanged, setActiveScreen, etc.