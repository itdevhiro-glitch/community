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

const gridContainer = document.getElementById('announcement-grid');
const youtubeContainer = document.getElementById('youtube-container');

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

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
