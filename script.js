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

// Create Lobby Modal Elements
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn');
const createLobbyForm = document.getElementById('create-lobby-form');
const newLobbyNameInput = document.getElementById('new-lobby-name-input');
const submitCreateLobbyBtn = document.getElementById('submit-create-lobby-btn');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');

// Custom Confirmation Modal Elements
const customConfirmModal = document.getElementById('custom-confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

// Lobby Detail Screen Elements (NEW)
const lobbyDetailScreen = document.getElementById('lobby-detail-screen');
const detailLobbyName = document.getElementById('detail-lobby-name');
const detailHostName = document.getElementById('detail-host-name');
const playerSlotsGrid = lobbyDetailScreen.querySelector('.player-slots-grid');
const detailPlayerCount = document.getElementById('detail-player-count');
const hostActionsContainer = document.getElementById('host-actions-container'); // NEW
const startGameBtn = document.getElementById('start-game-btn');
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn'); // NEW
const leaveLobbyBtn = document.getElementById('leave-lobby-btn');

// Kick Player Confirmation Modal Elements (NEW)
const kickPlayerConfirmModal = document.getElementById('kick-player-confirm-modal');
const closeKickPlayerConfirmModalBtn = document.getElementById('close-kick-player-confirm-modal-btn');
const kickPlayerConfirmName = document.getElementById('kick-player-confirm-name');
const kickPlayerConfirmBtn = document.getElementById('kick-player-confirm-btn');
const cancelKickPlayerBtn = document.getElementById('cancel-kick-player-btn');

// Kicked Message Modal Elements (NEW)
const kickedMessageModal = document.getElementById('kicked-message-modal');
const kickedMessageText = document.getElementById('kicked-message-text');
const kickedLobbyName = document.getElementById('kicked-lobby-name');
const kickedMessageOkBtn = document.getElementById('kicked-message-ok-btn');

// Kicked Players List Modal Elements (NEW)
const kickedPlayersListModal = document.getElementById('kicked-players-list-modal');
const closeKickedPlayersListModalBtn = document.getElementById('close-kicked-players-list-modal-btn');
const kickedPlayersListContent = document.getElementById('kicked-players-list-content');
const kickedListOkBtn = document.getElementById('kicked-list-ok-btn');

// State variables
let authMode = 'login'; // Default mode is login
let currentActiveScreen = loadingScreen;
let currentUserData = null; // To store user's profile data
let unsubscribeLobbies = null; // Global variable to store the unsubscribe function for lobby list listener
let unsubscribeLobbyDetail = null; // Global variable for single lobby detail listener
let unsubscribeKickedPlayers = null; // NEW: Listener for kicked players list
let isAuthResolved = false; // Flag to indicate if onAuthStateChanged has run at least once
let userHasActiveLobby = false; // Track if the current user has an active lobby (created or joined)
let currentLobbyId = null; // Stores the ID of the lobby the current user is in
let kickedPlayerToProcess = null; // Stores UID/name of player selected for kicking

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

    // Hide the current screen with transition
    currentActiveScreen.classList.remove('page-transition-visible');
    currentActiveScreen.classList.add('page-transition-hidden');
    currentActiveScreen.setAttribute('tabindex', '-1'); // Remove focus capability
    // Remove focus from any active element on the current screen
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    setTimeout(() => {
        currentActiveScreen.classList.add('hidden'); // Fully hide
        currentActiveScreen.classList.remove('page-transition-hidden'); // Clean up class

        // Show the new screen with transition
        newScreen.classList.remove('hidden');
        // Force reflow to ensure transition starts from hidden state
        void newScreen.offsetWidth;
        newScreen.classList.add('page-transition-visible');
        newScreen.removeAttribute('tabindex'); // Allow focus for new screen
        console.log(`صفحه ${newScreen.id} اکنون قابل مشاهده است.`);

        // Manage focus based on the new screen
        if (newScreen === authScreen) {
            emailInput.focus(); // Focus on email input for auth screen
        } else if (newScreen === mainScreen) {
            document.activeElement.blur(); // Ensure no input has focus on main screen
        } else if (newScreen === lobbyScreen) {
            lobbySearchInput.focus(); // Focus on search input on lobby screen
        } else if (newScreen === lobbyDetailScreen) {
            // No specific focus needed, content is dynamic
        }

        currentActiveScreen = newScreen; // Update the current active screen

    }, 600); // Matches CSS transition duration
}

// Function to open the profile modal
function openProfileModal() {
    profileModal.classList.remove('hidden');
    void profileModal.offsetWidth; // Trigger reflow for transition
    profileModal.classList.add('profile-modal-enter-active');
    // Populate profile data
    if (currentUserData) {
        profileDisplayName.textContent = currentUserData.displayName || 'ناشناس';
        profileEmail.textContent = currentUserData.email || 'ناشناس';
        profileUid.textContent = currentUserData.uid || 'ناشناس';
    }
}

// Function to close the profile modal
function closeProfileModal() {
    profileModal.classList.remove('profile-modal-enter-active');
    profileModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        profileModal.classList.add('hidden');
        profileModal.classList.remove('profile-modal-leave-active');
    }, 300); // Match modal transition duration
}

// Function to open the create lobby modal
function openCreateLobbyModal() {
    createLobbyModal.classList.remove('hidden');
    void createLobbyModal.offsetWidth;
    createLobbyModal.classList.add('profile-modal-enter-active');
    newLobbyNameInput.focus(); // Focus on the input field
    createLobbyMessageBox.classList.add('hidden'); // Hide previous messages
}

// Function to close the create lobby modal
function closeCreateLobbyModal() {
    createLobbyModal.classList.remove('profile-modal-enter-active');
    createLobbyModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        createLobbyModal.classList.add('hidden');
        createLobbyModal.classList.remove('profile-modal-leave-active');
        createLobbyForm.reset(); // Clear the form after closing
    }, 300);
}

// NEW: Function to open the kick player confirmation modal
function openKickPlayerConfirmModal(playerName, playerUid) {
    kickPlayerConfirmName.textContent = playerName;
    kickPlayerConfirmModal.classList.remove('hidden');
    void kickPlayerConfirmModal.offsetWidth; // Trigger reflow for transition
    kickPlayerConfirmModal.classList.add('profile-modal-enter-active');
    // Store player data to use when kick button is clicked
    kickedPlayerToProcess = { uid: playerUid, displayName: playerName };
}

// NEW: Function to close the kick player confirmation modal
function closeKickPlayerConfirmModal() {
    kickPlayerConfirmModal.classList.remove('profile-modal-enter-active');
    kickPlayerConfirmModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        kickPlayerConfirmModal.classList.add('hidden');
        kickPlayerConfirmModal.classList.remove('profile-modal-leave-active');
        kickedPlayerToProcess = null; // Clear stored player data
    }, 300);
}

// NEW: Function to show the "You have been kicked" message modal
function showKickedMessageModal(lobbyName) {
    kickedLobbyName.textContent = lobbyName;
    kickedMessageModal.classList.remove('hidden');
    void kickedMessageModal.offsetWidth; // Trigger reflow for transition
    kickedMessageModal.classList.add('profile-modal-enter-active');
}

// NEW: Function to close the "You have been kicked" message modal
function closeKickedMessageModal() {
    kickedMessageModal.classList.remove('profile-modal-enter-active');
    kickedMessageModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        kickedMessageModal.classList.add('hidden');
        kickedMessageModal.classList.remove('profile-modal-leave-active');
        setActiveScreen(lobbyScreen); // Redirect to lobby list after acknowledging
        unsubscribeLobbies = setupLobbyListener(''); // Refresh lobby list
    }, 300);
}

// NEW: Function to open the kicked players list modal
function openKickedPlayersListModal() {
    kickedPlayersListModal.classList.remove('hidden');
    void kickedPlayersListModal.offsetWidth;
    kickedPlayersListModal.classList.add('profile-modal-enter-active');
    // Start listening for kicked players for the current lobby
    if (currentLobbyId) {
        unsubscribeKickedPlayers = setupKickedPlayersListListener(currentLobbyId);
    } else {
        kickedPlayersListContent.innerHTML = '<p class="text-gray-400 text-center">خطا: لابی فعال یافت نشد.</p>';
    }
}

// NEW: Function to close the kicked players list modal
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
 * In a real application, this would be a backend call to a robust moderation service.
 * @param {string} lobbyName - The name of the lobby to check.
 * @returns {Promise<{is_appropriate: boolean, reason: string}>} - The moderation result.
 */
async function checkLobbyNameWithAI(lobbyName) {
    // Updated prompt to be multilingual and emphasize strictness
    // Explicitly mentioning common offensive terms in both English and Persian,
    // and emphasizing their detection regardless of language.
    const prompt = `As a highly rigorous and professional content moderation AI, meticulously analyze the following lobby name for compliance with the strictest community guidelines across *all* languages. 
    You must absolutely identify and disallow any political, racist, sexual, offensive, vulgar, violent, or otherwise inappropriate content, including but not limited to terms like "fuck", "asshole", "shit", "bitch", and their equivalents in Persian such as "کیر", "کون", "کس", "کسکش", "جنده", "حرومزاده", "بیناموس" etc., regardless of how they are spelled (e.g., phonetic or deliberate misspellings to evade detection). 
    Your analysis should consider the context and intent where possible.
    Your response *must* be a JSON object: {"is_appropriate": boolean, "reason": string}. If 'is_appropriate' is false, provide a *brief, objective, and precise* reason identifying the specific type of violation (e.g., "Contains offensive language", "Political reference detected", "Violates decency standards"). If appropriate, 'reason' should be an empty string. 
    Lobby name to analyze: "${lobbyName}"`;
    
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    
    const payload = {
        contents: chatHistory,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "is_appropriate": { "type": "BOOLEAN" },
                    "reason": { "type": "STRING" }
                },
                "propertyOrdering": ["is_appropriate", "reason"]
            }
        }
    };

    // **FIX: Replaced placeholder API Key with the provided user key.**
    const apiKey = "AIzaSyDfMZwyWNnRFUDLHKR1t_hZ5cWv2c_KvvE"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // **FIX: Check response.ok for successful HTTP status before parsing JSON.**
        if (!response.ok) {
            const errorText = await response.text(); // Get raw error text
            console.error("AI API HTTP Error:", response.status, response.statusText, errorText);
            return { is_appropriate: false, reason: `خطا در ارتباط با سرور اعتدال: ${response.statusText}.` };
        }

        const result = await response.json();
        
        // **FIX: Robustly check if result and its properties exist before accessing.**
        if (result && result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            
            try {
                const parsedJson = JSON.parse(jsonString);
                // Basic validation of the parsed response
                if (typeof parsedJson.is_appropriate === 'boolean' && typeof parsedJson.reason === 'string') {
                    return parsedJson;
                } else {
                    console.warn("AI response has unexpected structure or types:", parsedJson);
                    return { is_appropriate: false, reason: "پاسخ سیستم اعتدال نامفهوم است." }; 
                }
            } catch (parseError) {
                console.error("Error parsing AI response JSON:", parseError, "Raw response:", jsonString);
                return { is_appropriate: false, reason: "خطا در پردازش پاسخ اعتدال." };
            }
        } else {
            console.warn("AI response missing expected content structure:", result);
            // This could happen if API returns non-error but empty content, or unexpected format
            return { is_appropriate: false, reason: "عدم دریافت پاسخ معتبر از سیستم اعتدال." }; 
        }
    } catch (error) {
        console.error("Error calling AI moderation API (network or unexpected):", error);
        // Catch generic network errors or other unexpected issues
        return { is_appropriate: false, reason: `خطا در ارتباط با سیستم اعتدال: ${error.message}.` }; 
    }
}


// Firebase Authentication State Listener
// This listener is crucial for managing the UI state based on user authentication.
// It fetches/updates currentUserData and handles screen transitions.
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged فایر بیس فعال شد. وضعیت کاربر:", user ? user.uid : "کاربر وارد نشده");
    isAuthResolved = true; // Set flag that auth state has been checked

    if (user) {
        // User is signed in. Fetch or update their profile data.
        try {
            // Use appId in the path for user's private data as specified in Canvas docs
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`); 
            const userDocSnap = await getDoc(userDocRef);

            // Initialize currentUserData based on Firebase user and Firestore profile
            currentUserData = {
                uid: user.uid,
                email: user.email,
                // Prioritize displayName from Firestore, then user.displayName (if set by Firebase, e.g., Google Sign-in),
                // then fallback to part of email.
                displayName: (userDocSnap.exists() && userDocSnap.data().displayName)
                            ? userDocSnap.data().displayName
                            : (user.displayName || (user.email ? user.email.split('@')[0] : 'کاربر ناشناس'))
            };
            
            // If a user just registered and displayName was provided in the form,
            // ensure it's saved in Firestore if it wasn't already.
            // This scenario is mostly for robustness; primary save is during registration.
            // Also, ensure `email` is saved with `displayName` on profile creation/update.
            if (userDocSnap.exists() && !userDocSnap.data().displayName && displayNameInput.value.trim() !== '') {
                console.log("Updating displayName in Firestore from auth form.");
                await setDoc(userDocRef, { displayName: displayNameInput.value.trim(), email: user.email }, { merge: true });
                currentUserData.displayName = displayNameInput.value.trim(); // Update current data immediately
            } else if (!userDocSnap.exists() && authMode === 'register' && displayNameInput.value.trim() !== '') {
                console.log("Creating user profile in Firestore after registration.");
                 await setDoc(userDocRef, { displayName: displayName.trim(), email: user.email }, { merge: true });
                 currentUserData.displayName = displayName.trim();
            }


            // Update header display with fetched/derived data
            headerDisplayName.textContent = currentUserData.displayName;
            headerUserId.textContent = `شناسه: ${currentUserData.uid.substring(0, 8)}...`; // Display first 8 chars of UID

            console.log("نام نمایشی کاربر: " + currentUserData.displayName);
            setActiveScreen(mainScreen); // Transition to main screen once user data is ready

        } catch (firestoreError) {
            console.error("خطا در دریافت/به‌روزرسانی پروفایل کاربر از Firestore:", firestoreError);
            // Fallback if Firestore read fails
            currentUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'کاربر ناشناس')
            };
            headerDisplayName.textContent = currentUserData.displayName;
            headerUserId.textContent = `شناسه: ${currentUserData.uid.substring(0, 8)}...`;
            setActiveScreen(mainScreen); // Still transition even if profile fetch fails
            showMessageBox("مشکلی در بارگذاری پروفایل شما پیش آمد. لطفا دوباره امتحان کنید.", "error");
        }

    } else {
        // User is signed out or not signed in.
        // Only transition to auth screen if auth state has been initially resolved
        // This prevents flickering if app is just loading and auth hasn't fully checked yet.
        if (isAuthResolved) {
            setActiveScreen(authScreen); // Transition to authentication screen
        }
        // Reset auth form state
        authForm.reset();
        displayNameField.classList.add('hidden'); // Hide display name field
        submitAuthBtn.classList.add('hidden'); // Hide submit button initially
        loginToggleBtn.classList.remove('hidden'); // Show login toggle
        registerToggleBtn.classList.remove('hidden'); // Show register toggle
        authMode = 'login'; // Reset mode to login
        currentUserData = null; // Clear user data
        // If there's an active lobby listener, unsubscribe it to prevent unauthorized access
        if (unsubscribeLobbies) {
            unsubscribeLobbies();
            unsubscribeLobbies = null;
        }
        if (unsubscribeLobbyDetail) { // Also unsubscribe from lobby detail if active
            unsubscribeLobbyDetail();
            unsubscribeLobbyDetail = null;
        }
        if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list
            unsubscribeKickedPlayers();
            unsubscribeKickedPlayers = null;
        }
        currentLobbyId = null; // Clear current lobby
    }
    console.log("onAuthStateChanged به پایان رسید.");
});

// Initial Firebase Initialization (without explicit sign-in attempts)
async function initializeFirebaseAndAuth() {
    console.log("تابع initializeFirebaseAndAuth فراخوانی شد.");
    // Removed explicit signInWithCustomToken and signInAnonymously calls.
    // Firebase's onAuthStateChanged listener will automatically detect existing sessions
    // or confirm no user is logged in, then route to the appropriate screen.
    console.log("منتظر وضعیت احراز هویت firebase (onAuthStateChanged) می‌مانیم. این تابع تنها مسئول آغاز کار است.");
}

/**
 * Maps Firebase auth error codes to user-friendly Persian messages.
 * @param {string} errorCode - The Firebase error code.
 * @returns {string} User-friendly message.
 */
function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return "فرمت ایمیل وارد شده نامعتبر است. لطفا یک ایمیل معتبر وارد کنید.";
        case 'auth/user-disabled':
            return "حساب کاربری شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیگرید.";
        case 'auth/user-not-found':
            return "کاربری با این ایمیل یافت نشد. لطفا ثبت نام کنید یا ایمیل را بررسی کنید.";
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // Modern Firebase error for wrong password/email
            return "ایمیل یا رمز عبور اشتباه است.";
        case 'auth/email-already-in-use':
            return "این ایمیل قبلاً ثبت نام شده است. لطفاً وارد شوید یا از ایمیل دیگری استفاده کنید.";
        case 'auth/weak-password':
            return "رمز عبور بسیار ضعیف است. لطفاً رمزی با حداقل ۶ کاراکتر انتخاب کنید.";
        case 'auth/operation-not-allowed':
            return "این نوع احراز هویت در حال حاضر فعال نیست. لطفاً با پشتیبانی تماس بگیگرید.";
        case 'auth/network-request-failed':
            return "مشکل در اتصال به اینترنت. لطفاً اتصال خود را بررسی کنید.";
        case 'auth/too-many-requests':
            return "تعداد تلاش‌های ناموفق بیش از حد مجاز. لطفاً بعداً امتحان کنید.";
        case 'auth/cancelled-popup-request': // For cases like pop-ups being blocked
            return "عملیات ورود لغو شد. پنجره بازشو ممکن است مسدود شده باشد.";
        default:
            return "خطایی ناشناخته رخ داده است. لطفاً دوباره تلاش کنید.";
    }
}

// --- Firebase Lobby Functions ---

/**
 * Creates a new lobby document in Firestore.
 * @param {string} lobbyName - The name of the lobby.
 * @param {string} userId - The UID of the user creating the lobby.
 * @param {string} displayName - The display name of the user creating the lobby.
 * @returns {Promise<string>} The ID of the newly created lobby.
 */
async function createLobby(lobbyName, userId, displayName) {
    try {
        // Ensure display name is not empty or null
        const creatorDisplayName = displayName && displayName.trim() !== '' ? displayName : 'ناشناس';

        // Check if user already has an active lobby (status 'waiting' or 'playing')
        const userLobbiesQuery = query(
            collection(db, `global_lobbies`),
            where("hostId", "==", userId),
            where("status", "in", ["waiting", "playing"])
        );
        const userLobbiesSnapshot = await getDocs(userLobbiesQuery); // Use getDocs for one-time read
        if (!userLobbiesSnapshot.empty) {
            throw new Error("شما از قبل یک لابی فعال ساخته‌اید. لطفاً ابتدا لابی قبلی خود را ببندید.");
        }


        const lobbiesRef = collection(db, `global_lobbies`); 
        const newLobbyRef = await addDoc(lobbiesRef, {
            name: lobbyName,
            hostId: userId,
            status: "waiting", // Initial status: waiting for players
            players: [{ uid: userId, displayName: creatorDisplayName }], // Host is the first player
            kickedPlayers: [], // NEW: Initialize an empty array for kicked players
            createdAt: serverTimestamp(), // Firestore timestamp for ordering/cleanup
            gameSettings: { // Default game settings
                maxPlayers: 4, // Hokm is typically 4 players
                roundsToWin: 7
            }
        });
        console.log("لابی با ID ساخته شد: ", newLobbyRef.id);
        userHasActiveLobby = true; // Update state
        return newLobbyRef.id;
    } catch (e) {
        console.error("خطا در ساخت لابی: ", e);
        throw e; // Re-throw to be caught by the caller
    }
}

/**
 * Closes (deletes) a lobby. Only the host can close their lobby.
 * @param {string} lobbyId - The ID of the lobby to close.
 * @param {string} userId - The UID of the user attempting to close the lobby.
 */
async function closeLobby(lobbyId, userId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            return;
        }

        const lobbyData = lobbySnap.data();
        // Ensure only the host can close the lobby
        if (lobbyData.hostId !== userId) {
            showMessageBox("شما اجازه بستن این لابی را ندارید. فقط سازنده لابی می‌تواند آن را ببندد.", "error");
            return;
        }

        // Add fade-out animation
        const lobbyElement = document.querySelector(`[data-lobby-id="${lobbyId}"]`);
        if (lobbyElement) {
            lobbyElement.classList.add('fade-out');
            // Wait for the animation to complete before deleting from Firestore
            await new Promise(resolve => setTimeout(resolve, 500)); // Match CSS transition duration
        }

        await deleteDoc(lobbyRef);
        showMessageBox(`لابی "${lobbyData.name}" با موفقیت بسته شد.`, "success");
        console.log(`لابی ${lobbyId} توسط ${userId} بسته شد.`);
        userHasActiveLobby = false; // Update state
        // If the user was in this lobby, clear the currentLobbyId
        if (currentLobbyId === lobbyId) {
            currentLobbyId = null;
        }
        // The onSnapshot listener for lobby list will handle removal from UI for all clients
        // The onSnapshot listener for lobby detail will also handle it and ideally transition away
    } catch (e) {
        console.error("خطا در بستن لابی: ", e);
        showMessageBox(`خطا در بستن لابی: ${e.message}`, "error");
    }
}


/**
 * Sets up a real-time listener for available lobbies and updates the UI.
 * Filters lobbies based on a search term (case-insensitive).
 * @param {string} searchTerm - The term to search for in lobby names or host display names.
 * @returns {function} An unsubscribe function to detach the listener.
 */
function setupLobbyListener(searchTerm = '') {
    console.log(`شروع راه‌اندازی Listener لابی‌ها با عبارت جستجو: "${searchTerm}"`);
    // If there's an existing lobby detail listener, unsubscribe it
    if (unsubscribeLobbyDetail) {
        unsubscribeLobbyDetail();
        unsubscribeLobbyDetail = null;
        currentLobbyId = null;
        console.log("Listener جزئیات لابی غیرفعال شد.");
    }
    if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list listener
        unsubscribeKickedPlayers();
        unsubscribeKickedPlayers = null;
    }

    // Clear previous lobbies list
    lobbiesList.innerHTML = '<p class="text-gray-400">در حال بارگذاری لابی‌ها...</p>';
    userHasActiveLobby = false; // Reset state before checking lobbies

    // Normalize search term for case-insensitive comparison
    const normalizedSearchTerm = searchTerm.toLowerCase();

    // Changed the query path for lobbies to be truly public, independent of __app_id
    const q = query(
        collection(db, `global_lobbies`), 
        where("status", "==", "waiting") // Only show lobbies waiting for players
        // Note: Firestore's where clause does not support "contains" or full-text search directly.
        // We will fetch and then filter client-side.
    );

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("آپدیت جدید از Firestore دریافت شد.");
        lobbiesList.innerHTML = ''; // Clear existing list content to re-render

        let activeGamesCountNum = 0; // Reset count for games in 'playing' status
        let lobbiesToDisplay = [];
        let currentUserIsHostOfLobby = false; // Track if current user is host of *any* waiting/playing lobby
        let currentUserIsInAnyLobby = false; // Track if current user is in *any* waiting/playing lobby

        snapshot.forEach((doc) => {
            const lobby = doc.data();
            const lobbyId = doc.id;
            
            // Filter based on search term
            const lobbyName = (lobby.name || '').toLowerCase();
            const hostDisplayName = (lobby.players && lobby.players.length > 0 && lobby.players[0].displayName)
                                    ? lobby.players[0].displayName.toLowerCase()
                                    : '';
            
            // Check if current user is in this lobby (as host or player)
            const isCurrentUserHost = auth.currentUser && lobby.hostId === auth.currentUser.uid;
            const isCurrentUserPlayer = auth.currentUser && lobby.players.some(p => p.uid === auth.currentUser.uid);

            if (isCurrentUserHost) {
                currentUserIsHostOfLobby = true;
            }
            if (isCurrentUserPlayer) {
                currentUserIsInAnyLobby = true;
            }

            // If a search term is provided, filter the lobbies
            if (normalizedSearchTerm === '' || 
                lobbyName.includes(normalizedSearchTerm) || 
                hostDisplayName.includes(normalizedSearchTerm)) {
                lobbiesToDisplay.push({ id: lobbyId, ...lobby });
            }

            // Increment active games count if lobby is "playing" (this count is for all games, not just filtered ones)
            if (lobby.status === "playing") {
                activeGamesCountNum++;
            }
        });

        userHasActiveLobby = currentUserIsInAnyLobby; // Update global state
        
        // Sort lobbies client-side by creation time (newest first)
        lobbiesToDisplay.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA; // Sort by newest first
        });

        if (lobbiesToDisplay.length === 0) {
            lobbiesList.innerHTML = '<p class="text-gray-400">لابی با این مشخصات یافت نشد.</p>';
        } else {
            lobbiesToDisplay.forEach((lobby) => {
                const playerCount = lobby.players ? lobby.players.length : 0;
                const maxPlayers = lobby.gameSettings?.maxPlayers || 4; // Default to 4 if not set
                
                const hostDisplayName = lobby.players && lobby.players.length > 0
                                        ? lobby.players[0].displayName || 'ناشناس'
                                        : 'ناشناس';

                // Check if the current user is the host of this specific lobby
                const isCurrentUserHostOfThisLobby = auth.currentUser && lobby.hostId === auth.currentUser.uid;
                // Check if the current user is already a player in this specific lobby
                const isCurrentUserAlreadyInThisLobby = auth.currentUser && lobby.players.some(p => p.uid === auth.currentUser.uid);
                // NEW: Check if current user is kicked from this lobby
                const isCurrentUserKicked = auth.currentUser && lobby.kickedPlayers?.some(p => p.uid === auth.currentUser.uid);


                // If user is already in a lobby (any lobby), disable join buttons for *other* lobbies
                const canJoinThisLobby = auth.currentUser && !currentUserIsInAnyLobby && playerCount < maxPlayers && !isCurrentUserKicked;


                let joinButtonHtml = '';
                if (isCurrentUserKicked) { // NEW: Kicked user cannot join
                     joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-red-classic opacity-50 cursor-not-allowed" disabled>
                                        اخراج شده‌اید
                                    </button>`;
                }
                else if (isCurrentUserHostOfThisLobby) {
                    // If current user is the host of this lobby, show a "Go to My Lobby" button
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="view-my-lobby-btn classic-btn btn-blue-classic">
                                        ورود به لابی من
                                    </button>`;
                } else if (canJoinThisLobby) {
                    // If user can join, make the button active
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic">
                                        ورود به لابی
                                    </button>`;
                } else {
                    // Otherwise, disable the button for joining
                    joinButtonHtml = `<button data-lobby-id="${lobby.id}" class="join-lobby-btn classic-btn btn-blue-classic opacity-50 cursor-not-allowed" disabled>
                                        ورود به لابی
                                    </button>`;
                }
                
                // Close button for host only with a small margin-left for spacing
                const closeButtonHtml = isCurrentUserHostOfThisLobby 
                    ? `<button data-lobby-id="${lobby.id}" class="close-lobby-btn classic-btn btn-red-classic">
                        بستن لابی
                       </button>`
                    : ''; // Empty string if not host

                const lobbyItem = document.createElement('div');
                lobbyItem.className = 'lobby-item mb-3 w-full';
                lobbyItem.dataset.lobbyId = lobby.id;
                lobbyItem.innerHTML = `
                    <div class="mb-2 sm:mb-0 text-center sm:text-right">
                        <h3 class="text-xl font-bold">${lobby.name}</h3>
                        <p class="text-sm">سازنده: ${hostDisplayName}</p>
                        <p class="text-sm">بازیکنان: ${playerCount}/${maxPlayers}</p>
                    </div>
                    <!-- تغییرات: اضافه کردن کلاس lobby-actions برای مدیریت چیدمان دکمه‌ها -->
                    <div class="lobby-actions">
                        ${closeButtonHtml}
                        ${joinButtonHtml}
                    </div>
                `;
                lobbiesList.appendChild(lobbyItem);
            });
        }
        
        activeGamesCount.textContent = activeGamesCountNum; // Update active games count in footer

        // Attach Event Listeners for "Join Lobby" buttons
        lobbiesList.querySelectorAll('.join-lobby-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (lobbyId && auth.currentUser && !userHasActiveLobby) { // Ensure user isn't already in a lobby
                    try {
                        await joinLobby(lobbyId, auth.currentUser.uid, currentUserData.displayName);
                        // Transition to lobby detail screen is handled inside joinLobby
                    } catch (error) {
                        console.error("Error joining lobby:", error);
                        showMessageBox(`خطا در ورود به لابی: ${error.message}`, "error");
                        // If the error is due to being kicked, show the kicked message modal
                        if (error.message.includes("شما از این لابی اخراج شده‌اید.")) {
                             // Need to fetch lobby name to display in kicked message
                             const lobbySnap = await getDoc(doc(db, `global_lobbies`, lobbyId));
                             if (lobbySnap.exists()) {
                                 showKickedMessageModal(lobbySnap.data().name);
                             } else {
                                 showKickedMessageModal("ناشناس"); // Fallback if lobby doesn't exist anymore
                             }
                        }
                    }
                } else if (userHasActiveLobby) {
                    showMessageBox("شما از قبل در یک لابی فعال هستید. لطفاً ابتدا از آن خارج شوید.", "info");
                }
            });
        });

        // Attach Event Listeners for "View My Lobby" buttons (for hosts)
        lobbiesList.querySelectorAll('.view-my-lobby-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (lobbyId && auth.currentUser) {
                    // If the user clicks "View My Lobby", just transition them to the detail screen
                    currentLobbyId = lobbyId; // Set the global current lobby ID
                    setActiveScreen(lobbyDetailScreen);
                    unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId); // Start listening to this specific lobby
                }
            });
        });


        // Attach Event Listeners for "Close Lobby" buttons
        lobbiesList.querySelectorAll('.close-lobby-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const lobbyId = e.target.dataset.lobbyId;
                if (lobbyId && auth.currentUser) {
                    const lobbyName = e.target.closest('.lobby-item').querySelector('h3').textContent;
                    const confirmed = await showCustomConfirm(`آیا مطمئن هستید که می‌خواهید لابی "${lobbyName}" را ببندید؟ این عمل غیرقابل بازگشت است.`);
                    if (confirmed) {
                        try {
                            await closeLobby(lobbyId, auth.currentUser.uid);
                            // If host closes their own lobby while they are viewing it
                            if (currentActiveScreen === lobbyDetailScreen && currentLobbyId === lobbyId) {
                                setActiveScreen(lobbyScreen); // Go back to lobby list
                                unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase()); // Refresh list
                            }
                        } catch (error) {
                            console.error("Error closing lobby:", error);
                            showMessageBox(`خطا در بستن لابی: ${error.message}`, "error");
                        }
                    }
                }
            });
        });

    }, (error) => {
        console.error("خطا در گوش دادن به لابی‌ها: ", error);
        lobbiesList.innerHTML = `<p class="text-red-400">خطا در بارگذاری لیست لابی‌ها. (${error.message})</p>`;
        showMessageBox("خطا در بارگذاری لیست لابی‌ها. (" + error.message + ")", "error");
    });

    return unsubscribe; // Return the unsubscribe function
}

/**
 * Adds a user to an existing lobby.
 * @param {string} lobbyId - The ID of the lobby to join.
 * @param {string} userId - The UID of the user joining.
 * @param {string} displayName - The display name of the user joining.
 */
async function joinLobby(lobbyId, userId, displayName) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            return;
        }

        const lobbyData = lobbySnap.data();
        let players = lobbyData.players || [];
        const maxPlayers = lobbyData.gameSettings?.maxPlayers || 4;
        const kickedPlayers = lobbyData.kickedPlayers || []; // NEW: Get kicked players

        // NEW: Check if the user is in the kickedPlayers list
        if (kickedPlayers.some(p => p.uid === userId)) {
            throw new Error("شما از این لابی اخراج شده‌اید و نمی‌توانید به آن بازگردید.");
        }

        if (players.some(p => p.uid === userId)) {
            showMessageBox("شما قبلاً در این لابی هستید.", "info");
            currentLobbyId = lobbyId; // Set current lobby ID
            setActiveScreen(lobbyDetailScreen); // Transition to lobby details
            unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId); // Start listening to this specific lobby
            return;
        }

        if (players.length >= maxPlayers) {
            showMessageBox("لابی پر است.", "error");
            return;
        }

        // Add the new player
        const newPlayer = { uid: userId, displayName: displayName };
        players.push(newPlayer); // Add new player
        await updateDoc(lobbyRef, {
            players: players // Update the entire array
        });

        showMessageBox(`شما به لابی "${lobbyData.name}" وارد شدید.`, "success");
        console.log(`کاربر ${userId} به لابی ${lobbyId} پیوست.`);
        
        currentLobbyId = lobbyId; // Set current lobby ID
        userHasActiveLobby = true; // Mark user as being in a lobby
        setActiveScreen(lobbyDetailScreen); // Transition to lobby details
        unsubscribeLobbyDetail = setupLobbyDetailListener(lobbyId); // Start listening to this specific lobby

        // Check if the lobby is now full after joining
        // This check will be done by the lobby detail listener's update logic.
        // We'll update the status to "playing" inside setupLobbyDetailListener
        // when player count reaches max.

    } catch (e) {
        console.error("خطا در ورود به لابی: ", e);
        showMessageBox("خطا در ورود به لابی. لطفاً دوباره تلاش کنید.", "error");
        throw e; // Re-throw to be caught by the event listener
    }
}

/**
 * Sets up a real-time listener for a specific lobby's details and updates the UI.
 * @param {string} lobbyId - The ID of the lobby to listen to.
 * @returns {function} An unsubscribe function to detach the listener.
 */
function setupLobbyDetailListener(lobbyId) {
    console.log(`شروع راه‌اندازی Listener جزئیات لابی برای ID: ${lobbyId}`);
    // Unsubscribe from lobby list listener if active
    if (unsubscribeLobbies) {
        unsubscribeLobbies();
        unsubscribeLobbies = null;
        console.log("Listener لیست لابی‌ها غیرفعال شد.");
    }
    if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list listener
        unsubscribeKickedPlayers();
        unsubscribeKickedPlayers = null;
    }


    const lobbyRef = doc(db, `global_lobbies`, lobbyId);

    const unsubscribe = onSnapshot(lobbyRef, async (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            console.log("آپدیت جزئیات لابی دریافت شد:", lobbyData);

            detailLobbyName.textContent = lobbyData.name;
            detailHostName.textContent = `سازنده: ${lobbyData.players[0]?.displayName || 'ناشناس'}`;

            const players = lobbyData.players || [];
            const maxPlayers = lobbyData.gameSettings?.maxPlayers || 4;
            detailPlayerCount.textContent = `بازیکنان: ${players.length}/${maxPlayers}`;
            const kickedPlayers = lobbyData.kickedPlayers || []; // NEW

            // NEW: Check if the current user is now in the kickedPlayers list for this lobby
            if (auth.currentUser && kickedPlayers.some(p => p.uid === auth.currentUser.uid)) {
                console.log("کاربر فعلی اخراج شده است.");
                showMessageBox(`شما از لابی "${lobbyData.name}" اخراج شده‌اید.`, "error");
                closeKickPlayerConfirmModal(); // Close kick modal if open
                showKickedMessageModal(lobbyData.name); // Show kicked message
                currentLobbyId = null; // User is no longer in this lobby
                userHasActiveLobby = false;
                return; // Stop further processing for this user in this lobby
            }

            // Render player slots
            playerSlotsGrid.innerHTML = ''; // Clear existing slots
            const isCurrentUserHost = auth.currentUser && lobbyData.hostId === auth.currentUser.uid;

            for (let i = 0; i < maxPlayers; i++) {
                const player = players[i];
                const playerSlot = document.createElement('div');
                playerSlot.className = `player-slot ${player ? 'filled' : ''}`;
                playerSlot.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="player-avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>${player ? player.displayName : 'جایگاه خالی'}</span>
                `;
                // NEW: Make player slots clickable for the host
                if (isCurrentUserHost && player && player.uid !== auth.currentUser.uid) { // Host cannot kick themselves
                    playerSlot.classList.add('clickable');
                    playerSlot.dataset.playerUid = player.uid;
                    playerSlot.dataset.playerName = player.displayName;
                    playerSlot.addEventListener('click', (e) => {
                        const targetPlayerUid = e.currentTarget.dataset.playerUid;
                        const targetPlayerName = e.currentTarget.dataset.playerName;
                        if (targetPlayerUid && targetPlayerName) {
                            openKickPlayerConfirmModal(targetPlayerName, targetPlayerUid);
                        }
                    });
                }
                playerSlotsGrid.appendChild(playerSlot);
            }

            // Manage "Start Game" button visibility and state
            if (isCurrentUserHost) {
                hostActionsContainer.style.display = 'flex'; // Show container for host actions
                startGameBtn.style.display = 'block'; // Show for host
                viewKickedPlayersBtn.style.display = 'block'; // NEW: Show "View Kicked Players" button for host
                if (players.length === maxPlayers) {
                    startGameBtn.disabled = false; // Enable if full
                    startGameBtn.textContent = 'شروع بازی';
                    // Automatically update lobby status if full
                    if (lobbyData.status === "waiting") {
                        await updateDoc(lobbyRef, { status: "playing" });
                        showMessageBox("لابی پر شد! بازی آماده شروع است.", "info");
                    }
                } else {
                    startGameBtn.disabled = true; // Disable if not full
                    startGameBtn.textContent = `شروع بازی (${players.length}/${maxPlayers})`;
                }
            } else {
                hostActionsContainer.style.display = 'none'; // Hide container for non-hosts
                startGameBtn.style.display = 'none'; // Hide for non-hosts
                viewKickedPlayersBtn.style.display = 'none'; // Hide for non-hosts
            }

            // If lobby status changes to playing and current user is in this lobby
            if (lobbyData.status === "playing" && currentActiveScreen === lobbyDetailScreen && lobbyData.hostId !== auth.currentUser.uid) {
                // For non-host players, notify game is starting
                // (Future: transition to game board, but for now just a message)
                showMessageBox("بازی در این لابی شروع شد!", "info");
                // This is where you'd transition to the actual game screen
            }


        } else {
            // Lobby no longer exists (e.g., host closed it)
            console.log("لابی مورد نظر وجود ندارد. بازگشت به لیست لابی‌ها.");
            showMessageBox("لابی که در آن بودید بسته شد. ", "info");
            currentLobbyId = null;
            userHasActiveLobby = false; // User is no longer in any lobby
            setActiveScreen(lobbyScreen); // Go back to lobby list
            unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase()); // Re-initialize lobby list listener
        }
    }, (error) => {
        console.error("خطا در گوش دادن به جزئیات لابی: ", error);
        showMessageBox("خطا در بارگذاری جزئیات لابی. (" + error.message + ")", "error");
        currentLobbyId = null;
        userHasActiveLobby = false;
        setActiveScreen(lobbyScreen); // Go back to lobby list on error
        unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
    });

    return unsubscribe; // Return the unsubscribe function
}

/**
 * Removes the current user from the current lobby.
 */
async function leaveLobby() {
    if (!currentLobbyId || !auth.currentUser) {
        showMessageBox("شما در هیچ لابی فعالی نیستید.", "info");
        return;
    }

    const lobbyRef = doc(db, `global_lobbies`, currentLobbyId);
    const userId = auth.currentUser.uid;

    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            currentLobbyId = null;
            userHasActiveLobby = false;
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
            return;
        }

        const lobbyData = lobbySnap.data();
        let players = lobbyData.players || [];
        
        // If the user leaving is the host and there are other players, delete the lobby
        // Otherwise, just remove the player
        if (lobbyData.hostId === userId) {
             // Host is leaving, delete the lobby
             const confirmed = await showCustomConfirm("آیا مطمئن هستید که می‌خواهید لابی خود را ببندید؟ این عمل برای همه بازیکنان در این لابی غیرقابل بازگشت است.");
             if (confirmed) {
                 await deleteDoc(lobbyRef);
                 showMessageBox("لابی شما با موفقیت بسته شد.", "success");
                 currentLobbyId = null;
                 userHasActiveLobby = false;
                 setActiveScreen(lobbyScreen); // Go back to lobby list
                 unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase()); // Refresh list
                 if (unsubscribeLobbyDetail) { // Unsubscribe from this lobby's detail listener
                     unsubscribeLobbyDetail();
                     unsubscribeLobbyDetail = null;
                 }
                 if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list
                    unsubscribeKickedPlayers();
                    unsubscribeKickedPlayers = null;
                 }
             }
        } else {
            // Non-host player is leaving
            const updatedPlayers = players.filter(p => p.uid !== userId);
            await updateDoc(lobbyRef, { players: updatedPlayers });
            showMessageBox("شما از لابی خارج شدید.", "info");
            currentLobbyId = null;
            userHasActiveLobby = false;
            setActiveScreen(lobbyScreen); // Go back to lobby list
            unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase()); // Refresh list
            if (unsubscribeLobbyDetail) { // Unsubscribe from this lobby's detail listener
                unsubscribeLobbyDetail();
                unsubscribeLobbyDetail = null;
            }
            if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list
                unsubscribeKickedPlayers();
                unsubscribeKickedPlayers = null;
            }
        }

    } catch (e) {
        console.error("خطا در ترک لابی: ", e);
        showMessageBox(`خطا در ترک لابی: ${e.message}`, "error");
    }
}

// NEW: Function to kick a player from the lobby
async function kickPlayer(lobbyId, playerToKickUid, playerToKickDisplayName) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            return;
        }
        const lobbyData = lobbySnap.data();
        const players = lobbyData.players || [];
        const kickedPlayers = lobbyData.kickedPlayers || [];

        // Remove player from active players list
        const updatedPlayers = players.filter(p => p.uid !== playerToKickUid);
        // Add player to kickedPlayers list (ensure no duplicates)
        const isAlreadyKicked = kickedPlayers.some(p => p.uid === playerToKickUid);
        let newKickedPlayers = kickedPlayers;
        if (!isAlreadyKicked) {
            newKickedPlayers = [...kickedPlayers, { uid: playerToKickUid, displayName: playerToKickDisplayName }];
        }

        await updateDoc(lobbyRef, {
            players: updatedPlayers,
            kickedPlayers: newKickedPlayers
        });

        showMessageBox(`بازیکن "${playerToKickDisplayName}" با موفقیت اخراج شد.`, "success");
        console.log(`بازیکن ${playerToKickDisplayName} (${playerToKickUid}) از لابی ${lobbyId} اخراج شد.`);

        closeKickPlayerConfirmModal(); // Close the confirmation modal
    } catch (e) {
        console.error("خطا در اخراج بازیکن: ", e);
        showMessageBox(`خطا در اخراج بازیکن: ${e.message}`, "error");
    }
}

// NEW: Function to remove a player from the kicked players list (unkick)
async function unkickPlayer(lobbyId, playerToUnkickUid) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) {
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            return;
        }
        const lobbyData = lobbySnap.data();
        const kickedPlayers = lobbyData.kickedPlayers || [];

        // Remove player from kickedPlayers list
        const updatedKickedPlayers = kickedPlayers.filter(p => p.uid !== playerToUnkickUid);

        await updateDoc(lobbyRef, {
            kickedPlayers: updatedKickedPlayers
        });

        showMessageBox(`بازیکن با موفقیت از لیست اخراجی‌ها خارج شد و می‌تواند دوباره وارد لابی شود.`, "success");
        console.log(`بازیکن ${playerToUnkickUid} از لیست اخراجی‌های لابی ${lobbyId} خارج شد.`);
    } catch (e) {
        console.error("خطا در خارج کردن بازیکن از لیست اخراجی‌ها: ", e);
        showMessageBox(`خطا در خارج کردن بازیکن از لیست اخراجی‌ها: ${e.message}`, "error");
    }
}

// NEW: Listener for kicked players list for a specific lobby
function setupKickedPlayersListListener(lobbyId) {
    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
            const lobbyData = docSnap.data();
            const kickedPlayers = lobbyData.kickedPlayers || [];
            kickedPlayersListContent.innerHTML = ''; // Clear existing list

            if (kickedPlayers.length === 0) {
                kickedPlayersListContent.innerHTML = '<p class="text-gray-400 text-center">هیچ بازیکنی اخراج نشده است.</p>';
            } else {
                kickedPlayers.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.className = 'flex items-center justify-between bg-gray-700 p-3 rounded-lg mb-2';
                    playerDiv.innerHTML = `
                        <span>${player.displayName}</span>
                        <button data-player-uid="${player.uid}" class="unkick-player-btn classic-btn btn-green-classic text-sm py-1 px-3">
                            بازگرداندن
                        </button>
                    `;
                    kickedPlayersListContent.appendChild(playerDiv);
                });

                // Attach event listeners to new unkick buttons
                kickedPlayersListContent.querySelectorAll('.unkick-player-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const playerUid = e.target.dataset.playerUid;
                        if (playerUid && currentLobbyId) {
                            await unkickPlayer(currentLobbyId, playerUid);
                        }
                    });
                });
            }
        } else {
            kickedPlayersListContent.innerHTML = '<p class="text-gray-400 text-center">لابی یافت نشد یا بسته شده است.</p>';
            if (unsubscribeKickedPlayers) {
                unsubscribeKickedPlayers();
                unsubscribeKickedPlayers = null;
            }
        }
    }, (error) => {
        console.error("خطا در گوش دادن به لیست اخراجی‌ها:", error);
        kickedPlayersListContent.innerHTML = `<p class="text-red-400 text-center">خطا در بارگذاری لیست اخراجی‌ها. (${error.message})</p>`;
    });

    return unsubscribe;
}


// --- Event Listeners for Auth Screen Toggles ---
loginToggleBtn.addEventListener('click', () => {
    authMode = 'login';
    displayNameField.classList.add('hidden'); // Hide display name field for login
    submitAuthBtn.textContent = 'ورود'; // Set text for submit button
    submitAuthBtn.classList.remove('hidden'); // Show submit button
    loginToggleBtn.classList.add('hidden'); // Hide login toggle
    registerToggleBtn.classList.remove('hidden'); // Show register toggle
    emailInput.focus(); // Focus on email input
    showMessageBox("", "info"); // Clear any previous messages
    authForm.reset(); // Clear form fields
    console.log("حالت احراز هویت به: ورود تغییر یافت.");
});

registerToggleBtn.addEventListener('click', () => {
    authMode = 'register';
    displayNameField.classList.remove('hidden'); // Show display name field for register
    submitAuthBtn.textContent = 'ثبت نام'; // Set text for submit button
    submitAuthBtn.classList.remove('hidden'); // Show submit button
    registerToggleBtn.classList.add('hidden'); // Hide register toggle
    loginToggleBtn.classList.remove('hidden'); // Show login toggle
    emailInput.focus(); // Focus on email input
    showMessageBox("", "info"); // Clear any previous messages
    authForm.reset(); // Clear form fields
    console.log("حالت احراز هویت به: ثبت نام تغییر یافت.");
});

// --- Event Listener for Main Auth Form Submission ---
submitAuthBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log(`فرم احراز هویت در حالت ${authMode} ارسال شد.`);

    // Ensure input elements exist before accessing their value
    if (!emailInput || !passwordInput || (authMode === 'register' && !displayNameInput)) {
        showMessageBox("خطا: برخی فیلدهای ورودی یافت نشدند. لطفاً صفحه را رفرش کنید.", 'error');
        console.error("یکی از عناصر ورودی (ایمیل، رمز عبور، نام نمایشی) در DOM یافت نشد.");
        return;
    }

    const email = emailInput.value.trim();
    let password = ''; // Changed to 'let' and initialized to prevent ReferenceError
    if (passwordInput) { // Check if passwordInput element exists
        password = passwordInput.value.trim();
    }
    const displayName = displayNameInput.value.trim(); // Get display name

    if (!email || !password) {
        showMessageBox("لطفاً ایمیل و رمز عبور را وارد کنید.", 'error');
        return;
    }

    // Basic client-side validation for display name on registration
    if (authMode === 'register' && !displayName) {
        showMessageBox("لطفاً نام نمایشی خود را وارد کنید.", 'error');
        return;
    }
    if (authMode === 'register' && password.length < 6) {
        showMessageBox("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error");
        return;
    }


    if (authMode === 'login') {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessageBox(`با موفقیت وارد شدید!`, 'success');
            // onAuthStateChanged will handle screen transition
        } catch (error) {
            console.error("خطا در ورود:", error);
            showMessageBox(getFirebaseErrorMessage(error.code), 'error');
        }
    } else if (authMode === 'register') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Save user's display name to Firestore immediately after successful registration
            // Use a more general path for user profiles, not necessarily tied to appId, unless explicitly needed.
            const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`); // Use appId for private user data path
            await setDoc(userDocRef, { displayName: displayName.trim(), email: email }, { merge: true }); // Use merge:true to avoid overwriting if doc exists
            currentUserData.displayName = displayName.trim(); // Update current data immediately
            showMessageBox(`ثبت نام با موفقیت انجام شد!`, 'success');
            // onAuthStateChanged will handle screen transition and data load after this
        } catch (error) {
            console.error("خطا در ثبت نام:", error);
            showMessageBox(getFirebaseErrorMessage(error.code), 'error');
        }
    }
});

// Prevent default form submission for the main form
authForm.addEventListener('submit', (e) => e.preventDefault());


// --- Event Listeners for Main Screen UI ---
menuBtn.addEventListener('click', () => {
    openProfileModal(); // Menu button opens profile modal
    console.log("دکمه منو (سه خط) کلیک شد.");
});

profileSummary.addEventListener('click', () => {
    openProfileModal(); // Profile summary also opens profile modal
    console.log("روی خلاصه پروفایل کلیک شد.");
});

closeProfileModalBtn.addEventListener('click', closeProfileModal);

profileModal.addEventListener('click', (e) => {
    // Close modal if clicked outside content
    if (e.target === profileModal) {
        closeProfileModal();
    }
});

// Friendly Game button now navigates to the lobby screen
friendlyGameBtn.addEventListener('click', () => {
    if (!auth.currentUser) {
        showMessageBox("برای مشاهده لابی‌ها، ابتدا وارد حساب کاربری خود شوید.", "error");
        return;
    }
    setActiveScreen(lobbyScreen);
    // When navigating to lobby screen, initialize with empty search term
    unsubscribeLobbies = setupLobbyListener(''); 
    console.log("دکمه بازی دوستانه کلیک شد. رفتیم صفحه لابی‌ها.");
});

ratedGameBtn.addEventListener('click', () => {
    showMessageBox("صفحه بازی امتیازی به زودی!", "info");
    console.log("دکمه بازی امتیازی کلیک شد.");
});

// Logout button is now inside the profile modal
profileLogoutBtn.addEventListener('click', async () => {
    console.log("دکمه خروج کلیک شد.");
    try {
        await signOut(auth);
        showMessageBox("با موفقیت از حساب کاربری خود خارج شدید.", 'info');
        closeProfileModal(); // Close modal after logout
        // onAuthStateChanged will handle screen transition
    } catch (error) {
        console.error("خطا در خروج:", error);
        showMessageBox(`خطا در خروج: ${getFirebaseErrorMessage(error.code)}`, 'error');
    }
});

// --- Event Listeners for Lobby Screen UI (NEW) ---
backToMainBtn.addEventListener('click', () => {
    setActiveScreen(mainScreen);
    // If there's an active lobby listener, unsubscribe it to stop real-time updates
    if (unsubscribeLobbies) {
        unsubscribeLobbies();
        unsubscribeLobbies = null;
        console.log("Listener لابی‌ها غیرفعال شد.");
    }
    if (unsubscribeLobbyDetail) { // Also unsubscribe from lobby detail if active
        unsubscribeLobbyDetail();
        unsubscribeLobbyDetail = null;
        currentLobbyId = null;
    }
    if (unsubscribeKickedPlayers) { // NEW: Unsubscribe from kicked players list
        unsubscribeKickedPlayers();
        unsubscribeKickedPlayers = null;
    }
    userHasActiveLobby = false; // Reset overall lobby status
    console.log("دکمه بازگشت به صفحه اصلی کلیک شد.");
});

// Footer Add Icon Button opens the create lobby modal
addIconBtn.addEventListener('click', () => {
    // Ensure user is authenticated and has display name before allowing lobby creation
    if (!auth.currentUser || !currentUserData || !currentUserData.displayName) {
        showMessageBox("برای ساخت لابی، باید وارد حساب کاربری خود شوید و نام نمایشی داشته باشید.", "error");
        return;
    }
    if (userHasActiveLobby) { // Check the new flag
        showMessageBox("شما از قبل در یک لابی فعال هستید. لطفاً ابتدا از آن خارج شوید.", "info");
        return;
    }
    openCreateLobbyModal();
    console.log("آیکون 'ایجاد' در فوتر کلیک شد. مودال ساخت لابی باز شد.");
});

// Create Lobby Modal form submission
createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    const lobbyName = newLobbyNameInput.value.trim();

    if (!lobbyName) {
        showCreateLobbyMessageBox("لطفاً نام لابی را وارد کنید.", "error");
        return;
    }

    if (!auth.currentUser || !currentUserData || !currentUserData.displayName) {
        showCreateLobbyMessageBox("مشکلی در اطلاعات کاربری شما وجود دارد. لطفاً دوباره وارد شوید.", "error");
        return;
    }
    
    if (userHasActiveLobby) { // Double check here too
        showCreateLobbyMessageBox("شما از قبل در یک لابی فعال هستید. لطفاً ابتدا از آن خارج شوید.", "info");
        closeCreateLobbyModal(); // Close modal if they can't create
        return;
    }

    // AI Moderation Check for Lobby Name
    showCreateLobbyMessageBox("در حال بررسی نام لابی...", "info");
    try {
        const moderationResult = await checkLobbyNameWithAI(lobbyName);
        if (!moderationResult.is_appropriate) {
            showCreateLobbyMessageBox(`نام لابی نامناسب: ${moderationResult.reason}`, "error"); 
            return; // Stop lobby creation
        }
    } catch (aiError) {
        console.error("خطا در بررسی AI نام لابی:", aiError);
        showCreateLobbyMessageBox("خطایی در بررسی نام لابی پیش آمد. لطفاً دوباره تلاش کنید.", "error");
        return; // Stop lobby creation on AI error
    }

    try {
        const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName);
        showCreateLobbyMessageBox("لابی شما با موفقیت ساخته شد!", "success");
        newLobbyNameInput.value = ''; // Clear input
        setTimeout(() => {
            closeCreateLobbyModal();
            currentLobbyId = newLobbyId; // Set the global current lobby ID
            setActiveScreen(lobbyDetailScreen); // Transition to lobby detail screen
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId); // Start listening to this specific lobby
        }, 1500); // Close modal after a short delay
        
    } catch (error) {
        console.error("خطا در ساخت لابی از مودال:", error);
        // Use custom error message if it's the "already has lobby" error
        if (error.message.includes("شما از قبل یک لابی فعال ساخته‌اید.")) {
            showCreateLobbyMessageBox(error.message, "info"); // Use info type for user-friendly message
        } else {
            showCreateLobbyMessageBox(`خطا در ساخت لابی: ${getFirebaseErrorMessage(error.code) || error.message}`, "error");
        }
    }
});

// Close Create Lobby Modal button
closeCreateLobbyModalBtn.addEventListener('click', closeCreateLobbyModal);

// Close Create Lobby Modal if clicked outside content
createLobbyModal.addEventListener('click', (e) => {
    if (e.target === createLobbyModal) {
        closeCreateLobbyModal();
    }
});

refreshLobbiesBtn.addEventListener('click', () => {
    // Simply re-trigger the listener by unsubscribing and re-subscribing
    if (unsubscribeLobbies) {
        unsubscribeLobbies();
        unsubscribeLobbies = null;
    }
    if (auth.currentUser) { // Only refresh if a user is logged in
        // Refresh with the current search term
        unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
        showMessageBox("لیست لابی‌ها بروزرسانی شد.", "info");
        console.log("آیکون 'بروزرسانی' در فوتر کلیک شد.");
    } else {
        showMessageBox("برای بروزرسانی لابی‌ها، ابتدا وارد شوید.", "info");
    }
});

myLobbiesBtn.addEventListener('click', () => {
    showMessageBox("قابلیت 'لابی‌های من' به زودی!", "info");
    console.log("آیکون 'لابی‌های من' در فوتر کلیک شد.");
});

// Search input functionality: filter lobbies as user types
lobbySearchInput.addEventListener('input', (e) => {
    // Re-trigger the listener with the current input value for dynamic filtering
    if (unsubscribeLobbies) {
        unsubscribeLobbies(); // Unsubscribe from the previous listener
    }
    unsubscribeLobbies = setupLobbyListener(e.target.value.trim().toLowerCase());
    console.log("جستجو برای:", e.target.value.trim());
});

// Search button: explicitly trigger search
searchLobbiesBtn.addEventListener('click', () => {
    const searchTerm = lobbySearchInput.value.trim();
    if (searchTerm) {
        // Re-trigger the listener with the current input value
        if (unsubscribeLobbies) {
            unsubscribeLobbies();
        }
        unsubscribeLobbies = setupLobbyListener(searchTerm.toLowerCase());
        showMessageBox(`در حال جستجو برای "${searchTerm}"...`, "info");
    } else {
        showMessageBox("لطفاً عبارتی برای جستجو وارد کنید.", "info");
        // If search term is empty, show all lobbies
        if (unsubscribeLobbies) {
            unsubscribeLobbies();
        }
        unsubscribeLobbies = setupLobbyListener('');
    }
    console.log("دکمه جستجو کلیک شد. عبارت جستجو:", searchTerm);
});

// Allow pressing Enter in search input to trigger search
lobbySearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent default form submission
        searchLobbiesBtn.click(); // Simulate click on search button
    }
});

// Lobby Detail Screen Buttons
leaveLobbyBtn.addEventListener('click', leaveLobby);

startGameBtn.addEventListener('click', async () => {
    if (!currentLobbyId || !auth.currentUser) {
        showMessageBox("خطا: لابی‌ای برای شروع بازی وجود ندارد.", "error");
        return;
    }
    const lobbyRef = doc(db, `global_lobbies`, currentLobbyId);
    try {
        await updateDoc(lobbyRef, { status: "playing" });
        showMessageBox("بازی شروع شد!", "success");
        // Future: Transition to game board
    } catch (error) {
        console.error("خطا در شروع بازی:", error);
        showMessageBox(`خطا در شروع بازی: ${error.message}`, "error");
    }
});

// NEW: Kick Player Confirmation Modal Event Listeners
kickPlayerConfirmBtn.addEventListener('click', async () => {
    if (currentLobbyId && kickedPlayerToProcess) {
        await kickPlayer(currentLobbyId, kickedPlayerToProcess.uid, kickedPlayerToProcess.displayName);
    }
});

cancelKickPlayerBtn.addEventListener('click', closeKickPlayerConfirmModal);
closeKickPlayerConfirmModalBtn.addEventListener('click', closeKickPlayerConfirmModal);
kickPlayerConfirmModal.addEventListener('click', (e) => {
    if (e.target === kickPlayerConfirmModal) {
        closeKickPlayerConfirmModal();
    }
});

// NEW: Kicked Message Modal Event Listener
kickedMessageOkBtn.addEventListener('click', closeKickedMessageModal);

// NEW: Kicked Players List Modal Event Listeners
viewKickedPlayersBtn.addEventListener('click', openKickedPlayersListModal);
closeKickedPlayersListModalBtn.addEventListener('click', closeKickedPlayersListModal);
kickedListOkBtn.addEventListener('click', closeKickedPlayersListModal);
kickedPlayersListModal.addEventListener('click', (e) => {
    if (e.target === kickedPlayersListModal) {
        closeKickedPlayersListModal();
    }
});

// Start Firebase initialization when the window loads
window.onload = initializeFirebaseAndAuth;
