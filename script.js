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
// This MUST match the appId used in your security rules path.
const appId = "default-app-id"; 

// --- DOM Elements ---
const screens = {
    loading: document.getElementById('loading-screen'),
    auth: document.getElementById('auth-screen'),
    main: document.getElementById('main-screen'),
    lobby: document.getElementById('lobby-screen'),
    lobbyDetail: document.getElementById('lobby-detail-screen'),
    aiGame: document.getElementById('ai-game-screen'),
};
const modals = {
    profile: document.getElementById('profile-modal'),
    createLobby: document.getElementById('create-lobby-modal'),
    confirm: document.getElementById('custom-confirm-modal'),
    kicked: document.getElementById('kicked-message-modal'),
    password: document.getElementById('enter-password-modal'),
    gameOver: document.getElementById('game-over-modal'),
};
const dom = {
    authForm: document.getElementById('auth-form'), emailInput: document.getElementById('email'),
    displayNameInput: document.getElementById('display-name'), displayNameField: document.getElementById('display-name-field'),
    passwordInput: document.getElementById('password'), loginToggleBtn: document.getElementById('login-toggle-btn'),
    registerToggleBtn: document.getElementById('register-toggle-btn'), submitAuthBtn: document.getElementById('submit-auth-btn'),
    messageBox: document.getElementById('message-box'), menuBtn: document.getElementById('menu-btn'),
    profileSummary: document.getElementById('profile-summary'), headerDisplayName: document.getElementById('header-display-name'),
    headerUserId: document.getElementById('header-user-id'), friendlyGameBtn: document.getElementById('friendly-game-btn'),
    ratedGameBtn: document.getElementById('rated-game-btn'), closeProfileModalBtn: document.getElementById('close-profile-modal-btn'),
    profileDisplayName: document.getElementById('profile-display-name'), profileEmail: document.getElementById('profile-email'),
    profileUid: document.getElementById('profile-uid'), profileLogoutBtn: document.getElementById('profile-logout-btn'),
    backToMainBtn: document.getElementById('back-to-main-btn'), lobbySearchInput: document.getElementById('lobby-search-input'),
    lobbiesList: document.getElementById('lobbies-list'), addIconBtn: document.getElementById('add-icon-btn'),
    refreshLobbiesBtn: document.getElementById('refresh-lobbies-btn'), myLobbiesBtn: document.getElementById('my-lobbies-btn'),
    closeCreateLobbyModalBtn: document.getElementById('close-create-lobby-modal-btn'), createLobbyForm: document.getElementById('create-lobby-form'),
    newLobbyNameInput: document.getElementById('new-lobby-name-input'), createLobbyMessageBox: document.getElementById('create-lobby-message-box'),
    newLobbyPasswordInput: document.getElementById('new-lobby-password-input'), gameDurationSelect: document.getElementById('game-duration-select'),
    detailLobbyName: document.getElementById('detail-lobby-name'), detailHostName: document.getElementById('detail-host-name'),
    detailPlayerCount: document.getElementById('detail-player-count'), hostActionsContainer: document.getElementById('host-actions-container'),
    startGameBtn: document.getElementById('start-game-btn'), leaveLobbyBtn: document.getElementById('leave-lobby-btn'),
    aiGameCountdownOverlay: document.getElementById('ai-game-countdown-overlay'), aiGameCountdownTimer: document.getElementById('ai-game-countdown-timer'),
    aiGameTimer: document.getElementById('ai-game-timer'), aiGameRoleDisplay: document.getElementById('ai-game-role-display'),
    aiGamePlayerList: document.getElementById('ai-game-player-list'), aiGameChatForm: document.getElementById('ai-game-chat-form'),
    aiGameChatInput: document.getElementById('ai-game-chat-input'), aiGameChatSendBtn: document.getElementById('ai-game-chat-send-btn'),
    aiGameChatStatus: document.getElementById('ai-game-chat-status'), gameOverTitle: document.getElementById('game-over-title'),
    gameOverMessage: document.getElementById('game-over-message'), gameOverAiReveal: document.getElementById('game-over-ai-reveal'),
    gameOverAiName: document.getElementById('game-over-ai-name'), gameOverOkBtn: document.getElementById('game-over-ok-btn'),
    confirmTitle: document.getElementById('confirm-title'), confirmMessage: document.getElementById('confirm-message'),
    confirmYesBtn: document.getElementById('confirm-yes-btn'), confirmNoBtn: document.getElementById('confirm-no-btn'),
};

// --- State Variables ---
let authMode = 'login';
let currentActiveScreen = screens.loading;
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
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
const showMessageBox = (msg, type) => showCustomMessage(dom.messageBox, msg, type);
const showCreateLobbyMessageBox = (msg, type) => showCustomMessage(dom.createLobbyMessageBox, msg, type);

function showCustomConfirm(message, title = 'تایید عملیات') {
    return new Promise((resolve) => {
        if (!modals.confirm || !dom.confirmTitle || !dom.confirmMessage) return resolve(false);
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = message;
        modals.confirm.classList.remove('hidden');
        resolveCustomConfirm = resolve;
    });
}

function closeCustomConfirm(result) {
    if (modals.confirm) modals.confirm.classList.add('hidden');
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
        if (newScreen === screens.auth && dom.emailInput) dom.emailInput.focus();
        else if (newScreen === screens.lobby && dom.lobbySearchInput) dom.lobbySearchInput.focus();
        else if (newScreen === screens.aiGame && dom.aiGameChatInput) dom.aiGameChatInput.focus();
    }, 500);
}

function getFirebaseErrorMessage(errorCode) {
    const messages = {
        'auth/invalid-email': "فرمت ایمیل نامعتبر است.",'auth/user-disabled': "حساب کاربری شما غیرفعال شده است.",
        'auth/user-not-found': "کاربری با این ایمیل یافت نشد.",'auth/wrong-password': "ایمیل یا رمز عبور اشتباه است.",
        'auth/invalid-credential': "ایمیل یا رمز عبور اشتباه است.",'auth/email-already-in-use': "این ایمیل قبلاً ثبت نام شده است.",
        'auth/weak-password': "رمز عبور باید حداقل ۶ کاراکتر باشد.",'auth/network-request-failed': "مشکل در اتصال به اینترنت.",
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
    try {
        if (user) {
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                currentUserData = { uid: user.uid, email: user.email, displayName: userDocSnap.data().displayName };
            } else {
                const defaultDisplayName = user.email?.split('@')[0] || 'کاربر جدید';
                await setDoc(userDocRef, { displayName: defaultDisplayName, email: user.email });
                currentUserData = { uid: user.uid, email: user.email, displayName: defaultDisplayName };
            }

            if(dom.headerDisplayName) dom.headerDisplayName.textContent = currentUserData.displayName;
            if(dom.headerUserId) dom.headerUserId.textContent = `ID: ${currentUserData.uid.substring(0, 8)}...`;
            if(dom.profileDisplayName) dom.profileDisplayName.textContent = currentUserData.displayName;
            if(dom.profileEmail) dom.profileEmail.textContent = currentUserData.email;
            if(dom.profileUid) dom.profileUid.textContent = currentUserData.uid;
            
            if (currentActiveScreen === screens.loading || currentActiveScreen === screens.auth) {
                setActiveScreen(screens.main);
            }
        } else {
            currentUserData = null;
            setActiveScreen(screens.auth);
        }
    } catch (error) {
        console.error("Auth state change error:", error);
        showMessageBox("خطا در بارگذاری اطلاعات کاربری.", "error");
        await signOut(auth);
        setActiveScreen(screens.auth);
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
    const lobbyRef = doc(db, "global_lobbies", lobbyId);
    unsubscribeLobbyDetail = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            if (lobbyData.status === 'playing') {
                setActiveScreen(screens.aiGame);
                unsubscribeAiGame = setupAiGameListener(lobbyId, hostId);
                return;
            }
            const playersMap = lobbyData.players || {};
            const playerCount = Object.keys(playersMap).length;
            if(dom.detailLobbyName) dom.detailLobbyName.textContent = lobbyData.name;
            if(dom.detailHostName) dom.detailHostName.textContent = `سازنده: ${playersMap[lobbyData.hostId] || 'ناشناس'}`;
            if(dom.detailPlayerCount) dom.detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${MIN_PLAYERS_TO_START}`;
            const isCurrentUserHost = auth.currentUser?.uid === lobbyData.hostId;
            if (dom.hostActionsContainer) dom.hostActionsContainer.style.display = isCurrentUserHost ? 'flex' : 'none';
            if (dom.startGameBtn) {
                dom.startGameBtn.disabled = playerCount !== MIN_PLAYERS_TO_START;
                dom.startGameBtn.textContent = `شروع بازی (${playerCount}/${MIN_PLAYERS_TO_START})`;
            }
        } else {
            showMessageBox("لابی بسته شد.", "info");
            setActiveScreen(screens.lobby);
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

function setupAiGameListener(lobbyId, hostId) {
    if(dom.aiGameCountdownOverlay) dom.aiGameCountdownOverlay.classList.remove('hidden');
    let count = 5;
    if(dom.aiGameCountdownTimer) dom.aiGameCountdownTimer.textContent = count;
    const countdownInterval = setInterval(() => {
        count--;
        if(dom.aiGameCountdownTimer) dom.aiGameCountdownTimer.textContent = count > 0 ? count : 'شروع!';
        if (count <= 0) {
            clearInterval(countdownInterval);
            if(dom.aiGameCountdownOverlay) setTimeout(() => dom.aiGameCountdownOverlay.classList.add('hidden'), 1000);
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
            setActiveScreen(screens.lobby);
        }
    });
}

function renderAiGameUI(gameState, players, myUid) {
    const myRole = gameState.roles[myUid];
    if (dom.aiGameRoleDisplay) {
        dom.aiGameRoleDisplay.textContent = myRole === 'AI' ? 'هوش مصنوعی' : 'انسان';
        dom.aiGameRoleDisplay.style.color = myRole === 'AI' ? '#ff4f81' : '#00c6ff';
    }
    if(dom.aiGamePlayerList) {
        dom.aiGamePlayerList.innerHTML = '';
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
            dom.aiGamePlayerList.appendChild(playerDiv);
        });
    }
    if(dom.aiGameChatInput) {
        const isChatDisabled = gameState.phase !== 'discussion';
        dom.aiGameChatInput.disabled = isChatDisabled;
        if(dom.aiGameChatSendBtn) dom.aiGameChatSendBtn.disabled = isChatDisabled;
        if(dom.aiGameChatStatus) dom.aiGameChatStatus.classList.toggle('hidden', !isChatDisabled);
        if(isChatDisabled) {
            dom.aiGameChatInput.placeholder = "مرحله بحث تمام شد.";
            if(dom.aiGameChatStatus) dom.aiGameChatStatus.textContent = "زمان رأی‌گیری!";
        } else {
            dom.aiGameChatInput.placeholder = "پیام خود را به لحن ادبی بنویسید...";
            if(dom.aiGameChatStatus) dom.aiGameChatStatus.textContent = "";
        }
    }
}

function updateAiGameTimer(gameState, totalDuration, hostId, myUid, lobbyId) {
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (gameState.phase !== 'discussion') {
        if (dom.aiGameTimer) dom.aiGameTimer.textContent = "00:00";
        return;
    }
    const startTime = gameState.gameStartTime?.toDate().getTime();
    if (!startTime) return;
    gameTimerInterval = setInterval(async () => {
        const remaining = Math.max(0, totalDuration - (Date.now() - startTime) / 1000);
        if (dom.aiGameTimer) {
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            dom.aiGameTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
        let gameState = lobbySnap.data().gameState;
        const voteCounts = {};
        Object.values(gameState.votes).forEach(votedFor => { voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1; });
        let maxVotes = 0;
        let playerToEliminate = null;
        for (const [playerId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) { maxVotes = count; playerToEliminate = playerId; }
        }
        if (playerToEliminate) gameState.eliminatedPlayers[playerToEliminate] = 'voted_out';
        const aiPlayerId = Object.keys(gameState.roles).find(pId => gameState.roles[pId] === 'AI');
        const activeHumans = Object.keys(lobbySnap.data().players).filter(pId => !gameState.eliminatedPlayers[pId] && gameState.roles[pId] === 'Human');
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
    if(dom.gameOverAiName && players[aiPlayerId]) dom.gameOverAiName.textContent = players[aiPlayerId];
    if (dom.gameOverTitle && dom.gameOverMessage) {
        if (gameState.winner === 'humans') {
            dom.gameOverTitle.textContent = "انسان‌ها پیروز شدند!";
            dom.gameOverMessage.textContent = "شما با موفقیت هوش مصنوعی را شناسایی و حذف کردید.";
            dom.gameOverTitle.style.color = "#00c6ff";
        } else {
            dom.gameOverTitle.textContent = "هوش مصنوعی پیروز شد!";
            dom.gameOverMessage.textContent = "هوش مصنوعی با موفقیت در میان شما باقی ماند.";
            dom.gameOverTitle.style.color = "#ff4f81";
        }
    }
    if (modals.gameOver) modals.gameOver.classList.remove('hidden');
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    if (dom.authForm) dom.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = dom.emailInput.value.trim();
        const password = dom.passwordInput.value.trim();
        if (!email || !password) { showMessageBox("ایمیل و رمز عبور الزامی است.", 'error'); return; }
        try {
            if (authMode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const displayName = dom.displayNameInput.value.trim();
                if (!displayName) { showMessageBox("نام نمایشی الزامی است.", 'error'); return; }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`), {
                    displayName, email: userCredential.user.email
                });
            }
        } catch (error) { showMessageBox(getFirebaseErrorMessage(error.code), 'error'); }
    });

    if (dom.loginToggleBtn) dom.loginToggleBtn.addEventListener('click', () => { authMode = 'login'; dom.displayNameField.classList.add('hidden'); dom.submitAuthBtn.textContent = 'ورود'; dom.loginToggleBtn.classList.add('hidden'); dom.registerToggleBtn.classList.remove('hidden'); });
    if (dom.registerToggleBtn) dom.registerToggleBtn.addEventListener('click', () => { authMode = 'register'; dom.displayNameField.classList.remove('hidden'); dom.submitAuthBtn.textContent = 'ثبت نام'; dom.registerToggleBtn.classList.add('hidden'); dom.loginToggleBtn.classList.remove('hidden'); });
    if (dom.menuBtn) dom.menuBtn.addEventListener('click', () => modals.profile.classList.remove('hidden'));
    if (dom.profileSummary) dom.profileSummary.addEventListener('click', () => modals.profile.classList.remove('hidden'));
    if (dom.closeProfileModalBtn) dom.closeProfileModalBtn.addEventListener('click', () => modals.profile.classList.add('hidden'));
    if (dom.profileLogoutBtn) dom.profileLogoutBtn.addEventListener('click', () => signOut(auth));
    if (dom.friendlyGameBtn) dom.friendlyGameBtn.addEventListener('click', () => { setActiveScreen(screens.lobby); if (!unsubscribeLobbies) unsubscribeLobbies = setupLobbyListener(''); });
    if (dom.ratedGameBtn) dom.ratedGameBtn.addEventListener('click', () => showMessageBox("بازی امتیازی به زودی!", "info"));
    if (dom.backToMainBtn) dom.backToMainBtn.addEventListener('click', () => setActiveScreen(screens.main));
    if (dom.myLobbiesBtn) dom.myLobbiesBtn.addEventListener('click', () => showMessageBox("این قابلیت به زودی اضافه می‌شود!", "info"));
    if (dom.addIconBtn) dom.addIconBtn.addEventListener('click', () => modals.createLobby.classList.remove('hidden'));
    if (dom.closeCreateLobbyModalBtn) dom.closeCreateLobbyModalBtn.addEventListener('click', () => modals.createLobby.classList.add('hidden'));
    if (dom.createLobbyForm) dom.createLobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const lobbyName = dom.newLobbyNameInput.value.trim();
        if (!lobbyName) { showCreateLobbyMessageBox("نام لابی را وارد کنید.", "error"); return; }
        try {
            const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName,
                document.querySelector('input[name="lobby-type"]:checked').value, dom.newLobbyPasswordInput.value, dom.gameDurationSelect.value);
            modals.createLobby.classList.add('hidden');
            setActiveScreen(screens.lobbyDetail);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId, auth.currentUser.uid);
        } catch (error) { showCreateLobbyMessageBox(error.message, "error"); }
    });
    if (dom.startGameBtn) dom.startGameBtn.addEventListener('click', () => {
        if (dom.startGameBtn.disabled || !currentLobbyId) return;
        showCustomConfirm("آیا برای شروع بازی آماده‌اید؟", "شروع بازی").then(confirmed => {
            if (confirmed) startGame(currentLobbyId);
        });
    });
    if (dom.aiGameChatForm) dom.aiGameChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = dom.aiGameChatInput.value.trim();
        if (!messageText || !currentLobbyId) return;
        if(dom.aiGameChatSendBtn) dom.aiGameChatSendBtn.disabled = true;
        const moderationResult = await checkMessageWithAI(messageText);
        if (moderationResult.is_ai_like) {
            await addDoc(collection(db, `global_lobbies/${currentLobbyId}/messages`), {
                text: messageText, senderUid: auth.currentUser.uid, senderName: currentUserData.displayName, timestamp: serverTimestamp() });
            dom.aiGameChatInput.value = '';
        } else { showMessageBox(`پیام رد شد: ${moderationResult.reason}`, 'error'); }
        if(dom.aiGameChatSendBtn) dom.aiGameChatSendBtn.disabled = false;
    });
    if(dom.confirmYesBtn) dom.confirmYesBtn.addEventListener('click', () => closeCustomConfirm(true));
    if(dom.confirmNoBtn) dom.confirmNoBtn.addEventListener('click', () => closeCustomConfirm(false));
    if(dom.gameOverOkBtn) dom.gameOverOkBtn.addEventListener('click', () => {
        modals.gameOver.classList.add('hidden');
        setActiveScreen(screens.lobby);
        if (!unsubscribeLobbies) unsubscribeLobbies = setupLobbyListener('');
    });
    if (dom.aiGamePlayerList) dom.aiGamePlayerList.addEventListener('click', (e) => {
        if (e.target.matches('.vote-btn[data-target-uid]')) {
            castVote(currentLobbyId, e.target.dataset.targetUid);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupEventListeners);
