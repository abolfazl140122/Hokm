// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// REVISED: Imported writeBatch for atomic updates
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDocs, orderBy, deleteField, increment, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; 

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBpVHnjF5gdTm3vJiHEoAZCowsRkTapj_4", // Replace with your Firebase project API Key
    authDomain: "hokm-d6911.firebaseapp.com",
    projectId: "hokm-d6911",
    storageBucket: "hokm-d6911.appspot.com",
    messagingSenderId: "128133280011",
    appId: "1:128133280011:web:c9fe28f5201eef7a3a320e",
    measurementId: "G-LN0S9W86MK"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables for Firebase context (as per environment instructions)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Global AI API Key for Content Moderation (FOR DEMONSTRATION ONLY - INSECURE FOR PRODUCTION)
// **WARNING**: Hardcoding API keys in client-side code is a SECURITY VULNERABILITY.
// For production, this should be moved to a secure backend (e.g., Firebase Cloud Functions).
// You can get a Gemini API key from Google AI Studio: https://makersuite.google.com/
// Ensure you enable the Gemini API in your Google Cloud Project.
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"; // <<< REPLACE THIS WITH YOUR OWN GEMINI API KEY

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
const headerUserCoins = document.getElementById('header-user-coins'); // NEW (Updated for new location)
const friendlyGameBtn = document.getElementById('friendly-game-btn');
const friendlyGameCostSpan = document.getElementById('friendly-game-cost'); // NEW
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

// Main Menu Modal Elements (Replaced Profile Modal)
const mainMenuModal = document.getElementById('main-menu-modal');
const closeMainMenuModalBtn = document.getElementById('close-main-menu-modal-btn');
const mainMenuNav = document.getElementById('main-menu-nav');
const showProfileBtn = document.getElementById('show-profile-btn');
const showThemesBtn = document.getElementById('show-themes-btn');
const mainMenuLogoutBtn = document.getElementById('main-menu-logout-btn'); // Logout button now in main menu modal

// Profile View (inside Main Menu Modal)
const profileView = document.getElementById('profile-view');
const profileDisplayName = document.getElementById('profile-display-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileCoins = document.getElementById('profile-coins');
const backToMainMenuFromProfile = document.getElementById('back-to-main-menu-from-profile');

// Themes View (inside Main Menu Modal)
const themesView = document.getElementById('themes-view');
const themeButtonsContainer = document.getElementById('theme-buttons-container');
const backToMainMenuFromThemes = document.getElementById('back-to-main-menu-from-themes');


// Create Lobby Modal Elements
const createLobbyModal = document.getElementById('create-lobby-modal');
const closeCreateLobbyModalBtn = document.getElementById('close-create-lobby-modal-btn'); 
const createLobbyForm = document.getElementById('create-lobby-form');
const submitCreateLobbyBtn = document.getElementById('submit-create-lobby-btn');
const createLobbyMessageBox = document.getElementById('create-lobby-message-box');
const lobbyTypeToggle = document.getElementById('lobby-type-toggle');
const newLobbyPasswordField = document.getElementById('new-lobby-password-field'); // Corrected ID
const newLobbyPasswordInput = document.getElementById('new-lobby-password-input');
const togglePasswordVisibilityBtn = document.getElementById('toggle-password-visibility');
const eyeIconOpen = document.getElementById('eye-icon-open');
const eyeIconClosed = document.getElementById('eye-icon-closed');
const gameDurationInput = document.getElementById('game-duration-input'); // NEW
const createLobbyModalTitle = document.getElementById('create-lobby-modal-title'); // NEW: Added ID to H2

// NEW: Lobby Name Selection/Proposal specific elements
const lobbyNameSelectionArea = document.getElementById('lobby-name-selection-area');
const approvedLobbyNamesSelect = document.getElementById('approved-lobby-names-select');
const lobbyNameProposalArea = document.getElementById('lobby-name-proposal-area');
const proposedLobbyNameInput = document.getElementById('proposed-lobby-name-input');
const submitLobbyNameForApprovalBtn = document.getElementById('submit-lobby-name-for-approval-btn');
const lobbyProposalMessage = document.getElementById('lobby-proposal-message'); // NEW for message about pending requests

// NEW: Pending Lobby Names Area (for display of names waiting for admin approval)
const pendingLobbyNamesArea = document.getElementById('pending-lobby-names-area');
const pendingLobbyNamesList = document.getElementById('pending-lobby-names-list');

// NEW: Approved Lobby Names Management Area (for deletion)
const approvedLobbyNamesManagementArea = document.getElementById('approved-lobby-names-management-area');
const approvedLobbyNamesManagementList = document.getElementById('approved-lobby-names-management-list');


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
const toggleChatLockBtn = document.getElementById('toggle-chat-lock-btn');
const viewKickedPlayersBtn = document.getElementById('view-kicked-players-btn');
const leaveLobbyBtn = document.getElementById('leave-lobby-btn'); // Host-only to close lobby outside of game
const lobbyChatMessages = document.getElementById('lobby-chat-messages');
const lobbyChatForm = document.getElementById('lobby-chat-form');
const lobbyChatInput = document.getElementById('lobby-chat-input');
const lobbyChatSendBtn = document.getElementById('lobby-chat-send-btn');

// Game specific UI elements within Lobby Detail Screen (NEW)
const gameInfoPanel = document.getElementById('game-info-panel');
const gameTimerDisplay = document.getElementById('game-timer-display');
const gameRoleDisplay = document.getElementById('game-role-display');
const myRole = document.getElementById('my-role');
const gameScoresDisplay = document.getElementById('game-scores-display');
const aiScore = document.getElementById('ai-score');
const humanScore = document.getElementById('human-score');
const leaveGameFromLobbyBtn = document.getElementById('leave-game-from-lobby-btn'); // Player-initiated leave during game
const gamePlayerStatus = document.getElementById('game-player-status');
const gameCountdownOverlay = document.getElementById('game-countdown-overlay');
const countdownNumber = gameCountdownOverlay.querySelector('.countdown-effect');
const gameVotingOverlay = document.getElementById('game-voting-overlay');
const votingTitle = document.getElementById('voting-title');
const votingInstructions = document.getElementById('voting-instructions');
const votingOptions = document.getElementById('voting-options');
const gameResultDisplay = document.getElementById('game-result-display');
const winnerText = document.getElementById('winnerText'); 
const reasonText = document.getElementById('reasonText');
const returnToLobbiesBtn = document.getElementById('return-to-lobbies-btn');


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
let unsubscribeUserProfile = null; // NEW: Listener for real-time user profile updates
let unsubscribePendingLobbyNames = null; // NEW: Listener for pending lobby names
let unsubscribeGameSettings = null; // NEW: Listener for real-time game settings
let isInitialAuthCheckComplete = false; // Flag to ensure initial loading screen transition happens only once
let userHasActiveLobby = false; // Track if the current user has an active lobby (created or joined)
let currentLobbyId = null; // Stores the ID of the lobby the current user is in
let kickedPlayerToProcess = null; // Stores UID/name of player selected for kicking
let lobbyToJoin = null; // To store data of private lobby user wants to join
let isRefreshing = false; // NEW: State for refresh button
let gameEntryCost = 100; // NEW: Default game entry cost, will be fetched from Firebase
let currentTheme = 'classic'; // NEW: To store the currently active theme

// Promise resolver for custom confirmation modal
let resolveCustomConfirm;

// Global timer variables for game
let gameCountdownInterval = null;
let gameTimerInterval = null;

// NEW: Max pending proposals limit
const MAX_PENDING_PROPOSALS = 5;

// Function to clear all game-related intervals
function clearGameIntervals() {
    if (gameCountdownInterval) {
        clearInterval(gameCountdownInterval);
        gameCountdownInterval = null;
    }
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
}

// Function to reset game UI elements
function resetGameUI() {
    gameInfoPanel.classList.add('hidden');
    gameTimerDisplay.classList.add('hidden');
    gameRoleDisplay.classList.add('hidden');
    myRole.textContent = '---'; // Reset role display
    gameScoresDisplay.classList.add('hidden');
    leaveGameFromLobbyBtn.classList.add('hidden');
    gamePlayerStatus.innerHTML = ''; // Clear player pods
    gameCountdownOverlay.classList.add('hidden');
    gameVotingOverlay.classList.add('hidden');
    gameResultDisplay.classList.add('hidden');
    votingOptions.innerHTML = '';
    votingOptions.classList.remove('hidden'); // Ensure it's not hidden for next game
    votingTitle.classList.remove('hidden'); // Ensure it's not hidden
    votingInstructions.classList.remove('hidden'); // Ensure it's not hidden
    
    lobbyChatInput.disabled = false;
    lobbyChatSendBtn.disabled = false;
    lobbyChatInput.placeholder = "پیام خود را بنویسید...";
    lobbyChatInput.value = ''; // Clear any previous input

    // Ensure all overlays are hidden (explicitly display: none for immediate effect if needed)
    gameCountdownOverlay.style.display = 'none';
    gameVotingOverlay.style.display = 'none';
}

// NEW: Theme Configurations
const themeConfigs = {
    'classic': {
        displayName: 'کلاسیک',
        bodyClass: 'theme-classic',
        buttonClass: 'btn-brown-classic'
    },
    'cyberpunk': {
        displayName: 'سایبرپانک',
        bodyClass: 'theme-cyberpunk',
        buttonClass: 'btn-purple-classic'
    },
    'forest': {
        displayName: 'جنگلی',
        bodyClass: 'theme-forest',
        buttonClass: 'btn-green-classic'
    },
    'ocean': {
        displayName: 'اقیانوس',
        bodyClass: 'theme-ocean',
        buttonClass: 'btn-blue-classic'
    },
    'minimal': {
        displayName: 'مینیمال',
        bodyClass: 'theme-minimal',
        buttonClass: 'btn-gray-classic'
    }
};

/**
 * Applies the specified theme to the body and saves it to user profile.
 * @param {string} themeName - The key of the theme to apply (e.g., 'classic', 'cyberpunk').
 */
async function applyTheme(themeName) {
    let config = themeConfigs[themeName];
    if (!config) {
        console.warn(`Theme "${themeName}" not found. Falling back to 'classic'.`);
        themeName = 'classic';
        config = themeConfigs['classic'];
    }

    // Remove all existing theme classes from the body
    Object.values(themeConfigs).forEach(conf => {
        document.body.classList.remove(conf.bodyClass);
    });

    // Add the new theme class to the body
    document.body.classList.add(config.bodyClass);
    currentTheme = themeName; // Update global state

    // Update active button visual in modal if it's open
    updateThemeButtonsActiveState();

    // Save selected theme to user's profile in Firebase
    if (auth.currentUser && currentUserData && currentUserData.theme !== themeName) {
        try {
            const userProfileRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}/profile/data`);
            await updateDoc(userProfileRef, { theme: themeName });
            console.log(`Theme "${themeName}" saved to user profile.`);
        } catch (error) {
            console.error("Error saving theme to user profile:", error);
            // This error shouldn't prevent theme application, just means it might not persist.
        }
    } else if (auth.currentUser && !currentUserData) {
        console.warn("User data not fully loaded, cannot save theme yet.");
    }
}

/**
 * Populates the theme selection buttons and sets the active state.
 */
function populateThemeButtons() {
    themeButtonsContainer.innerHTML = ''; // Clear existing buttons

    for (const themeKey in themeConfigs) {
        const theme = themeConfigs[themeKey];
        const button = document.createElement('button');
        button.className = `classic-btn ${theme.buttonClass} text-base sm:text-lg theme-button`;
        button.dataset.theme = themeKey;
        button.textContent = theme.displayName;
        button.addEventListener('click', () => applyTheme(themeKey));
        themeButtonsContainer.appendChild(button);
    }
    updateThemeButtonsActiveState();
}

/**
 * Updates the 'active-theme-btn' class on theme buttons based on currentTheme.
 */
function updateThemeButtonsActiveState() {
    document.querySelectorAll('.theme-button').forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('active-theme-btn');
        } else {
            btn.classList.remove('active-theme-btn');
        }
    });
}


// Function to open the main menu modal and show default view (Main Nav)
function openMainMenuModal() {
    mainMenuModal.classList.remove('hidden');
    void mainMenuModal.offsetWidth;
    mainMenuModal.classList.add('profile-modal-enter-active');
    
    // Show main nav and hide other views
    mainMenuNav.classList.remove('hidden');
    profileView.classList.add('hidden');
    themesView.classList.add('hidden');
}

// Function to close the main menu modal
function closeMainMenuModal() {
    mainMenuModal.classList.remove('profile-modal-enter-active');
    mainMenuModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        mainMenuModal.classList.add('hidden');
        mainMenuModal.classList.remove('profile-modal-leave-active');
    }, 300);
}

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

/**
 * Calls a simulated AI content moderation API to check if the lobby name is appropriate.
 * @param {string} lobbyName - The name of the lobby to check.
 * @returns {Promise<{is_appropriate: boolean, reason: string}>} - The moderation result.
 */
async function checkLobbyNameWithAI(lobbyName) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("Gemini API Key is not configured. Skipping lobby name moderation. Please replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key.");
        return { is_appropriate: true, reason: "API key missing. Moderation skipped." };
    }

    const prompt = `As a highly rigorous and professional content moderation AI, meticulously analyze the following lobby name for compliance with the strictest community guidelines across *all* languages. You must absolutely identify and disallow any political, racist, sexual, offensive, vulgar, violent, or otherwise inappropriate content, including but not limited to terms like "fuck", "asshole", "shit", "bitch", and their equivalents in Persian such as "کیر", "کون", "کس", "کسکش", "جنده", "حرومزاده", "بیناموس" etc., regardless of how they are spelled (e.g., phonetic or deliberate misspellings to evade detection). Your analysis should consider the context and intent where possible. Your response *must* be a JSON object: {"is_appropriate": boolean, "reason": string}. If 'is_appropriate' is false, provide a *brief, objective, and precise* reason identifying the specific type of violation (e.g., "Contains offensive language", "Political reference detected", "Violates decency standards"). If appropriate, 'reason' should be an empty string. Lobby name to analyze: "${lobbyName}"`;
    let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory, generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { "is_appropriate": { "type": "BOOLEAN" }, "reason": { "type": "STRING" } }, "propertyOrdering": ["is_appropriate", "reason"] } } };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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

// Function to check if a message is "literary/AI-like" using Gemini AI
async function checkMessageForLiteraryAIStyle(message) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("Gemini API Key is not configured. Skipping chat style moderation. Please replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key.");
        return { is_literary: true, reason: "API key missing. Moderation skipped." };
    }

    const prompt = `As a highly sophisticated and discerning AI language analyst, you are to evaluate the provided Persian text for its adherence to a "literary" or "AI-like" style. This implies:
            1.  **Formality and Politeness:** The language should be formal, respectful, and free of slang, colloquialisms, expletives, or overly casual expressions.
            2.  **Clarity and Precision:** The message should be well-structured and convey meaning clearly, avoiding ambiguity.
            3.  **Sophistication in Vocabulary/Grammar:** While not overly complex, the vocabulary should lean towards a more elevated or precise tone, and grammar should be impeccable.
            4.  **Absence of Emojis/Informal Punctuation:** No emojis, excessive exclamation marks, or textspeak.
            
            You must decide if the message *strictly* follows these guidelines. Your response *must* be a JSON object: {"is_literary": boolean, "reason": string}.
            If 'is_literary' is false, provide a *brief and objective* reason for rejection, e.g., "Contains slang," "Informal tone," "Includes emoji," "Grammar error detected." If true, 'reason' should be an empty string.

            Persian Message to analyze: "${message}"`;

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { 
        contents: chatHistory, 
        generationConfig: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: "OBJECT", 
                properties: { 
                    "is_literary": { "type": "BOOLEAN" }, 
                    "reason": { "type": "STRING" } // Corrected syntax error here
                }, 
                "propertyOrdering": ["is_literary", "reason"] 
            } 
        } 
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`; // Using 1.5-flash for speed/cost

    try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (!response.ok) { 
            const errorText = await response.text();
            console.error("AI API HTTP Error:", response.status, response.statusText, errorText);
            return { is_literary: false, reason: `خطا در ارتباط با سرور هوش مصنوعی: ${response.statusText}.` }; 
        }

        const result = await response.json();
        
        if (result && result.candidates?.[0]?.content?.parts?.[0]) {
            const jsonString = result.candidates[0].content.parts[0].text;
            try { 
                const parsedJson = JSON.parse(jsonString); 
                if (typeof parsedJson.is_literary === 'boolean' && typeof parsedJson.reason === 'string') { 
                    return parsedJson; 
                } else { 
                    console.warn("AI response has unexpected structure:", parsedJson); 
                    return { is_literary: false, reason: "پاسخ سیستم بررسی نامفهوم است." }; 
                } 
            } catch (parseError) { 
                console.error("Error parsing AI response JSON:", parseError, "Raw:", jsonString); 
                return { is_literary: false, reason: "خطا در پردازش پاسخ سیستم بررسی." }; 
            }
        } else { 
            console.warn("AI response missing content structure:", result); 
            return { is_literary: false, reason: "عدم دریافت پاسخ معتبر از سیستم بررسی." }; 
        }
    } catch (error) { 
        console.error("Error calling AI chat style API:", error); 
        return { is_literary: false, reason: `خطا در ارتباط با سیستم بررسی: ${error.message}.` }; 
    }
}

// Function to apply color to lobby names
function formatLobbyNameWithColor(name) {
    const regex = /^\[#([0-9A-Fa-f]{6})\](.*)/; // Matches [#RRGGBB] at the start
    const match = name.match(regex);
    if (match) {
        const colorCode = match[1];
        const cleanName = match[2].trim();
        return `<span style="color:#${colorCode};">${cleanName}</span>`;
    }
    return name;
}


// Function to transition between screens
function setActiveScreen(newScreen) {
    console.log(`درخواست تغییر صفحه به: ${newScreen.id}. صفحه فعلی: ${currentActiveScreen.id}`);

    if (currentActiveScreen === newScreen) return;
    
    // Cleanup old listeners and game intervals when changing screens
    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; }
    if (unsubscribeLobbyChat) { unsubscribeLobbyChat(); unsubscribeLobbyChat = null; }
    if (unsubscribePendingLobbyNames) { unsubscribePendingLobbyNames(); unsubscribePendingLobbyNames = null; }
    clearGameIntervals();
    resetGameUI();


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

        if (newScreen === authScreen) {
            initializeAuthScreen(); // Ensure auth UI is reset and focused
        }
        else if (newScreen === lobbyScreen) lobbySearchInput.focus();

        currentActiveScreen = newScreen;

    }, 600); // Matches CSS transition duration
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
        kickedPlayersListContent.innerHTML = '<p class="text-center">خطا: لابی فعال یافت نشد.</p>';
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

// NEW: Function to update coins display in header
function updateUserCoinsDisplay() {
    if (currentUserData && currentUserData.coins !== undefined) {
        headerUserCoins.textContent = currentUserData.coins.toLocaleString('fa-IR'); // Display only number now
    } else {
        headerUserCoins.textContent = `---`;
    }
}

// =========================================================================
// === START OF CORRECTED AUTH & REAL-TIME SETTINGS LOGIC =================
// =========================================================================

/**
 * NEW: Sets up a real-time listener for game settings (like entry cost).
 * This ensures any changes in Firestore are immediately reflected in the app.
 */
function setupGameSettingsListener() {
    if (unsubscribeGameSettings) unsubscribeGameSettings(); // Clean up previous listener if any

    const configRef = doc(db, `artifacts/${appId}/config/game_settings`);
    unsubscribeGameSettings = onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const newCost = docSnap.data().gameEntryCost;
            if (typeof newCost === 'number') {
                gameEntryCost = newCost;
                friendlyGameCostSpan.textContent = gameEntryCost.toLocaleString('fa-IR');
                console.log(`هزینه ورودی بازی به صورت لحظه‌ای به ${gameEntryCost} تغییر کرد.`);
            }
        } else {
            console.warn("سند تنظیمات بازی یافت نشد. از مقدار پیش‌فرض استفاده می‌شود.");
            // Fallback to default if somehow the document is deleted after app start
            gameEntryCost = 100;
            friendlyGameCostSpan.textContent = gameEntryCost.toLocaleString('fa-IR');
        }
    }, (error) => {
        console.error("خطا در گوش دادن به تنظیمات بازی:", error);
    });
}

onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "logged out");

    // Part 1: Manage User Data and Listeners
    if (user) {
        // If a user is logged in, set up listeners.
        if (unsubscribeUserProfile) unsubscribeUserProfile();
        // setupGameSettingsListener is now called once in performAsyncAppSetup(), no need to call it here.

        // Setup listener for user profile
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        unsubscribeUserProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                currentUserData = { uid: user.uid, email: user.email, ...docSnap.data() };
                headerDisplayName.textContent = currentUserData.displayName || 'کاربر ناشناس';
                headerUserId.textContent = `شناسه: ${currentUserData.uid.substring(0, 8)}...`;
                updateUserCoinsDisplay();
                
                // NEW: Apply user's saved theme
                const savedTheme = currentUserData.theme || 'classic'; // Default to 'classic'
                if (currentTheme !== savedTheme) { // Only apply if different to avoid unnecessary transitions
                    applyTheme(savedTheme);
                }

                // Also update the approved lobby names list in the modal whenever profile data changes
                if (!createLobbyModal.classList.contains('hidden')) { // Only if modal is open
                   renderApprovedLobbyNamesManagementList(); // Rerender management list
                   // Re-evaluate approved names dropdown & proposal area visibility
                   updateCreateLobbyModalUI(createLobbyModalTitle.textContent === 'مدیریت نام‌های لابی و ساخت لابی' ? 'myLobbies' : 'create'); // Use the new helper here
                }
            } else {
                console.warn("User profile document not found. Creating a default one.");
                // Create a default profile if it doesn't exist
                setDoc(userDocRef, {
                    displayName: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    coins: 500, // Starting coins
                    approvedLobbyNames: [],
                    banStatus: { isBanned: false },
                    createdAt: serverTimestamp(),
                    theme: 'classic' // NEW: Add default theme
                }, { merge: true }).then(() => {
                    console.log("Default user profile created.");
                    applyTheme('classic'); // Apply default theme
                }).catch(e => {
                    console.error("Error creating default user profile:", e);
                });
                currentUserData = { uid: user.uid, email: user.email, displayName: 'کاربر جدید', coins: 0, approvedLobbyNames: [], theme: 'classic' };
                applyTheme('classic'); // Ensure default is applied immediately
            }
        }, (error) => {
            console.error("خطا در گوش دادن به user profile:", error);
        });

    } else {
        // User is logged out. Clean up all data and listeners.
        if (unsubscribeUserProfile) unsubscribeUserProfile();
        // unsubscribeGameSettings is intentionally not cleared here, as it's a global setting.
        // ... (other listener cleanups) ...
        if (unsubscribeLobbies) unsubscribeLobbies();
        if (unsubscribeLobbyDetail) unsubscribeLobbyDetail();
        if (unsubscribeKickedPlayers) unsubscribeKickedPlayers();
        if (unsubscribeLobbyChat) unsubscribeLobbyChat();
        if (unsubscribePendingLobbyNames) unsubscribePendingLobbyNames();
        
        unsubscribeUserProfile = unsubscribeLobbies = unsubscribeLobbyDetail = unsubscribeKickedPlayers = unsubscribeLobbyChat = unsubscribePendingLobbyNames = null;
        clearGameIntervals();
        
        currentUserData = null;
        currentLobbyId = null;
        userHasActiveLobby = false;
        
        resetGameUI();
        updateUserCoinsDisplay();
        applyTheme('classic'); // Reset to classic theme on logout
    }

    // Part 2: Manage Screen Transitions (no change needed here)
    if (!isInitialAuthCheckComplete) {
        setActiveScreen(user ? mainScreen : authScreen);
        isInitialAuthCheckComplete = true;
    } else {
        if (user && currentActiveScreen === authScreen) {
            setActiveScreen(mainScreen);
        } else if (!user && currentActiveScreen !== authScreen) {
            setActiveScreen(authScreen);
        }
    }
});

async function performAsyncAppSetup() {
    console.log("Performing asynchronous app setup...");

    // Ensure game_settings config exists at startup. If not, create it.
    // The real-time listener will then pick up the value.
    try {
        const configRef = doc(db, `artifacts/${appId}/config/game_settings`);
        const configSnap = await getDoc(configRef);
        if (!configSnap.exists()) {
            console.log("`game_settings` document not found. Creating with default values...");
            await setDoc(configRef, { gameEntryCost: 100 });
            console.log("Default `game_settings` config created successfully.");
        }
    } catch (error) {
        console.error("CRITICAL: Error initializing game settings config:", error);
        // We might want a more prominent error display here if this is fatal.
        showMessageBox("خطا در بارگذاری تنظیمات بازی.", "error");
    }
    
    // NEW: Setup listener for game settings
    setupGameSettingsListener();

    // Handle initial authentication
    if (initialAuthToken) {
        try {
            await signInWithCustomToken(auth, initialAuthToken);
        } catch (error) {
            console.error("Error signing in with initial custom token:", error);
        }
    }
    console.log("Firebase initialization finished.");
}
// Call the async setup function
performAsyncAppSetup();

// --- END OF CORRECTED AUTH & REAL-TIME SETTINGS LOGIC ---

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

/**
 * Checks for lobby name proposals marked as "approved" by an admin,
 * adds them to the user's profile, and updates the proposal status to "processed".
 * This function acts as the missing link between admin approval and user data.
 * NOTE: In a production environment, this is ideally handled by a Cloud Function for reliability.
 */
async function processNewlyApprovedLobbyNames() {
    if (!auth.currentUser) return;

    const proposedLobbyNamesRef = collection(db, `artifacts/${appId}/proposedLobbyNames`);
    const qApproved = query(
        proposedLobbyNamesRef,
        where("userId", "==", auth.currentUser.uid),
        where("status", "==", "approved") // Find names marked as "approved"
    );

    try {
        const approvedSnapshot = await getDocs(qApproved);
        if (approvedSnapshot.empty) {
            // No new approvals to process
            return;
        }

        const namesToAdd = [];
        const docsToUpdate = [];
        approvedSnapshot.forEach(doc => {
            namesToAdd.push(doc.data().name);
            docsToUpdate.push(doc.ref);
        });

        // Use a batch write for atomicity: update user profile AND proposal status together
        const batch = writeBatch(db);
        
        // 1. Update the user's profile with the new names
        const userProfileRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}/profile/data`);
        batch.update(userProfileRef, {
            approvedLobbyNames: arrayUnion(...namesToAdd)
        });

        // 2. Update each proposal's status to "processed" to prevent re-processing
        docsToUpdate.forEach(docRef => {
            batch.update(docRef, { status: "processed" });
        });

        // 3. Commit all changes
        await batch.commit();
        console.log(`Processed ${namesToAdd.length} newly approved lobby names for the user.`);
        // The onSnapshot listener on the user's profile will automatically pick up this change
        // and update currentUserData, triggering UI updates.

    } catch (error) {
        console.error("Error processing newly approved lobby names:", error);
        // We can show a message, but it's a background process, so console log is sufficient
    }
}

// NEW: Function to render the list of approved lobby names for management (deletion)
function renderApprovedLobbyNamesManagementList() {
    if (!currentUserData || !currentUserData.approvedLobbyNames) {
        approvedLobbyNamesManagementList.innerHTML = '<p class="text-center">هیچ نام لابی تأیید شده‌ای ندارید.</p>';
        approvedLobbyNamesManagementArea.classList.add('hidden');
        return;
    }

    const approvedNames = currentUserData.approvedLobbyNames;
    approvedLobbyNamesManagementList.innerHTML = ''; // Clear existing list

    if (approvedNames.length === 0) {
        approvedLobbyNamesManagementList.innerHTML = '<p class="text-center">هیچ نام لابی تأیید شده‌ای ندارید.</p>';
        approvedLobbyNamesManagementArea.classList.add('hidden');
    } else {
        approvedLobbyNamesManagementArea.classList.remove('hidden');
        approvedNames.forEach(name => {
            const nameDiv = document.createElement('div');
            nameDiv.className = 'flex items-center justify-between bg-gray-700 p-2 rounded-lg mb-1';
            nameDiv.innerHTML = `
                <span>${formatLobbyNameWithColor(name)}</span>
                <button type="button" class="classic-btn btn-red-classic text-sm py-1 px-3 delete-approved-lobby-name-btn" data-name="${name}">
                    حذف
                </button>
            `;
            approvedLobbyNamesManagementList.appendChild(nameDiv);
        });

        approvedLobbyNamesManagementList.querySelectorAll('.delete-approved-lobby-name-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const nameToDelete = e.target.dataset.name;
                const confirmed = await showCustomConfirm(`آیا مطمئن هستید که می‌خواهید نام لابی "${nameToDelete}" را حذف کنید؟`, "حذف نام لابی");
                if (confirmed) {
                    await deleteApprovedLobbyName(nameToDelete);
                }
            });
        });
    }
}

// NEW: Function to delete an approved lobby name from user's profile
async function deleteApprovedLobbyName(nameToDelete) {
    if (!auth.currentUser || !currentUserData) {
        showCreateLobbyMessageBox("خطا: اطلاعات کاربری در دسترس نیست.", "error");
        return;
    }

    const userProfileRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}/profile/data`);
    try {
        await updateDoc(userProfileRef, {
            approvedLobbyNames: arrayRemove(nameToDelete)
        });
        showCreateLobbyMessageBox(`نام لابی "${nameToDelete}" با موفقیت حذف شد.`, "success");
        // The onSnapshot for user profile will re-trigger and update UI.
    } catch (error) {
        console.error("Error deleting approved lobby name:", error);
        showCreateLobbyMessageBox(`خطا در حذف نام لابی: ${error.message}`, "error");
    }
}


// NEW: Function to update the UI of the Create Lobby modal based on mode and user data
async function updateCreateLobbyModalUI(mode) {
    // Clear any previous pending names listener from a prior modal opening
    if (unsubscribePendingLobbyNames) {
        unsubscribePendingLobbyNames();
        unsubscribePendingLobbyNames = null;
    }

    if (!auth.currentUser || !currentUserData) {
        // Initial state if user data isn't loaded yet
        approvedLobbyNamesSelect.innerHTML = '<option value="">در حال بارگذاری اطلاعات...</option>';
        lobbyNameSelectionArea.classList.add('hidden');
        lobbyNameProposalArea.classList.add('hidden');
        pendingLobbyNamesArea.classList.add('hidden');
        approvedLobbyNamesManagementArea.classList.add('hidden'); // Also hide management area
        submitCreateLobbyBtn.classList.add('hidden'); // Hide create button too
        submitLobbyNameForApprovalBtn.classList.add('hidden');
        return;
    }

    const approvedNames = currentUserData.approvedLobbyNames || [];
    
    // Clear existing options for the dropdown
    approvedLobbyNamesSelect.innerHTML = '<option value="">نام لابی را انتخاب کنید</option>';
    
    // Populate dropdown if approved names exist
    if (approvedNames.length > 0) {
        approvedNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.innerHTML = formatLobbyNameWithColor(name);
            approvedLobbyNamesSelect.appendChild(option);
        });
        lobbyNameSelectionArea.classList.remove('hidden'); // Show the dropdown
        submitCreateLobbyBtn.disabled = true; // Still disabled until selection
        submitCreateLobbyBtn.classList.remove('hidden'); // Make sure create button is visible
    } else {
        lobbyNameSelectionArea.classList.add('hidden'); // Hide the dropdown if no approved names
        submitCreateLobbyBtn.disabled = true;
        submitCreateLobbyBtn.classList.add('hidden'); // Hide create button if no approved names
    }

    // Manage visibility based on mode
    if (mode === 'create') {
        createLobbyModalTitle.textContent = 'ساخت لابی جدید';
        lobbyNameProposalArea.classList.remove('hidden'); // Always show proposal area in create mode
        submitLobbyNameForApprovalBtn.classList.remove('hidden'); // Always show its button
    } else { // mode === 'myLobbies'
        createLobbyModalTitle.textContent = 'مدیریت نام‌های لابی و ساخت لابی'; // More accurate title
        lobbyNameProposalArea.classList.add('hidden'); // Hide proposal area in myLobbies mode
        submitLobbyNameForApprovalBtn.classList.add('hidden'); // Hide its button
    }

    // Render and manage approved names list for deletion (visible in both modes)
    renderApprovedLobbyNamesManagementList();

    // Set up listener for PENDING requests for the current user
    const proposedLobbyNamesRef = collection(db, `artifacts/${appId}/proposedLobbyNames`);
    const qPending = query(
        proposedLobbyNamesRef,
        where("userId", "==", auth.currentUser.uid),
        where("status", "==", "pending")
    );

    unsubscribePendingLobbyNames = onSnapshot(qPending, (snapshot) => {
        pendingLobbyNamesList.innerHTML = ''; // Clear existing list
        const pendingCount = snapshot.size;
        if (pendingCount === 0) {
            pendingLobbyNamesList.innerHTML = '<p class="text-center">هیچ نام لابی در انتظار تایید ندارید.</p>';
            pendingLobbyNamesArea.classList.add('hidden');
        } else {
            pendingLobbyNamesArea.classList.remove('hidden');
            snapshot.forEach(doc => {
                const proposal = doc.data();
                const proposalDiv = document.createElement('div');
                proposalDiv.className = 'flex items-center justify-between bg-gray-700 p-2 rounded-lg mb-1';
                proposalDiv.innerHTML = `<span>${formatLobbyNameWithColor(proposal.name)}</span><span class="text-yellow-400 text-sm">در حال تایید...</span>`;
                pendingLobbyNamesList.appendChild(proposalDiv);
            });
        }

        // Control proposal input based on pending limit (only for 'create' mode)
        if (mode === 'create') {
            if (pendingCount >= MAX_PENDING_PROPOSALS) {
                lobbyProposalMessage.textContent = `شما ${pendingCount} درخواست نام لابی در انتظار تایید دارید. تا زمانی که درخواست‌های شما بررسی نشوند، نمی‌توانید درخواست جدیدی ارسال کنید.`;
                lobbyProposalMessage.classList.remove('text-gray-400');
                lobbyProposalMessage.classList.add('text-red-400');
                submitLobbyNameForApprovalBtn.disabled = true;
                proposedLobbyNameInput.disabled = true;
                proposedLobbyNameInput.placeholder = "تعداد درخواست‌های شما به حداکثر رسیده است.";
            } else {
                lobbyProposalMessage.textContent = "بعد از ارسال، ادمین نام لابی شما را بررسی و تأیید می‌کند. سپس می‌توانید از آن نام استفاده کنید.";
                lobbyProposalMessage.classList.remove('text-red-400');
                lobbyProposalMessage.classList.add('text-gray-400');
                submitLobbyNameForApprovalBtn.disabled = false;
                proposedLobbyNameInput.disabled = false;
                proposedLobbyNameInput.placeholder = "مثال: [#FFD700]لابی طلایی من";
            }
        }
    }, (error) => {
        console.error("Error listening to pending lobby names:", error);
        pendingLobbyNamesList.innerHTML = `<p class="text-red-400 text-center">خطا در بارگذاری درخواست‌های شما.</p>`;
    });

    proposedLobbyNameInput.value = ''; // Clear proposed input field
    if (mode === 'create' && approvedNames.length === 0) {
        proposedLobbyNameInput.focus();
    } else if (approvedNames.length > 0) {
         approvedLobbyNamesSelect.focus();
    }
}


async function openCreateLobbyModal(mode = 'create') {
    if (!auth.currentUser || !currentUserData) {
        showCreateLobbyMessageBox("ابتدا وارد حساب کاربری خود شوید.", "error");
        return;
    }

    await processNewlyApprovedLobbyNames();
    
    // Check if the user is already a host of an active lobby (only relevant for 'create' mode)
    if (userHasActiveLobby && currentLobbyId && mode === 'create') {
        try {
            const activeLobbyRef = doc(db, `global_lobbies`, currentLobbyId);
            const activeLobbySnap = await getDoc(activeLobbyRef);
            if (activeLobbySnap.exists() && activeLobbySnap.data().hostId === auth.currentUser.uid && activeLobbySnap.data().status !== 'ended') {
                showCreateLobbyMessageBox("شما از قبل یک لابی فعال ساخته‌اید. برای مدیریت آن به صفحه لابی برگردید.", "info");
                closeCreateLobbyModal();
                return;
            } else if (activeLobbySnap.exists() && activeLobbySnap.data().status === 'ended' && activeLobbySnap.data().hostId === auth.currentUser.uid) {
                userHasActiveLobby = false;
                currentLobbyId = null;
            }
        } catch (error) {
            console.error("Error checking active lobby for host:", error);
        }
    }

    createLobbyModal.classList.remove('hidden');
    void createLobbyModal.offsetWidth;
    createLobbyModal.classList.add('profile-modal-enter-active');
    createLobbyMessageBox.classList.add('hidden'); 
    
    createLobbyForm.reset();
    document.querySelector('input[name="lobby-type"][value="public"]').checked = true;
    document.querySelectorAll('.lobby-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('input[value="public"]').nextElementSibling.classList.add('active');
    newLobbyPasswordField.classList.add('hidden');
    gameDurationInput.value = 5;

    // Use the new helper function to manage UI visibility
    await updateCreateLobbyModalUI(mode); 

    // Special handling for 'myLobbies' mode: show specific message if no approved lobbies to manage
    if (mode === 'myLobbies' && (!currentUserData.approvedLobbyNames || currentUserData.approvedLobbyNames.length === 0)) {
         showCreateLobbyMessageBox("شما هیچ نام لابی تایید شده‌ای برای مدیریت یا ساخت لابی ندارید.", "info");
    }
}

function closeCreateLobbyModal() {
    createLobbyModal.classList.remove('profile-modal-enter-active');
    createLobbyModal.classList.add('profile-modal-leave-active');
    setTimeout(() => {
        createLobbyModal.classList.add('hidden');
        createLobbyModal.classList.remove('profile-modal-leave-active');
        createLobbyForm.reset();

        newLobbyPasswordField.classList.add('hidden');
        document.querySelectorAll('.lobby-type-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('input[value="public"]').nextElementSibling.classList.add('active');
        gameDurationInput.value = 5; 
        lobbyProposalMessage.classList.remove('text-red-400'); 
        lobbyProposalMessage.classList.add('text-gray-400');
        
        // Ensure all related areas are hidden when closing
        lobbyNameSelectionArea.classList.add('hidden');
        lobbyNameProposalArea.classList.add('hidden');
        pendingLobbyNamesArea.classList.add('hidden');
        approvedLobbyNamesManagementArea.classList.add('hidden');
        submitCreateLobbyBtn.classList.add('hidden'); // Hide it again on close
        submitLobbyNameForApprovalBtn.classList.add('hidden'); // Hide it again on close


        if (unsubscribePendingLobbyNames) {
            unsubscribePendingLobbyNames();
            unsubscribePendingLobbyNames = null;
        }
    }, 300);
}

// --- Firebase Lobby Functions ---
async function createLobby(lobbyName, userId, displayName, lobbyType, password, gameDurationMinutes) {
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
            gameSettings: { 
                maxPlayers: 4, 
                gameDurationMinutes: gameDurationMinutes // NEW
            }
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
        userHasActiveLobby = false; // Host just closed their lobby
        if (currentLobbyId === lobbyId) currentLobbyId = null;

        clearGameIntervals();
        resetGameUI();
    } catch (e) {
        console.error("خطا در بستن لابی: ", e);
        showMessageBox(`خطا در بستن لابی: ${e.message}`, "error");
    }
}

function setupLobbyListener(searchTerm = '') {
    console.log(`شروع راه‌اندازی Listener لابی‌ها با عبارت جستجو: "${searchTerm}"`);

    if (unsubscribeLobbyDetail) { unsubscribeLobbyDetail(); unsubscribeLobbyDetail = null; }
    if (unsubscribeKickedPlayers) { unsubscribeKickedPlayers(); unsubscribeKickedPlayers = null; }
    if (unsubscribeLobbyChat) { unsubscribeLobbyChat(); unsubscribeLobbyChat = null; }
    if (unsubscribePendingLobbyNames) { unsubscribePendingLobbyNames(); unsubscribePendingLobbyNames = null; }
    clearGameIntervals();
    resetGameUI(); 

    lobbiesList.innerHTML = '<p>در حال بارگذاری لابی‌ها...</p>';
    userHasActiveLobby = false; // Reset this flag when entering lobby list view

    const allLobbiesQuery = query(
        collection(db, `global_lobbies`),
        where("status", "in", ["waiting", "playing"]) // Check all active lobbies
    );
    getDocs(allLobbiesQuery).then(allLobbiesSnapshot => {
        if (auth.currentUser) {
            let foundActiveLobby = false;
            allLobbiesSnapshot.forEach(doc => {
                const lobbyData = doc.data();
                if (lobbyData.players && lobbyData.players[auth.currentUser.uid]) {
                    foundActiveLobby = true;
                    userHasActiveLobby = true;
                    currentLobbyId = doc.id; 
                }
            });
            if (!foundActiveLobby) { // If user was in a lobby but it's now gone/ended
                userHasActiveLobby = false;
                currentLobbyId = null;
            }
        }
        console.log(`User has active lobby: ${userHasActiveLobby} (ID: ${currentLobbyId})`);
    }).catch(error => {
        console.error("Error checking user's active lobby status:", error);
    });

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const q = query(
        collection(db, `global_lobbies`), 
        where("status", "==", "waiting") 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        lobbiesList.innerHTML = '';

        let lobbiesToDisplay = [];

        snapshot.forEach((doc) => {
            const lobby = { id: doc.id, ...doc.data() };
            const playersMap = lobby.players || {};
            
            const hostDisplayName = (playersMap[lobby.hostId] || 'ناشناس').toLowerCase();
            const lobbyName = (lobby.name || '').toLowerCase();
            
            if (normalizedSearchTerm === '' || lobbyName.includes(normalizedSearchTerm) || hostDisplayName.includes(normalizedSearchTerm)) {
                lobbiesToDisplay.push(lobby);
            }
        });
        
        getDocs(query(collection(db, `global_lobbies`), where("status", "==", "playing"))).then(playingSnapshot => {
            activeGamesCount.textContent = playingSnapshot.size;
        });
        
        lobbiesToDisplay.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (lobbiesToDisplay.length === 0) {
            lobbiesList.innerHTML = '<p>لابی با این مشخصات یافت نشد.</p>';
        } else {
            lobbiesToDisplay.forEach((lobby) => {
                const playersMap = lobby.players || {};
                const playerCount = Object.keys(playersMap).length;
                const maxPlayers = lobby.gameSettings?.maxPlayers || 4;
                const hostDisplayName = playersMap[lobby.hostId] || 'ناشناس';
                const isCurrentUserHostOfThisLobby = auth.currentUser && lobby.hostId === auth.currentUser.uid;
                const isCurrentUserKicked = auth.currentUser && lobby.kickedPlayers?.some(p => p.uid === auth.currentUser.uid);
                const canJoinThisLobby = auth.currentUser && !userHasActiveLobby && playerCount < maxPlayers && !isCurrentUserKicked;

                const lockIconHtml = lobby.type === 'private' 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" class="lobby-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>` 
                    : '';
                
                const formattedLobbyName = formatLobbyNameWithColor(lobby.name);

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
                        <h3 class="text-xl font-bold">${lockIconHtml}${formattedLobbyName}</h3>
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
                    const cleanLobbyName = lobbyName.replace(/<[^>]*>/g, '');
                    const confirmed = await showCustomConfirm(`آیا مطمئن هستید که می‌خواهید لابی "${cleanLobbyName}" را ببندید؟`);
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
            userHasActiveLobby = true; // Set this to true as user is in a lobby
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
        userHasActiveLobby = true; // Set this to true as user just joined a lobby
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
    if (unsubscribePendingLobbyNames) { unsubscribePendingLobbyNames(); unsubscribePendingLobbyNames = null; }
    clearGameIntervals();
    resetGameUI();

    const lobbyRef = doc(db, `global_lobbies`, lobbyId);
    const unsubscribe = onSnapshot(lobbyRef, async (docSnap) => {
        if (!docSnap.exists()) {
            showMessageBox("لابی که در آن بودید بسته شد.", "info");
            currentLobbyId = null;
            userHasActiveLobby = false;
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
            return;
        }
        
        const lobbyData = docSnap.data();
        const isCurrentUserHost = auth.currentUser && lobbyData.hostId === auth.currentUser.uid;
        const myUid = auth.currentUser.uid;

        if (!lobbyData.players || !lobbyData.players[myUid]) {
            console.log("Current user is no longer in this lobby's player list.");
            if (lobbyData.kickedPlayers?.some(p => p.uid === myUid)) {
                showKickedMessageModal(lobbyData.name);
            } else {
                showMessageBox("شما از لابی خارج شدید.", "info");
                currentLobbyId = null;
                userHasActiveLobby = false;
                setActiveScreen(lobbyScreen);
                unsubscribeLobbies = setupLobbyListener('');
            }
            return;
        }

        if (lobbyData.status === 'playing') {
            setupGameUI(lobbyId, lobbyData);
            hostActionsContainer.style.display = 'none';
            leaveLobbyBtn.classList.add('hidden');
            return;
        } else {
            resetGameUI();
            if (isCurrentUserHost) {
                hostActionsContainer.style.display = 'flex';
                leaveLobbyBtn.classList.remove('hidden');
                leaveLobbyBtn.textContent = 'بستن لابی';
            } else {
                hostActionsContainer.style.display = 'none';
                leaveLobbyBtn.classList.add('hidden');
            }
        }

        const playersMap = lobbyData.players || {};
        const playerCount = Object.keys(playersMap).length;
        const maxPlayers = lobbyData.gameSettings?.maxPlayers || 4;
        const isChatLocked = lobbyData.isChatLocked || false;

        if (unsubscribeLobbyChat) unsubscribeLobbyChat();
        unsubscribeLobbyChat = setupLobbyChatListener(lobbyId, lobbyData.hostId);

        detailLobbyName.innerHTML = formatLobbyNameWithColor(lobbyData.name);
        detailHostName.textContent = `سازنده: ${playersMap[lobbyData.hostId] || 'ناشناس'}`;
        detailPlayerCount.textContent = `بازیکنان: ${playerCount}/${maxPlayers}`;

        playerListContainer.innerHTML = '';
        gamePlayerStatus.innerHTML = ''; 
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2 lucide lucude-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

        if (isCurrentUserHost) {
            startGameBtn.disabled = playerCount !== maxPlayers;
            startGameBtn.textContent = `شروع بازی (${playerCount}/${maxPlayers})`;
            toggleChatLockBtn.textContent = isChatLocked ? 'باز کردن چت' : 'قفل کردن چت';
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


    }, (error) => {
        console.error("Lobby detail listener error:", error);
        showMessageBox("خطا در بارگذاری جزئیات لابی.", "error");
        currentLobbyId = null;
        userHasActiveLobby = false;
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
            showMessageBox("لابی مورد نظر یافت نشد.", "error");
            currentLobbyId = null;
            userHasActiveLobby = false;
            setActiveScreen(lobbyScreen);
            unsubscribeLobbies = setupLobbyListener('');
            return;
        }
        const isHost = lobbySnap.data().hostId === userId;
        if (isHost) {
            const confirmed = await showCustomConfirm("شما سازنده لابی هستید. خروج شما باعث بسته شدن لابی برای همه می‌شود. آیا مطمئن هستید؟", "بستن لابی");
            if (confirmed) {
                await deleteDoc(lobbyRef);
            }
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
            const validKickedPlayers = kickedPlayers.filter(p => p && p.displayName && p.uid);

            if (validKickedPlayers.length === 0) {
                kickedPlayersListContent.innerHTML = '<p class="text-center">هیچ بازیکنی اخراج نشده است.</p>';
            } else {
                validKickedPlayers.forEach(player => {
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
    
    const lobbyDocRef = doc(db, `global_lobbies`, lobbyId);
    const lobbySnap = await getDoc(lobbyDocRef);
    if (lobbySnap.exists() && lobbySnap.data().status === 'playing') {
        const moderationResult = await checkMessageForLiteraryAIStyle(text);
        if (!moderationResult.is_literary) {
            showMessageBox(`پیام شما به دلیل لحن نامناسب ارسال نشد: ${moderationResult.reason}`, "error");
            return;
        }
    }

    const messagesRef = collection(db, `global_lobbies/${lobbyId}/messages`);
    try {
        await addDoc(messagesRef, {
            text: text.trim(),
            senderUid: auth.currentUser.uid,
            senderName: currentUserData.displayName,
            timestamp: serverTimestamp(),
            isDeleted: false
        });
        lobbyChatInput.value = '';
    } catch (error) {
        console.error("Error sending chat message:", error);
        showMessageBox("خطا در ارسال پیام.", "error");
    }
}

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

        lobbyChatMessages.scrollTop = lobbyChatMessages.scrollHeight;
    }, (error) => {
        console.error("Lobby chat listener error:", error);
        console.warn("Could not load chat messages:", error.message);
    });
}

// --- Game Logic Functions (NEW) ---

async function initializeGameInFirestore(lobbyId, lobbyData) {
    const playerUIDs = Object.keys(lobbyData.players);
    const playerNames = lobbyData.players;

    if (playerUIDs.length !== 4) {
        throw new Error("برای شروع بازی باید 4 بازیکن در لابی باشند.");
    }

    const currentEntryCost = gameEntryCost;

    for (const playerId of playerUIDs) {
        const playerProfileRef = doc(db, `artifacts/${appId}/users/${playerId}/profile/data`);
        const playerProfileSnap = await getDoc(playerProfileRef);
        if (!playerProfileSnap.exists() || (playerProfileSnap.data().coins || 0) < currentEntryCost) {
            throw new Error(`بازیکن ${playerNames[playerId]} سکه کافی برای شروع بازی ندارد. (نیاز: ${currentEntryCost} سکه)`);
        }
    }

    const batch = writeBatch(db);
    for (const playerId of playerUIDs) {
        const playerProfileRef = doc(db, `artifacts/${appId}/users/${playerId}/profile/data`);
        batch.update(playerProfileRef, { coins: increment(-currentEntryCost) });
    }
    await batch.commit();
    console.log(`Successfully deducted ${currentEntryCost} coins from all players.`);

    if (currentUserData && playerUIDs.includes(currentUserData.uid)) {
        currentUserData.coins -= currentEntryCost;
        updateUserCoinsDisplay();
    }

    const shuffledPlayers = [...playerUIDs].sort(() => Math.random() - 0.5);
    const roles = {};
    roles[shuffledPlayers[0]] = 'AI';
    for (let i = 1; i < shuffledPlayers.length; i++) {
        roles[shuffledPlayers[i]] = 'Human';
    }

    const gameDurationMinutes = lobbyData.gameSettings?.gameDurationMinutes || 5;
    const countdownDurationSeconds = 5;

    const initialGameState = {
        players: playerUIDs,
        playerNames: playerNames,
        roles: roles,
        status: 'countdown',
        winner: null,
        winReason: null,
        gameStartTimestamp: null,
        gameDurationSeconds: gameDurationMinutes * 60,
        countdownEndTime: Date.now() + countdownDurationSeconds * 1000 + 500,
        votes: {},
        aiScore: 0,
        humanScore: 0
    };

    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    try {
        await updateDoc(lobbyRef, {
            gameState: initialGameState,
            status: "playing"
        });
        console.log(`Game state initialized for lobby ${lobbyId}`);
    } catch (error) {
        console.error("Error initializing game state:", error);
        await updateDoc(lobbyRef, { status: "waiting" });
        throw new Error("Failed to initialize game.");
    }
}

function setupGameUI(lobbyId, lobbyData) {
    console.log(`Setting up game UI for lobby ID: ${lobbyId}`);
    clearGameIntervals();
    resetGameUI();

    const gameState = lobbyData.gameState;
    const myUid = auth.currentUser.uid;
    
    gameInfoPanel.classList.remove('hidden');
    leaveGameFromLobbyBtn.classList.remove('hidden');
    
    hostActionsContainer.style.display = 'none';
    leaveLobbyBtn.classList.add('hidden');
    
    playerListContainer.innerHTML = ''; 

    gamePlayerStatus.innerHTML = '';
    if (Array.isArray(gameState.players) && lobbyData.players) {
        gameState.players.forEach(pUid => {
            const playerPod = document.createElement('div');
            playerPod.className = `game-player-pod flex-grow`;
            const isAI = gameState.roles[pUid] === 'AI';
            playerPod.classList.add(isAI ? 'is-ai' : 'is-human');
            if (pUid === myUid) {
                myRole.textContent = isAI ? 'هوش مصنوعی' : 'انسان';
                gameRoleDisplay.classList.remove('hidden');
            }
            
            const isPlayerInLobby = lobbyData.players && lobbyData.players[pUid];
            const playerStatusText = isPlayerInLobby ? 'آنلاین' : 'ترک کرده';
            
            playerPod.innerHTML = `
                <span class="player-name">${gameState.playerNames[pUid] || 'ناشناس'}</span>
                <span class="player-role">${isAI ? 'هوش مصنوعی' : 'انسان'}</span>
                <span class="player-status">${playerStatusText}</span>
            `;
            gamePlayerStatus.appendChild(playerPod);
        });
    }


    const currentTime = Date.now();
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);

    if (gameState.status === 'countdown') {
        gameCountdownOverlay.classList.remove('hidden');
        gameVotingOverlay.classList.add('hidden');
        gameResultDisplay.classList.add('hidden');
        gameTimerDisplay.classList.add('hidden');
        gameScoresDisplay.classList.add('hidden');

        lobbyChatInput.disabled = true;
        lobbyChatSendBtn.disabled = true;
        lobbyChatInput.placeholder = "بازی در حال شروع است...";

        let countdownSecs = Math.ceil((gameState.countdownEndTime - currentTime) / 1000);
        countdownNumber.textContent = Math.max(0, countdownSecs);
        countdownNumber.style.animation = 'none';
        countdownNumber.offsetHeight;
        countdownNumber.style.animation = 'countdown-pulse 1s ease-out forwards';


        gameCountdownInterval = setInterval(async () => {
            countdownSecs--;
            countdownNumber.textContent = Math.max(0, countdownSecs);
            if (!gameCountdownOverlay.classList.contains('hidden')) {
                countdownNumber.style.animation = 'none';
                countdownNumber.offsetHeight;
                countdownNumber.style.animation = 'countdown-pulse 1s ease-out forwards';
            }

            if (countdownSecs <= 0) {
                clearInterval(gameCountdownInterval);
                gameCountdownInterval = null;
                gameCountdownOverlay.classList.add('hidden');
                if (auth.currentUser && lobbyData.hostId === auth.currentUser.uid) {
                    await updateDoc(lobbyRef, {
                        'gameState.status': 'active',
                        'gameState.gameStartTimestamp': serverTimestamp()
                    });
                }
            }
        }, 1000);

    } else if (gameState.status === 'active' && gameState.gameStartTimestamp) {
        gameCountdownOverlay.classList.add('hidden');
        gameVotingOverlay.classList.add('hidden');
        gameResultDisplay.classList.add('hidden');
        gameTimerDisplay.classList.remove('hidden');
        gameScoresDisplay.classList.remove('hidden');

        lobbyChatInput.disabled = false;
        lobbyChatSendBtn.disabled = false;
        lobbyChatInput.placeholder = "پیام خود را بنویسید...";

        if (!gameTimerInterval) {
            gameTimerInterval = setInterval(async () => {
                const startMillis = gameState.gameStartTimestamp ? gameState.gameStartTimestamp.toMillis() : Date.now();
                const elapsedMs = Date.now() - startMillis;
                const remainingMs = gameState.gameDurationSeconds * 1000 - elapsedMs;

                if (remainingMs <= 0) {
                    clearInterval(gameTimerInterval);
                    gameTimerInterval = null;
                    gameTimerDisplay.textContent = "00:00";
                    if (auth.currentUser && lobbyData.hostId === auth.currentUser.uid) {
                        await updateDoc(lobbyRef, { 'gameState.status': 'voting' });
                    }
                    return;
                }

                const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                gameTimerDisplay.textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }, 1000);
        }

    } else if (gameState.status === 'voting') {
        gameCountdownOverlay.classList.add('hidden');
        gameVotingOverlay.classList.remove('hidden');
        gameResultDisplay.classList.add('hidden');
        gameTimerDisplay.classList.add('hidden');
        
        lobbyChatInput.disabled = true;
        lobbyChatSendBtn.disabled = true;
        lobbyChatInput.placeholder = "رای‌گیری در جریان است. چت موقتاً غیرفعال شد.";

        renderVotingOptions(lobbyId, myUid, gameState, lobbyData);
        
    } else if (gameState.status === 'ended') {
        gameCountdownOverlay.classList.add('hidden');
        gameVotingOverlay.classList.remove('hidden');
        gameResultDisplay.classList.remove('hidden');
        gameTimerDisplay.classList.add('hidden');
        votingOptions.classList.add('hidden');
        votingTitle.classList.add('hidden');
        votingInstructions.classList.add('hidden');
        
        lobbyChatInput.disabled = true;
        lobbyChatSendBtn.disabled = true;
        lobbyChatInput.placeholder = "بازی به پایان رسید.";

        winnerText.textContent = gameState.winner === 'Human' ? 'تیم انسان‌ها برنده شد!' : 'هوش مصنوعی برنده شد!';
        winnerText.classList.toggle('text-green-500', gameState.winner === 'Human');
        winnerText.classList.toggle('text-red-500', gameState.winner === 'AI');
        reasonText.textContent = gameState.winReason || 'بازی به پایان رسید.';
    }

    aiScore.textContent = `AI: ${gameState.aiScore || 0}`;
    humanScore.textContent = `Human: ${gameState.humanScore || 0}`;
}

function renderVotingOptions(lobbyId, myUid, gameState, lobbyData) {
    votingOptions.innerHTML = '';
    
    const hasVoted = gameState.votes && gameState.votes[myUid];

    if (hasVoted) {
        const votedForName = gameState.playerNames[gameState.votes[myUid]] || 'ناشناس';
        votingInstructions.textContent = `شما به ${votedForName} رای داده‌اید. منتظر بقیه بازیکنان باشید.`;
        return;
    }

    const livingPlayers = gameState.players.filter(uid => lobbyData.players && lobbyData.players[uid]);
    const aiPlayers = livingPlayers.filter(uid => gameState.roles[uid] === 'AI');
    const humanPlayers = livingPlayers.filter(uid => gameState.roles[uid] === 'Human' && uid !== myUid);

    if (aiPlayers.length > 0) {
        const aiButton = document.createElement('button');
        aiButton.className = 'voting-btn ai-vote';
        aiButton.textContent = `رای به هوش مصنوعی (${gameState.playerNames[aiPlayers[0]]})`;
        aiButton.onclick = () => castVote(lobbyId, myUid, aiPlayers[0]);
        votingOptions.appendChild(aiButton);
    }

    humanPlayers.forEach(playerUid => {
        const humanButton = document.createElement('button');
        humanButton.className = 'voting-btn human-vote';
        humanButton.textContent = `رای به انسان (${gameState.playerNames[playerUid]})`;
        humanButton.onclick = () => castVote(lobbyId, myUid, playerUid);
        votingOptions.appendChild(humanButton);
    });

    votingOptions.classList.remove('hidden');
}

async function castVote(lobbyId, voterUid, votedForUid) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    try {
        // Use a transaction to ensure atomic update and read-check
        await db.runTransaction(async (transaction) => {
            const lobbyDoc = await transaction.get(lobbyRef);
            if (!lobbyDoc.exists()) {
                throw new Error("لابی یافت نشد یا بسته شده است.");
            }
            const lobbyData = lobbyDoc.data();
            const gameState = lobbyData.gameState;

            if (gameState.status !== 'voting') {
                throw new Error("رای‌گیری فعال نیست.");
            }
            if (gameState.votes && gameState.votes[voterUid]) {
                throw new Error("شما قبلاً رای داده‌اید.");
            }

            // Update the vote
            const newVotes = { ...gameState.votes, [voterUid]: votedForUid };
            transaction.update(lobbyRef, { 'gameState.votes': newVotes });

            // Check if all living human players have voted (logic only for host to resolve)
            // This check is duplicated client-side for UX, but primary resolution is server-side via host.
            const livingHumanPlayers = gameState.players.filter(uid => 
                gameState.roles[uid] === 'Human' && lobbyData.players && lobbyData.players[uid]
            );
            const totalVotesExpected = livingHumanPlayers.length; 
            const actualVotesCount = Object.keys(newVotes).length;

            if (actualVotesCount >= totalVotesExpected) {
                if (auth.currentUser && lobbyData.hostId === auth.currentUser.uid) {
                    // If current user is host and all votes are in, resolve the game
                    await resolveVotes(lobbyId, { ...gameState, votes: newVotes }, lobbyData);
                }
            }
        });
        showMessageBox(`رای شما ثبت شد.`, "success");
    } catch (error) {
        console.error("Error casting vote:", error);
        showMessageBox(`خطا در ثبت رای: ${error.message}`, "error");
    }
}

async function resolveVotes(lobbyId, gameState, lobbyData) {
    const lobbyRef = doc(db, 'global_lobbies', lobbyId);
    const votes = gameState.votes || {};
    const playerUidsInGame = gameState.players || [];
    const roles = gameState.roles || {};
    const currentLobbyPlayers = lobbyData.players || {};

    // Filter players who were in the game AND are still in the lobby
    const livingPlayersInGameAndLobby = playerUidsInGame.filter(uid => currentLobbyPlayers[uid]);
    const livingHumanPlayers = livingPlayersInGameAndLobby.filter(uid => roles[uid] === 'Human');
    const livingAIPlayers = livingPlayersInGameAndLobby.filter(uid => roles[uid] === 'AI');

    let winner = null;
    let winReason = '';

    // Edge cases for sudden player leaves during voting
    if (livingHumanPlayers.length === 0 && livingAIPlayers.length > 0) {
        winner = 'AI';
        winReason = `تمام انسان‌ها از بازی خارج شدند. هوش مصنوعی برنده است.`;
    } else if (livingAIPlayers.length === 0 && livingHumanPlayers.length > 0) {
        winner = 'Human';
        winReason = `هوش مصنوعی از بازی خارج شد. انسان‌ها برنده هستند.`;
    } else if (livingHumanPlayers.length === 0 && livingAIPlayers.length === 0) {
        winner = 'None'; // Or draw, depending on game rules
        winReason = `تمام بازیکنان از بازی خارج شدند.`;
    } else if (livingPlayersInGameAndLobby.length === 2 && livingAIPlayers.length === 1 && livingHumanPlayers.length === 1) {
        // Special case: 1 AI vs 1 Human remains after initial vote phase, AI wins (if this is Hokm-like)
        winner = 'AI';
        winReason = `فقط هوش مصنوعی و یک انسان باقی ماندند. هوش مصنوعی برنده است.`;
    } else {
        // Normal voting resolution
        if (livingAIPlayers.length > 0) {
            const aiPlayerUid = livingAIPlayers[0]; // Assuming only one AI
            const votesForAI = Object.values(votes).filter(votedUid => votedUid === aiPlayerUid).length;
            
            // Simple majority of living human players
            if (votesForAI > livingHumanPlayers.length / 2) {
                winner = 'AI';
                winReason = `بیشتر بازیکنان به هوش مصنوعی رای دادند.`;
            } else {
                winner = 'Human';
                winReason = `بازیکنان هوش مصنوعی را تشخیص ندادند. انسان‌ها برنده شدند.`;
            }
        } else {
            // No AI left, humans win by default
            winner = 'Human';
            winReason = `هوش مصنوعی از بازی خارج شد. انسان‌ها برنده شدند.`;
        }
    }
    
    await updateDoc(lobbyRef, {
        'gameState.status': 'ended',
        'gameState.winner': winner,
        'gameState.winReason': winReason
    });
}


// --- Event Listeners ---
function initializeAuthScreen() {
    authMode = 'login';
    displayNameField.classList.add('hidden');
    submitAuthBtn.textContent = 'ورود';
    loginToggleBtn.classList.add('hidden');
    registerToggleBtn.classList.remove('hidden');
    authForm.reset();
    // Ensure focus is on email input if auth screen is the active screen
    if (currentActiveScreen === authScreen) {
         emailInput.focus();
    }
}

loginToggleBtn.addEventListener('click', () => {
    authMode = 'login';
    displayNameField.classList.add('hidden');
    submitAuthBtn.textContent = 'ورود';
    loginToggleBtn.classList.add('hidden');
    registerToggleBtn.classList.remove('hidden');
    authForm.reset();
    messageBox.classList.add('hidden');
    emailInput.focus();
});

registerToggleBtn.addEventListener('click', () => {
    authMode = 'register';
    displayNameField.classList.remove('hidden');
    submitAuthBtn.textContent = 'ثبت نام';
    registerToggleBtn.classList.add('hidden');
    loginToggleBtn.classList.remove('hidden');
    authForm.reset();
    messageBox.classList.add('hidden');
    emailInput.focus();
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const displayName = displayNameInput.value.trim();

    if (!email || !password) { showMessageBox("لطفاً ایمیل و رمز عبور را وارد کنید.", 'error'); return; }
    if (authMode === 'register' && !displayName) { showMessageBox("لطفاً نام نمایشی را وارد کنید.", 'error'); return; }
    if (authMode === 'register' && password.length < 6) { showMessageBox("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error"); return; }
    
    submitAuthBtn.disabled = true;
    submitAuthBtn.textContent = 'در حال پردازش...';

    try {
        if (authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            const userDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile/data`);
            await setDoc(userDocRef, {
                displayName: displayName,
                email: userCredential.user.email,
                coins: 500, // Starting coins
                approvedLobbyNames: [],
                banStatus: { isBanned: false },
                createdAt: serverTimestamp(),
                theme: 'classic' // Set default theme on registration
            });
            console.log("User profile document created immediately after registration.");
        }
    } catch (error) { 
        showMessageBox(getFirebaseErrorMessage(error.code), 'error'); 
    } finally {
        submitAuthBtn.disabled = false;
        submitAuthBtn.textContent = authMode === 'login' ? 'ورود' : 'ثبت نام';
    }
});

// Change from openProfileModal to openMainMenuModal
menuBtn.addEventListener('click', openMainMenuModal);
profileSummary.addEventListener('click', openMainMenuModal); // Still opens main menu

// New Event Listeners for Main Menu Modal navigation
closeMainMenuModalBtn.addEventListener('click', closeMainMenuModal);
mainMenuModal.addEventListener('click', (e) => e.target === mainMenuModal && closeMainMenuModal());

showProfileBtn.addEventListener('click', () => {
    mainMenuNav.classList.add('hidden');
    profileView.classList.remove('hidden');
    themesView.classList.add('hidden'); // Ensure themes view is hidden
    if (currentUserData) { // Populate profile data when opening profile view
        profileDisplayName.textContent = currentUserData.displayName || 'ناشناس';
        profileEmail.textContent = currentUserData.email || 'ناشناس';
        profileUid.textContent = currentUserData.uid || 'ناشناس';
        profileCoins.textContent = currentUserData.coins !== undefined ? currentUserData.coins.toLocaleString('fa-IR') : '---';
    }
});

showThemesBtn.addEventListener('click', () => {
    mainMenuNav.classList.add('hidden');
    profileView.classList.add('hidden'); // Ensure profile view is hidden
    themesView.classList.remove('hidden');
    populateThemeButtons(); // Populate theme buttons when showing themes view
});

backToMainMenuFromProfile.addEventListener('click', () => {
    profileView.classList.add('hidden');
    mainMenuNav.classList.remove('hidden');
});

backToMainMenuFromThemes.addEventListener('click', () => {
    themesView.classList.add('hidden');
    mainMenuNav.classList.remove('hidden');
});

// Logout button is now within the main menu modal
mainMenuLogoutBtn.addEventListener('click', async () => {
    const confirmed = await showCustomConfirm("آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟");
    if (confirmed) {
        try { 
            await signOut(auth); 
            closeMainMenuModal(); 
            // Theme will automatically reset to classic via onAuthStateChanged
        } catch (error) { 
            showMessageBox(getFirebaseErrorMessage(error.code), 'error'); 
        }
    }
});

friendlyGameBtn.addEventListener('click', () => {
    if (!auth.currentUser) {
        showMessageBox("برای مشاهده لابی‌ها، ابتدا وارد شوید.", "error"); return;
    }
    if (!currentUserData) {
        showMessageBox("در حال بارگذاری اطلاعات کاربری، لطفاً کمی صبر کنید.", "info"); return;
    }
    if ((currentUserData.coins || 0) < gameEntryCost) {
        showMessageBox(`سکه شما برای ورود به بازی دوستانه کافی نیست. (نیاز: ${gameEntryCost} سکه، موجودی شما: ${currentUserData.coins || 0})`, "error"); return;
    }
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener('');
});

ratedGameBtn.addEventListener('click', () => showMessageBox("بازی امتیازی به زودی!", "info"));

backToMainBtn.addEventListener('click', () => {
    setActiveScreen(mainScreen);
});

addIconBtn.addEventListener('click', () => {
    if (!auth.currentUser) { showMessageBox("برای ساخت لابی، ابتدا وارد شوید.", "error"); return; }
    openCreateLobbyModal('create');
});

myLobbiesBtn.addEventListener('click', () => {
    if (!auth.currentUser) { showMessageBox("برای مشاهده لابی‌های من، ابتدا وارد شوید.", "error"); return; }
    openCreateLobbyModal('myLobbies');
});

submitLobbyNameForApprovalBtn.addEventListener('click', async () => {
    const proposedName = proposedLobbyNameInput.value.trim();
    if (!proposedName) { showCreateLobbyMessageBox("لطفاً نام لابی پیشنهادی خود را وارد کنید.", "error"); return; }
    if (!auth.currentUser || !currentUserData) { showCreateLobbyMessageBox("خطا: اطلاعات کاربری در دسترس نیست.", "error"); return; }

    const proposedLobbyNamesRef = collection(db, `artifacts/${appId}/proposedLobbyNames`);
    const qPending = query(
        proposedLobbyNamesRef,
        where("userId", "==", auth.currentUser.uid),
        where("status", "==", "pending")
    );
    const pendingSnapshot = await getDocs(qPending);
    if (pendingSnapshot.size >= MAX_PENDING_PROPOSALS) { // Use constant for limit
        showCreateLobbyMessageBox(`شما به حداکثر تعداد (${MAX_PENDING_PROPOSALS}) درخواست لابی در انتظار تایید رسیده‌اید.`, "error");
        return;
    }

    showCreateLobbyMessageBox("در حال بررسی و ارسال نام لابی برای تأیید...", "info");
    submitLobbyNameForApprovalBtn.disabled = true;
    try {
        const moderationResult = await checkLobbyNameWithAI(proposedName);
        if (!moderationResult.is_appropriate) {
            showCreateLobbyMessageBox(`نام لابی نامناسب: ${moderationResult.reason}`, "error");
            return;
        }

        await addDoc(proposedLobbyNamesRef, {
            name: proposedName,
            userId: auth.currentUser.uid,
            displayName: currentUserData.displayName,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        showCreateLobbyMessageBox("نام لابی شما با موفقیت برای تأیید ارسال شد.", "success");
        proposedLobbyNameInput.value = '';
    } catch (error) {
        console.error("خطا در ارسال نام لابی برای تأیید:", error);
        showCreateLobbyMessageBox(`خطا در ارسال نام لابی: ${error.message}`, "error");
    } finally {
        submitLobbyNameForApprovalBtn.disabled = false;
    }
});

// Listen for changes in the approved lobby names dropdown to enable/disable the "Create Lobby" button
approvedLobbyNamesSelect.addEventListener('change', () => {
    submitCreateLobbyBtn.disabled = !approvedLobbyNamesSelect.value;
});

createLobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let lobbyName;
    
    // Check if lobby name selection area is visible and a name is selected
    if (!lobbyNameSelectionArea.classList.contains('hidden') && approvedLobbyNamesSelect.value) {
        lobbyName = approvedLobbyNamesSelect.value;
    } else {
        showCreateLobbyMessageBox("لطفاً یک نام لابی تأیید شده را از لیست انتخاب کنید.", "error"); 
        return; 
    }

    const lobbyType = document.querySelector('input[name="lobby-type"]:checked').value;
    const password = newLobbyPasswordInput.value;
    const gameDuration = parseInt(gameDurationInput.value, 10);

    if (lobbyType === 'private' && password.length < 4) { showCreateLobbyMessageBox("رمز عبور برای لابی خصوصی باید حداقل ۴ کاراکتر باشد.", "error"); return; }
    if (isNaN(gameDuration) || gameDuration < 1 || gameDuration > 60) { showCreateLobbyMessageBox("مدت زمان بازی باید بین ۱ تا ۶۰ دقیقه باشد.", "error"); return; }
    if (!auth.currentUser || !currentUserData?.displayName) { showCreateLobbyMessageBox("مشکلی در اطلاعات کاربری شما وجود دارد.", "error"); return; }
    if (userHasActiveLobby) { showCreateLobbyMessageBox("شما از قبل در یک لابی فعال هستید.", "info"); closeCreateLobbyModal(); return; }
    
    submitCreateLobbyBtn.disabled = true;
    try {
        const newLobbyId = await createLobby(lobbyName, auth.currentUser.uid, currentUserData.displayName, lobbyType, password, gameDuration);
        showCreateLobbyMessageBox("لابی شما با موفقیت ساخته شد!", "success");
        
        // ===================================================================
        // === تغییر کلیدی: طبق درخواست شما، این بخش کامنت شد تا نام لابی ===
        // === بعد از استفاده از لیست نام‌های تایید شده حذف نشود.          ===
        // ===================================================================
        /*
        // Remove the used lobby name from the user's approved list
        const userDocRef = doc(db, `artifacts/${appId}/users/${auth.currentUser.uid}/profile/data`);
        await updateDoc(userDocRef, {
            approvedLobbyNames: arrayRemove(lobbyName)
        });
        */

        setTimeout(() => {
            closeCreateLobbyModal();
            currentLobbyId = newLobbyId;
            userHasActiveLobby = true;
            setActiveScreen(lobbyDetailScreen);
            unsubscribeLobbyDetail = setupLobbyDetailListener(newLobbyId);
        }, 1500);
        
    } catch (error) {
        console.error("خطا در ساخت لابی از مودال:", error);
        showCreateLobbyMessageBox(error.message.includes("شما از قبل یک لابی فعال ساخته‌اید.") ? error.message : `خطا در ساخت لابی: ${error.message}`, "error");
    } finally {
        submitCreateLobbyBtn.disabled = false;
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
    if (refreshIconSvg) {
        refreshIconSvg.classList.add('is-refreshing');
    }
    lobbiesList.innerHTML = '<p>در حال بروزرسانی لیست...</p>';
    if (unsubscribeLobbies) { unsubscribeLobbies(); unsubscribeLobbies = null; }
    unsubscribeLobbies = setupLobbyListener(lobbySearchInput.value.trim().toLowerCase());
    setTimeout(() => {
        isRefreshing = false;
        refreshLobbiesBtn.disabled = false;
        if (refreshIconSvg) {
            refreshIconSvg.classList.remove('is-refreshing');
        }
        showMessageBox("لیست لابی‌ها بروزرسانی شد.", "info");
    }, 1000);
});


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

startGameBtn.addEventListener('click', async () => {
    if (currentLobbyId && auth.currentUser) {
        try {
            const lobbyRef = doc(db, 'global_lobbies', currentLobbyId);
            const lobbySnap = await getDoc(lobbyRef);
            if (lobbySnap.exists()) {
                await initializeGameInFirestore(currentLobbyId, lobbySnap.data());
            }
        } catch (error) {
            console.error("Error starting game:", error);
            showMessageBox(`خطا در شروع بازی: ${error.message}`, "error");
        }
    }
});

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

lobbyChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentLobbyId) {
        sendLobbyMessage(currentLobbyId, lobbyChatInput.value);
    }
});

lobbyChatMessages.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.delete-message-btn');
    if (deleteButton) {
        const messageId = deleteButton.dataset.messageId;
        if (currentLobbyId && messageId) {
            deleteLobbyMessage(currentLobbyId, messageId);
        }
    }
});

leaveGameFromLobbyBtn.addEventListener('click', async () => {
    if (!currentLobbyId || !auth.currentUser) return;

    const confirmed = await showCustomConfirm("آیا مطمئن هستید که می‌خواهید بازی را ترک کنید؟ این عمل غیرقابل بازگشت است.");
    if (!confirmed) return;

    const lobbyRef = doc(db, `global_lobbies`, currentLobbyId);
    const myUid = auth.currentUser.uid;
    
    try {
        const lobbySnap = await getDoc(lobbyRef);
        if (!lobbySnap.exists()) { throw new Error("Lobby not found"); }
        
        const lobbyData = lobbySnap.data();
        // Check if current user is the host. If so, they must close the lobby, not just leave the game.
        if (lobbyData.hostId === myUid) {
            const hostConfirmedClose = await showCustomConfirm("شما سازنده لابی هستید. خروج شما باعث بسته شدن لابی برای همه می‌شود. آیا مطمئن هستید؟", "بستن لابی");
            if (hostConfirmedClose) {
                await deleteDoc(lobbyRef); // Host closes the lobby
            } else {
                // If host cancels closing, they remain in the game.
                return;
            }
        } else {
            // Non-host player: simply remove from player list
            // Use a transaction to ensure no race conditions if multiple players leave simultaneously
            await db.runTransaction(async (transaction) => {
                const currentLobbyDoc = await transaction.get(lobbyRef);
                if (!currentLobbyDoc.exists()) {
                    throw new Error("Lobby not found or already closed.");
                }
                const currentLobbyData = currentLobbyDoc.data();
                const currentPlayers = { ...currentLobbyData.players };
                delete currentPlayers[myUid];

                transaction.update(lobbyRef, { players: currentPlayers });

                // Host (if still in game) will resolve game state based on remaining players
                // The onSnapshot listener will update UI for everyone
            });
        }
        
        showMessageBox("شما از بازی خارج شدید.", "info");
    } catch (error) {
        console.error("Error leaving game:", error);
        showMessageBox("خطا در خروج از بازی: " + error.message, "error");
    } finally {
        // Regardless of outcome, transition user away from the game.
        // This will be handled by the onSnapshot listener for lobbyDetailScreen
        // if the lobby is deleted or player removed.
        // If the transaction fails, the user remains in the lobby's state.
    }
});


returnToLobbiesBtn.addEventListener('click', () => {
    currentLobbyId = null;
    userHasActiveLobby = false;
    setActiveScreen(lobbyScreen);
    unsubscribeLobbies = setupLobbyListener('');
});
