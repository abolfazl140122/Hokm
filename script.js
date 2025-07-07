// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, deleteDoc, getDocs, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Gemini API Key for Chat Validation (Replace with your actual key)
const GEMINI_API_KEY = "AIzaSyDfMZwyWNnRFUDLHKR1t_hZ5cWv2c_KvvE";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
let currentActiveScreen = document.getElementById('loading-screen');
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
let currentLobbyId = null;
let gameTimerInterval = null; // For the countdown timer in the game

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const createLobbyModal = document.getElementById('create-lobby-modal');
const gameScreen = document.getElementById('game-screen'); // New Game Screen

// Create Lobby Modal Elements
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const gameDurationInput = document.getElementById('game-duration-input'); // New

// Lobby Detail Elements
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

// Game Screen Elements
const gameCountdownOverlay = document.getElementById('game-countdown-overlay');
const countdownTimerDisplay = document.getElementById('countdown-timer-display');
const gameTimerDisplay = document.getElementById('game-timer-display');
const myRoleDisplay = document.getElementById('my-role-display');
const leaveGameBtn = document.getElementById('leave-game-btn');
const gamePlayersContainer = document.getElementById('game-players-container');
const gameChatMessages = document.getElementById('game-chat-messages');
const gameChatForm = document.getElementById('game-chat-form');
const gameChatInput = document.getElementById('game-chat-input');
const gameChatValidationMsg = document.getElementById('game-chat-validation-msg');
const gameStatusOverlay = document.getElementById('game-status-overlay');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverReason = document.getElementById('game-over-reason');
const backToLobbyListBtn = document.getElementById('back-to-lobby-list-btn');


// --- Utility & UI Functions ---

function showMessageBox(message, type = 'info') {
    // This function can be used for general notifications
    const box = document.getElementById('message-box'); // Assuming a general message box exists
    if(!box) return;
    box.textContent = message;
    box.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    if (type === 'error') box.classList.add('bg-red-500', 'text-white');
    else if (type === 'success') box.classList.add('bg-green-500', 'text-white');
    else box.classList.add('bg-blue-500', 'text-white');
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 5000);
}

function setActiveScreen(newScreen) {
    if (currentActiveScreen === newScreen) return;
    
    // Cleanup old listeners when changing screens
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

    currentActiveScreen.classList.remove('page-transition-visible');
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        newScreen.classList.remove('hidden');
        newScreen.classList.add('page-transition-visible');
        currentActiveScreen = newScreen;
    }, 600);
}

function openCreateLobbyModal() {
    createLobbyModal.classList.remove('hidden');
}

function closeCreateLobbyModal() {
    createLobbyModal.classList.add('hidden');
}

// --- AI Chat Validation Function ---

/**
 * Validates if a message conforms to a literary/AI-like style using Gemini.
 * @param {string} messageText - The text to validate.
 * @returns {Promise<{is_compliant: boolean, reason: string}>} - The validation result.
 */
async function validateMessageStyleAI(messageText) {
    const prompt = `You are a strict linguistic style validator. A user is playing a game where they must pretend to be a sophisticated, literary, and analytical AI. Analyze the following user message. Does it adhere to this persona? The message should avoid slang, casual chat, and simple reactions. It should sound more like a machine processing and outputting information.

Your response MUST be a JSON object with this exact structure: {"is_compliant": boolean, "reason": string}.
If it is compliant, the reason should be "OK".
If not, provide a very brief, direct reason in Persian like "لحن بیش از حد محاوره‌ای است" or "از اصطلاحات نامناسب استفاده شده".

User message to analyze: "${messageText}"`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
        }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            return { is_compliant: false, reason: "خطا در ارتباط با سرور اعتبارسنجی." };
        }
        const result = await response.json();
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonString);
        return parsedJson;
    } catch (error) {
        console.error("AI Validation Error:", error);
        return { is_compliant: false, reason: "خطا در پردازش پاسخ اعتبارسنجی." };
    }
}


// --- Firebase & Game Logic ---

// Authentication listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, `users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserData = { uid: user.uid, ...userDocSnap.data() };
        } else {
            // Create profile for new users
            const displayName = user.email.split('@')[0];
            await setDoc(userDocRef, { email: user.email, displayName: displayName });
            currentUserData = { uid: user.uid, email: user.email, displayName: displayName };
        }
        // Update header UI
        document.getElementById('header-display-name').textContent = currentUserData.displayName;
        document.getElementById('header-user-id').textContent = `ID: ${user.uid.substring(0,8)}`;
        setActiveScreen(mainScreen);
    } else {
        setActiveScreen(authScreen);
        currentUserData = null;
    }
});

// Create Lobby
createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    const duration = parseInt(gameDurationInput.value, 10);
    const lobbyType = document.querySelector('input[name="lobby-type"]:checked').value;
    const password = document.getElementById('new-lobby-password-input').value;
    
    if (!lobbyName || !currentUserData) return;
    
    try {
        const newLobbyData = {
            name: lobbyName,
            hostId: currentUserData.uid,
            status: "waiting", // waiting, starting, playing, voting, finished
            type: lobbyType,
            players: {
                [currentUserData.uid]: currentUserData.displayName
            },
            createdAt: serverTimestamp(),
            gameSettings: {
                maxPlayers: 4, // You can make this configurable
                gameDurationInSeconds: duration,
            }
        };
        if (lobbyType === 'private') newLobbyData.password = password;

        const newLobbyRef = await addDoc(collection(db, 'lobbies'), newLobbyData);
        currentLobbyId = newLobbyRef.id;
        closeCreateLobbyModal();
        setActiveScreen(lobbyDetailScreen);
        unsubscribeLobbyDetail = setupLobbyDetailListener(currentLobbyId);
    } catch (error) {
        console.error("Error creating lobby:", error);
        showMessageBox("خطا در ساخت لابی", "error");
    }
});


// Setup Lobby List Listener
function setupLobbyListener() {
    lobbiesList.innerHTML = '<p class="text-gray-400">در حال بارگذاری لابی‌ها...</p>';
    const q = query(collection(db, 'lobbies'), where("status", "==", "waiting"));

    return onSnapshot(q, (snapshot) => {
        const lobbiesList = document.getElementById('lobbies-list');
        lobbiesList.innerHTML = '';
        if (snapshot.empty) {
            lobbiesList.innerHTML = '<p class="text-gray-400">هیچ لابی فعالی وجود ندارد. یکی بسازید!</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            const playerCount = Object.keys(lobby.players).length;
            const maxPlayers = lobby.gameSettings.maxPlayers;
            
            // Basic lobby item HTML, you can style this better
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item p-4 border rounded mb-2 flex justify-between items-center';
            lobbyItem.innerHTML = `
                <div>
                    <h3 class="font-bold">${lobby.name} ${lobby.type === 'private' ? '🔒' : ''}</h3>
                    <p>سازنده: ${lobby.players[lobby.hostId]}</p>
                    <p>بازیکنان: ${playerCount}/${maxPlayers}</p>
                </div>
                <button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic">ورود</button>
            `;
            lobbiesList.appendChild(lobbyItem);
        });
    });
}

// Join Lobby
document.getElementById('lobbies-list').addEventListener('click', async (e) => {
    if (e.target.classList.contains('join-lobby-btn')) {
        const lobbyId = e.target.dataset.lobbyId;
        const lobbyRef = doc(db, 'lobbies', lobbyId);
        try {
            await updateDoc(lobbyRef, {
                [`players.${currentUserData.uid}`]: currentUserData.displayName
            });
            currentLobbyId = lobbyId;
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);
        } catch (error) {
            console.error("Error joining lobby:", error);
            showMessageBox("خطا در ورود به لابی", "error");
        }
    }
});

// Start Game
startGameBtn.addEventListener('click', async () => {
    if (!currentLobbyId || !currentUserData) return;
    const lobbyRef = doc(db, 'lobbies', currentLobbyId);
    try {
        // This should ideally be a Cloud Function for security and fairness
        const lobbySnap = await getDoc(lobbyRef);
        const lobbyData = lobbySnap.data();
        const players = lobbyData.players || {};
        const playerIds = Object.keys(players);
        
        // Randomly assign roles
        const aiIndex = Math.floor(Math.random() * playerIds.length);
        const aiPlayerId = playerIds[aiIndex];
        const roles = {};
        playerIds.forEach(id => {
            roles[id] = (id === aiPlayerId) ? 'ai' : 'human';
        });

        // Set game state
        await updateDoc(lobbyRef, {
            status: 'starting',
            gameState: {
                roles: roles,
                timerEndTime: null, // will be set after countdown
                eliminatedPlayers: [],
                votes: {},
                winner: null,
                gameoverReason: ''
            }
        });
    } catch (error) {
        console.error("Error starting game:", error);
    }
});

// Leave Game/Lobby
leaveGameBtn.addEventListener('click', async () => {
    // A simple implementation: host deletes lobby, others just leave
    if (!currentLobbyId || !currentUserData) return;
    const lobbyRef = doc(db, 'lobbies', currentLobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if(lobbySnap.data().hostId === currentUserData.uid) {
        await deleteDoc(lobbyRef);
    } else {
        await updateDoc(lobbyRef, {
            [`players.${currentUserData.uid}`]: deleteField()
        });
    }
    // Listeners will handle screen transition
});

backToLobbyListBtn.addEventListener('click', () => {
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener();
});


// The MAIN Game State Machine: Lobby Detail Listener
function setupLobbyDetailListener(lobbyId) {
    if (unsubscribeLobbies) unsubscribeLobbies();
    const lobbyRef = doc(db, 'lobbies', lobbyId);

    return onSnapshot(lobbyRef, (docSnap) => {
        if (!docSnap.exists()) {
            // Lobby was deleted
            showMessageBox("لابی بسته شد.", "info");
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener();
            return;
        }

        const lobbyData = docSnap.data();
        const players = lobbyData.players || {};
        const playerCount = Object.keys(players).length;
        const maxPlayers = lobbyData.gameSettings.maxPlayers;
        const isHost = lobbyData.hostId === currentUserData?.uid;

        // Route based on game status
        switch(lobbyData.status) {
            case 'waiting':
                setActiveScreen(lobbyDetailScreen);
                updateLobbyDetailsUI(lobbyData, players, playerCount, maxPlayers, isHost);
                break;
            case 'starting':
                setActiveScreen(gameScreen);
                runGameCountdown(lobbyData);
                break;
            case 'playing':
            case 'voting':
                setActiveScreen(gameScreen);
                updateGameUI(lobbyData);
                break;
            case 'finished':
                setActiveScreen(gameScreen);
                updateGameUI(lobbyData); // Show final state
                showGameOverScreen(lobbyData.gameState);
                break;
        }
    });
}

// UI Update for Lobby Waiting Screen
function updateLobbyDetailsUI(lobbyData, players, playerCount, maxPlayers, isHost) {
    detailLobbyName.textContent = lobbyData.name;
    detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${maxPlayers}`;
    playerListContainer.innerHTML = Object.values(players).map(name => `<div>${name}</div>`).join('');
    
    if(isHost) {
        hostActionsContainer.style.display = 'block';
        startGameBtn.disabled = playerCount !== maxPlayers;
        leaveLobbyBtn.classList.remove('hidden');
    } else {
        hostActionsContainer.style.display = 'none';
    }
}

// Run 5-second countdown
function runGameCountdown(lobbyData) {
    gameCountdownOverlay.classList.remove('hidden');
    let count = 5;
    countdownTimerDisplay.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        countdownTimerDisplay.textContent = count > 0 ? count : 'شروع!';
        if (count <= 0) {
            clearInterval(countdownInterval);
            gameCountdownOverlay.classList.add('hidden');
            // Only the host sets the timer end time to prevent race conditions
            if (lobbyData.hostId === currentUserData?.uid) {
                const lobbyRef = doc(db, 'lobbies', currentLobbyId);
                const gameEndTime = new Date(Date.now() + lobbyData.gameSettings.gameDurationInSeconds * 1000);
                updateDoc(lobbyRef, {
                    status: 'playing',
                    'gameState.timerEndTime': gameEndTime,
                });
            }
        }
    }, 1000);
}

// UI Update for Game Screen (Playing/Voting)
function updateGameUI(lobbyData) {
    const gameState = lobbyData.gameState;
    const myRole = gameState.roles[currentUserData.uid];
    
    // Update Role Display
    myRoleDisplay.textContent = `شما: ${myRole === 'ai' ? 'هوش مصنوعی' : 'انسان'}`;
    myRoleDisplay.className = `my-role ${myRole === 'ai' ? 'role-ai' : 'role-human'}`;

    // Update Game Timer
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (gameState.timerEndTime) {
        gameTimerInterval = setInterval(() => {
            const endTime = gameState.timerEndTime.toDate();
            const now = new Date();
            const diff = endTime - now;

            if (diff <= 0) {
                clearInterval(gameTimerInterval);
                gameTimerDisplay.textContent = "00:00";
                // Host transitions game to voting state
                if (lobbyData.hostId === currentUserData.uid && lobbyData.status === 'playing') {
                    updateDoc(doc(db, 'lobbies', currentLobbyId), { status: 'voting' });
                }
            } else {
                const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
                const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                gameTimerDisplay.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }
    
    // Update Player Cards for Voting
    gamePlayersContainer.innerHTML = '';
    const livingPlayers = Object.keys(lobbyData.players).filter(uid => !gameState.eliminatedPlayers.includes(uid));

    livingPlayers.forEach(uid => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        if(gameState.votes[currentUserData.uid] === uid) playerCard.classList.add('has-voted');
        
        const canVoteFor = lobbyData.status === 'voting' && uid !== currentUserData.uid && !gameState.votes[currentUserData.uid];
        const voteButtonHtml = canVoteFor 
            ? `<button data-vote-for="${uid}" class="vote-button classic-btn btn-red-classic">رای به حذف</button>`
            : '';

        playerCard.innerHTML = `
            <span class="player-name">${lobbyData.players[uid]}</span>
            ${voteButtonHtml}
        `;
        gamePlayersContainer.appendChild(playerCard);
    });
    
    // Update Chat
    gameChatInput.disabled = lobbyData.status !== 'playing';
    gameChatSendBtn.disabled = lobbyData.status !== 'playing';
    gameChatInput.placeholder = lobbyData.status === 'playing' ? "با لحن ادبی/هوش مصنوعی صحبت کنید..." : "رای‌گیری آغاز شده است. چت بسته شد.";

    // Process votes if everyone has voted
    if(lobbyData.status === 'voting') {
        const livingVoters = livingPlayers.filter(uid => !gameState.eliminatedPlayers.includes(uid));
        const allVoted = livingVoters.every(uid => gameState.votes[uid]);
        if (allVoted && lobbyData.hostId === currentUserData.uid) {
            processVotes(lobbyData);
        }
    }
}

// Process votes (should be a Cloud Function)
async function processVotes(lobbyData) {
    const gameState = lobbyData.gameState;
    const voteCounts = {};
    Object.values(gameState.votes).forEach(votedForUid => {
        voteCounts[votedForUid] = (voteCounts[votedForUid] || 0) + 1;
    });

    let maxVotes = 0;
    let playerToEliminate = null;
    for (const [uid, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
            maxVotes = count;
            playerToEliminate = uid;
        }
    }
    
    // In case of a tie, for now, we do nothing. A real game needs a tie-breaker.
    if (!playerToEliminate) {
        // No one was eliminated (e.g. a tie)
        await updateDoc(doc(db, 'lobbies', currentLobbyId), {
            status: 'finished',
            'gameState.winner': 'ai',
            'gameState.gameoverReason': 'هوش مصنوعی به دلیل عدم اجماع در رای‌گیری، پیروز شد.'
        });
        return;
    }

    const wasAI = gameState.roles[playerToEliminate] === 'ai';
    const newEliminated = [...gameState.eliminatedPlayers, playerToEliminate];
    const livingPlayersCount = Object.keys(lobbyData.players).length - newEliminated.length;
    
    let newStatus = 'finished';
    let winner = '';
    let reason = '';

    if (wasAI) {
        winner = 'humans';
        reason = `انسان‌ها پیروز شدند! هوش مصنوعی (${lobbyData.players[playerToEliminate]}) شناسایی و حذف شد.`;
    } else if (livingPlayersCount <= 2) { // 1 human vs 1 AI left
        winner = 'ai';
        reason = `هوش مصنوعی پیروز شد! تنها یک انسان باقی مانده بود.`;
    } else {
        // This case is not handled in the simple scenario. Game ends.
        winner = 'ai';
        reason = `یک انسان حذف شد، اما هوش مصنوعی همچنان مخفی است! هوش مصنوعی پیروز شد.`;
    }

    await updateDoc(doc(db, 'lobbies', currentLobbyId), {
        status: newStatus,
        'gameState.winner': winner,
        'gameState.gameoverReason': reason,
        'gameState.eliminatedPlayers': newEliminated
    });
}


// Show Game Over Screen
function showGameOverScreen(gameState) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameOverTitle.textContent = gameState.winner === 'humans' ? 'تبریک به انسان‌ها!' : 'هوش مصنوعی پیروز شد!';
    gameOverTitle.style.color = gameState.winner === 'humans' ? '#a8dadc' : '#e63946';
    gameOverReason.textContent = gameState.gameoverReason;
    gameStatusOverlay.classList.remove('hidden');
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Basic Nav
    document.getElementById('friendly-game-btn').addEventListener('click', () => {
        setActiveScreen(lobbyScreen);
        unsubscribeLobbies = setupLobbyListener();
    });
    document.getElementById('back-to-main-btn').addEventListener('click', () => setActiveScreen(mainScreen));
    document.getElementById('add-icon-btn').addEventListener('click', openCreateLobbyModal);
    document.getElementById('close-create-lobby-modal-btn').addEventListener('click', closeCreateLobbyModal);

    // Game Chat Submission
    gameChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = gameChatInput.value.trim();
        if (!text || !currentLobbyId) return;

        gameChatSendBtn.disabled = true;
        gameChatValidationMsg.classList.remove('hidden');
        gameChatValidationMsg.textContent = 'در حال اعتبارسنجی سبک پیام...';
        
        const validation = await validateMessageStyleAI(text);

        if (validation.is_compliant) {
            gameChatValidationMsg.classList.add('hidden');
            // Send message (this part can be its own function)
            try {
                const messagesRef = collection(db, `lobbies/${currentLobbyId}/messages`);
                await addDoc(messagesRef, {
                    text: text,
                    senderUid: currentUserData.uid,
                    senderName: currentUserData.displayName,
                    timestamp: serverTimestamp()
                });
                gameChatInput.value = '';
            } catch (error) { console.error("Error sending message:", error); }
        } else {
            gameChatValidationMsg.textContent = `خطا: ${validation.reason}`;
        }
        gameChatSendBtn.disabled = false;
        gameChatInput.focus();
    });
    
    // Voting click listener
    gamePlayersContainer.addEventListener('click', async e => {
        if(e.target.matches('.vote-button')) {
            const voteForUid = e.target.dataset.voteFor;
            if(voteForUid && currentLobbyId && currentUserData) {
                const lobbyRef = doc(db, 'lobbies', currentLobbyId);
                await updateDoc(lobbyRef, {
                    [`gameState.votes.${currentUserData.uid}`]: voteForUid
                });
            }
        }
    });

});

// A simplified auth flow for demonstration
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const displayName = document.getElementById('display-name').value;
    const isRegister = document.getElementById('display-name-field').offsetParent !== null;

    try {
        if (isRegister) {
            await createUserWithEmailAndPassword(auth, email, password);
            // The onAuthStateChanged listener will handle profile creation
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        showMessageBox(error.message, 'error');
    }
});
