// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (from user's input)
// **IMPORTANT**: You should replace these with your actual Firebase project configuration.
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

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const authScreen = document.getElementById('auth-screen');
const mainScreen = document.getElementById('main-screen');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('display-name');
const displayNameField = document.getElementById('display-name-field');
const passwordInput = document.getElementById('password');
const loginToggleBtn = document.getElementById('login-toggle-btn');
const registerToggleBtn = document.getElementById('register-toggle-btn');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const messageBox = document.getElementById('message-box');

// Main Screen UI Elements
const menuBtn = document.getElementById('menu-btn');
const profileSummary = document.getElementById('profile-summary');
const headerDisplayName = document.getElementById('header-display-name');
const headerUserId = document.getElementById('header-user-id');
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const ratedGameBtn = document.getElementById('rated-game-btn');

// Lobby Screen UI Elements
const lobbyScreen = document.getElementById('lobby-screen');
const backToMainBtn = document.getElementById('back-to-main-btn'); // Inside Lobby Header Search Bar
const lobbySearchInput = document.getElementById('lobby-search-input');
const searchLobbiesBtn = document.getElementById('search-lobbies-btn');
const lobbiesList = document.getElementById('lobbies-list');
const addIconBtn = document.getElementById('add-icon-btn'); // Footer icon
const refreshLobbiesBtn = document.getElementById('refresh-lobbies-btn'); // Footer icon
const myLobbiesBtn = document.getElementById('my-lobbies-btn'); // Footer icon
const activeGamesCount = document.getElementById('active-games-count');

// Profile Modal Elements
const profileModal = document.getElementById('profile-modal');
const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileLogoutBtn = document.getElementById('profile-logout-btn');

// Create Lobby Modal Elements (MODIFIED)
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn');
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const submitCreateLobbyBtn = document.getElementById('submit-create-lobby-btn');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const setPasswordToggle = document.getElementById('set-password-toggle'); // NEW
const newLobbyPasswordField = document.getElementById('new-lobby-password-field'); // NEW
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input'); // NEW

// Custom Confirmation Modal Elements
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

// Lobby Detail Screen Elements
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const playerSlotsGrid = lobbyDetailScreen.querySelector('.player-slots-grid');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container'); 
const startGameBtn = document.getElementById('start-game-btn');
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn'); 
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');

// Kick Player Confirmation Modal Elements
const kickPlayerConfirmModal = document.getElementById('kick-player-confirm-modal');
const closeKickPlayerConfirmModalBtn = document.getElementById('close-kick-player-confirm-modal-btn');
const kickPlayerConfirmName = document.getElementById('kick-player-confirm-name');
const kickPlayerConfirmBtn = document.getElementById('kick-player-confirm-btn');
const cancelKickPlayerBtn = document.getElementById('cancel-kick-player-btn');

// Kicked Message Modal Elements
const kickedMessageModal = document.getElementById('kicked-message-modal');
const kickedMessageText = document.getElementById('kicked-message-text');
const kickedLobbyName = document.getElementById('kicked-lobby-name');
const kickedMessageOkBtn = document.getElementById('kicked-message-ok-btn');

// Kicked Players List Modal Elements
const kickedPlayersListModal = document.getElementById('kicked-players-list-modal');
const closeKickedPlayersListModalBtn = document.getElementById('close-kicked-players-list-modal-btn');
const kickedPlayersListContent = document.getElementById('kicked-players-list-content');
const kickedListOkBtn = document.getElementById('kicked-list-ok-btn');

// Enter Password Modal Elements (NEW)
const enterPasswordModal = document.getElementById('enter-password-modal');
const closeEnterPasswordModalBtn = document.getElementById('close-enter-password-modal-btn');
const passwordPromptLobbyName = document.getElementById('password-prompt-lobby-name');
const enterPasswordForm = document.getElementById('enter-password-form');
const lobbyPasswordPromptInput = document.getElementById('lobby-password-prompt-input');
const submitLobbyPasswordBtn = document.getElementById('submit-lobby-password-btn');
const enterPasswordMessageBox = document.getElementById('enter-password-message-box');

// State variables
let authMode = 'login'; // Default mode is login
let currentActiveScreen = loadingScreen;
let currentUserData = null; // To store user's profile data
let unsubscribeLobbies = null; // Global variable to store the unsubscribe function for lobby list listener
let unsubscribeLobbyDetail = null; // Global variable for single lobby detail listener
let unsubscribeKickedPlayers = null; // Listener for kicked players list
let isAuthResolved = false; // Flag to indicate if onAuthStateChanged has run at least once
let userHasActiveLobby = false; // Track if the current user has an active lobby (created or joined)
let currentLobbyId = null; // Stores the ID of the lobby the current user is in
let kickedPlayerToProcess = null; // Stores UID/name of player selected for kicking
let lobbyToJoin = null; // NEW: Stores lobby data when password prompt is shown

// Promise resolver for custom confirmation modal
let resolveCustomConfirm;

// Function to show custom message box (re-used for auth and create lobby modals)
function showCustomMessage(element, message, type = 'info') {
    element.textContent = message;
    element.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    if (type === 'error') {
        element.classList.add('bg-red-500', 'text-white');
    } else if (type === 'success') {
        element.classList.add('bg-green-500', 'text-white');
    } else {
        element.classList.add('bg-blue-500', 'text-white');
    }
    element.classList.remove('hidden');
    console.log(`پیام نمایش داده شد (${type}): ${message}`);
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}
const showMessageBox = (msg, type) => showCustomMessage(messageBox, msg, type);
const showCreateLobbyMessageBox = (msg, type) => showCustomMessage(createLobbyMessageBox, msg, type);
const showEnterPasswordMessageBox = (msg, type) => showCustomMessage(enterPasswordMessageBox, msg, type); // NEW

// Function to show custom confirmation modal
function showCustomConfirm(message, title = 'تایید عملیات') {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        customConfirmModal.classList.remove('hidden');
        void customConfirmModal.offsetWidth;
        customConfirmModal.classList.add('profile-modal-enter-active');
        resolveCustomConfirm = resolve;
        confirmYesBtn.onclick = () => { closeCustomConfirm(); resolveCustomConfirm(true); };
        confirmNoBtn.onclick = () => { closeCustomConfirm(); resolveCustomConfirm(false); };
    });
}
function closeCustomConfirm() {
    customConfirmModal.classList.remove('profile-modal-enter-active');
    customConfirmModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { customConfirmModal.classList.add('hidden'); customConfirmModal.classList.remove('profile-modal-leave-active'); }, 300);
}

// Function to transition between screens
function setActiveScreen(newScreen) {
    if (currentActiveScreen === newScreen) return;
    console.log(`درخواست تغییر صفحه به: ${newScreen.id}. صفحه فعلی: ${currentActiveScreen.id}`);
    currentActiveScreen.classList.remove('page-transition-visible');
    currentActiveScreen.classList.add('page-transition-hidden');
    currentActiveScreen.setAttribute('tabindex', '-1'); 
    if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); }
    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        currentActiveScreen.classList.remove('page-transition-hidden');
        newScreen.classList.remove('hidden');
        void newScreen.offsetWidth;
        newScreen.classList.add('page-transition-visible');
        newScreen.removeAttribute('tabindex');
        if (newScreen === authScreen) { emailInput.focus(); }
        else if (newScreen === lobbyScreen) { lobbySearchInput.focus(); }
        currentActiveScreen = newScreen;
    }, 600);
}

// Function to open/close profile modal
function openProfileModal() {
    profileModal.classList.remove('hidden');
    void profileModal.offsetWidth;
    profileModal.classList.add('profile-modal-enter-active');
    if (currentUserData) {
        profileDisplayName.textContent = currentUserData.displayName || 'ناشناس';
        profileEmail.textContent = currentUserData.email || 'ناشناس';
        profileUid.textContent = currentUserData.uid || 'ناشناس';
    }
}
function closeProfileModal() {
    profileModal.classList.remove('profile-modal-enter-active');
    profileModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { profileModal.classList.add('hidden'); profileModal.classList.remove('profile-modal-leave-active'); }, 300);
}

// Function to open/close create lobby modal
function openCreateLobbyModal() {
    createLobbyModal.classList.remove('hidden');
    void createLobbyModal.offsetWidth;
    createLobbyModal.classList.add('profile-modal-enter-active');
    newLobbyNameInput.focus();
    createLobbyMessageBox.classList.add('hidden');
    // NEW: Reset password fields on open
    setPasswordToggle.checked = false;
    newLobbyPasswordField.classList.add('hidden');
    newLobbyPasswordInput.value = '';
}
function closeCreateLobbyModal() {
    createLobbyModal.classList.remove('profile-modal-enter-active');
    createLobbyModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { createLobbyModal.classList.add('hidden'); createLobbyModal.classList.remove('profile-modal-leave-active'); createLobbyForm.reset(); }, 300);
}

// Function to open/close kick player confirmation modal
function openKickPlayerConfirmModal(playerName, playerUid) {
    kickPlayerConfirmName.textContent = playerName;
    kickPlayerConfirmModal.classList.remove('hidden');
    void kickPlayerConfirmModal.offsetWidth;
    kickPlayerConfirmModal.classList.add('profile-modal-enter-active');
    kickedPlayerToProcess = { uid: playerUid, displayName: playerName };
}
function closeKickPlayerConfirmModal() {
    kickPlayerConfirmModal.classList.remove('profile-modal-enter-active');
    kickPlayerConfirmModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { kickPlayerConfirmModal.classList.add('hidden'); kickPlayerConfirmModal.classList.remove('profile-modal-leave-active'); kickedPlayerToProcess = null; }, 300);
}

// Function to show/close "You have been kicked" message modal
function showKickedMessageModal(lobbyName) {
    kickedLobbyName.textContent = lobbyName;
    kickedMessageModal.classList.remove('hidden');
    void kickedMessageModal.offsetWidth;
    kickedMessageModal.classList.add('profile-modal-enter-active');
}
function closeKickedMessageModal() {
    kickedMessageModal.classList.remove('profile-modal-enter-active');
    kickedMessageModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { kickedMessageModal.classList.add('hidden'); kickedMessageModal.classList.remove('profile-modal-leave-active'); setActiveScreen(lobbyScreen); unsubscribeLobbies = setupLobbyListener(''); }, 300);
}

// Function to open/close kicked players list modal
function openKickedPlayersListModal() {
    kickedPlayersListModal.classList.remove('hidden');
    void kickedPlayersListModal.offsetWidth;
    kickedPlayersListModal.classList.add('profile-modal-enter-active');
    if (currentLobbyId) {
        unsubscribeKickedPlayers = setupKickedPlayersListListener(currentLobbyId);
    } else {
        kickedPlayersListContent.innerHTML = '<p class="text-gray-400 text-center">خطا: لابی فعال یافت نشد.</p>';
    }
}
function closeKickedPlayersListModal() {
    kickedPlayersListModal.classList.remove('profile-modal-enter-active');
    kickedPlayersListModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { kickedPlayersListModal.classList.add('hidden'); kickedPlayersListModal.classList.remove('profile-modal-leave-active'); if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; } }, 300);
}

// NEW: Function to open/close enter password modal
function openEnterPasswordModal(lobby) {
    lobbyToJoin = lobby; // Store the full lobby object
    passwordPromptLobbyName.textContent = lobby.name;
    enterPasswordModal.classList.remove('hidden');
    void enterPasswordModal.offsetWidth;
    enterPasswordModal.classList.add('profile-modal-enter-active');
    lobbyPasswordPromptInput.focus();
    enterPasswordMessageBox.classList.add('hidden');
}
function closeEnterPasswordModal() {
    enterPasswordModal.classList.remove('profile-modal-enter-active');
    enterPasswordModal.classList.add('profile-modal-leave-active');
    setTimeout(() => { enterPasswordModal.classList.add('hidden'); enterPasswordModal.classList.remove('profile-modal-leave-active'); enterPasswordForm.reset(); lobbyToJoin = null; }, 300);
}

/**
 * AI content moderation function... (NO CHANGES HERE, keeping it for context)
 */
async function checkLobbyNameWithAI(lobbyName) { /* ... same as before ... */ }

// Firebase Authentication State Listener (NO CHANGES HERE, keeping it for context)
onAuthStateChanged(auth, async (user) => { /* ... same as before ... */ });

// Initial Firebase Initialization (NO CHANGES HERE, keeping it for context)
async function initializeFirebaseAndAuth() { /* ... same as before ... */ }

// Firebase error message mapping (NO CHANGES HERE, keeping it for context)
function getFirebaseErrorMessage(errorCode) { /* ... same as before ... */ }

// --- Firebase Lobby Functions ---

/**
 * MODIFIED: Creates a new lobby, now with optional password.
 * @param {string} lobbyName - The name of the lobby.
 * @param {string} userId - The UID of the user creating the lobby.
 * @param {string} displayName - The display name of the user creating the lobby.
 * @param {string|null} password - The lobby password, or null for a public lobby.
 * @returns {Promise<string>} The ID of the newly created lobby.
 */
async function createLobby(lobbyName, userId, displayName, password = null) {
    try {
        const creatorDisplayName = displayName && displayName.trim() !== '' ? displayName : 'ناشناس';

        const userLobbiesQuery = query(
            collection(db, `global_lobbies`),
            where("hostId", "==", userId),
            where("status", "in", ["waiting", "playing"])
        );
        const userLobbiesSnapshot = await getDocs(userLobbiesQuery);
        if (!userLobbiesSnapshot.empty) {
            throw new Error("شما از قبل یک لابی فعال ساخته‌اید. لطفاً ابتدا لابی قبلی خود را ببندید.");
        }

        const lobbiesRef = collection(db, `global_lobbies`);
        const newLobbyRef = await addDoc(lobbiesRef, {
            name: lobbyName,
            hostId: userId,
            status: "waiting",
            players: [{ uid: userId, displayName: creatorDisplayName }],
            kickedPlayers: [],
            createdAt: serverTimestamp(),
            // NEW: Add privacy fields
            isPrivate: !!password, // true if password is not null/empty, false otherwise
            password: password, // Store password (can be null)
            gameSettings: {
                maxPlayers: 4,
                roundsToWin: 7
            }
        });
        console.log("لابی با ID ساخته شد: ", newLobbyRef.id);
        userHasActiveLobby = true;
        return newLobbyRef.id;
    } catch (e) {
        console.error("خطا در ساخت لابی: ", e);
        throw e;
    }
}

// closeLobby function... (NO CHANGES HERE)
async function closeLobby(lobbyId, userId) { /* ... same as before ... */ }

/**
 * MODIFIED: Sets up a real-time listener for available lobbies.
 * Now renders a lock icon for private lobbies.
 */
function setupLobbyListener(searchTerm = '') {
    console.log(`شروع راه‌اندازی Listener لابی‌ها با عبارت جستجو: "${searchTerm}"`);
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; }

    lobbiesList.innerHTML = '<p class="text-gray-400">در حال بارگذاری لابی‌ها...</p>';
    userHasActiveLobby = false;

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const q = query(collection(db, `global_lobbies`), where("status", "==", "waiting"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("آپدیت جدید از Firestore دریافت شد.");
        lobbiesList.innerHTML = '';

        let activeGamesCountNum = 0;
        let lobbiesToDisplay = [];
        let currentUserIsHostOfLobby = false;
        let currentUserIsInAnyLobby = false;

        snapshot.forEach((doc) => {
            const lobby = doc.data();
            const lobbyId = doc.id;
            
            const lobbyName = (lobby.name || '').toLowerCase();
            const hostDisplayName = (lobby.players?.[0]?.displayName || '').toLowerCase();
            
            const isCurrentUserHost = auth.currentUser && lobby.hostId === auth.currentUser.uid;
            const isCurrentUserPlayer = auth.currentUser && lobby.players.some(p => p.uid === auth.currentUser.uid);

            if (isCurrentUserHost) currentUserIsHostOfLobby = true;
            if (isCurrentUserPlayer) currentUserIsInAnyLobby = true;

            if (normalizedSearchTerm === '' || lobbyName.includes(normalizedSearchTerm) || hostDisplayName.includes(normalizedSearchTerm)) {
                lobbiesToDisplay.push({ id: lobbyId, ...lobby });
            }

            if (lobby.status === "playing") activeGamesCountNum++;
        });

        userHasActiveLobby = currentUserIsInAnyLobby;
        
        lobbiesToDisplay.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (lobbiesToDisplay.length === 0) {
            lobbiesList.innerHTML = '<p class="text-gray-400">لابی با این مشخصات یافت نشد.</p>';
        } else {
            lobbiesToDisplay.forEach((lobby) => {
                const playerCount = lobby.players ? lobby.players.length : 0;
                const maxPlayers = lobby.gameSettings?.maxPlayers || 4;
                const hostDisplayName = lobby.players?.[0]?.displayName || 'ناشناس';
                const isCurrentUserHostOfThisLobby = auth.currentUser && lobby.hostId === auth.currentUser.uid;
                const isCurrentUserKicked = auth.currentUser && lobby.kickedPlayers?.some(p => p.uid === auth.currentUser.uid);
                const canJoinThisLobby = auth.currentUser && !currentUserIsInAnyLobby && playerCount < maxPlayers && !isCurrentUserKicked;
                
                // NEW: Lock icon for private lobbies
                const lockIcon = lobby.isPrivate 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-keyhole lobby-lock-icon"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>`
                    : '';

                let joinButtonHtml = '';
                if (isCurrentUserKicked) {
                     joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-red-classic opacity-50 cursor-not-allowed" disabled>اخراج شده‌اید</button>`;
                } else if (isCurrentUserHostOfThisLobby) {
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="view-my-lobby-btn classic-btn btn-blue-classic">ورود به لابی من</button>`;
                } else if (canJoinThisLobby) {
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic">ورود به لابی</button>`;
                } else {
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic opacity-50 cursor-not-allowed" disabled>ورود به لابی</button>`;
                }
                
                const closeButtonHtml = isCurrentUserHostOfThisLobby 
                    ? `<button data-lobby-id="${lobby.id}" class="close-lobby-btn classic-btn btn-red-classic">بستن لابی</button>` : '';

                const lobbyItem = document.createElement('div');
                lobbyItem.className = 'lobby-item mb-3 w-full';
                lobbyItem.dataset.lobbyId = lobby.id;
                lobbyItem.innerHTML = `
                    <div class="mb-2 sm:mb-0 text-center sm:text-right">
                        <h3 class="text-xl font-bold">${lobby.name} ${lockIcon}</h3>
                        <p class="text-sm">سازنده: ${hostDisplayName}</p>
                        <p class="text-sm">بازیکنان: ${playerCount}/${maxPlayers}</p>
                    </div>
                    <div class="lobby-actions">
                        ${closeButtonHtml}
                        ${joinButtonHtml}
                    </div>
                `;
                lobbiesList.appendChild(lobbyItem);
            });
        }
        
        activeGamesCount.textContent = activeGamesCountNum;

        // MODIFIED: Event listener for "Join Lobby" buttons
        lobbiesList.querySelectorAll('.join-lobby-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (!lobbyId || !auth.currentUser || userHasActiveLobby) {
                    if (userHasActiveLobby) showMessageBox("شما از قبل در یک لابی فعال هستید.", "info");
                    return;
                }
                
                // Find the lobby data from our displayed list
                const lobbyData = lobbiesToDisplay.find(l => l.id === lobbyId);
                if (!lobbyData) {
                    showMessageBox("لابی یافت نشد.", "error");
                    return;
                }

                if (lobbyData.isPrivate) {
                    // If lobby is private, open password prompt modal
                    openEnterPasswordModal(lobbyData);
                } else {
                    // If public, join directly
                    try {
                        await joinLobby(lobbyId, auth.currentUser.uid, currentUserData.displayName);
                    } catch (error) {
                        console.error("Error joining lobby:", error);
                        showMessageBox(`خطا در ورود به لابی: ${error.message}`, "error");
                    }
                }
            });
        });

        // Attach other listeners (view my lobby, close lobby) - NO CHANGES HERE
        lobbiesList.querySelectorAll('.view-my-lobby-btn').forEach(button => { /* ... same as before ... */ });
        lobbiesList.querySelectorAll('.close-lobby-btn').forEach(button => { /* ... same as before ... */ });

    }, (error) => {
        console.error("خطا در گوش دادن به لابی‌ها: ", error);
        lobbiesList.innerHTML = `<p class="text-red-400">خطا در بارگذاری لیست لابی‌ها. (${error.message})</p>`;
    });

    return unsubscribe;
}

// joinLobby function... (NO CHANGES HERE, it's called after password validation)
async function joinLobby(lobbyId, userId, displayName) { /* ... same as before ... */ }

// setupLobbyDetailListener... (NO CHANGES HERE)
function setupLobbyDetailListener(lobbyId) { /* ... same as before ... */ }

// leaveLobby function... (NO CHANGES HERE)
async function leaveLobby() { /* ... same as before ... */ }

// kickPlayer, unkickPlayer, setupKickedPlayersListListener... (NO CHANGES HERE)
async function kickPlayer(lobbyId, playerToKickUid, playerToKickDisplayName) { /* ... same as before ... */ }
async function unkickPlayer(lobbyId, playerToUnkickUid) { /* ... same as before ... */ }
function setupKickedPlayersListListener(lobbyId) { /* ... same as before ... */ }

// --- Event Listeners for Auth Screen Toggles --- (NO CHANGES HERE)
/* ... same as before ... */

// --- Event Listener for Main Auth Form Submission --- (NO CHANGES HERE)
/* ... same as before ... */

// --- Event Listeners for Main Screen UI --- (NO CHANGES HERE)
/* ... same as before ... */

// --- Event Listeners for Lobby Screen UI ---
backToMainBtn.addEventListener('click', () => { /* ... same as before ... */ });

addIconBtn.addEventListener('click', () => {
    if (!auth.currentUser || !currentUserData || !currentUserData.displayName) {
        showMessageBox("برای ساخت لابی، باید وارد حساب کاربری خود شوید و نام نمایشی داشته باشید.", "error");
        return;
    }
    if (userHasActiveLobby) {
        showMessageBox("شما از قبل در یک لابی فعال هستید. لطفاً ابتدا از آن خارج شوید.", "info");
        return;
    }
    openCreateLobbyModal();
});

// MODIFIED: Create Lobby Modal form submission
createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    const usePassword = setPasswordToggle.checked;
    const password = newLobbyPasswordInput.value.trim();

    if (!lobbyName) {
        showCreateLobbyMessageBox("لطفاً نام لابی را وارد کنید.", "error");
        return;
    }

    // NEW: Validate password if checkbox is checked
    if (usePassword && !password) {
        showCreateLobbyMessageBox("لطفاً رمز عبور را برای لابی خصوصی وارد کنید.", "error");
        return;
    }

    if (!auth.currentUser || !currentUserData || !currentUserData.displayName) {
        showCreateLobbyMessageBox("مشکلی در اطلاعات کاربری شما وجود دارد.", "error");
        return;
    }
    
    if (userHasActiveLobby) {
        showCreateLobbyMessageBox("شما از قبل در یک لابی فعال هستید.", "info");
        closeCreateLobbyModal();
        return;
    }

    // AI moderation check... (NO CHANGES HERE)
    /* ... same as before ... */

    try {
        // MODIFIED: Pass password to createLobby function
        const lobbyPassword = usePassword ? password : null;
        const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName, lobbyPassword);
        
        showCreateLobbyMessageBox("لابی شما با موفقیت ساخته شد!", "success");
        createLobbyForm.reset();
        setTimeout(() => {
            closeCreateLobbyModal();
            currentLobbyId = newLobbyId;
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId);
        }, 1500);
        
    } catch (error) {
        console.error("خطا در ساخت لابی از مودال:", error);
        showCreateLobbyMessageBox(`خطا در ساخت لابی: ${error.message}`, "error");
    }
});

// NEW: Event listener for password toggle in create lobby modal
setPasswordToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        newLobbyPasswordField.classList.remove('hidden');
        newLobbyPasswordInput.required = true;
    } else {
        newLobbyPasswordField.classList.add('hidden');
        newLobbyPasswordInput.required = false;
        newLobbyPasswordInput.value = '';
    }
});


closeCreateLobbyModalBtn.addEventListener('click', closeCreateLobbyModal);
createLobbyModal.addEventListener('click', (e) => { if (e.target === createLobbyModal) closeCreateLobbyModal(); });

refreshLobbiesBtn.addEventListener('click', () => { /* ... same as before ... */ });
myLobbiesBtn.addEventListener('click', () => { /* ... same as before ... */ });
lobbySearchInput.addEventListener('input', (e) => { /* ... same as before ... */ });
searchLobbiesBtn.addEventListener('click', () => { /* ... same as before ... */ });
lobbySearchInput.addEventListener('keypress', (e) => { /* ... same as before ... */ });

// Lobby Detail Screen Buttons (NO CHANGES HERE)
leaveLobbyBtn.addEventListener('click', leaveLobby);
startGameBtn.addEventListener('click', async () => { /* ... same as before ... */ });

// Kick Player Logic (NO CHANGES HERE)
/* ... same as before ... */

// --- NEW: Event Listeners for Enter Password Modal ---
enterPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enteredPassword = lobbyPasswordPromptInput.value;
    if (!enteredPassword) {
        showEnterPasswordMessageBox("لطفاً رمز عبور را وارد کنید.", "error");
        return;
    }

    if (!lobbyToJoin) {
        showEnterPasswordMessageBox("خطای داخلی: لابی برای ورود مشخص نیست.", "error");
        return;
    }

    // Client-side password validation
    if (enteredPassword === lobbyToJoin.password) {
        showEnterPasswordMessageBox("رمز عبور صحیح است. در حال ورود...", "success");
        try {
            // Join the lobby now that password is validated
            await joinLobby(lobbyToJoin.id, auth.currentUser.uid, currentUserData.displayName);
            closeEnterPasswordModal(); // Close the password modal on success
        } catch (error) {
            console.error("Error joining lobby after password validation:", error);
            showEnterPasswordMessageBox(`خطا در ورود: ${error.message}`, "error");
        }
    } else {
        showEnterPasswordMessageBox("رمز عبور اشتباه است.", "error");
        lobbyPasswordPromptInput.value = ""; // Clear input for re-try
        lobbyPasswordPromptInput.focus();
    }
});

closeEnterPasswordModalBtn.addEventListener('click', closeEnterPasswordModal);
enterPasswordModal.addEventListener('click', (e) => {
    if (e.target === enterPasswordModal) {
        closeEnterPasswordModal();
    }
});


// Start Firebase initialization when the window loads
window.onload = initializeFirebaseAndAuth;
