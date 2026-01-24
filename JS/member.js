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

const mobileBtn = document.getElementById('mobile-menu-toggle');
const navLinks = document.getElementById('nav-links');

if(mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileBtn.querySelector('i');
        if(navLinks.classList.contains('active')){
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }
    });
}

async function renderMembers() {
    const container = document.getElementById('member-container');
    const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
    
    try {
        const snap = await getDocs(q);
        container.innerHTML = '';
        
        if(snap.empty) {
            container.innerHTML = '<p class="text-center" style="grid-column:1/-1">Belum ada member terdaftar.</p>';
            return;
        }

        snap.forEach(doc => {
            const d = doc.data();
            const imgPath = `asset/member/${d.imageName}`;
            
            let socialHtml = '';
            if(d.social.instagram) socialHtml += `<a href="${d.social.instagram}" target="_blank" class="social-link" title="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
            if(d.social.reality) socialHtml += `<a href="${d.social.reality}" target="_blank" class="social-link" title="Reality"><i class="fa-solid fa-r"></i></a>`;
            if(d.social.discord) socialHtml += `<div class="social-link discord-trigger" data-id="${d.social.discord}" title="Discord"><i class="fa-brands fa-discord"></i></div>`;

            const card = document.createElement('div');
            card.className = 'member-card fade-in';
            card.innerHTML = `
                <div class="mem-img-box">
                    <img src="${imgPath}" alt="${d.username}" onerror="this.src='asset/Content/thumbnail/default.jpg'">
                </div>
                <h3 class="mem-name">${d.username}</h3>
                <div class="mem-role">${d.division}</div>
                <div class="mem-gen">${d.gen}</div>
                <p class="mem-quote">"${d.motto}"</p>
                <div class="mem-social">
                    ${socialHtml}
                </div>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.discord-trigger').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                alert(`Discord Username: ${id}`);
                navigator.clipboard.writeText(id).then(() => alert('Copied to clipboard!'));
            });
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<p>Gagal memuat data.</p>';
    }
}

renderMembers();