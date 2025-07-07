// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// REVISED: Imported deleteField for updating player maps
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; 

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

// Create Lobby Modal Elements
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn'); 
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const submitCreateLobbyBtn = document.getElementById('submit-create-lobby-btn');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const lobbyTypeToggle = document.getElementById('lobby-type-toggle');
const newLobbyPasswordField = document.getElementById('new-lobby-password-field');
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input');
const togglePasswordVisibilityBtn = document.getElementById('toggle-password-visibility');
const eyeIconOpen = document.getElementById('eye-icon-open');
const eyeIconClosed = document.getElementById('eye-icon-closed');

// Custom Confirmation Modal Elements
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

// Lobby Detail Screen Elements (UPDATED)
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const playerListContainer = document.getElementById('player-list-container');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container');
const startGameBtn = document.getElementById('start-game-btn');
const toggleChatLockBtn = document.getElementById('toggle-chat-lock-btn'); // NEW
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatForm = document.getElementById('lobby-chat-form');
const lobbyChatInput = document.getElementById('lobby-chat-input');
const lobbyChatSendBtn = document.getElementById('lobby-chat-send-btn');

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

// New Enter Password Modal Elements
const enterPasswordModal = document.getElementById('enter-password-modal');
const passwordPromptLobbyName = document.getElementById('password-prompt-lobby-name');
const enterPasswordForm = document.getElementById('enter-password-form');
const joinLobbyPasswordInput = document.getElementById('join-lobby-password-input');
const submitJoinPasswordBtn = document.getElementById('submit-join-password-btn');
const cancelJoinPasswordBtn = document.getElementById('cancel-join-password-btn');
const passwordPromptMessageBox = document.getElementById('password-prompt-message-box');

// State variables
let authMode = 'login'; // Default mode is login
let currentActiveScreen = loadingScreen;
let currentUserData = null; // To store user's profile data
let unsubscribeLobbies = null; // Global variable to store the unsubscribe function for lobby list listener
let unsubscribeLobbyDetail = null; // Global variable for single lobby detail listener
let unsubscribeKickedPlayers = null; // Listener for kicked players list
let unsubscribeLobbyChat = null; // NEW: Listener for lobby chat messages
let isAuthResolved = false; // Flag to indicate if onAuthStateChanged has run at least once
let userHasActiveLobby = false; // Track if the current user has an active lobby (created or joined)
let currentLobbyId = null; // Stores the ID of the lobby the current user is in
let kickedPlayerToProcess = null; // Stores UID/name of player selected for kicking
let lobbyToJoin = null; // To store data of private lobby user wants to join
let isRefreshing = false; // NEW: State for refresh button

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
// Wrapper for main message box
const showMessageBox = (msg, type) => showCustomMessage(messageBox, msg, type);
// Wrapper for create lobby message box
const showCreateLobbyMessageBox = (msg, type) => showCustomMessage(createLobbyMessageBox, msg, type);


// Function to show custom confirmation modal
function showCustomConfirm(message, title = 'تایید عملیات') {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        customConfirmModal.classList.remove('hidden');
        void customConfirmModal.offsetWidth; // Trigger reflow for transition
        customConfirmModal.classList.add('profile-modal-enter-active');

        resolveCustomConfirm = resolve; // Store the resolve function

        // Event listeners for Yes/No buttons
        confirmYesBtn.onclick = () => {
            closeCustomConfirm();
            resolveCustomConfirm(true);
        };
        confirmNoBtn.onclick = () => {
            closeCustomConfirm();
            resolveCustomConfirm(false);
        };
    });
}

// Function to close the custom confirmation modal
function closeCustomConfirm() {
    customConfirmModal.classList.remove('profile-modal-enter-active');
    customConfirmModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        customConfirmModal.classList.add('hidden');
        customConfirmModal.classList.remove('profile-modal-leave-active');
    }, 300); // Match modal transition duration
}


// Function to transition between screens
function setActiveScreen(newScreen) {
    console.log(`درخواست تغییر صفحه به: ${newScreen.id}. صفحه فعلی: ${currentActiveScreen.id}`);

    if (currentActiveScreen === newScreen) return;
    
    // Cleanup old listeners when changing screens
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }

    // Hide the current screen with transition
    currentActiveScreen.classList.remove('page-transition-visible');
    currentActiveScreen.classList.add('page-transition-hidden');
    currentActiveScreen.setAttribute('tabindex', '-1'); // Remove focus capability
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    setTimeout(() => {
        currentActiveScreen.classList.add('hidden');
        currentActiveScreen.classList.remove('page-transition-hidden');

        // Show the new screen with transition
        newScreen.classList.remove('hidden');
        void newScreen.offsetWidth;
        newScreen.classList.add('page-transition-visible');
        newScreen.removeAttribute('tabindex');
        console.log(`صفحه ${newScreen.id} اکنون قابل مشاهده است.`);

        if (newScreen === authScreen) emailInput.focus();
        else if (newScreen === lobbyScreen) lobbySearchInput.focus();

        currentActiveScreen = newScreen;

    }, 600); // Matches CSS transition duration
}

// Functions to open/close modals
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
    setTimeout(() => {
        profileModal.classList.add('hidden');
        profileModal.classList.remove('profile-modal-leave-active');
    }, 300);
}

function openCreateLobbyModal() {
    createLobbyModal.classList.remove('hidden');
    void createLobbyModal.offsetWidth;
    createLobbyModal.classList.add('profile-modal-enter-active');
    newLobbyNameInput.focus();
    createLobbyMessageBox.classList.add('hidden');
}

function closeCreateLobbyModal() {
    createLobbyModal.classList.remove('profile-modal-enter-active');
    createLobbyModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        createLobbyModal.classList.add('hidden');
        createLobbyModal.classList.remove('profile-modal-leave-active');
        createLobbyForm.reset();
        // Reset toggle buttons to default
        newLobbyPasswordField.classList.add('hidden');
        document.querySelectorAll('.lobby-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('input[value="public"]').nextElementSibling.classList.add('active');
    }, 300);
}

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
    setTimeout(() => {
        kickPlayerConfirmModal.classList.add('hidden');
        kickPlayerConfirmModal.classList.remove('profile-modal-leave-active');
        kickedPlayerToProcess = null;
    }, 300);
}

function showKickedMessageModal(lobbyName) {
    kickedLobbyName.textContent = lobbyName;
    kickedMessageModal.classList.remove('hidden');
    void kickedMessageModal.offsetWidth;
    kickedMessageModal.classList.add('profile-modal-enter-active');
}

function closeKickedMessageModal() {
    kickedMessageModal.classList.remove('profile-modal-enter-active');
    kickedMessageModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        kickedMessageModal.classList.add('hidden');
        kickedMessageModal.classList.remove('profile-modal-leave-active');
        setActiveScreen(lobbyScreen);
        unsubscribeLobbies = setupLobbyListener('');
    }, 300);
}

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
    setTimeout(() => {
        kickedPlayersListModal.classList.add('hidden');
        kickedPlayersListModal.classList.remove('profile-modal-leave-active');
        if (unsubscribeKickedPlayers) {
            unsubscribeKickedPlayers();
            unsubscribeKickedPlayers = null;
        }
    }, 300);
}


/**
 * Calls a simulated AI content moderation API to check if the lobby name is appropriate.
 * @param {string} lobbyName - The name of the lobby to check.
 * @returns {Promise<{is_appropriate: boolean, reason: string}>} - The moderation result.
 */
async function checkLobbyNameWithAI(lobbyName) {
    const prompt = `As a highly rigorous and professional content moderation AI, meticulously analyze the following lobby name for compliance with the strictest community guidelines across *all* languages. You must absolutely identify and disallow any political, racist, sexual, offensive, vulgar, violent, or otherwise inappropriate content, including but not limited to terms like "fuck", "asshole", "shit", "bitch", and their equivalents in Persian such as "کیر", "کون", "کس", "کسکش", "جنده", "حرومزاده", "بیناموس" etc., regardless of how they are spelled (e.g., phonetic or deliberate misspellings to evade detection). Your analysis should consider the context and intent where possible. Your response *must* be a JSON object: {"is_appropriate": boolean, "reason": string}. If 'is_appropriate' is false, provide a *brief, objective, and precise* reason identifying the specific type of violation (e.g., "Contains offensive language", "Political reference detected", "Violates decency standards"). If appropriate, 'reason' should be an empty string. Lobby name to analyze: "${lobbyName}"`;
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory, generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "is_appropriate": { "type": "BOOLEAN" }, "reason": { "type": "STRING" } }, "propertyOrdering": ["is_appropriate", "reason"] } } };
    const apiKey = "AIzaSyDfMZwyWNnRFUDLHKR1t_hZ5cWv2c_KvvE"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { const errorText = await response.text(); console.error("AI API HTTP Error:", response.status, response.statusText, errorText); return { is_appropriate: false, reason: `خطا در ارتباط با سرور اعتدال: ${response.statusText}.` }; }
        const result = await response.json();
        if (result && result.candidates?.[0]?.content?.parts?.[0]) {
            const jsonString = result.candidates[0].content.parts[0].text;
            try { const parsedJson = JSON.parse(jsonString); if (typeof parsedJson.is_appropriate === 'boolean' && typeof parsedJson.reason === 'string') { return parsedJson; } else { console.warn("AI response has unexpected structure:", parsedJson); return { is_appropriate: false, reason: "پاسخ سیستم اعتدال نامفهوم است." }; } } catch (parseError) { console.error("Error parsing AI response JSON:", parseError, "Raw:", jsonString); return { is_appropriate: false, reason: "خطا در پردازش پاسخ اعتدال." }; }
        } else { console.warn("AI response missing content structure:", result); return { is_appropriate: false, reason: "عدم دریافت پاسخ معتبر از سیستم اعتدال." }; }
    } catch (error) { console.error("Error calling AI moderation API:", error); return { is_appropriate: false, reason: `خطا در ارتباط با سیستم اعتدال: ${error.message}.` }; }
}

// Firebase Authentication State Listener
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "logged out");
    
    // This is the first time the auth state has been determined.
    // We can now safely transition away from the loading screen.
    if (!isAuthResolved) {
        isAuthResolved = true;
    }

    if (user) {
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`); 
            const userDocSnap = await getDoc(userDocRef);
            currentUserData = {
                uid: user.uid,
                email: user.email,
                displayName: (userDocSnap.exists() && userDocSnap.data().displayName) ? userDocSnap.data().displayName : (user.displayName || (user.email ? user.email.split('@')[0] : 'کاربر ناشناس'))
            };
            if (!userDocSnap.exists() && authMode === 'register' && displayNameInput.value.trim() !== '') {
                await setDoc(userDocRef, { displayName: displayNameInput.value.trim(), email: user.email }, { merge: true });
                currentUserData.displayName = displayNameInput.value.trim();
            }
            headerDisplayName.textContent = currentUserData.displayName;
            headerUserId.textContent = `شناسه: ${currentUserData.uid.substring(0, 8)}...`;
            
            // Only transition if we are coming from loading or auth screen
            if(currentActiveScreen === loadingScreen || currentActiveScreen === authScreen) {
                setActiveScreen(mainScreen);
            }

        } catch (firestoreError) {
            console.error("Firestore profile error:", firestoreError);
            currentUserData = { uid: user.uid, email: user.email, displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'کاربر ناشناس') };
            headerDisplayName.textContent = currentUserData.displayName;
            headerUserId.textContent = `شناسه: ${currentUserData.uid.substring(0, 8)}...`;
            setActiveScreen(mainScreen);
            showMessageBox("مشکل در بارگذاری پروفایل.", "error");
        }
    } else {
        // User is logged out
        setActiveScreen(authScreen);
        authForm.reset();
        displayNameField.classList.add('hidden');
        submitAuthBtn.classList.add('hidden');
        loginToggleBtn.classList.remove('hidden');
        registerToggleBtn.classList.remove('hidden');
        authMode = 'login';
        currentUserData = null;
        // Clean up all listeners
        if (unsubscribeLobbies) unsubscribeLobbies();
        if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
        if (unsubscribeKickedPlayers) unsubscribeKickedPlayers();
        if (unsubscribeLobbyChat) unsubscribeLobbyChat();
        unsubscribeLobbies = unsubscribeLobbyDetail = unsubscribeKickedPlayers = unsubscribeLobbyChat = null;
        currentLobbyId = null;
    }
});

// --- FIX START: Corrected Initial Firebase Authentication Flow ---
// This function now correctly handles the initial sign-in logic,
// preventing the auth screen from showing unnecessarily.
async function initializeFirebaseAndAuth() {
    console.log("Initializing Firebase Auth...");
    
    // The onAuthStateChanged listener is already set up globally.
    // We just need to trigger the sign-in process if a token is available.
    // If no token is available, onAuthStateChanged will still fire with `null` or
    // with a user from a cached session, which is the correct behavior.
    
    if (initialAuthToken) {
        console.log("Initial auth token found. Attempting to sign in...");
        try {
            // Signing in with the custom token will trigger onAuthStateChanged.
            // We don't need to do anything else here. The listener will handle the screen transition.
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Sign in with custom token successful.");
        } catch (error) {
            // If the token is invalid, log the error.
            // onAuthStateChanged will fire with a `null` user, taking them to the auth screen.
            console.error("Error signing in with initial custom token:", error);
        }
    } else {
        console.log("No initial auth token. Waiting for onAuthStateChanged to resolve session.");
        // No token, so Firebase will check for a cached user.
        // onAuthStateChanged will handle the result automatically.
    }
}
// --- FIX END ---

// Maps Firebase auth error codes to user-friendly Persian messages.
function getFirebaseErrorMessage(errorCode) {
    const messages = {
        'auth/invalid-email': "فرمت ایمیل نامعتبر است.",
        'auth/user-disabled': "حساب کاربری شما غیرفعال شده است.",
        'auth/user-not-found': "کاربری با این ایمیل یافت نشد.",
        'auth/wrong-password': "ایمیل یا رمز عبور اشتباه است.",
        'auth/invalid-credential': "ایمیل یا رمز عبور اشتباه است.",
        'auth/email-already-in-use': "این ایمیل قبلاً ثبت نام شده است.",
        'auth/weak-password': "رمز عبور باید حداقل ۶ کاراکتر باشد.",
        'auth/operation-not-allowed': "این نوع ورود فعال نیست.",
        'auth/network-request-failed': "مشکل در اتصال به اینترنت.",
        'auth/too-many-requests': "تعداد تلاش‌های ناموفق بیش از حد مجاز.",
    };
    return messages[errorCode] || "خطایی ناشناخته رخ داده است.";
}

// --- Firebase Lobby Functions ---
async function createLobby(lobbyName, userId, displayName, lobbyType, password) {
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
        
        const newLobbyData = {
            name: lobbyName,
            hostId: userId,
            status: "waiting",
            type: lobbyType,
            players: {
                [userId]: creatorDisplayName // Using a map: { "uid": "displayName" }
            },
            kickedPlayers: [], // Still an array of objects
            createdAt: serverTimestamp(),
            isChatLocked: false, // NEW: Chat is open by default
            gameSettings: { maxPlayers: 4, roundsToWin: 7 }
        };

        if (lobbyType === 'private') {
            newLobbyData.password = password;
        }

        const newLobbyRef = await addDoc(lobbiesRef, newLobbyData);
        
        console.log(`لابی ${lobbyType} با ID ساخته شد: `, newLobbyRef.id);
        userHasActiveLobby = true;
        return newLobbyRef.id;
    } catch (e) {
        console.error("خطا در ساخت لابی: ", e);
        throw e;
    }
}

async function closeLobby(lobbyId, userId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) { showMessageBox("لابی مورد نظر یافت نشد.", "error"); return; }
        const lobbyData = lobbySnap.data();
        if (lobbyData.hostId !== userId) { showMessageBox("شما اجازه بستن این لابی را ندارید.", "error"); return; }

        const lobbyElement = document.querySelector(`[data-lobby-id="${lobbyId}"]`);
        if (lobbyElement) {
            lobbyElement.classList.add('fade-out');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        await deleteDoc(lobbyRef);
        showMessageBox(`لابی "${lobbyData.name}" با موفقیت بسته شد.`, "success");
        userHasActiveLobby = false;
        if (currentLobbyId === lobbyId) currentLobbyId = null;
    } catch (e) {
        console.error("خطا در بستن لابی: ", e);
        showMessageBox(`خطا در بستن لابی: ${e.message}`, "error");
    }
}

function setupLobbyListener(searchTerm = '') {
    console.log(`شروع راه‌اندازی Listener لابی‌ها با عبارت جستجو: "${searchTerm}"`);
    if (unsubscribeLobbyDetail) {
        unsubscribeLobbyDetail();
        unsubscribeLobbyDetail = null;
        currentLobbyId = null;
    }
    if (unsubscribeKickedPlayers) {
        unsubscribeKickedPlayers();
        unsubscribeKickedPlayers = null;
    }
    if (unsubscribeLobbyChat) {
        unsubscribeLobbyChat();
        unsubscribeLobbyChat = null;
    }

    lobbiesList.innerHTML = '<p class="text-gray-400">در حال بارگذاری لابی‌ها...</p>';
    userHasActiveLobby = false;

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const q = query(
        collection(db, `global_lobbies`), 
        where("status", "==", "waiting") // This is key: only shows 'waiting' lobbies.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        lobbiesList.innerHTML = '';

        let lobbiesToDisplay = [];
        let currentUserIsInAnyLobby = false;

        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            const playersMap = lobby.players || {};
            
            const hostDisplayName = (playersMap[lobby.hostId] || 'ناشناس').toLowerCase();
            const lobbyName = (lobby.name || '').toLowerCase();
            
            if (auth.currentUser && playersMap[auth.currentUser.uid]) {
                currentUserIsInAnyLobby = true;
            }

            if (normalizedSearchTerm === '' || lobbyName.includes(normalizedSearchTerm) || hostDisplayName.includes(normalizedSearchTerm)) {
                lobbiesToDisplay.push(lobby);
            }
        });

        userHasActiveLobby = currentUserIsInAnyLobby;
        
        // Count active games separately by another query or accept this might be slightly off
        // For now, we will update the active games count less frequently or assume it's decorative.
        getDocs(query(collection(db, `global_lobbies`), where("status", "==", "playing"))).then(playingSnapshot => {
            activeGamesCount.textContent = playingSnapshot.size;
        });
        
        lobbiesToDisplay.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (lobbiesToDisplay.length === 0) {
            lobbiesList.innerHTML = '<p class="text-gray-400">لابی با این مشخصات یافت نشد.</p>';
        } else {
            lobbiesToDisplay.forEach((lobby) => {
                const playersMap = lobby.players || {};
                const playerCount = Object.keys(playersMap).length;
                const maxPlayers = lobby.gameSettings?.maxPlayers || 4;
                const hostDisplayName = playersMap[lobby.hostId] || 'ناشناس';
                const isCurrentUserHostOfThisLobby = auth.currentUser && lobby.hostId === auth.currentUser.uid;
                const isCurrentUserKicked = auth.currentUser && lobby.kickedPlayers?.some(p => p.uid === auth.currentUser.uid);
                const canJoinThisLobby = auth.currentUser && !currentUserIsInAnyLobby && playerCount < maxPlayers && !isCurrentUserKicked;

                const lockIconHtml = lobby.type === 'private' 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" class="lobby-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>` 
                    : '';

                let joinButtonHtml = '';
                if (isCurrentUserKicked) {
                     joinButtonHtml = `<button class="join-lobby-btn classic-btn btn-red-classic opacity-50 cursor-not-allowed" disabled>اخراج شده‌اید</button>`;
                } else if (isCurrentUserHostOfThisLobby) {
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="view-my-lobby-btn classic-btn btn-blue-classic">ورود به لابی من</button>`;
                } else if (canJoinThisLobby) {
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" data-lobby-type="${lobby.type || 'public'}" data-lobby-name="${lobby.name}" class="join-lobby-btn classic-btn btn-blue-classic">ورود به لابی</button>`;
                } else {
                    joinButtonHtml = `<button class="join-lobby-btn classic-btn btn-blue-classic opacity-50 cursor-not-allowed" disabled>ورود به لابی</button>`;
                }
                
                const closeButtonHtml = isCurrentUserHostOfThisLobby 
                    ? `<button data-lobby-id="${lobby.id}" class="close-lobby-btn classic-btn btn-red-classic">بستن لابی</button>` : '';

                const lobbyItem = document.createElement('div');
                lobbyItem.className = 'lobby-item mb-3 w-full';
                lobbyItem.dataset.lobbyId = lobby.id;
                lobbyItem.innerHTML = `
                    <div class="mb-2 sm:mb-0 text-center sm:text-right">
                        <h3 class="text-xl font-bold">${lockIconHtml}${lobby.name}</h3>
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
        
        lobbiesList.querySelectorAll('.join-lobby-btn:not([disabled])').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.currentTarget.dataset.lobbyId;
                const lobbyType = e.currentTarget.dataset.lobbyType;
                const lobbyName = e.currentTarget.dataset.lobbyName;
                
                if (lobbyType === 'private') {
                    openEnterPasswordModal(lobbyId, lobbyName);
                } else {
                    try {
                        await joinLobby(lobbyId, auth.currentUser.uid, currentUserData.displayName);
                    } catch (error) {
                        console.error("Error joining public lobby:", error);
                        showMessageBox(`خطا در ورود به لابی: ${error.message}`, "error");
                    }
                }
            });
        });

        lobbiesList.querySelectorAll('.view-my-lobby-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (lobbyId && auth.currentUser) {
                    currentLobbyId = lobbyId;
                    setActiveScreen(lobbyDetailScreen);
                    unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);
                }
            });
        });

        lobbiesList.querySelectorAll('.close-lobby-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (lobbyId && auth.currentUser) {
                    const lobbyName = e.target.closest('.lobby-item').querySelector('h3').textContent;
                    const confirmed = await showCustomConfirm(`آیا مطمئن هستید که می‌خواهید لابی "${lobbyName}" را ببندید؟`);
                    if (confirmed) {
                        await closeLobby(lobbyId, auth.currentUser.uid);
                    }
                }
            });
        });

    }, (error) => {
        console.error("خطا در گوش دادن به لابی‌ها: ", error);
        lobbiesList.innerHTML = `<p class="text-red-400">خطا در بارگذاری لیست لابی‌ها. (${error.message})</p>`;
    });

    return unsubscribe;
}

async function joinLobby(lobbyId, userId, displayName) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) { throw new Error("لابی یافت نشد."); }
        
        const lobbyData = lobbySnap.data();
        const playersMap = lobbyData.players || {};
        const maxPlayers = lobbyData.gameSettings?.maxPlayers || 4;
        const kickedPlayers = lobbyData.kickedPlayers || [];

        if (kickedPlayers.some(p => p.uid === userId)) {
            throw new Error("شما از این لابی اخراج شده‌اید.");
        }
        if (playersMap[userId]) { // Player is already in
            currentLobbyId = lobbyId;
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);
            return;
        }
        if (Object.keys(playersMap).length >= maxPlayers) { throw new Error("لابی پر است."); }
        
        // Add player to map using dot notation for the key
        await updateDoc(lobbyRef, {
            [`players.${userId}`]: displayName
        });
        
        showMessageBox(`شما به لابی "${lobbyData.name}" وارد شدید.`, "success");
        
        currentLobbyId = lobbyId;
        userHasActiveLobby = true;
        setActiveScreen(lobbyDetailScreen);
        unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId);
    } catch (e) {
        console.error("خطا در ورود به لابی: ", e);
        throw e; // Re-throw to be caught by the caller
    }
}

function setupLobbyDetailListener(lobbyId) {
    console.log(`Listening to lobby details for ID: ${lobbyId}`);
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }
    if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; }
    if (unsubscribeLobbyChat) { unsubscribeLobbyChat(); unsubscribeLobbyChat = null; }
    
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, async (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            const isCurrentUserHost = auth.currentUser && lobbyData.hostId === auth.currentUser.uid;

            // Check if game has started (or status changed)
            if (lobbyData.status === 'playing') {
                // This block is now a placeholder. In a full implementation,
                // it would transition to the game screen.
                console.log("Game has started for this lobby, but game screen is disabled.");
                showMessageBox("بازی شروع شد! (قابلیت بازی در نسخه‌های بعدی)", "info");
                // For now, we kick the user back to the lobby list.
                setActiveScreen(lobbyScreen);
                unsubscribeLobbies = setupLobbyListener('');
                return; 
            }

            const playersMap = lobbyData.players || {};
            const playerCount = Object.keys(playersMap).length;
            const maxPlayers = lobbyData.gameSettings?.maxPlayers || 4;
            const isChatLocked = lobbyData.isChatLocked || false;

            if (unsubscribeLobbyChat) unsubscribeLobbyChat();
            unsubscribeLobbyChat = setupLobbyChatListener(lobbyId, lobbyData.hostId);

            detailLobbyName.textContent = lobbyData.name;
            detailHostName.textContent = `سازنده: ${playersMap[lobbyData.hostId] || 'ناشناس'}`;
            detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${maxPlayers}`;

            if (auth.currentUser && lobbyData.kickedPlayers?.some(p => p.uid === auth.currentUser.uid)) {
                showKickedMessageModal(lobbyData.name);
                return;
            }

            playerListContainer.innerHTML = '';
            const playerList = Object.entries(playersMap).map(([uid, displayName]) => ({ uid, displayName }));

            for (const player of playerList) {
                const isHost = player.uid === lobbyData.hostId;
                const playerItem = document.createElement('div');
                playerItem.className = 'player-list-item';
                if (isHost) playerItem.classList.add('is-host');

                const kickButtonHtml = (isCurrentUserHost && !isHost) 
                    ? `<button class="kick-player-btn" data-player-uid="${player.uid}" data-player-name="${player.displayName}">اخراج</button>` 
                    : '';
                
                const hostLabelHtml = isHost ? '<span class="host-label">(سازنده)</span>' : '';

                playerItem.innerHTML = `
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2 lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span class="player-name">${player.displayName}</span>
                        ${hostLabelHtml}
                    </div>
                    ${kickButtonHtml}
                `;
                playerListContainer.appendChild(playerItem);
            }

            playerListContainer.querySelectorAll('.kick-player-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                   openKickPlayerConfirmModal(e.currentTarget.dataset.playerName, e.currentTarget.dataset.playerUid);
                });
            });

            // === LOGIC CHANGE: Manage "Leave/Close Lobby" Button Visibility ===
            if (isCurrentUserHost) {
                leaveLobbyBtn.classList.remove('hidden');
                leaveLobbyBtn.textContent = 'بستن لابی'; // Host closes the lobby
            } else {
                // Per instructions, the leave button is hidden for non-hosts.
                // They must use the back button in the header (if available) or restart to leave.
                leaveLobbyBtn.classList.add('hidden');
            }

            // Manage Host Actions
            if (isCurrentUserHost) {
                hostActionsContainer.style.display = 'flex';
                startGameBtn.disabled = playerCount !== maxPlayers;
                startGameBtn.textContent = `شروع بازی (${playerCount}/${maxPlayers})`;
                
                toggleChatLockBtn.textContent = isChatLocked ? 'باز کردن چت' : 'قفل کردن چت';

            } else {
                hostActionsContainer.style.display = 'none';
            }

            if (isChatLocked && !isCurrentUserHost) {
                lobbyChatInput.disabled = true;
                lobbyChatSendBtn.disabled = true;
                lobbyChatInput.placeholder = "چت توسط سازنده قفل شده است";
            } else {
                lobbyChatInput.disabled = false;
                lobbyChatSendBtn.disabled = false;
                lobbyChatInput.placeholder = "پیام خود را بنویسید...";
            }


        } else {
            showMessageBox("لابی که در آن بودید بسته شد یا بازی شروع شد.", "info");
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
        }
    }, (error) => {
        console.error("Lobby detail listener error:", error);
        showMessageBox("خطا در بارگذاری جزئیات لابی.", "error");
        setActiveScreen(lobbyScreen);
        unsubscribeLobbies = setupLobbyListener('');
    });
    return unsubscribe;
}

async function leaveLobby() {
    if (!currentLobbyId || !auth.currentUser) return;
    const lobbyRef = doc(db, `global_lobbies`, currentLobbyId);
    const userId = auth.currentUser.uid;
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
            return;
        }
        const isHost = lobbySnap.data().hostId === userId;
        // The button is now only visible to the host, so this check is redundant but safe.
        if (isHost) {
            const confirmed = await showCustomConfirm("شما سازنده لابی هستید. خروج شما باعث بسته شدن لابی برای همه می‌شود. آیا مطمئن هستید؟", "بستن لابی");
            if (confirmed) {
                await deleteDoc(lobbyRef);
                // The onSnapshot listener will handle screen transition for all players.
            }
        } else {
            // This block is now unreachable via the UI as per the new requirement, but the logic is kept for safety.
            console.warn("A non-host tried to leave the lobby. This path should not be reachable.");
            await updateDoc(lobbyRef, {
                [`players.${userId}`]: deleteField()
            });
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
        }
    } catch (e) { console.error("Error leaving lobby:", e); showMessageBox("خطا در ترک لابی.", "error"); }
}

async function kickPlayer(lobbyId, playerToKickUid, playerToKickDisplayName) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        await updateDoc(lobbyRef, {
            [`players.${playerToKickUid}`]: deleteField(),
            kickedPlayers: arrayUnion({ uid: playerToKickUid, displayName: playerToKickDisplayName })
        });
        showMessageBox(`بازیکن "${playerToKickDisplayName}" اخراج شد.`, "success");
        closeKickPlayerConfirmModal();
    } catch (e) { console.error("Error kicking player:", e); showMessageBox("خطا در اخراج بازیکن.", "error"); }
}

async function unkickPlayer(lobbyId, playerToUnkickUid) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (lobbySnap.exists()) {
            const kickedPlayers = lobbySnap.data().kickedPlayers || [];
            const playerToUnkick = kickedPlayers.find(p => p.uid === playerToUnkickUid);
            if (playerToUnkick) {
                await updateDoc(lobbyRef, { kickedPlayers: arrayRemove(playerToUnkick) });
                showMessageBox(`بازیکن "${playerToUnkick.displayName}" می‌تواند دوباره وارد شود.`, "success");
            }
        }
    } catch (e) { console.error("Error unkicking player:", e); showMessageBox("خطا در بازگرداندن بازیکن.", "error"); }
}

function setupKickedPlayersListListener(lobbyId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    return onSnapshot(lobbyRef, (docSnap) => {
        kickedPlayersListContent.innerHTML = '';
        if (docSnap.exists()) {
            const kickedPlayers = docSnap.data().kickedPlayers || [];
            if (kickedPlayers.length === 0) {
                kickedPlayersListContent.innerHTML = '<p class="text-gray-400 text-center">هیچ بازیکنی اخراج نشده است.</p>';
            } else {
                kickedPlayers.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg mb-2';
                    playerDiv.innerHTML = `<span>${player.displayName}</span><button data-player-uid="${player.uid}" class="unkick-player-btn classic-btn btn-green-classic text-sm py-1 px-3">بازگرداندن</button>`;
                    kickedPlayersListContent.appendChild(playerDiv);
                });
                kickedPlayersListContent.querySelectorAll('.unkick-player-btn').forEach(button => {
                    button.addEventListener('click', (e) => unkickPlayer(currentLobbyId, e.target.dataset.playerUid));
                });
            }
        }
    });
}

async function sendLobbyMessage(lobbyId, text) {
    if (!text.trim() || !auth.currentUser || !currentUserData) return;
    const messagesRef = collection(db, `global_lobbies/${lobbyId}/messages`);
    try {
        await addDoc(messagesRef, {
            text: text.trim(),
            senderUid: auth.currentUser.uid,
            senderName: currentUserData.displayName,
            timestamp: serverTimestamp(),
            isDeleted: false // NEW
        });
        lobbyChatInput.value = ''; // Clear input after sending
    } catch (error) {
        console.error("Error sending chat message:", error);
        showMessageBox("خطا در ارسال پیام.", "error");
    }
}

// NEW: Soft-deletes a message
async function deleteLobbyMessage(lobbyId, messageId) {
    const messageRef = doc(db, `global_lobbies/${lobbyId}/messages`, messageId);
    try {
        await updateDoc(messageRef, {
            text: "[این پیام حذف شده است]",
            isDeleted: true
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        showMessageBox("خطا در حذف پیام.", "error");
    }
}

function setupLobbyChatListener(lobbyId, hostId) {
    const messagesRef = collection(db, `global_lobbies/${lobbyId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (snapshot) => {
        lobbyChatMessages.innerHTML = '';
        snapshot.forEach(doc => {
            const messageData = doc.data();
            const messageId = doc.id;
            const isCurrentUserMsg = messageData.senderUid === auth.currentUser.uid;
            const isCurrentUserHost = auth.currentUser.uid === hostId;

            const canDelete = !messageData.isDeleted && (isCurrentUserMsg || isCurrentUserHost);

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('chat-message');
            if (isCurrentUserMsg) {
                messageDiv.classList.add('current-user');
            }
            
            const deleteButtonHtml = canDelete ? `
                <button class="delete-message-btn" data-message-id="${messageId}" title="حذف پیام">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            ` : '';

            const messageContentHtml = messageData.isDeleted ? `
                <p class="message-text-deleted">${messageData.text}</p>
            ` : `
                <span class="sender-name">${messageData.senderName}</span>
                <p class="message-text">${messageData.text}</p>
            `;

            messageDiv.innerHTML = `
                <div class="chat-message-content">
                    ${messageContentHtml}
                </div>
                ${deleteButtonHtml}
            `;
            lobbyChatMessages.appendChild(messageDiv);
        });
        // Auto-scroll to the bottom
        lobbyChatMessages.scrollTop = lobbyChatMessages.scrollHeight;
    }, (error) => {
        console.error("Lobby chat listener error:", error);
        console.warn("Could not load chat messages:", error.message);
    });
}

// --- Event Listeners ---
// Auth, Profile, Modals, Lobby List
loginToggleBtn.addEventListener('click', () => {
    authMode = 'login';
    displayNameField.classList.add('hidden');
    submitAuthBtn.textContent = 'ورود';
    submitAuthBtn.classList.remove('hidden');
    loginToggleBtn.classList.add('hidden');
    registerToggleBtn.classList.remove('hidden');
    emailInput.focus();
    authForm.reset();
});

registerToggleBtn.addEventListener('click', () => {
    authMode = 'register';
    displayNameField.classList.remove('hidden');
    submitAuthBtn.textContent = 'ثبت نام';
    submitAuthBtn.classList.remove('hidden');
    registerToggleBtn.classList.add('hidden');
    loginToggleBtn.classList.remove('hidden');
    emailInput.focus();
    authForm.reset();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!email || !password) { showMessageBox("لطفاً ایمیل و رمز عبور را وارد کنید.", 'error'); return; }
    if (authMode === 'register' && !displayName) { showMessageBox("لطفاً نام نمایشی را وارد کنید.", 'error'); return; }
    if (authMode === 'register' && password.length < 6) { showMessageBox("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error"); return; }

    try {
        if (authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
            await setDoc(userDocRef, { displayName: displayName, email: email }, { merge: true });
        }
    } catch (error) { showMessageBox(getFirebaseErrorMessage(error.code), 'error'); }
});

menuBtn.addEventListener('click', openProfileModal);
profileSummary.addEventListener('click', openProfileModal);
closeProfileModalBtn.addEventListener('click', closeProfileModal);
profileModal.addEventListener('click', (e) => e.target === profileModal && closeProfileModal());

profileLogoutBtn.addEventListener('click', async () => {
    try { await signOut(auth); closeProfileModal(); } catch (error) { showMessageBox(getFirebaseErrorMessage(error.code), 'error'); }
});

friendlyGameBtn.addEventListener('click', () => {
    if (!auth.currentUser) { showMessageBox("برای مشاهده لابی‌ها، ابتدا وارد شوید.", "error"); return; }
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener('');
});

ratedGameBtn.addEventListener('click', () => showMessageBox("بازی امتیازی به زودی!", "info"));

backToMainBtn.addEventListener('click', () => {
    setActiveScreen(mainScreen);
    if (unsubscribeLobbies) unsubscribeLobbies();
    if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
    if (unsubscribeLobbyChat) unsubscribeLobbyChat();
    unsubscribeLobbies = unsubscribeLobbyDetail = unsubscribeLobbyChat = null;
});

addIconBtn.addEventListener('click', () => {
    if (!auth.currentUser) { showMessageBox("برای ساخت لابی، ابتدا وارد شوید.", "error"); return; }
    if (userHasActiveLobby) { showMessageBox("شما از قبل در یک لابی فعال هستید.", "info"); return; }
    openCreateLobbyModal();
});

createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lobbyName = newLobbyNameInput.value.trim();
    const lobbyType = document.querySelector('input[name="lobby-type"]:checked').value;
    const password = newLobbyPasswordInput.value;

    if (!lobbyName) { showCreateLobbyMessageBox("لطفاً نام لابی را وارد کنید.", "error"); return; }
    if (lobbyType === 'private' && password.length < 4) { showCreateLobbyMessageBox("رمز عبور برای لابی خصوصی باید حداقل ۴ کاراکتر باشد.", "error"); return; }
    if (!auth.currentUser || !currentUserData?.displayName) { showCreateLobbyMessageBox("مشکلی در اطلاعات کاربری شما وجود دارد.", "error"); return; }
    if (userHasActiveLobby) { showCreateLobbyMessageBox("شما از قبل در یک لابی فعال هستید.", "info"); closeCreateLobbyModal(); return; }

    showCreateLobbyMessageBox("در حال بررسی نام لابی...", "info");
    try {
        const moderationResult = await checkLobbyNameWithAI(lobbyName);
        if (!moderationResult.is_appropriate) { showCreateLobbyMessageBox(`نام لابی نامناسب: ${moderationResult.reason}`, "error");  return; }
    } catch (aiError) { console.error("خطا در بررسی AI نام لابی:", aiError); showCreateLobbyMessageBox("خطایی در بررسی نام لابی پیش آمد.", "error"); return; }

    try {
        const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName, lobbyType, password);
        showCreateLobbyMessageBox("لابی شما با موفقیت ساخته شد!", "success");
        
        setTimeout(() => {
            closeCreateLobbyModal();
            currentLobbyId = newLobbyId;
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId);
        }, 1500);
        
    } catch (error) {
        console.error("خطا در ساخت لابی از مودال:", error);
        showCreateLobbyMessageBox(error.message.includes("شما از قبل یک لابی فعال ساخته‌اید.") ? error.message : `خطا در ساخت لابی: ${error.message}`, "error");
    }
});

closeCreateLobbyModalBtn.addEventListener('click', closeCreateLobbyModal);
createLobbyModal.addEventListener('click', (e) => e.target === createLobbyModal && closeCreateLobbyModal());

refreshLobbiesBtn.addEventListener('click', () => {
    if (isRefreshing) return;
    if (!auth.currentUser) { showMessageBox("برای بروزرسانی لابی‌ها، ابتدا وارد شوید.", "info"); return; }
    isRefreshing = true;
    refreshLobbiesBtn.disabled = true;
    const refreshIconSvg = refreshLobbiesBtn.querySelector('svg');
    refreshIconSvg.classList.add('is-refreshing');
    lobbiesList.innerHTML = '<p class="text-gray-400">در حال بروزرسانی لیست...</p>';
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }
    unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
    setTimeout(() => {
        isRefreshing = false;
        refreshLobbiesBtn.disabled = false;
        refreshIconSvg.classList.remove('is-refreshing');
        showMessageBox("لیست لابی‌ها بروزرسانی شد.", "info");
    }, 1000);
});

myLobbiesBtn.addEventListener('click', () => showMessageBox("لابی‌های من به زودی!", "info"));
lobbySearchInput.addEventListener('input', (e) => {
    if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = setupLobbyListener(e.target.value.trim().toLowerCase());
});
lobbySearchInput.addEventListener('keypress', (e) => e.key === 'Enter' && searchLobbiesBtn.click());
searchLobbiesBtn.addEventListener('click', () => {
    if (unsubscribeLobbies) unsubscribeLobbies();
    unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
});

// --- Lobby Detail Screen Event Listeners ---
leaveLobbyBtn.addEventListener('click', leaveLobby);

startGameBtn.addEventListener('click', () => {
    if (startGameBtn.disabled) return;
    showMessageBox("شروع بازی در حال حاضر غیرفعال است. این قابلیت به زودی اضافه خواهد شد.", "info");
});

// NEW: Toggle Chat Lock Listener
toggleChatLockBtn.addEventListener('click', async () => {
    if (!currentLobbyId || !auth.currentUser) return;
    const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (lobbySnap.exists() && lobbySnap.data().hostId === auth.currentUser.uid) {
            const currentLockState = lobbySnap.data().isChatLocked || false;
            await updateDoc(lobbyRef, { isChatLocked: !currentLockState });
        }
    } catch (error) {
        console.error("Error toggling chat lock:", error);
        showMessageBox("خطا در تغییر وضعیت چت.", "error");
    }
});

// Kick/Unkick related
kickPlayerConfirmBtn.addEventListener('click', () => kickedPlayerToProcess && kickPlayer(currentLobbyId, kickedPlayerToProcess.uid, kickedPlayerToProcess.displayName));
cancelKickPlayerBtn.addEventListener('click', closeKickPlayerConfirmModal);
closeKickPlayerConfirmModalBtn.addEventListener('click', closeKickPlayerConfirmModal);
kickPlayerConfirmModal.addEventListener('click', (e) => e.target === kickPlayerConfirmModal && closeKickPlayerConfirmModal());
kickedMessageOkBtn.addEventListener('click', closeKickedMessageModal);
viewKickedPlayersBtn.addEventListener('click', openKickedPlayersListModal);
closeKickedPlayersListModalBtn.addEventListener('click', closeKickedPlayersListModal);
kickedListOkBtn.addEventListener('click', closeKickedPlayersListModal);
kickedPlayersListModal.addEventListener('click', (e) => e.target === kickedPlayersListModal && closeKickedPlayersListModal());

// Private lobby password related
function showPasswordPromptMessage(message, type = 'error') {
    passwordPromptMessageBox.textContent = message;
    passwordPromptMessageBox.className = 'mt-5 p-3.5 rounded-xl text-base text-center';
    passwordPromptMessageBox.classList.add(type === 'error' ? 'bg-red-500' : 'bg-blue-500', 'text-white');
    passwordPromptMessageBox.classList.remove('hidden');
    setTimeout(() => passwordPromptMessageBox.classList.add('hidden'), 4000);
}

function openEnterPasswordModal(lobbyId, lobbyName) {
    lobbyToJoin = { id: lobbyId, name: lobbyName };
    passwordPromptLobbyName.textContent = lobbyName;
    enterPasswordForm.reset();
    passwordPromptMessageBox.classList.add('hidden');
    enterPasswordModal.classList.remove('hidden');
    void enterPasswordModal.offsetWidth;
    enterPasswordModal.classList.add('profile-modal-enter-active');
    joinLobbyPasswordInput.focus();
}

function closeEnterPasswordModal() {
    enterPasswordModal.classList.remove('profile-modal-enter-active');
    enterPasswordModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        enterPasswordModal.classList.add('hidden');
        enterPasswordModal.classList.remove('profile-modal-leave-active');
        lobbyToJoin = null;
    }, 300);
}

lobbyTypeToggle.addEventListener('change', (e) => {
    document.querySelectorAll('.lobby-type-btn').forEach(btn => btn.classList.remove('active'));
    e.target.nextElementSibling.classList.add('active');
    if (e.target.value === 'private') {
        newLobbyPasswordField.classList.remove('hidden');
    } else {
        newLobbyPasswordField.classList.add('hidden');
    }
});

togglePasswordVisibilityBtn.addEventListener('click', () => {
    const isPassword = newLobbyPasswordInput.type === 'password';
    newLobbyPasswordInput.type = isPassword ? 'text' : 'password';
    eyeIconOpen.style.display = isPassword ? 'none' : 'block';
    eyeIconClosed.style.display = isPassword ? 'block' : 'none';
});

cancelJoinPasswordBtn.addEventListener('click', closeEnterPasswordModal);
enterPasswordModal.addEventListener('click', (e) => e.target === enterPasswordModal && closeEnterPasswordModal());

enterPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!lobbyToJoin) return;
    const enteredPassword = joinLobbyPasswordInput.value;
    if (!enteredPassword) { showPasswordPromptMessage('لطفاً رمز عبور را وارد کنید.'); return; }

    submitJoinPasswordBtn.disabled = true;
    submitJoinPasswordBtn.textContent = 'در حال بررسی...';
    try {
        const lobbyRef = doc(db, 'global_lobbies', lobbyToJoin.id);
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists() || lobbySnap.data().type !== 'private') {
            showPasswordPromptMessage('این لابی دیگر خصوصی نیست یا وجود ندارد.');
            closeEnterPasswordModal();
            return;
        }
        if (enteredPassword === lobbySnap.data().password) {
            closeEnterPasswordModal();
            await joinLobby(lobbyToJoin.id, auth.currentUser.uid, currentUserData.displayName);
        } else {
            showPasswordPromptMessage('رمز عبور اشتباه است.');
            joinLobbyPasswordInput.value = '';
            joinLobbyPasswordInput.focus();
        }
    } catch (error) {
        console.error("Error verifying lobby password:", error);
        showPasswordPromptMessage('خطا در بررسی رمز عبور.');
    } finally {
        submitJoinPasswordBtn.disabled = false;
        submitJoinPasswordBtn.textContent = 'ورود';
    }
});

// Chat Form Submission
lobbyChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentLobbyId) {
        sendLobbyMessage(currentLobbyId, lobbyChatInput.value);
    }
});

// NEW: Event Delegation for Message Deletion
lobbyChatMessages.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.delete-message-btn');
    if (deleteButton) {
        const messageId = deleteButton.dataset.messageId;
        if (currentLobbyId && messageId) {
            deleteLobbyMessage(currentLobbyId, messageId);
        }
    }
});

// Initialize the app when the window loads
window.onload = initializeFirebaseAndAuth;
