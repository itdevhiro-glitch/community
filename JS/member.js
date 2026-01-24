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
    const wrapper = document.getElementById('main-member-wrapper');
    const q = query(collection(db, "members"), orderBy("createdAt", "asc"));
    
    try {
        const snap = await getDocs(q);
        wrapper.innerHTML = '';
        
        if(snap.empty) {
            wrapper.innerHTML = '<p class="text-center" style="color:#888;">Belum ada member yang dipanggil.</p>';
            return;
        }

        const membersByGen = {};

        snap.forEach(doc => {
            const d = doc.data();
            const genKey = d.gen ? d.gen.trim() : "Unknown Gen";
            
            if (!membersByGen[genKey]) {
                membersByGen[genKey] = [];
            }
            membersByGen[genKey].push(d);
        });

        const sortedGenKeys = Object.keys(membersByGen).sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        let sectionDelay = 0;

        sortedGenKeys.forEach(gen => {
            const section = document.createElement('div');
            section.className = 'gen-section';
            section.style.animationDelay = `${sectionDelay}s`;

            const titleHTML = `
                <div class="gen-title-wrapper">
                    <h2 class="gen-title">${gen}</h2>
                    <div class="gen-line"></div>
                </div>
            `;
            
            const grid = document.createElement('div');
            grid.className = 'member-grid';

            membersByGen[gen].forEach(member => {
                const imgPath = `asset/member/${member.imageName}`;
                let socialHtml = '';
                
                if(member.social.instagram) socialHtml += `<a href="${member.social.instagram}" target="_blank" class="social-btn"><i class="fa-brands fa-instagram"></i></a>`;
                if(member.social.reality) socialHtml += `<a href="${member.social.reality}" target="_blank" class="social-btn"><i class="fa-solid fa-r"></i></a>`;
                if(member.social.discord) socialHtml += `<div class="social-btn discord-trigger" data-id="${member.social.discord}"><i class="fa-brands fa-discord"></i></div>`;

                const card = document.createElement('div');
                card.className = 'member-card';
                card.innerHTML = `
                    <img src="${imgPath}" alt="${member.username}" class="card-image-full" onerror="this.src='asset/Content/thumbnail/default.jpg'">
                    <div class="card-overlay">
                        <div class="mem-top-info">
                            <span class="badge-role">${member.division}</span>
                            <h3 class="mem-name-large">${member.username}</h3>
                        </div>
                        <div class="mem-hidden-content">
                            <p class="mem-quote-small">"${member.motto}"</p>
                            <div class="social-row">
                                ${socialHtml}
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });

            section.innerHTML = titleHTML;
            section.appendChild(grid);
            wrapper.appendChild(section);
            
            sectionDelay += 0.2;
        });

        document.querySelectorAll('.discord-trigger').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.getAttribute('data-id');
                alert(`Discord Username: ${id}`);
                navigator.clipboard.writeText(id);
            });
        });

    } catch (e) {
        console.error(e);
        wrapper.innerHTML = '<p class="text-center">Gagal memuat portal member.</p>';
    }
}

renderMembers();
