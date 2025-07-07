// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, deleteField, writeBatch, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; 

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBpVHnjF5gdTm3vJiHEoAZCowsRkTapj_4",
    authDomain: "hokm-d6911.firebaseapp.com",
    projectId: "hokm-d6911",
    storageBucket: "hokm-d6911.appspot.com",
    messagingSenderId: "128133280011",
    appId: "1:128133280011:web:c9fe28f5201eef7a3a320e",
    measurementId: "G-LN0S9W86MK"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants ---
const GEMINI_API_KEY = "AIzaSyC3FiMyunPUaYamnJGT48NuzAhBA-BWi3w";
const MIN_PLAYERS_TO_START = 4; // The game requires 4 players

// --- DOM Elements ---
// Screens
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const aiGameScreen = document.getElementById('ai-game-screen');
// Modals
const profileModal = document.getElementById('profile-modal');
const createLobbyModal = document.getElementById('create-lobby-modal');
const customConfirmModal = document.getElementById('custom-confirm-modal');
const kickPlayerConfirmModal = document.getElementById('kick-player-confirm-modal');
const kickedMessageModal = document.getElementById('kicked-message-modal');
const kickedPlayersListModal = document.getElementById('kicked-players-list-modal');
const enterPasswordModal = document.getElementById('enter-password-modal');
const gameOverModal = document.getElementById('game-over-modal');
// Auth Elements
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const displayNameField = document.getElementById('display-name-field');
const passwordInput = document.getElementById('password');
const loginToggleBtn = document.getElementById('login-toggle-btn');
const registerToggleBtn = document.getElementById('register-toggle-btn');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const messageBox = document.getElementById('message-box');
// Main Screen Elements
const menuBtn = document.getElementById('menu-btn');
const profileSummary = document.getElementById('profile-summary');
const headerDisplayName = document.getElementById('header-display-name');
const headerUserId = document.getElementById('header-user-id');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const ratedGameBtn = document.getElementById('rated-game-btn');
// Profile Modal Elements
const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
// Lobby List Elements
const backToMainBtn = document.getElementById('back-to-main-btn');
const lobbySearchInput = document.getElementById('lobby-search-input');
const searchLobbiesBtn = document.getElementById('search-lobbies-btn');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn');
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn');
const myLobbiesBtn = document.getElementById('my-lobbies-btn');
const activeGamesCount = document.getElementById('active-games-count');
// Create Lobby Modal Elements
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn'); 
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const lobbyTypeToggle = document.getElementById('lobby-type-toggle');
const newLobbyPasswordField = document.getElementById('new-lobby-password-field');
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input');
const togglePasswordVisibilityBtn = document.getElementById('toggle-password-visibility');
const eyeIconOpen = document.getElementById('eye-icon-open');
const eyeIconClosed = document.getElementById('eye-icon-closed');
const gameDurationSelect = document.getElementById('game-duration-select');
// Lobby Detail Elements
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const playerListContainer = document.getElementById('player-list-container');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container');
const startGameBtn = document.getElementById('start-game-btn');
const toggleChatLockBtn = document.getElementById('toggle-chat-lock-btn');
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatForm = document.getElementById('lobby-chat-form');
const lobbyChatInput = document.getElementById('lobby-chat-input');
// AI Game Screen Elements
const aiGameCountdownOverlay = document.getElementById('ai-game-countdown-overlay');
const aiGameCountdownTimer = document.getElementById('ai-game-countdown-timer');
const aiGameTimer = document.getElementById('ai-game-timer');
const aiGameRoleDisplay = document.getElementById('ai-game-role-display');
const aiGamePlayerList = document.getElementById('ai-game-player-list');
const aiGameChatForm = document.getElementById('ai-game-chat-form');
const aiGameChatInput = document.getElementById('ai-game-chat-input');
const aiGameChatSendBtn = document.getElementById('ai-game-chat-send-btn');
const aiGameChatStatus = document.getElementById('ai-game-chat-status');
const aiGameChatMessages = document.getElementById('ai-game-chat-messages');
// Game Over Modal Elements
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const gameOverAiReveal = document.getElementById('game-over-ai-reveal');
const gameOverAiName = document.getElementById('game-over-ai-name');
const gameOverOkBtn = document.getElementById('game-over-ok-btn');
// Other Modal Elements
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');


// --- State Variables ---
let authMode = 'login';
let currentActiveScreen = loadingScreen;
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
let unsubscribeKickedPlayers = null;
let unsubscribeLobbyChat = null;
let unsubscribeAiGame = null;
let userHasActiveLobby = false;
let currentLobbyId = null;
let kickedPlayerToProcess = null;
let lobbyToJoin = null;
let isRefreshing = false;
let gameTimerInterval = null;
let resolveCustomConfirm;

// --- Helper Functions ---
function showCustomMessage(element, message, type = 'info') {
    if (!element) return;
    element.textContent = message;
    element.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    if (type === 'error') element.classList.add('bg-red-500', 'text-white');
    else if (type === 'success') element.classList.add('bg-green-500', 'text-white');
    else element.classList.add('bg-blue-500', 'text-white');
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}
const showMessageBox = (msg, type) => showCustomMessage(messageBox, msg, type);
const showCreateLobbyMessageBox = (msg, type) => showCustomMessage(createLobbyMessageBox, msg, type);

function showCustomConfirm(message, title = 'تایید عملیات') {
    return new Promise((resolve) => {
        if (!customConfirmModal || !confirmTitle || !confirmMessage) return resolve(false);
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        customConfirmModal.classList.remove('hidden');
        resolveCustomConfirm = resolve;
    });
}

function closeCustomConfirm(result) {
    if (customConfirmModal) customConfirmModal.classList.add('hidden');
    if (resolveCustomConfirm) resolveCustomConfirm(result);
}

function setActiveScreen(newScreen) {
    if (!currentActiveScreen || !newScreen || currentActiveScreen === newScreen) return;

    // Cleanup old listeners to prevent memory leaks
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; }
    if (unsubscribeLobbyChat) { unsubscribeLobbyChat(); unsubscribeLobbyChat = null; }
    if (unsubscribeAiGame) { unsubscribeAiGame(); unsubscribeAiGame = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

    currentActiveScreen.classList.add('page-transition-hidden');
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        newScreen.classList.remove('hidden');
        newScreen.classList.remove('page-transition-hidden');
        currentActiveScreen = newScreen;

        // Auto-focus on relevant inputs
        if (newScreen === authScreen && emailInput) emailInput.focus();
        else if (newScreen === lobbyScreen && lobbySearchInput) lobbySearchInput.focus();
        else if (newScreen === aiGameScreen && aiGameChatInput) aiGameChatInput.focus();
    }, 500);
}

function getFirebaseErrorMessage(errorCode) {
    const messages = {
        'auth/invalid-email': "فرمت ایمیل نامعتبر است.", 'auth/user-disabled': "حساب کاربری شما غیرفعال شده است.",
        'auth/user-not-found': "کاربری با این ایمیل یافت نشد.", 'auth/wrong-password': "ایمیل یا رمز عبور اشتباه است.",
        'auth/invalid-credential': "ایمیل یا رمز عبور اشتباه است.", 'auth/email-already-in-use': "این ایمیل قبلاً ثبت نام شده است.",
        'auth/weak-password': "رمز عبور باید حداقل ۶ کاراکتر باشد.", 'auth/network-request-failed': "مشکل در اتصال به اینترنت.",
        'auth/too-many-requests': "تعداد تلاش‌های ناموفق بیش از حد مجاز.",
    };
    return messages[errorCode] || "خطایی ناشناخته رخ داده است.";
}

// --- AI Moderation API Call ---
async function checkMessageWithAI(messageText) {
    const prompt = `As a strict linguistic analyst AI, evaluate if the following Persian text is written in a formal, logical, and machine-like tone, suitable for an AI character in a social deduction game. Avoid colloquialisms, slang, and overly emotional language. Your response MUST be a JSON object: {"is_ai_like": boolean, "reason": string}. If 'is_ai_like' is true, the reason should be empty. If false, provide a brief, helpful reason in Persian for the user (e.g., "لحن بیش از حد عامیانه است", "شامل عبارات احساسی است"). Text to analyze: "${messageText}"`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
        });
        if (!response.ok) return { is_ai_like: false, reason: "خطا در ارتباط با سرور تحلیل زبان." };
        const result = await response.json();
        const jsonString = result.candidates[0].content.parts[0].text;
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error calling AI moderation API:", error);
        return { is_ai_like: false, reason: `خطای شبکه در ارتباط با سرور تحلیل.` };
    }
}


// --- Authentication Flow ---
onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed. User:", user?.uid || "None");
    try {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            currentUserData = {
                uid: user.uid,
                email: user.email,
                displayName: userDocSnap.exists() ? userDocSnap.data().displayName : (user.email?.split('@')[0] || 'کاربر')
            };
            if(headerDisplayName) headerDisplayName.textContent = currentUserData.displayName;
            if(headerUserId) headerUserId.textContent = `ID: ${currentUserData.uid.substring(0, 8)}...`;
            
            if (currentActiveScreen === loadingScreen || currentActiveScreen === authScreen) {
                setActiveScreen(mainScreen);
            }
        } else {
            currentUserData = null;
            setActiveScreen(authScreen);
        }
    } catch (error) {
        console.error("Auth state change error:", error);
        showMessageBox("خطا در بارگذاری اطلاعات کاربری.", "error");
        // Fallback to auth screen if profile load fails
        setActiveScreen(authScreen);
    }
});


// --- Lobby & Game Logic ---
async function createLobby(lobbyName, userId, displayName, lobbyType, password, gameDuration) {
    const userLobbiesQuery = query(collection(db, "global_lobbies"), where("hostId", "==", userId), where("status", "in", ["waiting", "playing"]));
    const userLobbiesSnapshot = await getDocs(userLobbiesQuery);
    if (!userLobbiesSnapshot.empty) {
        throw new Error("شما از قبل یک لابی فعال ساخته‌اید.");
    }
    
    const newLobbyData = {
        name: lobbyName,
        hostId: userId,
        status: "waiting",
        type: lobbyType,
        players: { [userId]: displayName },
        kickedPlayers: [],
        createdAt: serverTimestamp(),
        isChatLocked: false,
        gameSettings: {
            maxPlayers: MIN_PLAYERS_TO_START,
            gameDuration: parseInt(gameDuration, 10)
        }
    };

    if (lobbyType === 'private' && password) {
        newLobbyData.password = password;
    }

    const newLobbyRef = await addDoc(collection(db, "global_lobbies"), newLobbyData);
    userHasActiveLobby = true;
    return newLobbyRef.id;
}

function setupLobbyDetailListener(lobbyId, hostId) {
    console.log(`Listening to lobby details for ID: ${lobbyId}`);
    const lobbyRef = doc(db, "global_lobbies", lobbyId);

    unsubscribeLobbyDetail = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            
            if (lobbyData.status === 'playing') {
                console.log("Game started! Transitioning to AI Game Screen.");
                setActiveScreen(aiGameScreen);
                unsubscribeAiGame = setupAiGameListener(lobbyId, hostId);
                return;
            }

            // Render waiting lobby details
            if(detailLobbyName) detailLobbyName.textContent = lobbyData.name;
            const playersMap = lobbyData.players || {};
            if(detailHostName) detailHostName.textContent = `سازنده: ${playersMap[lobbyData.hostId] || 'ناشناس'}`;
            const playerCount = Object.keys(playersMap).length;
            if(detailPlayerCount) detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${MIN_PLAYERS_TO_START}`;

            // Host-specific controls
            const isCurrentUserHost = auth.currentUser?.uid === lobbyData.hostId;
            if (hostActionsContainer) hostActionsContainer.style.display = isCurrentUserHost ? 'flex' : 'none';
            if (startGameBtn) {
                startGameBtn.disabled = playerCount !== MIN_PLAYERS_TO_START;
                startGameBtn.textContent = `شروع بازی (${playerCount}/${MIN_PLAYERS_TO_START})`;
            }
        } else {
            showMessageBox("لابی که در آن بودید بسته شد.", "info");
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
        }
    });
}

async function startGame(lobbyId) {
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    await runTransaction(db, async (transaction) => {
        const lobbySnap = await transaction.get(lobbyRef);
        if (!lobbySnap.exists()) throw new Error("لابی یافت نشد.");
        
        const lobbyData = lobbySnap.data();
        const playerIds = Object.keys(lobbyData.players);
        if (playerIds.length !== MIN_PLAYERS_TO_START) throw new Error(`برای شروع به ${MIN_PLAYERS_TO_START} بازیکن نیاز است.`);

        // Assign roles
        const shuffledPlayers = playerIds.sort(() => 0.5 - Math.random());
        const aiPlayerId = shuffledPlayers[0];
        const roles = {};
        playerIds.forEach(id => {
            roles[id] = (id === aiPlayerId) ? 'AI' : 'Human';
        });

        transaction.update(lobbyRef, {
            status: 'playing',
            gameState: {
                roles: roles,
                eliminatedPlayers: {},
                votes: {},
                phase: 'discussion',
                gameStartTime: serverTimestamp(),
                isGameOver: false,
                winner: null,
            }
        });
    });
}

function setupAiGameListener(lobbyId, hostId) {
    // Initial setup: show countdown
    if(aiGameCountdownOverlay) aiGameCountdownOverlay.classList.remove('hidden');
    let count = 5;
    if(aiGameCountdownTimer) aiGameCountdownTimer.textContent = count;
    const countdownInterval = setInterval(() => {
        count--;
        if(aiGameCountdownTimer) aiGameCountdownTimer.textContent = count > 0 ? count : 'شروع!';
        if (count <= 0) {
            clearInterval(countdownInterval);
            if(aiGameCountdownOverlay) setTimeout(() => aiGameCountdownOverlay.classList.add('hidden'), 1000);
        }
    }, 1000);

    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    return onSnapshot(lobbyRef, async (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            if (lobbyData.status !== 'playing' || !lobbyData.gameState) return;
            
            const gameState = lobbyData.gameState;
            const myUid = auth.currentUser.uid;
            
            if (gameState.isGameOver) {
                openGameOverModal(gameState, lobbyData.players);
                return;
            }
            
            renderAiGameUI(gameState, lobbyData.players, myUid);
            updateAiGameTimer(gameState, lobbyData.gameSettings.gameDuration, hostId, myUid, lobbyId);

            // Check if voting is complete
            const activePlayers = Object.keys(lobbyData.players).filter(pId => !gameState.eliminatedPlayers[pId]);
            const votesCount = Object.keys(gameState.votes).length;
            
            if (gameState.phase === 'voting' && votesCount === activePlayers.length) {
                // Host processes the votes
                if (myUid === hostId) {
                    await processVotes(lobbyId);
                }
            }
        } else {
            showMessageBox("لابی حذف شد.", "info");
            setActiveScreen(lobbyScreen);
        }
    });
}

function renderAiGameUI(gameState, players, myUid) {
    const myRole = gameState.roles[myUid];
    if (aiGameRoleDisplay) {
        aiGameRoleDisplay.textContent = myRole === 'AI' ? 'هوش مصنوعی' : 'انسان';
        aiGameRoleDisplay.style.color = myRole === 'AI' ? '#ff4f81' : '#00c6ff';
    }

    if(aiGamePlayerList) {
        aiGamePlayerList.innerHTML = '';
        const canVote = gameState.phase === 'voting';
        Object.entries(players).forEach(([uid, name]) => {
            const isEliminated = !!gameState.eliminatedPlayers[uid];
            if (isEliminated) return; // Don't show eliminated players in the list for voting

            const playerDiv = document.createElement('div');
            playerDiv.className = 'ai-player-list-item';

            let voteButtonHtml = '';
            const hasVoted = !!gameState.votes[myUid];
            if (canVote && !hasVoted && uid !== myUid) {
                voteButtonHtml = `<button class="vote-btn" data-target-uid="${uid}">رأی</button>`;
            } else if (canVote) {
                voteButtonHtml = `<button class="vote-btn" disabled>${hasVoted ? 'ثبت شد' : 'شما'}</button>`;
            }
            
            playerDiv.innerHTML = `<span>${name}</span> ${voteButtonHtml}`;
            aiGamePlayerList.appendChild(playerDiv);
        });
    }

    if(aiGameChatInput) {
        const isChatDisabled = gameState.phase !== 'discussion';
        aiGameChatInput.disabled = isChatDisabled;
        aiGameChatSendBtn.disabled = isChatDisabled;
        if(aiGameChatStatus) aiGameChatStatus.classList.toggle('hidden', !isChatDisabled);
        if(isChatDisabled) {
            aiGameChatInput.placeholder = "مرحله بحث تمام شد.";
            if(aiGameChatStatus) aiGameChatStatus.textContent = "زمان رأی‌گیری!";
        } else {
            aiGameChatInput.placeholder = "پیام خود را به لحن ادبی بنویسید...";
            if(aiGameChatStatus) aiGameChatStatus.textContent = "";
        }
    }
}

function updateAiGameTimer(gameState, totalDuration, hostId, myUid, lobbyId) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (gameState.phase !== 'discussion') {
        if (aiGameTimer) aiGameTimer.textContent = "00:00";
        return;
    }

    const startTime = gameState.gameStartTime?.toDate().getTime();
    if (!startTime) return;

    gameTimerInterval = setInterval(async () => {
        const remaining = Math.max(0, totalDuration - (Date.now() - startTime) / 1000);
        if (aiGameTimer) {
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            aiGameTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        if (remaining <= 0) {
            clearInterval(gameTimerInterval);
            if (myUid === hostId) {
                await setGamePhase(lobbyId, 'voting');
            }
        }
    }, 1000);
}

async function setGamePhase(lobbyId, phase) {
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    await updateDoc(lobbyRef, { 'gameState.phase': phase });
}

async function castVote(lobbyId, targetUid) {
    await updateDoc(doc(db, "global_lobbies", lobbyId), {
        [`gameState.votes.${auth.currentUser.uid}`]: targetUid
    });
}

async function processVotes(lobbyId) {
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    await runTransaction(db, async (transaction) => {
        const lobbySnap = await transaction.get(lobbyRef);
        if (!lobbySnap.exists()) return;
        
        const lobbyData = lobbySnap.data();
        const gameState = lobbyData.gameState;

        // Tally votes
        const voteCounts = {};
        Object.values(gameState.votes).forEach(votedFor => {
            voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
        });

        // Find player with most votes
        let maxVotes = 0;
        let playerToEliminate = null;
        for (const [playerId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                playerToEliminate = playerId;
            }
        }
        
        // Update game state
        const newGameState = { ...gameState };
        if (playerToEliminate) {
            newGameState.eliminatedPlayers[playerToEliminate] = 'voted_out';
        }
        
        // Check win conditions
        const aiPlayerId = Object.keys(gameState.roles).find(pId => gameState.roles[pId] === 'AI');
        const activeHumans = Object.keys(lobbyData.players).filter(pId => 
            !newGameState.eliminatedPlayers[pId] && gameState.roles[pId] === 'Human'
        );

        if (newGameState.eliminatedPlayers[aiPlayerId]) {
            newGameState.isGameOver = true;
            newGameState.winner = 'humans';
        } else if (activeHumans.length <= 1) {
            newGameState.isGameOver = true;
            newGameState.winner = 'ai';
        } else {
            // Reset for next round
            newGameState.phase = 'discussion';
            newGameState.votes = {};
            newGameState.gameStartTime = serverTimestamp();
        }
        
        transaction.update(lobbyRef, { gameState: newGameState });
    });
}

function openGameOverModal(gameState, players) {
    if (unsubscribeAiGame) { unsubscribeAiGame(); unsubscribeAiGame = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }
    
    const aiPlayerId = Object.keys(gameState.roles).find(pId => gameState.roles[pId] === 'AI');
    const aiPlayerName = players[aiPlayerId];

    if (gameOverAiName) gameOverAiName.textContent = aiPlayerName;
    if (gameOverTitle && gameOverMessage) {
        if (gameState.winner === 'humans') {
            gameOverTitle.textContent = "انسان‌ها پیروز شدند!";
            gameOverMessage.textContent = "شما با موفقیت هوش مصنوعی را شناسایی و حذف کردید.";
            gameOverTitle.style.color = "#00c6ff";
        } else {
            gameOverTitle.textContent = "هوش مصنوعی پیروز شد!";
            gameOverMessage.textContent = "هوش مصنوعی با موفقیت در میان شما باقی ماند.";
            gameOverTitle.style.color = "#ff4f81";
        }
    }
    
    if (gameOverModal) gameOverModal.classList.remove('hidden');
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Auth
    if (loginToggleBtn) loginToggleBtn.addEventListener('click', () => { authMode = 'login'; /*...*/ });
    if (registerToggleBtn) registerToggleBtn.addEventListener('click', () => { authMode = 'register'; /*...*/ });
    if (authForm) authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        try {
            if (authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const displayName = displayNameInput.value.trim();
                if (!displayName) { showMessageBox("لطفاً نام نمایشی را وارد کنید.", 'error'); return; }
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", cred.user.uid), { displayName: displayName, email: email });
            }
        } catch (error) { showMessageBox(getFirebaseErrorMessage(error.code), 'error'); }
    });

    // Profile Modal
    if (menuBtn) menuBtn.addEventListener('click', () => profileModal.classList.remove('hidden'));
    if (profileSummary) profileSummary.addEventListener('click', () => profileModal.classList.remove('hidden'));
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', () => signOut(auth));

    // Main Navigation
    if (friendlyGameBtn) friendlyGameBtn.addEventListener('click', () => {
        setActiveScreen(lobbyScreen);
        unsubscribeLobbies = setupLobbyListener('');
    });
    if (ratedGameBtn) ratedGameBtn.addEventListener('click', () => showMessageBox("بازی امتیازی به زودی!", "info"));
    if (backToMainBtn) backToMainBtn.addEventListener('click', () => setActiveScreen(mainScreen));

    // Lobby Creation
    if (addIconBtn) addIconBtn.addEventListener('click', () => {
        if (userHasActiveLobby) { showMessageBox("شما از قبل در یک لابی فعال هستید.", "info"); return; }
        createLobbyModal.classList.remove('hidden');
    });
    if (closeCreateLobbyModalBtn) closeCreateLobbyModalBtn.addEventListener('click', () => createLobbyModal.classList.add('hidden'));
    if (createLobbyForm) createLobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lobbyName = newLobbyNameInput.value.trim();
        if (!lobbyName) { showCreateLobbyMessageBox("نام لابی را وارد کنید.", "error"); return; }
        try {
            const newLobbyId = await createLobby(
                lobbyName, auth.currentUser.uid, currentUserData.displayName,
                document.querySelector('input[name="lobby-type"]:checked').value,
                newLobbyPasswordInput.value,
                gameDurationSelect.value
            );
            createLobbyModal.classList.add('hidden');
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId, auth.currentUser.uid);
        } catch (error) { showCreateLobbyMessageBox(error.message, "error"); }
    });
    
    // AI Game Chat
    if (aiGameChatForm) aiGameChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = aiGameChatInput.value.trim();
        if (!messageText || !currentLobbyId) return;
        
        aiGameChatSendBtn.disabled = true;
        
        const moderationResult = await checkMessageWithAI(messageText);
        if (moderationResult.is_ai_like) {
            await addDoc(collection(db, `global_lobbies/${currentLobbyId}/messages`), {
                text: messageText, senderUid: auth.currentUser.uid, senderName: currentUserData.displayName,
                timestamp: serverTimestamp(), isDeleted: false
            });
            aiGameChatInput.value = '';
        } else {
            showMessageBox(`پیام رد شد: ${moderationResult.reason}`, 'error');
        }
        
        aiGameChatSendBtn.disabled = false;
    });

    // Confirmation Modal
    if(confirmYesBtn) confirmYesBtn.addEventListener('click', () => closeCustomConfirm(true));
    if(confirmNoBtn) confirmNoBtn.addEventListener('click', () => closeCustomConfirm(false));
    
    // Game Over Modal
    if(gameOverOkBtn) gameOverOkBtn.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        setActiveScreen(lobbyScreen);
        unsubscribeLobbies = setupLobbyListener('');
    });
    
    // Dynamic content listeners
    if (aiGamePlayerList) aiGamePlayerList.addEventListener('click', (e) => {
        if (e.target.matches('.vote-btn[data-target-uid]')) {
            castVote(currentLobbyId, e.target.dataset.targetUid);
        }
    });
    
    // ... other listeners like lobby search, refresh, etc. can be added here
}

// Initialize the application
document.addEventListener('DOMContentLoaded', setupEventListeners);
