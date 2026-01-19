import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// DOM Elements
const gridContainer = document.getElementById('announcement-grid');
const youtubeContainer = document.getElementById('youtube-container');
const detailModal = document.getElementById('detail-modal');
const closeDetailBtn = document.getElementById('close-detail');
const detailBackdrop = document.getElementById('detail-backdrop');
const mobileBtn = document.getElementById('mobile-menu-toggle');
const navLinks = document.getElementById('nav-links');

// Mobile Menu Logic
if(mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Ubah icon dari bars ke xmark
        const icon = mobileBtn.querySelector('i');
        if(navLinks.classList.contains('active')){
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });

    // Tutup menu saat link diklik
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileBtn.querySelector('i').classList.remove('fa-xmark');
            mobileBtn.querySelector('i').classList.add('fa-bars');
        });
    });
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function openDetailModal(data, imagePath, dateStr) {
    document.getElementById('popup-img').src = imagePath;
    document.getElementById('popup-title').innerText = data.title;
    document.getElementById('popup-date').innerText = dateStr;
    document.getElementById('popup-desc').innerText = data.description;
    
    detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeDetail() {
    detailModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

if(closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetail);
if(detailBackdrop) detailBackdrop.addEventListener('click', closeDetail);

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && !detailModal.classList.contains('hidden')) {
        closeDetail();
    }
});

async function loadAnnouncements() {
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
            const imagePath = `asset/Content/thumbnail/${data.imageName}`;
            
            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${imagePath}" alt="${data.title}" class="card-img" onerror="this.style.display='none'">
                </div>
                <div class="card-content">
                    <span class="card-date">${dateStr}</span>
                    <h3 class="card-title">${data.title}</h3>
                    <p class="card-desc">${data.description}</p>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openDetailModal(data, imagePath, dateStr);
            });

            gridContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error:", error);
        gridContainer.innerHTML = '<p class="text-center">Gagal memuat data.</p>';
    }
}

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

window.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
    loadYoutube();
});
