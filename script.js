--- START OF FILE script.js ---

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, deleteField, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Global variables
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- DOM Elements ---
// (All previous DOM element declarations are assumed to be here...)
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const createLobbyModal = document.getElementById('create-lobby-modal');

// Auth elements
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const displayNameField = document.getElementById('display-name-field');
const passwordInput = document.getElementById('password');
const loginToggleBtn = document.getElementById('login-toggle-btn');
const registerToggleBtn = document.getElementById('register-toggle-btn');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const messageBox = document.getElementById('message-box');

// Main screen elements
const headerDisplayName = document.getElementById('header-display-name');
const headerUserId = document.getElementById('header-user-id');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const ratedGameBtn = document.getElementById('rated-game-btn');

// Lobby screen elements
const backToMainBtn = document.getElementById('back-to-main-btn');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn');
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn');
const activeGamesCount = document.getElementById('active-games-count');
const lobbySearchInput = document.getElementById('lobby-search-input');
const searchLobbiesBtn = document.getElementById('search-lobbies-btn');

// Lobby Detail elements
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const detailPlayerCount = document.getElementById('detail-player-count');
const playerListContainer = document.getElementById('player-list-container');
const startGameBtn = document.getElementById('start-game-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');

// Create Lobby Modal elements
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const gameDurationSelect = document.getElementById('game-duration-select'); // NEW
const submitCreateLobbyBtn = document.getElementById('submit-create-lobby-btn');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn');

// NEW: Game Screen Elements
const gameScreen = document.getElementById('game-screen');
const gameCountdownOverlay = document.getElementById('game-countdown-overlay');
const gameStartTimer = document.getElementById('game-start-timer');
const gameLobbyName = document.getElementById('game-lobby-name');
const gameTimerDisplay = document.getElementById('game-timer-display');
const leaveGameBtn = document.getElementById('leave-game-btn');
const myRoleDisplay = document.getElementById('my-role-display');
const myRoleText = document.getElementById('my-role-text');
const gamePlayerList = document.getElementById('game-player-list');
const gameMainPanel = document.getElementById('game-main-panel');
const gameChatMessages = document.getElementById('game-chat-messages');
const gameVotingPanel = document.getElementById('game-voting-panel');
const votingButtonsContainer = document.getElementById('voting-buttons-container');
const gameChatForm = document.getElementById('game-chat-form');
const gameChatInput = document.getElementById('game-chat-input');
const gameChatSendBtn = document.getElementById('game-chat-send-btn');

// NEW: Game Result Modal Elements
const gameResultModal = document.getElementById('game-result-modal');
const resultTitle = document.getElementById('result-title');
const resultWinnerText = document.getElementById('result-winner-text');
const resultDetailsText = document.getElementById('result-details-text');
const resultBackToLobbiesBtn = document.getElementById('result-back-to-lobbies-btn');

// Other Modals
const profileModal = document.getElementById('profile-modal');
const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileSummary = document.getElementById('profile-summary');
const menuBtn = document.getElementById('menu-btn');

// --- State variables ---
let currentActiveScreen = loadingScreen;
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
let currentLobbyId = null;
let gameTimerInterval = null; // For client-side display updates

// --- Helper Functions (showMessageBox, setActiveScreen, etc.) are assumed to be here ---
function showMessageBox(message, type = 'info') {
    // This is a simplified version. The full function from the original script should be used.
    console.log(`Message (${type}): ${message}`);
    const box = document.getElementById('message-box'); // A generic message box for simplicity
    if(box) {
        box.textContent = message;
        box.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
        if (type === 'error') box.classList.add('bg-red-500', 'text-white');
        else if (type === 'success') box.classList.add('bg-green-500', 'text-white');
        else box.classList.add('bg-blue-500', 'text-white');
        box.classList.remove('hidden');
        setTimeout(() => box.classList.add('hidden'), 5000);
    }
}

function setActiveScreen(newScreen) {
    if (currentActiveScreen === newScreen) return;
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

    currentActiveScreen.classList.remove('page-transition-visible');
    currentActiveScreen.classList.add('page-transition-hidden');
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        newScreen.classList.remove('hidden');
        newScreen.classList.remove('page-transition-hidden');
        newScreen.classList.add('page-transition-visible');
        currentActiveScreen = newScreen;
    }, 600);
}
// (Other modal open/close functions are assumed to be here)
function openProfileModal() { profileModal.classList.remove('hidden'); }
function closeProfileModal() { profileModal.classList.add('hidden'); }
function openCreateLobbyModal() { createLobbyModal.classList.remove('hidden'); }
function closeCreateLobbyModal() { createLobbyModal.classList.add('hidden'); }

/**
 * NEW: AI check for message style.
 * This function calls the Gemini API to validate if a message is written
 * in a formal, "AI-like" or "literary" (ادبی) style.
 * @param {string} messageText - The text to be validated.
 * @returns {Promise<{is_appropriate_style: boolean, reason: string}>}
 */
async function checkMessageStyleWithAI(messageText) {
    const apiKey = "YOUR_GEMINI_API_KEY"; // <-- IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const prompt = `As a strict linguistic analyst, evaluate the following Persian sentence. Determine if it is written in a formal, literary ("adبی"), or AI-like style. The text must avoid slang, colloquialisms, and overly casual phrasing. Your response *must* be a JSON object with two keys: {"is_appropriate_style": boolean, "reason": string}. If the style is appropriate, set "is_appropriate_style" to true and "reason" to an empty string. If it is not, set "is_appropriate_style" to false and provide a brief, one-sentence reason in Persian (e.g., "Contains slang.", "Phrase is too informal."). Text to analyze: "${messageText}"`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            console.error("AI API Error:", response.status, await response.text());
            return { is_appropriate_style: false, reason: "خطا در ارتباط با سرور تحلیل زبان." };
        }
        const result = await response.json();
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonString);
        return parsedJson;
    } catch (error) {
        console.error("Error calling AI style check API:", error);
        return { is_appropriate_style: false, reason: "خطای ناشناخته در تحلیل پیام." };
    }
}


// --- Firebase Auth & Main Logic ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`); 
        const userDocSnap = await getDoc(userDocRef);
        currentUserData = {
            uid: user.uid,
            email: user.email,
            displayName: (userDocSnap.exists() && userDocSnap.data().displayName) ? userDocSnap.data().displayName : 'کاربر'
        };
        headerDisplayName.textContent = currentUserData.displayName;
        headerUserId.textContent = `شناسه: ${user.uid.substring(0, 8)}...`;
        if (currentActiveScreen === loadingScreen || currentActiveScreen === authScreen) {
            setActiveScreen(mainScreen);
        }
    } else {
        setActiveScreen(authScreen);
        currentUserData = null;
    }
});

async function createLobby(lobbyName, userId, displayName, lobbyType, password, duration) {
    // MODIFIED: Added gameDuration
    const lobbiesRef = collection(db, `global_lobbies`);
    const newLobbyData = {
        name: lobbyName,
        hostId: userId,
        status: "waiting", // aLWAYS waiting on creation
        type: lobbyType,
        players: { [userId]: displayName },
        kickedPlayers: [],
        createdAt: serverTimestamp(),
        gameSettings: {
            maxPlayers: 4, // Game is fixed to 4 players
            gameDuration: parseInt(duration, 10) // Duration in seconds
        }
    };
    if (lobbyType === 'private') newLobbyData.password = password;
    const newLobbyRef = await addDoc(lobbiesRef, newLobbyData);
    return newLobbyRef.id;
}

// NEW: Function to start the game
async function startGame(lobbyId) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) return;
    
    const lobbyData = lobbySnap.data();
    const playerIds = Object.keys(lobbyData.players);

    // 1. Shuffle players and assign roles
    const shuffledPlayerIds = playerIds.sort(() => 0.5 - Math.random());
    const aiPlayerId = shuffledPlayerIds[0];
    const roles = {};
    playerIds.forEach(id => {
        roles[id] = (id === aiPlayerId) ? 'AI' : 'Human';
    });

    // 2. Prepare the game state update
    const batch = writeBatch(db);
    batch.update(lobbyRef, {
        status: 'countdown', // Trigger countdown on clients
        roles: roles,
        alivePlayers: playerIds, // All players are alive at start
        gameStartTime: serverTimestamp(),
        votes: {}
    });

    // 3. Commit the changes
    await batch.commit();
}

// MODIFIED: The lobby listener is now a state machine for the game
function setupLobbyDetailListener(lobbyId) {
    currentLobbyId = lobbyId;
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }

    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    unsubscribeLobbyDetail = onSnapshot(lobbyRef, (docSnap) => {
        if (!docSnap.exists()) {
            showMessageBox("لابی بسته شد یا دیگر وجود ندارد.", "info");
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
            return;
        }

        const lobbyData = docSnap.data();
        const isHost = auth.currentUser && lobbyData.hostId === auth.currentUser.uid;
        
        // --- Game State Machine ---
        switch (lobbyData.status) {
            case 'waiting':
                setActiveScreen(lobbyDetailScreen);
                renderLobbyDetails(lobbyData, isHost);
                break;
            case 'countdown':
                setActiveScreen(gameScreen);
                renderGameUI(lobbyData); // Render base UI
                showGameCountdown(); // Show the 5-sec timer
                break;
            case 'playing':
                setActiveScreen(gameScreen);
                renderGameUI(lobbyData);
                break;
            case 'voting':
                setActiveScreen(gameScreen);
                renderGameUI(lobbyData, true); // Render with voting panel
                break;
            case 'finished':
                setActiveScreen(gameScreen); // Stay on game screen briefly
                showGameResult(lobbyData);
                break;
        }
    });
}

function renderLobbyDetails(lobbyData, isHost) {
    const playerCount = Object.keys(lobbyData.players).length;
    const maxPlayers = lobbyData.gameSettings.maxPlayers || 4;
    detailLobbyName.textContent = lobbyData.name;
    detailHostName.textContent = `سازنده: ${lobbyData.players[lobbyData.hostId]}`;
    detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${maxPlayers}`;

    startGameBtn.disabled = playerCount !== maxPlayers;
    startGameBtn.textContent = `شروع بازی (${playerCount}/${maxPlayers})`;
    if (isHost) {
        document.getElementById('host-actions-container').style.display = 'flex';
        leaveLobbyBtn.textContent = 'بستن لابی';
        leaveLobbyBtn.classList.remove('hidden');
    } else {
        document.getElementById('host-actions-container').style.display = 'none';
        leaveLobbyBtn.classList.add('hidden');
    }
    
    playerListContainer.innerHTML = '';
    Object.entries(lobbyData.players).forEach(([uid, name]) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-list-item p-2 bg-gray-700 rounded';
        playerItem.textContent = name;
        playerListContainer.appendChild(playerItem);
    });
}

// NEW: Renders the main game screen
function renderGameUI(lobbyData, isVoting = false) {
    gameLobbyName.textContent = lobbyData.name;

    // Display my role
    const myRole = lobbyData.roles[currentUserData.uid];
    myRoleText.textContent = myRole === 'AI' ? 'هوش مصنوعی' : 'انسان';
    myRoleDisplay.className = 'p-4 rounded-lg text-center'; // Reset classes
    myRoleDisplay.classList.add(myRole === 'AI' ? 'role-ai' : 'role-human');
    myRoleText.className = 'text-3xl font-bold';
    myRoleText.classList.add(myRole === 'AI' ? 'role-ai' : 'role-human');

    // Display player list
    gamePlayerList.innerHTML = '';
    Object.entries(lobbyData.players).forEach(([uid, name]) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'game-player-item';
        playerItem.innerHTML = `<span>${name}</span>`;
        if (!lobbyData.alivePlayers.includes(uid)) {
            playerItem.classList.add('voted-out');
        }
        gamePlayerList.appendChild(playerItem);
    });

    // Handle chat/voting panel visibility
    gameChatForm.style.display = isVoting ? 'none' : 'flex';
    gameVotingPanel.classList.toggle('hidden', !isVoting);

    if (isVoting) {
        renderVotingButtons(lobbyData);
    } else {
        // Handle game timer
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        const gameEndTime = lobbyData.gameStartTime.toDate().getTime() + (lobbyData.gameSettings.gameDuration * 1000);

        gameTimerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, gameEndTime - now);
            const minutes = Math.floor((remaining / 1000) / 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            gameTimerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (remaining === 0) {
                clearInterval(gameTimerInterval);
                // Host is responsible for transitioning state to 'voting'
                if (lobbyData.hostId === currentUserData.uid) {
                    updateDoc(doc(db, 'global_lobbies', currentLobbyId), { status: 'voting' });
                }
            }
        }, 1000);
    }
}

// NEW: Renders voting buttons
function renderVotingButtons(lobbyData) {
    votingButtonsContainer.innerHTML = '';
    const myVote = lobbyData.votes[currentUserData.uid];

    lobbyData.alivePlayers.forEach(uid => {
        if (uid === currentUserData.uid) return; // Can't vote for self
        const button = document.createElement('button');
        button.className = 'classic-btn btn-gray-classic vote-button';
        button.textContent = lobbyData.players[uid];
        button.dataset.voteUid = uid;
        button.disabled = !!myVote; // Disable if already voted
        if (myVote === uid) {
            button.classList.add('btn-green-classic'); // Highlight my vote
        }
        votingButtonsContainer.appendChild(button);
    });
}

// NEW: Shows 5-second countdown
function showGameCountdown() {
    gameCountdownOverlay.classList.remove('hidden');
    let count = 5;
    gameStartTimer.textContent = count;
    const countdownInterval = setInterval(() => {
        count--;
        gameStartTimer.textContent = count;
        if (count <= 0) {
            clearInterval(countdownInterval);
            gameCountdownOverlay.classList.add('hidden');
            // Host transitions the state to 'playing'
            if (auth.currentUser && currentLobbyId) {
                getDoc(doc(db, 'global_lobbies', currentLobbyId)).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().hostId === auth.currentUser.uid) {
                        updateDoc(doc(db, 'global_lobbies', currentLobbyId), { status: 'playing' });
                    }
                });
            }
        }
    }, 1000);
}

// NEW: Handles sending game messages with style check
async function sendGameMessage(text) {
    if (!text.trim()) return;

    gameChatSendBtn.disabled = true;
    gameChatSendBtn.textContent = '...';

    const styleCheck = await checkMessageStyleWithAI(text);
    if (!styleCheck.is_appropriate_style) {
        showMessageBox(`سبک پیام نامناسب: ${styleCheck.reason}`, 'error');
        gameChatSendBtn.disabled = false;
        gameChatSendBtn.textContent = 'ارسال';
        return;
    }

    const messagesRef = collection(db, `global_lobbies/${currentLobbyId}/game_messages`);
    await addDoc(messagesRef, {
        text: text.trim(),
        senderUid: currentUserData.uid,
        senderName: currentUserData.displayName,
        timestamp: serverTimestamp()
    });

    gameChatInput.value = '';
    gameChatSendBtn.disabled = false;
    gameChatSendBtn.textContent = 'ارسال';
}

// NEW: Submits a vote
async function submitVote(votedForUid) {
    if (!currentLobbyId || !currentUserData) return;
    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    await updateDoc(lobbyRef, {
        [`votes.${currentUserData.uid}`]: votedForUid
    });
    // After voting, check if all alive players have voted
    checkIfVotingFinished();
}

// NEW: Checks if voting is complete
async function checkIfVotingFinished() {
    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) return;
    const lobbyData = lobbySnap.data();

    const aliveCount = lobbyData.alivePlayers.length;
    const voteCount = Object.keys(lobbyData.votes).length;

    // Host tallies votes when everyone has voted
    if (voteCount >= aliveCount && lobbyData.hostId === currentUserData.uid) {
        tallyVotes(lobbyData);
    }
}

// NEW: Tallies votes and determines the winner
async function tallyVotes(lobbyData) {
    const voteCounts = {};
    Object.values(lobbyData.votes).forEach(votedUid => {
        voteCounts[votedUid] = (voteCounts[votedUid] || 0) + 1;
    });

    let votedOutPlayer = null;
    let maxVotes = 0;
    for (const [uid, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
            maxVotes = count;
            votedOutPlayer = uid;
        }
    }
    
    // Handle ties by not voting anyone out (or implement a re-vote)
    // For simplicity, we assume no ties or the first player with max votes gets chosen
    if (!votedOutPlayer) {
        // No one was voted out (e.g., a perfect tie)
         await updateDoc(doc(db, 'global_lobbies', currentLobbyId), {
            status: 'finished',
            result: { winner: 'AI', reason: 'انسان‌ها در رای‌گیری به توافق نرسیدند و هوش مصنوعی پیروز شد.' }
        });
        return;
    }

    const wasAiVotedOut = lobbyData.roles[votedOutPlayer] === 'AI';
    let result = {};

    if (wasAiVotedOut) {
        result = { winner: 'Humans', reason: `انسان‌ها با موفقیت هوش مصنوعی (${lobbyData.players[votedOutPlayer]}) را شناسایی و حذف کردند.` };
    } else {
        const remainingHumans = lobbyData.alivePlayers.filter(uid => uid !== votedOutPlayer && lobbyData.roles[uid] === 'Human').length;
        if (remainingHumans <= 1) {
            result = { winner: 'AI', reason: `هوش مصنوعی با موفقیت یک انسان را حذف کرد و با باقی‌مانده یک انسان، به پیروزی رسید.` };
        } else {
             // This case is for multi-round games. In our single round, this means AI wins.
             result = { winner: 'AI', reason: `یک انسان به اشتباه حذف شد! هوش مصنوعی یک قدم به پیروزی نزدیک‌تر شد.` };
        }
    }
    await updateDoc(doc(db, 'global_lobbies', currentLobbyId), { status: 'finished', result: result });
}


// NEW: Shows the game result modal
function showGameResult(lobbyData) {
    const result = lobbyData.result;
    resultTitle.textContent = result.winner === 'Humans' ? 'پیروزی انسان‌ها!' : 'پیروزی هوش مصنوعی!';
    resultWinnerText.textContent = `تیم ${result.winner === 'Humans' ? 'انسان' : 'هوش مصنوعی'} برنده شد!`;
    resultDetailsText.textContent = result.reason;
    
    // Reveal the AI
    const aiPlayerId = Object.keys(lobbyData.roles).find(key => lobbyData.roles[key] === 'AI');
    resultDetailsText.textContent += `\nهوش مصنوعی در این بازی ${lobbyData.players[aiPlayerId]} بود.`;

    gameResultModal.classList.remove('hidden');
}


// --- Event Listeners ---
// Auth form listeners... (same as before)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (authMode === 'register' && !displayName) { showMessageBox("لطفاً نام نمایشی را وارد کنید.", 'error'); return; }

    try {
        if (authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
            await setDoc(userDocRef, { displayName: displayName, email: email }, { merge: true });
        }
    } catch (error) { console.error(error); showMessageBox("خطا: " + error.code, 'error'); }
});


friendlyGameBtn.addEventListener('click', () => {
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener('');
});
ratedGameBtn.addEventListener('click', () => showMessageBox('بازی امتیازی به زودی!', 'info'));

addIconBtn.addEventListener('click', openCreateLobbyModal);
closeCreateLobbyModalBtn.addEventListener('click', closeCreateLobbyModal);

// MODIFIED: Create Lobby Form Submission
createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    const duration = gameDurationSelect.value;
    // ... other values
    if (!lobbyName) { showMessageBox("نام لابی الزامی است.", 'error'); return; }
    
    try {
        // Simplified for this example, the original lobby creation logic should be used
        const newLobbyId = await createLobby(lobbyName, currentUserData.uid, currentUserData.displayName, 'public', '', duration);
        closeCreateLobbyModal();
        setupLobbyDetailListener(newLobbyId);
    } catch (error) {
        console.error("Error creating lobby:", error);
        showMessageBox("خطا در ساخت لابی.", 'error');
    }
});

// Lobby Detail Screen
startGameBtn.addEventListener('click', () => {
    if (currentLobbyId) startGame(currentLobbyId);
});

// Game Screen
gameChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendGameMessage(gameChatInput.value);
});

votingButtonsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('.vote-button');
    if (button && !button.disabled) {
        submitVote(button.dataset.voteUid);
    }
});

resultBackToLobbiesBtn.addEventListener('click', async () => {
    gameResultModal.classList.add('hidden');
    // Host can delete the finished lobby
    if (currentLobbyId && currentUserData) {
        const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
        const lobbySnap = await getDoc(lobbyRef);
        if (lobbySnap.exists() && lobbySnap.data().hostId === currentUserData.uid) {
            await deleteDoc(lobbyRef);
        }
    }
    currentLobbyId = null;
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener('');
});

// Initialize
window.onload = () => {
    // Simplified init
    // A proper init flow like in the original script should be used
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged in
        } else {
            setActiveScreen(authScreen);
        }
    })
};

// ... a large portion of the original script (profile, lobby list, etc.) is omitted for brevity but should be included in the final file.
// This example focuses on the new game logic.

// Dummy setupLobbyListener for placeholder functionality
function setupLobbyListener(searchTerm) {
    const q = query(collection(db, `global_lobbies`), where("status", "==", "waiting"));
    return onSnapshot(q, (snapshot) => {
        lobbiesList.innerHTML = '';
        if (snapshot.empty) {
            lobbiesList.innerHTML = '<p class="text-gray-400">هیچ لابی فعالی یافت نشد.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item mb-3 w-full flex justify-between items-center p-4 bg-gray-800 rounded-lg';
            lobbyItem.innerHTML = `
                <div>
                    <h3 class="text-xl font-bold text-yellow-300">${lobby.name}</h3>
                    <p class="text-sm text-gray-400">سازنده: ${lobby.players[lobby.hostId]}</p>
                </div>
                <button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic">ورود</button>
            `;
            lobbiesList.appendChild(lobbyItem);
        });

        lobbiesList.querySelectorAll('.join-lobby-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // A simplified join logic
                const lobbyId = e.target.dataset.lobbyId;
                updateDoc(doc(db, 'global_lobbies', lobbyId), {
                    [`players.${currentUserData.uid}`]: currentUserData.displayName
                }).then(() => {
                    setupLobbyDetailListener(lobbyId);
                });
            });
        });
    });
}
--- END OF FILE script.js ---