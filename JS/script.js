// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// --- CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyCBkaF_sZMtq9ZqccMpFjVzyLmUb3CM_28",
    authDomain: "tachibanaweb-ccdea.firebaseapp.com",
    projectId: "tachibanaweb-ccdea",
    storageBucket: "tachibanaweb-ccdea.firebasestorage.app",
    messagingSenderId: "506360800082",
    appId: "1:506360800082:web:347a8d42dc3a3bd0f3108b",
    measurementId: "G-858EX7ME1L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- DOM ELEMENTS ---
const gridContainer = document.getElementById('announcement-grid');
const youtubeContainer = document.getElementById('youtube-container');
const adminModal = document.getElementById('admin-panel');

// --- HELPER: FORMAT DATE ---
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- MAIN FUNCTIONS ---

// 1. Load Announcements with Animation
async function loadAnnouncements() {
    gridContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Memuat kabar terbaru...</p>
        </div>
    `;
    
    try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        gridContainer.innerHTML = ''; 

        if(querySnapshot.empty){
            gridContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Belum ada pengumuman saat ini.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const dateStr = formatDate(data.createdAt);
            
            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${data.imageUrl}" alt="${data.title}" class="card-img">
                </div>
                <div class="card-content">
                    <span class="card-date">${dateStr}</span>
                    <h3 class="card-title">${data.title}</h3>
                    <p class="card-desc">${data.description}</p>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error:", error);
        gridContainer.innerHTML = '<p class="text-center">Gagal memuat data. Periksa koneksi.</p>';
    }
}

// 2. Load YouTube
async function loadYoutube() {
    try {
        const querySnapshot = await getDocs(collection(db, "youtube"));
        let videoUrl = "";
        
        querySnapshot.forEach((doc) => {
            if (doc.id === 'main' || !videoUrl) videoUrl = doc.data().videoUrl;
        });

        if (videoUrl) {
            const videoId = getYoutubeID(videoUrl);
            if(videoId) {
                youtubeContainer.innerHTML = `
                    <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
                    title="YouTube video player" allowfullscreen></iframe>
                `;
            }
        } else {
            youtubeContainer.innerHTML = '<div class="loading-state light"><p>Video belum tersedia.</p></div>';
        }
    } catch (error) {
        youtubeContainer.innerHTML = '<p>Gagal memuat video.</p>';
    }
}

function getYoutubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- ADMIN UI LOGIC ---

// File Input Visual Feedback
const fileInput = document.getElementById('news-image');
const fileLabel = document.getElementById('file-label');

fileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        fileLabel.innerHTML = `<i class="fa-solid fa-check"></i> ${this.files[0].name}`;
        fileLabel.style.color = 'var(--coffee-dark)';
    }
});

// Modal Logic
document.getElementById('admin-toggle-btn').addEventListener('click', () => {
    adminModal.classList.remove('hidden');
});

document.getElementById('close-admin').addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

// Close modal on outside click
adminModal.addEventListener('click', (e) => {
    if (e.target === document.querySelector('.modal-backdrop')) {
        adminModal.classList.add('hidden');
    }
});

// Login
document.getElementById('login-btn').addEventListener('click', () => {
    const pass = document.getElementById('admin-pass').value;
    if (pass === "admin123") {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
    } else {
        alert("Akses Ditolak: Password salah.");
    }
});

// Upload Logic
document.getElementById('upload-news-btn').addEventListener('click', async () => {
    const title = document.getElementById('news-title').value;
    const desc = document.getElementById('news-desc').value;
    const file = document.getElementById('news-image').files[0];
    const btn = document.getElementById('upload-news-btn');

    if (!title || !desc || !file) {
        alert("Mohon lengkapi semua data dan gambar.");
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = "Mengunggah...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        const storageRef = ref(storage, 'announcements/' + Date.now() + '-' + file.name);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, "announcements"), {
            title: title,
            description: desc,
            imageUrl: imageUrl,
            createdAt: new Date()
        });

        alert("Berhasil! Pengumuman telah diterbitkan.");
        // Reset
        document.getElementById('news-title').value = '';
        document.getElementById('news-desc').value = '';
        fileInput.value = '';
        fileLabel.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Pilih Gambar Banner';
        loadAnnouncements();

    } catch (error) {
        console.error(error);
        alert("Gagal upload: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
});

document.getElementById('update-yt-btn').addEventListener('click', async () => {
    const link = document.getElementById('youtube-link').value;
    if (!link) return;

    const btn = document.getElementById('update-yt-btn');
    btn.innerText = "Updating...";
    
    try {
        await setDoc(doc(db, "youtube", "main"), { videoUrl: link });
        alert("Video Showcase diperbarui!");
        loadYoutube();
    } catch (error) {
        alert("Gagal update.");
    } finally {
        btn.innerText = "Update Showcase";
    }
});

// Init
window.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
    loadYoutube();
});