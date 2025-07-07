// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; 

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
const MIN_PLAYERS_TO_START = 4;

// --- DOM Elements ---
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const aiGameScreen = document.getElementById('ai-game-screen');
const profileModal = document.getElementById('profile-modal');
const createLobbyModal = document.getElementById('create-lobby-modal');
const customConfirmModal = document.getElementById('custom-confirm-modal');
const kickedMessageModal = document.getElementById('kicked-message-modal');
const enterPasswordModal = document.getElementById('enter-password-modal');
const gameOverModal = document.getElementById('game-over-modal');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const displayNameField = document.getElementById('display-name-field');
const passwordInput = document.getElementById('password');
const loginToggleBtn = document.getElementById('login-toggle-btn');
const registerToggleBtn = document.getElementById('register-toggle-btn');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const messageBox = document.getElementById('message-box');
const menuBtn = document.getElementById('menu-btn');
const profileSummary = document.getElementById('profile-summary');
const headerDisplayName = document.getElementById('header-display-name');
const headerUserId = document.getElementById('header-user-id');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const ratedGameBtn = document.getElementById('rated-game-btn');
const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const lobbySearchInput = document.getElementById('lobby-search-input');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn');
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn');
const myLobbiesBtn = document.getElementById('my-lobbies-btn');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn'); 
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input');
const gameDurationSelect = document.getElementById('game-duration-select');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container');
const startGameBtn = document.getElementById('start-game-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const aiGameCountdownOverlay = document.getElementById('ai-game-countdown-overlay');
const aiGameCountdownTimer = document.getElementById('ai-game-countdown-timer');
const aiGameTimer = document.getElementById('ai-game-timer');
const aiGameRoleDisplay = document.getElementById('ai-game-role-display');
const aiGamePlayerList = document.getElementById('ai-game-player-list');
const aiGameChatForm = document.getElementById('ai-game-chat-form');
const aiGameChatInput = document.getElementById('ai-game-chat-input');
const aiGameChatSendBtn = document.getElementById('ai-game-chat-send-btn');
const aiGameChatStatus = document.getElementById('ai-game-chat-status');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const gameOverAiReveal = document.getElementById('game-over-ai-reveal');
const gameOverAiName = document.getElementById('game-over-ai-name');
const gameOverOkBtn = document.getElementById('game-over-ok-btn');
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
let currentLobbyId = null;
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
    setTimeout(() => { element.classList.add('hidden'); }, 5000);
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
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeAiGame) { unsubscribeAiGame(); unsubscribeAiGame = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }
    currentActiveScreen.classList.add('page-transition-hidden');
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        newScreen.classList.remove('hidden', 'page-transition-hidden');
        currentActiveScreen = newScreen;
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

// --- Authentication Flow (REVISED) ---
onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed. User:", user?.uid || "None");
    try {
        if (user) {
            // User is signed in. Fetch their profile.
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                currentUserData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: userDocSnap.data().displayName
                };
            } else {
                // This might happen if registration succeeded but profile creation failed.
                // We'll create a default profile.
                const defaultDisplayName = user.email?.split('@')[0] || 'کاربر جدید';
                await setDoc(userDocRef, { displayName: defaultDisplayName, email: user.email });
                currentUserData = { uid: user.uid, email: user.email, displayName: defaultDisplayName };
            }

            // Update UI with user data
            if(headerDisplayName) headerDisplayName.textContent = currentUserData.displayName;
            if(headerUserId) headerUserId.textContent = `ID: ${currentUserData.uid.substring(0, 8)}...`;
            if(profileDisplayName) profileDisplayName.textContent = currentUserData.displayName;
            if(profileEmail) profileEmail.textContent = currentUserData.email;
            if(profileUid) profileUid.textContent = currentUserData.uid;
            
            // Transition to main screen
            if (currentActiveScreen === loadingScreen || currentActiveScreen === authScreen) {
                setActiveScreen(mainScreen);
            }
        } else {
            // User is signed out.
            currentUserData = null;
            setActiveScreen(authScreen);
        }
    } catch (error) {
        console.error("Auth state change error:", error);
        showMessageBox("خطا در بارگذاری اطلاعات کاربری.", "error");
        // If something goes wrong, force logout and show auth screen for safety.
        await signOut(auth);
        setActiveScreen(authScreen);
    }
});

// --- Lobby & Game Logic ---
async function createLobby(lobbyName, userId, displayName, lobbyType, password, gameDuration) {
    const newLobbyData = {
        name: lobbyName, hostId: userId, status: "waiting", type: lobbyType,
        players: { [userId]: displayName }, kickedPlayers: [], createdAt: serverTimestamp(),
        isChatLocked: false, gameSettings: {
            maxPlayers: MIN_PLAYERS_TO_START,
            gameDuration: parseInt(gameDuration, 10)
        }
    };
    if (lobbyType === 'private' && password) newLobbyData.password = password;
    const newLobbyRef = await addDoc(collection(db, "global_lobbies"), newLobbyData);
    currentLobbyId = newLobbyRef.id;
    return newLobbyRef.id;
}

function setupLobbyDetailListener(lobbyId, hostId) {
    console.log(`Listening to lobby details for ID: ${lobbyId}`);
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    unsubscribeLobbyDetail = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            if (lobbyData.status === 'playing') {
                setActiveScreen(aiGameScreen);
                unsubscribeAiGame = setupAiGameListener(lobbyId, hostId);
                return;
            }
            const playersMap = lobbyData.players || {};
            const playerCount = Object.keys(playersMap).length;
            if(detailLobbyName) detailLobbyName.textContent = lobbyData.name;
            if(detailHostName) detailHostName.textContent = `سازنده: ${playersMap[lobbyData.hostId] || 'ناشناس'}`;
            if(detailPlayerCount) detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${MIN_PLAYERS_TO_START}`;
            const isCurrentUserHost = auth.currentUser?.uid === lobbyData.hostId;
            if (hostActionsContainer) hostActionsContainer.style.display = isCurrentUserHost ? 'flex' : 'none';
            if (startGameBtn) {
                startGameBtn.disabled = playerCount !== MIN_PLAYERS_TO_START;
                startGameBtn.textContent = `شروع بازی (${playerCount}/${MIN_PLAYERS_TO_START})`;
            }
        } else {
            showMessageBox("لابی بسته شد.", "info");
            setActiveScreen(lobbyScreen);
            if (!unsubscribeLobbies) unsubscribeLobbies = setupLobbyListener('');
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
        if (playerIds.length !== MIN_PLAYERS_TO_START) throw new Error(`به ${MIN_PLAYERS_TO_START} بازیکن نیاز است.`);
        const shuffledPlayers = playerIds.sort(() => 0.5 - Math.random());
        const aiPlayerId = shuffledPlayers[0];
        const roles = {};
        playerIds.forEach(id => { roles[id] = (id === aiPlayerId) ? 'AI' : 'Human'; });
        transaction.update(lobbyRef, {
            status: 'playing',
            gameState: {
                roles, eliminatedPlayers: {}, votes: {}, phase: 'discussion',
                gameStartTime: serverTimestamp(), isGameOver: false, winner: null,
            }
        });
    });
}

// ... (Rest of the game logic functions like setupAiGameListener, renderAiGameUI, etc. from the previous correct response)
function setupAiGameListener(lobbyId, hostId) {
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
            const activePlayers = Object.keys(lobbyData.players).filter(pId => !gameState.eliminatedPlayers[pId]);
            const votesCount = Object.keys(gameState.votes).length;
            if (gameState.phase === 'voting' && votesCount === activePlayers.length && myUid === hostId) {
                await processVotes(lobbyId);
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
        const hasVoted = !!gameState.votes[myUid];
        Object.entries(players).forEach(([uid, name]) => {
            if (gameState.eliminatedPlayers[uid]) return;
            const playerDiv = document.createElement('div');
            playerDiv.className = 'ai-player-list-item';
            let voteButtonHtml = '';
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
        if(aiGameChatSendBtn) aiGameChatSendBtn.disabled = isChatDisabled;
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
    await updateDoc(doc(db, "global_lobbies", lobbyId), { 'gameState.phase': phase });
}

async function castVote(lobbyId, targetUid) {
    await updateDoc(doc(db, "global_lobbies", lobbyId), { [`gameState.votes.${auth.currentUser.uid}`]: targetUid });
}

async function processVotes(lobbyId) {
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    await runTransaction(db, async (transaction) => {
        const lobbySnap = await transaction.get(lobbyRef);
        if (!lobbySnap.exists()) return;
        const lobbyData = lobbySnap.data();
        let gameState = lobbyData.gameState;
        const voteCounts = {};
        Object.values(gameState.votes).forEach(votedFor => { voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1; });
        let maxVotes = 0;
        let playerToEliminate = null;
        for (const [playerId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) { maxVotes = count; playerToEliminate = playerId; }
        }
        if (playerToEliminate) gameState.eliminatedPlayers[playerToEliminate] = 'voted_out';
        const aiPlayerId = Object.keys(gameState.roles).find(pId => gameState.roles[pId] === 'AI');
        const activeHumans = Object.keys(lobbyData.players).filter(pId => !gameState.eliminatedPlayers[pId] && gameState.roles[pId] === 'Human');
        if (gameState.eliminatedPlayers[aiPlayerId]) {
            gameState.isGameOver = true; gameState.winner = 'humans';
        } else if (activeHumans.length <= 1) {
            gameState.isGameOver = true; gameState.winner = 'ai';
        } else {
            gameState.phase = 'discussion'; gameState.votes = {}; gameState.gameStartTime = serverTimestamp();
        }
        transaction.update(lobbyRef, { gameState });
    });
}

function openGameOverModal(gameState, players) {
    if (unsubscribeAiGame) { unsubscribeAiGame(); unsubscribeAiGame = null; }
    if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }
    const aiPlayerId = Object.keys(gameState.roles).find(pId => gameState.roles[pId] === 'AI');
    if(gameOverAiName && players[aiPlayerId]) gameOverAiName.textContent = players[aiPlayerId];
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
    // Auth Form (REVISED)
    if (authForm) authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) { showMessageBox("ایمیل و رمز عبور الزامی است.", 'error'); return; }
        
        try {
            if (authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged will handle the rest
            } else { // Register Mode
                const displayName = displayNameInput.value.trim();
                if (!displayName) { showMessageBox("نام نمایشی الزامی است.", 'error'); return; }
                
                // 1. Create user in Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // 2. Immediately create their profile in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    displayName: displayName,
                    email: user.email
                });
                
                // 3. onAuthStateChanged will now fire and load this new profile
                console.log("Registration successful, user profile created.");
            }
        } catch (error) {
            showMessageBox(getFirebaseErrorMessage(error.code), 'error');
        }
    });

    if (loginToggleBtn) loginToggleBtn.addEventListener('click', () => { 
        authMode = 'login';
        if(displayNameField) displayNameField.classList.add('hidden');
        if(submitAuthBtn) { submitAuthBtn.textContent = 'ورود'; submitAuthBtn.classList.remove('hidden'); }
        if(loginToggleBtn) loginToggleBtn.classList.add('hidden');
        if(registerToggleBtn) registerToggleBtn.classList.remove('hidden');
    });
    if (registerToggleBtn) registerToggleBtn.addEventListener('click', () => {
        authMode = 'register';
        if(displayNameField) displayNameField.classList.remove('hidden');
        if(submitAuthBtn) { submitAuthBtn.textContent = 'ثبت نام'; submitAuthBtn.classList.remove('hidden'); }
        if(registerToggleBtn) registerToggleBtn.classList.add('hidden');
        if(loginToggleBtn) loginToggleBtn.classList.remove('hidden');
    });

    // Profile Modal
    if (menuBtn) menuBtn.addEventListener('click', () => profileModal.classList.remove('hidden'));
    if (profileSummary) profileSummary.addEventListener('click', () => profileModal.classList.remove('hidden'));
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
    if (profileLogoutBtn) profileLogoutBtn.addEventListener('click', () => signOut(auth));

    // Navigation
    if (friendlyGameBtn) friendlyGameBtn.addEventListener('click', () => {
        setActiveScreen(lobbyScreen);
        if (!unsubscribeLobbies) unsubscribeLobbies = setupLobbyListener('');
    });
    if (ratedGameBtn) ratedGameBtn.addEventListener('click', () => showMessageBox("بازی امتیازی به زودی!", "info"));
    if (backToMainBtn) backToMainBtn.addEventListener('click', () => setActiveScreen(mainScreen));
    if (myLobbiesBtn) myLobbiesBtn.addEventListener('click', () => showMessageBox("این قابلیت به زودی اضافه می‌شود!", "info"));

    // Lobby Creation
    if (addIconBtn) addIconBtn.addEventListener('click', () => createLobbyModal.classList.remove('hidden'));
    if (closeCreateLobbyModalBtn) closeCreateLobbyModalBtn.addEventListener('click', () => createLobbyModal.classList.add('hidden'));
    if (createLobbyForm) createLobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lobbyName = newLobbyNameInput.value.trim();
        if (!lobbyName) { showCreateLobbyMessageBox("نام لابی را وارد کنید.", "error"); return; }
        try {
            const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName,
                document.querySelector('input[name="lobby-type"]:checked').value, newLobbyPasswordInput.value, gameDurationSelect.value);
            createLobbyModal.classList.add('hidden');
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId, auth.currentUser.uid);
        } catch (error) { showCreateLobbyMessageBox(error.message, "error"); }
    });
    
    // Start Game
    if (startGameBtn) startGameBtn.addEventListener('click', () => {
        if (startGameBtn.disabled || !currentLobbyId) return;
        showCustomConfirm("آیا برای شروع بازی آماده‌اید؟", "شروع بازی").then(confirmed => {
            if (confirmed) startGame(currentLobbyId);
        });
    });

    // AI Game Chat
    if (aiGameChatForm) aiGameChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = aiGameChatInput.value.trim();
        if (!messageText || !currentLobbyId) return;
        if(aiGameChatSendBtn) aiGameChatSendBtn.disabled = true;
        const moderationResult = await checkMessageWithAI(messageText);
        if (moderationResult.is_ai_like) {
            await addDoc(collection(db, `global_lobbies/${currentLobbyId}/messages`), {
                text: messageText, senderUid: auth.currentUser.uid, senderName: currentUserData.displayName,
                timestamp: serverTimestamp() });
            aiGameChatInput.value = '';
        } else {
            showMessageBox(`پیام رد شد: ${moderationResult.reason}`, 'error');
        }
        if(aiGameChatSendBtn) aiGameChatSendBtn.disabled = false;
    });

    // Modals
    if(confirmYesBtn) confirmYesBtn.addEventListener('click', () => closeCustomConfirm(true));
    if(confirmNoBtn) confirmNoBtn.addEventListener('click', () => closeCustomConfirm(false));
    if(gameOverOkBtn) gameOverOkBtn.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        setActiveScreen(lobbyScreen);
        if (!unsubscribeLobbies) unsubscribeLobbies = setupLobbyListener('');
    });
    
    // Dynamic content delegation
    if (aiGamePlayerList) aiGamePlayerList.addEventListener('click', (e) => {
        if (e.target.matches('.vote-btn[data-target-uid]')) {
            castVote(currentLobbyId, e.target.dataset.targetUid);
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', setupEventListeners);
