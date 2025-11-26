import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, update, remove, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// --- GLOBAL VARIABLES (Provided by Canvas) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let firebaseConfig = {};
try {
    firebaseConfig = JSON.parse(__firebase_config);
} catch (e) {
    console.error("Failed to parse firebase config:", e);
    // Fallback config (if needed)
    firebaseConfig = {
        apiKey: "dummy-key", authDomain: "dummy.firebaseapp.com", projectId: "dummy"
    };
}
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// State management
let currentUserId = null;
let currentUserRole = null;
let isAuthReady = false;
let allUsersData = {}; // Cache for user list
const ROOT_ADMIN_EMAIL = "admin@tachibana.com"; // Changed from atlantis.com
const ROLES = ['root', 'owner', 'co-owner', 'leader-music', 'leader-voiceact', 'leader-art', 'member-music', 'member-voiceact', 'member-art'];
const DIVISIONS = {
    'music': 'Music',
    'voiceact': 'Voice Act',
    'art': 'Art'
};

// --- DOM ELEMENTS ---
const appInterface = document.getElementById('app-interface');
const authPage = document.getElementById('auth-page');
const loadingScreen = document.getElementById('loading-screen');
const loginFormCard = document.getElementById('login-form-card');
const authErrorMessage = document.getElementById('auth-error-message');
const loginButton = document.getElementById('login-button');
const anonymousLoginButton = document.getElementById('anonymous-login-button');
const registerButton = document.getElementById('register-button'); // New
const toggleRegisterButton = document.getElementById('toggle-register-button'); // New
const loginForm = document.getElementById('login-form'); // New
const registerForm = document.getElementById('register-form'); // New

// --- INITIAL UI SETUP ---
const showAuthPage = () => {
    loadingScreen.classList.add('opacity-0');
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        authPage.classList.remove('hidden');
        // Trigger transition for login card
        setTimeout(() => {
            loginFormCard.classList.remove('scale-95', 'opacity-0');
        }, 100); 
    }, 500);
};

const showAppInterface = () => {
    authPage.classList.add('hidden');
    appInterface.classList.remove('hidden');
    // Hide loading screen after all content is loaded
    loadingScreen.classList.add('hidden'); 
};


// --- UTILITY FUNCTIONS ---

/** Shows the custom modal. */
const showModal = (title, body, onConfirm, showCancel = true, confirmText = 'OK') => {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');

    modalTitle.textContent = title;
    modalBody.innerHTML = body;

    btnConfirm.textContent = confirmText;
    btnCancel.style.display = showCancel ? 'inline-block' : 'none';

    btnConfirm.onclick = null;
    btnCancel.onclick = null;

    btnConfirm.onclick = () => {
        onConfirm();
        hideModal();
    };

    btnCancel.onclick = () => {
        hideModal();
    };

    // Open modal with transition
    modal.classList.add('open');
    modal.classList.remove('opacity-0', 'pointer-events-none');
};

/** Hides the custom modal. */
const hideModal = () => {
    const modal = document.getElementById('custom-modal');
    modal.classList.remove('open');
    modal.classList.add('opacity-0', 'pointer-events-none');
};

// --- AUTHENTICATION HANDLER ---

/** Displays auth error message */
const displayAuthError = (message) => {
    authErrorMessage.textContent = message;
    authErrorMessage.classList.remove('hidden');
};

/**
 * Signs in the user using the custom token or anonymously.
 */
const handleAnonAuth = async () => {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Signed in with custom token.");
        } else {
            await signInAnonymously(auth);
            console.log("Signed in anonymously (no token provided).");
        }
    } catch (error) {
        console.error("Authentication failed:", error.message);
        displayAuthError("Gagal otentikasi. Silakan coba lagi.");
        showAuthPage();
    }
};

const handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        displayAuthError("Email dan password harus diisi.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        let message = "Login gagal. Cek email/password Anda.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message = "Email atau password salah.";
        }
        displayAuthError(message);
        console.error("Login failed:", error.message);
    }
};

// New Registration Handler
const handleRegistration = async () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const division = document.getElementById('register-division').value;
    const role = `member-${division}`;

    if (!email || !password) {
        showModal('Error Pendaftaran', 'Email dan password harus diisi.', () => {}, false);
        return;
    }

    if (password.length < 6) {
        showModal('Error Pendaftaran', 'Password minimal harus 6 karakter.', () => {}, false);
        return;
    }

    try {
        // 1. Create user with Email/Password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        // 2. Set default role in RTDB for new user
        const userRoleRef = ref(db, `artifacts/${appId}/users/${newUserId}/config/role`);
        await set(userRoleRef, role);

        // 3. Set profile data in RTDB
        const userDataRef = ref(db, `artifacts/${appId}/users/${newUserId}/profile`);
        await set(userDataRef, { email: email, createdAt: serverTimestamp() });

        // Auto-login or show success message
        showModal('Registrasi Sukses!', `Akun ${email} berhasil didaftarkan sebagai **${role.toUpperCase()}**. Silakan login.`, () => {
            // Clear registration form and switch to login
            document.getElementById('register-email').value = '';
            document.getElementById('register-password').value = '';
            toggleRegistrationForm();
        }, false);

    } catch (e) {
        console.error("Error registering user: ", e);
        let message = "Gagal mendaftarkan pengguna.";
        if (e.code === 'auth/email-already-in-use') {
            message = "Email sudah terdaftar. Silakan login atau gunakan email lain.";
        } else if (e.code === 'auth/weak-password') {
             message = "Password terlalu lemah (minimal 6 karakter).";
        }
        showModal('Error Pendaftaran', message, () => {}, false);
    }
};

// New function to toggle registration form
const toggleRegistrationForm = () => {
    if (registerForm.classList.contains('hidden')) {
        // Show Register
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        toggleRegisterButton.textContent = 'Sudah Punya Akun? Login Tim &rarr;';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        authErrorMessage.classList.add('hidden');
    } else {
        // Show Login
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        toggleRegisterButton.textContent = 'Belum Punya Akun? Daftar Tim &rarr;';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        authErrorMessage.classList.add('hidden');
    }
};


onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        authErrorMessage.classList.add('hidden');
        
        // --- RTDB: Check and set up user role ---
        const userRoleRef = ref(db, `artifacts/${appId}/users/${currentUserId}/config/role`);
        
        // Set root role for the specific admin email if it's the first login
        if (user.email === ROOT_ADMIN_EMAIL) {
            await set(userRoleRef, 'root').catch(e => console.error("Error setting root role:", e));
        }

        onValue(userRoleRef, async (snapshot) => {
            if (snapshot.exists()) {
                currentUserRole = snapshot.val();
            } else if (!user.isAnonymous) {
                // Default role for new *non-anonymous* users: Member Divisi Music
                currentUserRole = 'member-music';
                // Only set if this isn't the root admin (which is handled above)
                if (user.email !== ROOT_ADMIN_EMAIL) {
                    await set(userRoleRef, currentUserRole);
                }
            } else {
                // Default role for anonymous users
                currentUserRole = 'member-music';
            }

            // Update UI elements with user info
            document.getElementById('current-user-id').textContent = currentUserId;
            document.getElementById('current-user-role').textContent = currentUserRole.toUpperCase();

            // Show admin navigation item if role is high-level
            const usersNavItem = document.getElementById('nav-item-users');
            if (canManageUsers()) {
                usersNavItem?.classList.remove('hidden');
            } else {
                usersNavItem?.classList.add('hidden');
            }

            showAppInterface();

            // Initialize all listeners and load dashboard only once
            if (!isAuthReady) {
                isAuthReady = true;
                loadPage('dashboard');
                setupNavListeners();
                setupFirebaseListeners();
            }
        }, {
            onlyOnce: false // Keep listening for role changes
        });
        
    } else {
        // Logged out or initial state
        currentUserId = null;
        currentUserRole = null;
        isAuthReady = false;
        showAuthPage();
    }
});

// --- AUTH LISTENERS SETUP (For the login page) ---
loginButton.addEventListener('click', handleLogin);
document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});
anonymousLoginButton.addEventListener('click', handleAnonAuth);
// New registration listeners
toggleRegisterButton.addEventListener('click', toggleRegistrationForm);
registerButton.addEventListener('click', handleRegistration);
document.getElementById('register-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegistration();
});


// --- PAGE RENDERING & NAVIGATION ---

const pageContent = document.getElementById('page-content');

// --- TEMPLATES ---
const dashboardTemplate = () => `
    <h2 class="text-3xl font-extrabold mb-8 text-text-light border-b border-caramel-accent pb-2">Dashboard Kontrol Event Tachibana</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card p-6 rounded-xl shadow-lg border-t-4 border-caramel-accent">
            <div class="flex items-center space-x-4">
                <i data-lucide="shield-check" class="w-8 h-8 text-caramel-accent"></i>
                <div>
                    <p class="text-sm font-medium text-text-dark opacity-70">PERAN AKTIF</p>
                    <p class="text-2xl font-black text-text-dark">${currentUserRole.toUpperCase()}</p>
                </div>
            </div>
            <p class="mt-4 text-xs text-mocha-highlight">Selamat datang, ${currentUserId.substring(0, 8)}...</p>
        </div>

        <div class="card p-6 rounded-xl shadow-lg border-t-4 border-mocha-highlight">
            <p class="text-lg font-semibold text-text-dark mb-3">Progress Event Aktif</p>
            <div id="event-progress-summary" class="space-y-4">
                <p class="text-sm text-text-dark">Memuat data...</p>
            </div>
        </div>

        <div class="card p-6 rounded-xl shadow-lg border-t-4 border-red-500">
            <p class="text-lg font-semibold text-text-dark mb-3">Pesan Tim Terbaru</p>
            <div id="latest-chat-summary" class="space-y-2 h-20 overflow-hidden">
                <p class="text-sm text-text-dark">Memuat pesan...</p>
            </div>
            <a href="#" data-page="chat" class="text-sm text-caramel-accent hover:underline mt-4 block nav-item font-medium">Lihat semua Chat &rarr;</a>
        </div>
    </div>
`;

const chatTemplate = () => `
    <h2 class="text-3xl font-extrabold mb-6 text-text-light border-b border-caramel-accent pb-2">Chat Tim Real-time Tachibana</h2>
    <div class="chat-container h-[75vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin space-y-4 bg-latte-light">
            <p class="text-center text-mocha-highlight">Memuat pesan...</p>
        </div>
        <div class="p-4 border-t border-mocha-highlight flex space-x-3 bg-gray-100">
            <input type="text" id="chat-input" placeholder="Ketik pesan Anda di sini..." class="flex-1 p-3 rounded-lg bg-white text-text-dark border border-mocha-highlight focus:border-caramel-accent" autofocus>
            <button id="chat-send-button" class="caramel-button px-6 py-3 rounded-lg font-semibold shadow-md">Kirim</button>
        </div>
    </div>
`;

const eventsTemplate = () => `
    <h2 class="text-3xl font-extrabold mb-8 text-text-light border-b border-caramel-accent pb-2">Event dan Manajemen Tugas Tachibana</h2>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        <div class="lg:col-span-1 card p-6 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold mb-4 text-text-dark">Tugas Event (<span id="selected-event-title" class="text-caramel-accent">Pilih Event</span>)</h3>
            <select id="event-selector" class="w-full p-3 rounded-lg bg-gray-200 text-text-dark mb-4 border border-mocha-highlight focus:border-caramel-accent">
                <option value="">Pilih Event...</option>
            </select>
            ${canManageEvents() ? `<button id="add-task-button" class="caramel-button px-4 py-2 rounded-lg text-sm mb-4 w-full font-medium" disabled><i data-lucide="plus" class="w-4 h-4 inline-block mr-1"></i> Tambah Tugas Baru</button>` : ''}
            <div id="event-tasks-list" class="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
                <p class="text-mocha-highlight text-sm">Pilih event untuk melihat tugas.</p>
            </div>
        </div>
        
        <div class="lg:col-span-2 card p-6 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold mb-4 text-text-dark">Daftar Semua Event Aktif</h3>
            ${canManageEvents() ? `<button id="add-event-button" class="caramel-button px-4 py-2 rounded-lg text-sm mb-4 font-medium"><i data-lucide="plus" class="w-4 h-4 inline-block mr-1"></i> Tambah Event Baru</button>` : ''}
            <div id="event-list" class="space-y-4">
                <p class="text-text-dark">Memuat daftar event...</p>
            </div>
        </div>
    </div>
`;

const financeTemplate = () => `
    <h2 class="text-3xl font-extrabold mb-8 text-text-light border-b border-caramel-accent pb-2">Keuangan, Sponsor, & Vendor Tachibana</h2>
    
    <div class="card p-6 rounded-xl shadow-lg mb-6">
        <h3 class="text-2xl font-bold mb-4 text-text-dark flex justify-between items-center">
            Total Kas Event 
            <span id="finance-total" class="text-2xl font-extrabold text-green-600">Rp 0</span>
        </h3>
        ${canManageFinance() ? `<button id="add-finance-button" class="caramel-button px-4 py-2 rounded-lg text-sm mb-4 font-medium"><i data-lucide="plus" class="w-4 h-4 inline-block mr-1"></i> Tambah Transaksi</button>` : ''}
        
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-mocha-highlight">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Tipe</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Deskripsi</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Jumlah (Rp)</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Tanggal</th>
                        ${canManageFinance() ? `<th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Aksi</th>` : ''}
                    </tr>
                </thead>
                <tbody id="finance-list" class="divide-y divide-mocha-highlight">
                    <tr><td colspan="5" class="text-center py-6 text-mocha-highlight">Memuat data keuangan...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold mb-4 text-text-dark">Daftar Sponsor</h3>
            ${canManageFinance() ? `<button id="add-sponsor-button" class="caramel-button px-4 py-2 rounded-lg text-sm mb-4 font-medium"><i data-lucide="plus" class="w-4 h-4 inline-block mr-1"></i> Tambah Sponsor</button>` : ''}
            <div id="sponsor-list" class="space-y-3">
                <p class="text-mocha-highlight text-sm">Memuat daftar sponsor...</p>
            </div>
        </div>

        <div class="card p-6 rounded-xl shadow-lg">
            <h3 class="text-2xl font-bold mb-4 text-text-dark">Daftar Vendor</h3>
            ${canManageFinance() ? `<button id="add-vendor-button" class="caramel-button px-4 py-2 rounded-lg text-sm mb-4 font-medium"><i data-lucide="plus" class="w-4 h-4 inline-block mr-1"></i> Tambah Vendor</button>` : ''}
            <div id="vendor-list" class="space-y-3">
                <p class="text-mocha-highlight text-sm">Memuat daftar vendor...</p>
            </div>
        </div>
    </div>
`;

const usersTemplate = () => `
    <h2 class="text-3xl font-extrabold mb-8 text-text-light border-b border-caramel-accent pb-2">Manajemen Pengguna Tachibana (Admin)</h2>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="card p-6 rounded-xl shadow-lg lg:col-span-1 border-t-4 border-caramel-accent">
            <h3 class="text-xl font-bold mb-4 text-text-dark">Tambah Pengguna Baru (Email)</h3>
            <input type="email" id="new-user-email" placeholder="Email Pengguna" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
            <input type="password" id="new-user-password" placeholder="Password Awal" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
            <select id="new-user-role" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-4 border border-mocha-highlight focus:border-caramel-accent">
                ${ROLES.filter(r => r !== 'root').map(role => `<option value="${role}">${role.toUpperCase()}</option>`).join('')}
            </select>
            <button id="add-user-button" class="caramel-button w-full px-4 py-2 rounded-lg font-semibold">Daftarkan Pengguna</button>
        </div>

        <div class="card p-6 rounded-xl shadow-lg lg:col-span-2 border-t-4 border-mocha-highlight">
            <h3 class="text-xl font-bold mb-4 text-text-dark">Daftar Pengguna Aktif</h3>
            <div class="overflow-x-auto max-h-[70vh] scrollbar-thin">
                <table class="min-w-full divide-y divide-mocha-highlight">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">ID Pengguna</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Email</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Peran</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="user-list-body" class="divide-y divide-mocha-highlight">
                        <tr><td colspan="4" class="text-center py-6 text-mocha-highlight">Memuat daftar pengguna...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
`;


/**
 * Loads the content for the selected page.
 */
const loadPage = (pageName) => {
    
    // Remove active state from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-caramel-accent', 'text-white', 'font-bold');
        item.classList.add('text-latte-light');
    });

    // Set active state for the current page
    const activeNavItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('bg-caramel-accent', 'text-white', 'font-bold');
        activeNavItem.classList.remove('text-latte-light');
    }

    // Render the page content
    switch (pageName) {
        case 'dashboard':
            pageContent.innerHTML = dashboardTemplate();
            lucide.createIcons();
            break;
        case 'chat':
            pageContent.innerHTML = chatTemplate();
            lucide.createIcons();
            setupChatListeners();
            break;
        case 'events':
            pageContent.innerHTML = eventsTemplate();
            lucide.createIcons();
            setupEventListeners();
            break;
        case 'finance':
            pageContent.innerHTML = financeTemplate();
            lucide.createIcons();
            setupFinanceListeners();
            break;
        case 'users':
            if (!canManageUsers()) {
                pageContent.innerHTML = '<h1>Akses Ditolak</h1><p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>';
            } else {
                pageContent.innerHTML = usersTemplate();
                lucide.createIcons();
                setupUsersListeners();
            }
            break;
        default:
            pageContent.innerHTML = '<h1>Halaman Tidak Ditemukan</h1>';
    }
};

const setupNavListeners = () => {
    // Navigation links
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            loadPage(page);
            // Hide sidebar on mobile after clicking
            document.getElementById('sidebar').classList.add('-translate-x-full');
        });
    });

    // Mobile menu toggle
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('-translate-x-full');
    });

    // Logout button
    document.getElementById('logout-button').addEventListener('click', () => {
        showModal('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari aplikasi?', () => {
            signOut(auth).then(() => {
                // The onAuthStateChanged listener handles the UI change
                // window.location.reload(); // Not needed if onAuthStateChanged is robust
            }).catch((error) => {
                console.error("Logout Error:", error);
                showModal('Error', 'Gagal keluar. Silakan coba lagi.', () => {}, false);
            });
        }, true, 'Ya, Keluar');
    });
};

// --- ROLE CHECKERS ---
const isRoot = () => currentUserRole === 'root';
const canManageUsers = () => isRoot();
const canManageEvents = () => {
    return currentUserRole && (currentUserRole.startsWith('leader-') || ['root', 'owner', 'co-owner'].includes(currentUserRole));
};
const canManageFinance = () => {
    return currentUserRole && (['root', 'owner', 'co-owner'].includes(currentUserRole));
};
const getDivisionFromRole = () => {
    if (currentUserRole && currentUserRole.includes('-')) {
        return currentUserRole.split('-')[1];
    }
    return null; // For high-level roles
};

// --- FIREBASE FEATURE IMPLEMENTATIONS ---

// 1. CHAT FEATURE
const setupChatListeners = () => {
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');

    if (chatInput && chatSendButton) {
        chatSendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
};

const sendMessage = async () => {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();

    if (!message || !currentUserId) return;

    const chatRef = push(ref(db, `artifacts/${appId}/public/data/chat`));
    const senderRole = currentUserRole.toUpperCase();

    try {
        await set(chatRef, {
            userId: currentUserId,
            role: senderRole,
            text: message,
            timestamp: serverTimestamp()
        });
        chatInput.value = ''; // Clear input
    } catch (e) {
        console.error("Error sending message: ", e);
        showModal('Error Chat', 'Gagal mengirim pesan.', () => {}, false);
    }
};

const renderChatMessages = (messages) => {
    const chatMessagesDiv = document.getElementById('chat-messages');
    if (!chatMessagesDiv) return;

    chatMessagesDiv.innerHTML = messages.map(msg => {
        const isMine = msg.userId === currentUserId;
        const alignment = isMine ? 'justify-end' : 'justify-start';
        const bubbleColor = isMine ? 'bg-caramel-accent text-white' : 'bg-mocha-highlight text-text-light';
        const roleColor = msg.role.startsWith('LEADER') || ['ROOT', 'OWNER', 'CO-OWNER'].includes(msg.role) ? 'text-caramel-accent font-bold' : 'text-text-dark opacity-80';
        const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...';
        const senderInfo = isMine ? 'Anda' : msg.role;

        return `
            <div class="flex ${alignment}">
                <div class="max-w-xs md:max-w-md">
                    <p class="text-xs ${roleColor} mb-1">${senderInfo}</p>
                    <div class="${bubbleColor} p-3 rounded-xl shadow-md">
                        <p class="text-sm break-words">${msg.text}</p>
                    </div>
                    <p class="text-xs text-mocha-highlight mt-1 text-right">${time}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
};

const updateLatestChatSummary = (messages) => {
    const latestChatSummary = document.getElementById('latest-chat-summary');
    if (!latestChatSummary) return;

    if (messages.length === 0) {
        latestChatSummary.innerHTML = '<p class="text-sm text-text-dark">Belum ada pesan.</p>';
        return;
    }

    latestChatSummary.innerHTML = messages.slice(-3).reverse().map(msg => {
        const role = msg.role;
        const text = msg.text.length > 30 ? msg.text.substring(0, 30) + '...' : msg.text;
        return `
            <div class="text-sm">
                <span class="font-semibold text-caramel-accent">${role}:</span>
                <span class="text-text-dark">${text}</span>
            </div>
        `;
    }).join('');
}

// 2. EVENT & TASK FEATURE

let selectedEventId = null;

const setupEventListeners = () => {
    if (canManageEvents()) {
        document.getElementById('add-event-button')?.addEventListener('click', promptAddEvent);
        document.getElementById('add-task-button')?.addEventListener('click', promptAddTask);
    }
    document.getElementById('event-selector')?.addEventListener('change', (e) => {
        selectedEventId = e.target.value;
        document.getElementById('selected-event-title').textContent = selectedEventId ? (document.querySelector(`#event-selector option[value="${selectedEventId}"]`).textContent) : 'Pilih Event';
        document.getElementById('add-task-button')?.toggleAttribute('disabled', !selectedEventId);
        // Rerender tasks will be handled by the listener
    });
};

const promptAddEvent = () => {
    showModal('Tambah Event Baru', `
        <input type="text" id="modal-event-name" placeholder="Nama Event (Contoh: Live Concert Akhir Tahun)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <p class="text-sm text-text-dark mt-2">ID Event akan dibuat otomatis.</p>
    `, () => {
        const name = document.getElementById('modal-event-name').value.trim();
        if (name) addEvent(name);
    }, true, 'Tambah');
};

const addEvent = async (name) => {
    const eventsRef = push(ref(db, `artifacts/${appId}/public/data/events`));
    try {
        await set(eventsRef, {
            name: name,
            createdAt: serverTimestamp(),
            progress: 0,
            tasks: [], 
        });
    } catch (e) {
        console.error("Error adding event: ", e);
        showModal('Error Event', 'Gagal menambahkan event.', () => {}, false);
    }
};

const promptAddTask = () => {
    if (!selectedEventId) return;

    showModal('Tambah Tugas Baru', `
        <input type="text" id="modal-task-name" placeholder="Nama Tugas (Contoh: Hubungi Vendor Sound System)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <select id="modal-task-division" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
            ${Object.keys(DIVISIONS).map(key => `<option value="${key}">${DIVISIONS[key]}</option>`).join('')}
        </select>
        <input type="text" id="modal-task-staff" placeholder="ID Staff Penanggung Jawab (Opsional)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
    `, () => {
        const name = document.getElementById('modal-task-name').value.trim();
        const division = document.getElementById('modal-task-division').value;
        const staffId = document.getElementById('modal-task-staff').value.trim() || 'N/A';

        if (name && division) addTask(selectedEventId, name, division, staffId);
    }, true, 'Tambah');
};

const addTask = async (eventId, name, division, staffId) => {
    const eventRef = ref(db, `artifacts/${appId}/public/data/events/${eventId}`);
    onValue(eventRef, async (snapshot) => {
        const eventData = snapshot.val();
        let tasks = eventData.tasks || [];

        // Check if data is already handled by a previous listener run
        if (tasks.some(t => t.name === name && t.division === division)) return;

        const newTask = {
            id: crypto.randomUUID(),
            name: name,
            division: division,
            staffId: staffId,
            completed: false,
        };

        tasks.push(newTask);
        await updateTasksAndProgress(eventId, tasks);
    }, { onlyOnce: true });
};


const updateTasksAndProgress = async (eventId, tasks) => {
    const eventRef = ref(db, `artifacts/${appId}/public/data/events/${eventId}`);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    try {
        await update(eventRef, {
            tasks: tasks,
            progress: newProgress
        });
    } catch (e) {
        console.error("Error updating tasks/progress: ", e);
        showModal('Error Tugas', 'Gagal memperbarui progres tugas.', () => {}, false);
    }
};

const toggleTaskCompletion = async (eventId, taskId, completed) => {
    const eventRef = ref(db, `artifacts/${appId}/public/data/events/${eventId}`);
    onValue(eventRef, async (snapshot) => {
        const eventData = snapshot.val();
        if (!eventData) return;
        let tasks = eventData.tasks || [];
        
        const updatedTasks = tasks.map(t => 
            t.id === taskId ? { ...t, completed: completed } : t
        );
        
        await updateTasksAndProgress(eventId, updatedTasks);
    }, { onlyOnce: true });
};


const renderEventList = (events) => {
    const eventListDiv = document.getElementById('event-list');
    const eventSelector = document.getElementById('event-selector');
    if (!eventListDiv || !eventSelector) return;

    eventSelector.innerHTML = '<option value="">Pilih Event...</option>';
    eventListDiv.innerHTML = '';

    Object.keys(events).forEach(eventId => {
        const event = events[eventId];
        // Populate the selector
        const option = document.createElement('option');
        option.value = eventId;
        option.textContent = event.name;
        eventSelector.appendChild(option);

        // Render the list item
        eventListDiv.innerHTML += `
            <div class="p-4 rounded-xl bg-gray-100 shadow flex items-center justify-between border-l-4 border-caramel-accent">
                <div>
                    <p class="font-semibold text-text-dark">${event.name}</p>
                    <div class="w-full h-2 progress-bar-bg rounded-full mt-2">
                        <div class="progress-bar-fill h-2 rounded-full" style="width: ${event.progress}%;"></div>
                    </div>
                    <p class="text-xs text-mocha-highlight mt-1">${event.progress}% Selesai</p>
                </div>
                ${canManageEvents() ? `<i data-lucide="trash" class="w-5 h-5 text-red-500 cursor-pointer delete-event" data-id="${eventId}"></i>` : ''}
            </div>
        `;
    });

    if (selectedEventId) {
        eventSelector.value = selectedEventId;
        document.getElementById('selected-event-title').textContent = document.querySelector(`#event-selector option[value="${selectedEventId}"]`)?.textContent || 'Pilih Event';
        document.getElementById('add-task-button')?.toggleAttribute('disabled', !selectedEventId);
    }
    
    lucide.createIcons();
    document.querySelectorAll('.delete-event').forEach(btn => btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.getAttribute('data-id');
        showModal('Hapus Event', 'Apakah Anda yakin ingin menghapus event ini? Semua tugas akan hilang.', () => deleteEvent(eventId), true, 'Ya, Hapus');
    }));
};

const renderTasks = (events) => {
    const eventTasksList = document.getElementById('event-tasks-list');
    if (!eventTasksList || !selectedEventId) return;

    const selectedEvent = events[selectedEventId];
    if (!selectedEvent) return;

    const tasks = selectedEvent.tasks || [];
    eventTasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        eventTasksList.innerHTML = '<p class="text-mocha-highlight text-sm">Belum ada tugas untuk event ini.</p>';
        return;
    }

    const division = getDivisionFromRole();
    const isAdmin = ['root', 'owner', 'co-owner'].includes(currentUserRole);

    tasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1); // Uncompleted first

    tasks.forEach(task => {
        const isMyDivision = division && task.division === division;
        const canToggle = isAdmin || isMyDivision || task.staffId === currentUserId;

        eventTasksList.innerHTML += `
            <div class="flex items-center p-3 rounded-lg ${task.completed ? 'bg-green-100' : 'bg-gray-200'} border border-mocha-highlight">
                <input type="checkbox" id="task-${task.id}" data-event-id="${selectedEventId}" data-task-id="${task.id}" ${task.completed ? 'checked' : ''} ${!canToggle ? 'disabled' : ''} class="task-checkbox form-checkbox h-5 w-5 text-caramel-accent border-mocha-highlight rounded cursor-pointer">
                <label for="task-${task.id}" class="ml-3 flex-1 text-sm ${task.completed ? 'line-through text-mocha-highlight' : 'text-text-dark'}">
                    ${task.name}
                </label>
                <span class="text-xs font-medium px-2 py-1 rounded-full ${task.division === 'music' ? 'bg-purple-600 text-white' : task.division === 'voiceact' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}">
                    ${DIVISIONS[task.division]}
                </span>
                <i data-lucide="user" class="w-4 h-4 ml-2 text-mocha-highlight" title="Staff ID: ${task.staffId || 'N/A'}"></i>
                ${canManageEvents() ? `<i data-lucide="trash" class="w-4 h-4 text-red-500 ml-3 cursor-pointer delete-task" data-event-id="${selectedEventId}" data-task-id="${task.id}"></i>` : ''}
            </div>
        `;
    });
    
    lucide.createIcons();

    document.querySelectorAll('.task-checkbox').forEach(input => {
        input.addEventListener('change', (e) => {
            const eventId = e.currentTarget.getAttribute('data-event-id');
            const taskId = e.currentTarget.getAttribute('data-task-id');
            toggleTaskCompletion(eventId, taskId, e.currentTarget.checked);
        });
    });

    document.querySelectorAll('.delete-task').forEach(btn => btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.getAttribute('data-event-id');
        const taskId = e.currentTarget.getAttribute('data-task-id');
        showModal('Hapus Tugas', 'Apakah Anda yakin ingin menghapus tugas ini?', () => deleteTask(eventId, taskId), true, 'Ya, Hapus');
    }));
};

const deleteTask = async (eventId, taskId) => {
    const eventRef = ref(db, `artifacts/${appId}/public/data/events/${eventId}`);
    onValue(eventRef, async (snapshot) => {
        const eventData = snapshot.val();
        if (!eventData) return;
        let tasks = eventData.tasks || [];
        
        const updatedTasks = tasks.filter(t => t.id !== taskId);
        await updateTasksAndProgress(eventId, updatedTasks);
    }, { onlyOnce: true });
};


const updateEventProgressSummary = (events) => {
    const summaryDiv = document.getElementById('event-progress-summary');
    if (!summaryDiv) return;

    const eventArray = Object.keys(events).map(key => events[key]).filter(e => e.progress < 100).slice(0, 2);

    if (eventArray.length === 0) {
        summaryDiv.innerHTML = '<p class="text-sm text-text-dark">Belum ada event yang terdaftar.</p>';
        return;
    }

    summaryDiv.innerHTML = eventArray.map(event => `
        <div class="mb-4">
            <p class="text-sm font-medium text-text-dark">${event.name}</p>
            <div class="w-full h-3 progress-bar-bg rounded-full mt-1">
                <div class="progress-bar-fill h-3 rounded-full" style="width: ${event.progress}%;"></div>
            </div>
            <p class="text-xs text-mocha-highlight mt-1">${event.progress}%</p>
        </div>
    `).join('');
};

const deleteEvent = async (eventId) => {
    try {
        await remove(ref(db, `artifacts/${appId}/public/data/events/${eventId}`));
    } catch (e) {
        console.error("Error deleting event: ", e);
        showModal('Error Hapus Event', 'Gagal menghapus event.', () => {}, false);
    }
}


// 3. FINANCE, SPONSOR & VENDOR

const setupFinanceListeners = () => {
    if (canManageFinance()) {
        document.getElementById('add-finance-button')?.addEventListener('click', promptAddFinance);
        document.getElementById('add-sponsor-button')?.addEventListener('click', promptAddSponsor);
        document.getElementById('add-vendor-button')?.addEventListener('click', promptAddVendor);
    }
};

const promptAddFinance = () => {
     showModal('Tambah Transaksi', `
        <select id="modal-finance-type" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
            <option value="pemasukan">Pemasukan (Uang Masuk)</option>
            <option value="pengeluaran">Pengeluaran (Uang Keluar)</option>
        </select>
        <input type="text" id="modal-finance-desc" placeholder="Deskripsi (Contoh: Dana Sponsor A)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <input type="number" id="modal-finance-amount" placeholder="Jumlah (Contoh: 5000000)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
    `, () => {
        const type = document.getElementById('modal-finance-type').value;
        const desc = document.getElementById('modal-finance-desc').value.trim();
        const amount = parseFloat(document.getElementById('modal-finance-amount').value);
        if (desc && !isNaN(amount) && amount > 0) addFinance(type, desc, amount);
    }, true, 'Tambah');
};

const addFinance = async (type, description, amount) => {
    const financeRef = push(ref(db, `artifacts/${appId}/public/data/finance`));
    const value = type === 'pengeluaran' ? -amount : amount;
    try {
        await set(financeRef, {
            type: type,
            description: description,
            amount: value,
            timestamp: serverTimestamp(),
            recordedBy: currentUserId
        });
    } catch (e) {
        console.error("Error adding finance: ", e);
        showModal('Error Keuangan', 'Gagal menambahkan transaksi.', () => {}, false);
    }
};

const renderFinance = (transactions) => {
    const financeList = document.getElementById('finance-list');
    const financeTotal = document.getElementById('finance-total');
    if (!financeList || !financeTotal) return;

    let total = 0;
    financeList.innerHTML = '';

    const transactionArray = Object.keys(transactions).map(key => ({ id: key, ...transactions[key] })).sort((a, b) => b.timestamp - a.timestamp);

    if (transactionArray.length === 0) {
        financeList.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-mocha-highlight">Belum ada transaksi.</td></tr>';
        financeTotal.textContent = 'Rp 0';
        return;
    }

    transactionArray.forEach(t => {
        total += t.amount;
        const sign = t.amount < 0 ? '-' : '+';
        const color = t.amount < 0 ? 'text-red-500' : 'text-green-600';
        const typeText = t.amount < 0 ? 'Pengeluaran' : 'Pemasukan';
        const date = t.timestamp ? new Date(t.timestamp).toLocaleDateString('id-ID') : '...';

        financeList.innerHTML += `
            <tr class="hover:bg-gray-100 transition duration-150">
                <td class="px-4 py-3 whitespace-nowrap text-sm ${color}">${typeText}</td>
                <td class="px-4 py-3 whitespace-normal text-sm text-text-dark">${t.description}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold ${color}">${sign} ${Math.abs(t.amount).toLocaleString('id-ID')}</td>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-mocha-highlight">${date}</td>
                ${canManageFinance() ? `<td class="px-4 py-3 whitespace-nowrap"><i data-lucide="trash" class="w-4 h-4 text-red-500 cursor-pointer delete-finance" data-id="${t.id}"></i></td>` : ''}
            </tr>
        `;
    });

    financeTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    financeTotal.classList.remove('text-green-600', 'text-red-500');
    financeTotal.classList.add(total >= 0 ? 'text-green-600' : 'text-red-500');
    
    lucide.createIcons();
    document.querySelectorAll('.delete-finance').forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        showModal('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini?', () => deleteTransaction('finance', id), true, 'Ya, Hapus');
    }));
};

const promptAddSponsor = () => {
     showModal('Tambah Sponsor Baru', `
        <input type="text" id="modal-sponsor-name" placeholder="Nama Sponsor" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <input type="text" id="modal-sponsor-contact" placeholder="Kontak / PIC" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <input type="text" id="modal-sponsor-level" placeholder="Level Dukungan (Contoh: Platinum)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
    `, () => {
        const name = document.getElementById('modal-sponsor-name').value.trim();
        const contact = document.getElementById('modal-sponsor-contact').value.trim();
        const level = document.getElementById('modal-sponsor-level').value.trim();
        if (name) addPartner('sponsors', name, contact, level);
    }, true, 'Tambah');
};

const promptAddVendor = () => {
     showModal('Tambah Vendor Baru', `
        <input type="text" id="modal-vendor-name" placeholder="Nama Vendor (Contoh: XYZ Sound System)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <input type="text" id="modal-vendor-contact" placeholder="Kontak / PIC" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
        <input type="text" id="modal-vendor-service" placeholder="Layanan (Contoh: Sewa Alat Musik)" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
    `, () => {
        const name = document.getElementById('modal-vendor-name').value.trim();
        const contact = document.getElementById('modal-vendor-contact').value.trim();
        const service = document.getElementById('modal-vendor-service').value.trim();
        if (name) addPartner('vendors', name, contact, service);
    }, true, 'Tambah');
};

const addPartner = async (type, name, contact, details) => {
    const partnerRef = push(ref(db, `artifacts/${appId}/public/data/${type}`));
    try {
        await set(partnerRef, {
            name: name,
            contact: contact,
            details: details,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.error(`Error adding ${type}: `, e);
        showModal('Error Data', `Gagal menambahkan ${type}.`, () => {}, false);
    }
};

const renderPartners = (type, partners) => {
    const listDiv = document.getElementById(`${type}-list`);
    if (!listDiv) return;

    listDiv.innerHTML = '';
    const partnerArray = Object.keys(partners).map(key => ({ id: key, ...partners[key] }));

    if (partnerArray.length === 0) {
        listDiv.innerHTML = `<p class="text-mocha-highlight text-sm">Belum ada daftar ${type}.</p>`;
        return;
    }

    partnerArray.forEach(p => {
        listDiv.innerHTML += `
            <div class="p-3 rounded-lg bg-gray-200 shadow flex items-start justify-between border border-mocha-highlight">
                <div>
                    <p class="font-semibold text-text-dark">${p.name}</p>
                    <p class="text-sm text-mocha-highlight">Kontak: ${p.contact || 'N/A'}</p>
                    <p class="text-xs ${type === 'sponsors' ? 'text-green-600' : 'text-caramel-accent'}">${p.details}</p>
                </div>
                ${canManageFinance() ? `<i data-lucide="trash" class="w-4 h-4 text-red-500 cursor-pointer delete-partner" data-type="${type}" data-id="${p.id}"></i>` : ''}
            </div>
        `;
    });
    
    lucide.createIcons();
    document.querySelectorAll('.delete-partner').forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const type = e.currentTarget.getAttribute('data-type');
        showModal(`Hapus ${type.charAt(0).toUpperCase() + type.slice(1, -1)}`, `Apakah Anda yakin ingin menghapus ${type.slice(0, -1)} ini?`, () => deleteTransaction(type, id), true, 'Ya, Hapus');
    }));
};

const deleteTransaction = async (collectionName, id) => {
    try {
        await remove(ref(db, `artifacts/${appId}/public/data/${collectionName}/${id}`));
    } catch (e) {
        console.error(`Error deleting from ${collectionName}: `, e);
        showModal('Error Hapus', 'Gagal menghapus data.', () => {}, false);
    }
};

// 4. USERS MANAGEMENT (ROOT ONLY)
const setupUsersListeners = () => {
    document.getElementById('add-user-button')?.addEventListener('click', registerNewUser);
};

const registerNewUser = async () => {
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (!email || !password || !role) {
        showModal('Error Input', 'Semua kolom (Email, Password, Peran) harus diisi.', () => {}, false);
        return;
    }

    if (!email.includes('@')) {
        showModal('Error Input', 'Format email tidak valid.', () => {}, false);
        return;
    }

    try {
        // 1. Create user with Email/Password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        // 2. Set role in RTDB
        const userRoleRef = ref(db, `artifacts/${appId}/users/${newUserId}/config/role`);
        await set(userRoleRef, role);

        // 3. Set display data in RTDB (optional, for listing)
        const userDataRef = ref(db, `artifacts/${appId}/users/${newUserId}/profile`);
        await set(userDataRef, { email: email, createdAt: serverTimestamp() });

        showModal('Sukses!', `Pengguna ${email} berhasil didaftarkan dengan peran ${role.toUpperCase()}.`, () => {
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-password').value = '';
        }, false);

    } catch (e) {
        console.error("Error registering user: ", e);
        let message = "Gagal mendaftarkan pengguna.";
        if (e.code === 'auth/email-already-in-use') {
            message = "Email sudah terdaftar. Gunakan email lain.";
        } else if (e.code === 'auth/weak-password') {
             message = "Password terlalu lemah (minimal 6 karakter).";
        }
        showModal('Error Pendaftaran', message, () => {}, false);
    }
};

const renderUserList = (users) => {
    const userListBody = document.getElementById('user-list-body');
    if (!userListBody) return;

    userListBody.innerHTML = '';
    allUsersData = users; // Cache all user data

    const userArray = Object.keys(users).map(uid => ({
        uid: uid,
        email: users[uid].profile?.email || (users[uid].config?.role === 'root' ? ROOT_ADMIN_EMAIL : 'N/A'),
        role: users[uid].config?.role || 'N/A'
    })).sort((a, b) => {
        // Sort: Root first, then Owner, then by role, then by ID
        if (a.role === 'root') return -1;
        if (b.role === 'root') return 1;
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return a.role.localeCompare(b.role);
    });
    
    userArray.forEach(user => {
        const isSelf = user.uid === currentUserId;
        const canEdit = !isSelf && user.role !== 'root'; // Cannot edit self or root
        
        userListBody.innerHTML += `
            <tr class="${isSelf ? 'bg-caramel-accent bg-opacity-20' : 'hover:bg-gray-100 transition duration-150'}">
                <td class="px-4 py-3 whitespace-nowrap text-xs font-mono text-text-dark">${user.uid.substring(0, 10)}...${isSelf ? ' (Anda)' : ''}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-text-dark">${user.email}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-caramel-accent">${user.role.toUpperCase()}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                    ${canEdit ? `
                        <button class="text-blue-500 hover:text-blue-700 text-sm font-medium mr-3 edit-role-button" data-uid="${user.uid}" data-current-role="${user.role}">Ubah Peran</button>
                    ` : `<span class="text-mocha-highlight text-sm">N/A</span>`}
                </td>
            </tr>
        `;
    });
    
    document.querySelectorAll('.edit-role-button').forEach(btn => btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-uid');
        const currentRole = e.currentTarget.getAttribute('data-current-role');
        promptChangeRole(uid, currentRole);
    }));
};

const promptChangeRole = (uid, currentRole) => {
    const roleOptions = ROLES.filter(r => r !== 'root').map(role => 
        `<option value="${role}" ${role === currentRole ? 'selected' : ''}>${role.toUpperCase()}</option>`
    ).join('');

    showModal('Ubah Peran Pengguna', `
        <p class="text-sm text-text-dark mb-3">ID: <strong>${uid.substring(0, 15)}...</strong></p>
        <select id="modal-new-role" class="p-3 w-full rounded-lg bg-gray-200 text-text-dark mb-3 border border-mocha-highlight focus:border-caramel-accent">
            ${roleOptions}
        </select>
    `, () => {
        const newRole = document.getElementById('modal-new-role').value;
        if (newRole && newRole !== currentRole) setCustomRole(uid, newRole);
    }, true, 'Terapkan');
};

const setCustomRole = async (targetUserId, targetRole) => {
    const userRoleRef = ref(db, `artifacts/${appId}/users/${targetUserId}/config/role`);
    
    try {
        await set(userRoleRef, targetRole);
        showModal('Sukses!', `Peran pengguna ${targetUserId.substring(0, 10)}... telah diatur menjadi ${targetRole.toUpperCase()}.`, () => {}, false);
    } catch (e) {
        console.error("Error setting role: ", e);
        showModal('Error Peran', 'Gagal mengatur peran pengguna.', () => {}, false);
    }
};

// --- FIREBASE LISTENERS SETUP (Real-time updates) ---
const setupFirebaseListeners = () => {
    if (!isAuthReady || !currentUserId) return;

    // Chat Listener (Same as original)
    onValue(ref(db, `artifacts/${appId}/public/data/chat`), (snapshot) => {
        const data = snapshot.val();
        const messages = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => a.timestamp - b.timestamp) : [];
        
        if (document.getElementById('chat-messages')) {
            renderChatMessages(messages);
        }
        updateLatestChatSummary(messages);
    });

    // Event Listener (Same as original)
    onValue(ref(db, `artifacts/${appId}/public/data/events`), (snapshot) => {
        const events = snapshot.val() || {};

        if (document.getElementById('event-list')) {
            renderEventList(events);
        }

        if (document.getElementById('event-tasks-list')) {
            renderTasks(events);
        }

        updateEventProgressSummary(events);
    });

    // Finance Listener (Same as original)
    onValue(ref(db, `artifacts/${appId}/public/data/finance`), (snapshot) => {
        const transactions = snapshot.val() || {};
        if (document.getElementById('finance-list')) {
            renderFinance(transactions);
        }
    });

    // Sponsor Listener (Same as original)
    onValue(ref(db, `artifacts/${appId}/public/data/sponsors`), (snapshot) => {
        const partners = snapshot.val() || {};
        if (document.getElementById('sponsor-list')) {
            renderPartners('sponsors', partners);
        }
    });

    // Vendor Listener (Same as original)
    onValue(ref(db, `artifacts/${appId}/public/data/vendors`), (snapshot) => {
        const partners = snapshot.val() || {};
        if (document.getElementById('vendor-list')) {
            renderPartners('vendors', partners);
        }
    });

    // *NEW* Users Listener (Admin only)
    if (canManageUsers()) {
        onValue(ref(db, `artifacts/${appId}/users`), (snapshot) => {
            const users = snapshot.val() || {};
            if (document.getElementById('user-list-body')) {
                renderUserList(users);
            }
        });
    }
};
