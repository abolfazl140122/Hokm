// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, deleteDoc, getDocs, orderBy, limit, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const profileModal = document.getElementById('profile-modal');
const createLobbyModal = document.getElementById('create-lobby-modal');
const customConfirmModal = document.getElementById('custom-confirm-modal');
const kickPlayerConfirmModal = document.getElementById('kick-player-confirm-modal');
const kickedMessageModal = document.getElementById('kicked-message-modal');
const kickedPlayersListModal = document.getElementById('kicked-players-list-modal');
const lobbySettingsModal = document.getElementById('lobby-settings-modal');
const passwordPromptModal = document.getElementById('password-prompt-modal');
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const newLobbyScenarioInput = document.getElementById('new-lobby-scenario-input');
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input');
const lobbiesList = document.getElementById('lobbies-list');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailLobbyScenario = document.getElementById('detail-lobby-scenario');
const detailHostName = document.getElementById('detail-host-name');
const playerSlotsGrid = lobbyDetailScreen.querySelector('.player-slots-grid');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container');
const startGameBtn = document.getElementById('start-game-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const addIconBtn = document.getElementById('add-icon-btn');
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn');
const messageBox = document.getElementById('message-box');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const passwordPromptForm = document.getElementById('password-prompt-form');
const passwordPromptInput = document.getElementById('password-prompt-input');
const passwordPromptMessageBox = document.getElementById('password-prompt-message-box');
const lobbySettingsForm = document.getElementById('lobby-settings-form');
const settingLobbyName = document.getElementById('setting-lobby-name');
const settingLobbyScenario = document.getElementById('setting-lobby-scenario');
const settingLobbyPassword = document.getElementById('setting-lobby-password');
const lobbySettingsMessageBox = document.getElementById('lobby-settings-message-box');
const lobbySettingsBtn = document.getElementById('lobby-settings-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInputForm = document.getElementById('chat-input-form');
const chatMessageInput = document.getElementById('chat-message-input');
const kickPlayerConfirmName = document.getElementById('kick-player-confirm-name');
const kickedLobbyName = document.getElementById('kicked-lobby-name');
const kickedPlayersListContent = document.getElementById('kicked-players-list-content');
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn');

// State variables
let currentActiveScreen = loadingScreen;
let currentUserData = null;
let unsubscribeLobbies = null;
let unsubscribeLobbyDetail = null;
let unsubscribeKickedPlayers = null;
let unsubscribeChat = null;
let userHasActiveLobby = false;
let currentLobbyId = null;
let currentLobbyData = null;
let kickedPlayerToProcess = null;
let lobbyToJoin = null;

// --- Utility & Modal Functions ---
function showCustomMessage(element, message, type = 'info') {
    if (!element) return;
    element.textContent = message;
    element.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    const types = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    element.classList.add(...(types[type] || types.info).split(' '));
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
}
const showMessageBox = (msg, type) => showCustomMessage(messageBox, msg, type);
const showCreateLobbyMessageBox = (msg, type) => showCustomMessage(createLobbyMessageBox, msg, type);
const showLobbySettingsMessageBox = (msg, type) => showCustomMessage(lobbySettingsMessageBox, msg, type);
const showPasswordPromptMessageBox = (msg, type) => showCustomMessage(passwordPromptMessageBox, msg, type);

function openModal(modal) { /* ... same as before ... */ }
function closeModal(modal) { /* ... same as before ... */ }
function setActiveScreen(newScreen) { /* ... same as before ... */ }

// --- Authentication ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        const userDocSnap = await getDoc(userDocRef);
        currentUserData = {
            uid: user.uid,
            email: user.email,
            displayName: (userDocSnap.exists() && userDocSnap.data().displayName) ? userDocSnap.data().displayName : 'کاربر ناشناس'
        };
        document.getElementById('header-display-name').textContent = currentUserData.displayName;
        document.getElementById('header-user-id').textContent = `شناسه: ${user.uid.substring(0, 8)}...`;
        setActiveScreen(mainScreen);
    } else {
        currentUserData = null;
        setActiveScreen(authScreen);
        if (unsubscribeLobbies) unsubscribeLobbies();
        if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
        if (unsubscribeChat) unsubscribeChat();
    }
});

// --- Lobby Management ---

async function createLobby(lobbyName, scenario, password) {
    const lobbiesRef = collection(db, `global_lobbies`);
    const newLobbyData = {
        name: lobbyName,
        scenario: scenario,
        password: password,
        hostId: currentUserData.uid,
        status: "waiting",
        // NEW: Using a map for players
        players: {
            [currentUserData.uid]: { displayName: currentUserData.displayName }
        },
        // NEW: Using a map for kicked players
        kickedPlayers: {},
        createdAt: serverTimestamp(),
        gameSettings: { maxPlayers: 4, roundsToWin: 7 }
    };
    const newLobbyRef = await addDoc(lobbiesRef, newLobbyData);
    return newLobbyRef.id;
}

function setupLobbyListener(searchTerm = '') {
    if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
    if (unsubscribeChat) unsubscribeChat();
    const q = query(collection(db, `global_lobbies`), where("status", "==", "waiting"));
    unsubscribeLobbies = onSnapshot(q, (snapshot) => {
        let lobbiesToDisplay = [];
        userHasActiveLobby = false;
        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            // NEW: Check if user is in the players map
            if (currentUserData.uid in lobby.players) {
                userHasActiveLobby = true;
            }
            const normalizedSearchTerm = searchTerm.toLowerCase();
            if (!searchTerm || (lobby.name || '').toLowerCase().includes(normalizedSearchTerm) || (lobby.scenario || '').toLowerCase().includes(normalizedSearchTerm)) {
                lobbiesToDisplay.push(lobby);
            }
        });

        lobbiesList.innerHTML = lobbiesToDisplay.length === 0 ? '<p class="text-gray-400">لابی یافت نشد.</p>' : '';
        lobbiesToDisplay.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        lobbiesToDisplay.forEach(lobby => {
            const isHost = lobby.hostId === currentUserData.uid;
            // NEW: Check kicked players map
            const isKicked = currentUserData.uid in lobby.kickedPlayers;
            // NEW: Get player count from map size
            const playerCount = Object.keys(lobby.players).length;
            const isFull = playerCount >= lobby.gameSettings.maxPlayers;
            const hostDisplayName = lobby.players[lobby.hostId]?.displayName || 'ناشناس';

            let actionButton = '';
            if (isHost) {
                 actionButton = `<button data-lobby-id="${lobby.id}" class="view-my-lobby-btn classic-btn btn-blue-classic">ورود به لابی من</button>`;
            } else if (isKicked) {
                 actionButton = `<button class="classic-btn btn-red-classic" disabled>اخراج شده‌اید</button>`;
            } else if (isFull) {
                actionButton = `<button class="classic-btn btn-gray-classic" disabled>لابی پر است</button>`;
            } else if (userHasActiveLobby) {
                actionButton = `<button class="classic-btn btn-blue-classic" disabled>ورود به لابی</button>`;
            } else {
                actionButton = `<button data-lobby-id='${JSON.stringify(lobby)}' class="join-lobby-btn classic-btn btn-blue-classic">ورود به لابی</button>`;
            }

            const lobbyItem = document.createElement('div');
            lobbyItem.className = 'lobby-item';
            lobbyItem.innerHTML = `
                <div class="lobby-info">
                    <h3>
                        ${lobby.password ? `<svg class="lock-icon" ...></svg>` : ''}
                        ${lobby.name}
                    </h3>
                    ${lobby.scenario ? `<p class="scenario">${lobby.scenario}</p>` : ''}
                    <p>سازنده: ${hostDisplayName}</p>
                    <p>بازیکنان: ${playerCount}/${lobby.gameSettings.maxPlayers}</p>
                </div>
                <div class="lobby-actions">${actionButton}</div>
            `;
            lobbiesList.appendChild(lobbyItem);
        });
    }, (error) => {
        console.error("Lobby listener error:", error);
        lobbiesList.innerHTML = `<p class="text-red-400">خطا در بارگذاری لابی‌ها.</p>`;
    });
}

async function joinLobby(lobbyId, password = "") {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) throw new Error("لابی یافت نشد.");
        const lobby = lobbySnap.data();
        if (lobby.password && lobby.password !== password) {
            showPasswordPromptMessageBox("رمز عبور اشتباه است.", "error");
            return false;
        }
        // NEW: Add player to map using dot notation
        await updateDoc(lobbyRef, {
            [`players.${currentUserData.uid}`]: { displayName: currentUserData.displayName }
        });
        currentLobbyId = lobbyId;
        setActiveScreen(lobbyDetailScreen);
        setupLobbyDetailListener(lobbyId);
        closeModal(passwordPromptModal);
        return true;
    } catch (error) {
        console.error("Join lobby error:", error);
        (currentActiveScreen === lobbyScreen ? showMessageBox : showPasswordPromptMessageBox)(`خطا در ورود: ${error.message}`, "error");
        return false;
    }
}

function setupLobbyDetailListener(lobbyId) {
    if (unsubscribeLobbies) unsubscribeLobbies();
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    unsubscribeLobbyDetail = onSnapshot(lobbyRef, (docSnap) => {
        if (!docSnap.exists()) {
            showMessageBox("لابی که در آن بودید بسته شد.", "info");
            setActiveScreen(lobbyScreen);
            setupLobbyListener();
            return;
        }
        currentLobbyData = { id: docSnap.id, ...docSnap.data() };
        const isHost = currentLobbyData.hostId === currentUserData.uid;

        // NEW: Check kicked players map
        if (currentUserData.uid in currentLobbyData.kickedPlayers) {
            showKickedMessageModal(currentLobbyData.name);
            return;
        }

        detailLobbyName.textContent = currentLobbyData.name;
        detailLobbyScenario.textContent = currentLobbyData.scenario || "بدون توضیحات";
        detailHostName.textContent = `سازنده: ${currentLobbyData.players[currentLobbyData.hostId]?.displayName || 'ناشناس'}`;
        const playerCount = Object.keys(currentLobbyData.players).length;
        detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${currentLobbyData.gameSettings.maxPlayers}`;

        // Player slots
        playerSlotsGrid.innerHTML = '';
        const playersArray = Object.entries(currentLobbyData.players).map(([uid, data]) => ({ uid, ...data }));
        for (let i = 0; i < currentLobbyData.gameSettings.maxPlayers; i++) {
            const player = playersArray[i];
            const slot = document.createElement('div');
            slot.className = `player-slot ${player ? 'filled' : ''}`;
            slot.innerHTML = `...`; // Same as before
            if (isHost && player && player.uid !== currentUserData.uid) {
                slot.classList.add('clickable');
                slot.dataset.playerUid = player.uid;
                slot.dataset.playerName = player.displayName;
                slot.onclick = () => { /* openKickPlayerConfirmModal(...) */ };
            }
            playerSlotsGrid.appendChild(slot);
        }
        
        hostActionsContainer.style.display = isHost ? 'flex' : 'none';
        startGameBtn.disabled = playerCount !== currentLobbyData.gameSettings.maxPlayers;
        if (!unsubscribeChat) setupChatListener(lobbyId);
    });
}

async function leaveLobby() {
    if (!currentLobbyId) return;
    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    if (currentLobbyData.hostId === currentUserData.uid) {
        await deleteDoc(lobbyRef);
    } else {
        // NEW: Remove player from map using deleteField()
        await updateDoc(lobbyRef, {
            [`players.${currentUserData.uid}`]: deleteField()
        });
    }
    setActiveScreen(lobbyScreen);
    setupLobbyListener();
}

async function kickPlayer(lobbyId, playerToKickUid, playerToKickDisplayName) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        await updateDoc(lobbyRef, {
            // NEW: Remove from players map and add to kickedPlayers map
            [`players.${playerToKickUid}`]: deleteField(),
            [`kickedPlayers.${playerToKickUid}`]: { displayName: playerToKickDisplayName }
        });
        showMessageBox(`بازیکن "${playerToKickDisplayName}" با موفقیت اخراج شد.`, "success");
        closeModal(kickPlayerConfirmModal);
    } catch (e) {
        showMessageBox(`خطا در اخراج بازیکن: ${e.message}`, "error");
    }
}

async function unkickPlayer(lobbyId, playerToUnkickUid) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        // NEW: Remove from kickedPlayers map
        await updateDoc(lobbyRef, {
            [`kickedPlayers.${playerToUnkickUid}`]: deleteField()
        });
        showMessageBox(`بازیکن با موفقیت از لیست اخراجی‌ها خارج شد.`, "success");
    } catch (e) {
        showMessageBox(`خطا: ${e.message}`, "error");
    }
}

function setupKickedPlayersListListener(lobbyId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    unsubscribeKickedPlayers = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const kickedPlayers = docSnap.data().kickedPlayers || {};
            // NEW: Use Object.entries for map
            const kickedPlayersArray = Object.entries(kickedPlayers);
            kickedPlayersListContent.innerHTML = kickedPlayersArray.length === 0 ? '<p>هیچ بازیکنی اخراج نشده است.</p>' : '';
            kickedPlayersArray.forEach(([uid, playerData]) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'flex items-center justify-between ...';
                playerDiv.innerHTML = `
                    <span>${playerData.displayName}</span>
                    <button data-player-uid="${uid}" class="unkick-player-btn ...">بازگرداندن</button>
                `;
                kickedPlayersListContent.appendChild(playerDiv);
            });
        }
    });
}


// --- Event Listeners ---
// ... (Most event listeners remain the same, ensure they call the updated functions) ...
friendlyGameBtn.addEventListener('click', () => {
    setActiveScreen(lobbyScreen);
    setupLobbyListener();
});
backToMainBtn.addEventListener('click', () => {
    setActiveScreen(mainScreen);
    if (unsubscribeLobbies) unsubscribeLobbies();
});
addIconBtn.addEventListener('click', () => openModal(createLobbyModal));
refreshLobbiesBtn.addEventListener('click', () => setupLobbyListener(document.getElementById('lobby-search-input').value));

lobbiesList.addEventListener('click', (e) => {
    const joinBtn = e.target.closest('.join-lobby-btn');
    if (joinBtn && joinBtn.dataset.lobbyId) {
        lobbyToJoin = JSON.parse(joinBtn.dataset.lobbyId);
        if (lobbyToJoin.password) {
            passwordPromptForm.reset();
            passwordPromptMessageBox.classList.add('hidden');
            openModal(passwordPromptModal);
        } else {
            joinLobby(lobbyToJoin.id);
        }
    }
    const viewBtn = e.target.closest('.view-my-lobby-btn');
    if (viewBtn) {
        currentLobbyId = viewBtn.dataset.lobbyId;
        setActiveScreen(lobbyDetailScreen);
        setupLobbyDetailListener(currentLobbyId);
    }
});

createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = newLobbyNameInput.value.trim();
    if (!name) return showCreateLobbyMessageBox("نام لابی اجباری است.", "error");
    try {
        const newLobbyId = await createLobby(name, newLobbyScenarioInput.value.trim(), newLobbyPasswordInput.value.trim());
        closeModal(createLobbyModal);
        currentLobbyId = newLobbyId;
        setActiveScreen(lobbyDetailScreen);
        setupLobbyDetailListener(newLobbyId);
    } catch (error) {
        showCreateLobbyMessageBox(`خطا: ${error.message}`, "error");
    }
});

passwordPromptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (lobbyToJoin) joinLobby(lobbyToJoin.id, passwordPromptInput.value);
});

leaveLobbyBtn.addEventListener('click', leaveLobby);
// ... Other listeners for modals, chat, etc. ...
