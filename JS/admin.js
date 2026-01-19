import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, query, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Global Variables
let currentFormId = null; 
let unsubscribeQuestions = null;
let unsubscribeResponses = null;

// --- AUTH & INIT ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.querySelector('.user-profile span').innerText = user.email;
        
        // Load All Data
        loadAnnouncements();
        loadFormList();
    } else {
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    }
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    const btnText = document.getElementById('btn-text');
    btnText.innerText = "Authenticating...";

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        document.getElementById('login-error').classList.remove('hidden');
    } finally {
        btnText.innerText = "Login System";
    }
});

// Logout
document.querySelector('.logout').addEventListener('click', async (e) => {
    e.preventDefault();
    if(confirm("Yakin ingin logout?")) await signOut(auth);
});

// --- FEATURE 1: ANNOUNCEMENTS ---

function loadAnnouncements() {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('announcement-table-body');
        document.getElementById('stat-count-posts').innerText = snapshot.size;
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada postingan.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID') : '-';
            const localPath = `asset/Content/thumbnail/${data.imageName}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${localPath}" class="thumb-img" onerror="this.src='asset/Content/thumbnail/default.jpg'"></td>
                <td><strong>${data.title}</strong></td>
                <td>${date}</td>
                <td><button class="btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus postingan ini?")) {
                    await deleteDoc(doc(db, "announcements", e.target.closest('button').dataset.id));
                }
            });
        });
    });
}

document.getElementById('btn-publish').addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const desc = document.getElementById('new-desc').value;
    const imageName = document.getElementById('new-image-name').value;
    const btn = document.getElementById('btn-publish');

    if(!title || !desc || !imageName) return alert("Lengkapi data!");

    btn.innerText = "Menyimpan...";
    try {
        await addDoc(collection(db, "announcements"), {
            title, description: desc, imageName, createdAt: new Date()
        });
        document.getElementById('add-post-modal').classList.add('hidden');
        document.getElementById('new-title').value = '';
        document.getElementById('new-desc').value = '';
        showToast("Pengumuman diterbitkan!");
    } catch (e) {
        alert("Gagal menyimpan.");
    } finally {
        btn.innerText = "Publish Now";
    }
});

// --- FEATURE 2: YOUTUBE ---

document.getElementById('btn-update-yt').addEventListener('click', async () => {
    const link = document.getElementById('yt-link-input').value;
    if(!link) return;
    try {
        await setDoc(doc(db, "youtube", "main"), { videoUrl: link });
        showToast("Video updated!");
        document.getElementById('yt-link-input').value = '';
    } catch (e) { alert("Gagal update."); }
});

// --- FEATURE 3: MULTI-FORMS ---

// A. Form List
function loadFormList() {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('form-list-container');
        document.getElementById('stat-total-forms').innerText = snapshot.size;
        container.innerHTML = '';

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '-';
            
            const card = document.createElement('div');
            card.className = 'form-card-item';
            card.innerHTML = `
                <div class="fc-icon"><i class="fa-solid fa-file-lines"></i></div>
                <div class="fc-info">
                    <h4>${data.title}</h4>
                    <p>${data.description || '...'}</p>
                    <small>${date}</small>
                </div>
                <div class="fc-actions">
                    <button class="btn-edit-form" onclick="window.openFormEditor('${docSnap.id}', '${data.title}')">Edit</button>
                    <button class="btn-delete-form" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(card);
        });

        document.querySelectorAll('.btn-delete-form').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus form ini & semua datanya?")) {
                    await deleteDoc(doc(db, "forms", e.target.closest('button').dataset.id));
                }
            });
        });
    });
}

document.getElementById('btn-create-form').addEventListener('click', async () => {
    const title = document.getElementById('new-form-title').value;
    const desc = document.getElementById('new-form-desc').value;
    if(!title) return;

    try {
        await addDoc(collection(db, "forms"), { title, description: desc, createdAt: new Date() });
        document.getElementById('create-form-modal').classList.add('hidden');
        document.getElementById('new-form-title').value = '';
        showToast("Form dibuat!");
    } catch (e) { alert("Error create form"); }
});

// B. Form Editor
window.openFormEditor = (formId, formTitle) => {
    currentFormId = formId;
    document.getElementById('view-form-list').classList.add('hidden');
    document.getElementById('view-form-editor').classList.remove('hidden');
    document.getElementById('editor-form-title').innerText = formTitle;
    
    const formUrl = `${window.location.origin}/form.html?id=${formId}`;
    document.getElementById('share-link-text').innerText = formUrl;
    window.currentFormUrl = formUrl;

    loadQuestions(formId);
    loadResponses(formId);
};

window.copyFormLink = () => {
    navigator.clipboard.writeText(window.currentFormUrl);
    showToast("Link disalin!");
};

document.getElementById('field-type').addEventListener('change', (e) => {
    const val = e.target.value;
    const opt = document.getElementById('options-container');
    if(['select', 'radio', 'checkbox'].includes(val)) opt.classList.remove('hidden');
    else opt.classList.add('hidden');
});

document.getElementById('btn-add-field').addEventListener('click', async () => {
    if(!currentFormId) return;
    const label = document.getElementById('field-label').value;
    const type = document.getElementById('field-type').value;
    const rawOptions = document.getElementById('field-options').value;

    if(!label) return alert("Isi Label!");
    if(['select','radio','checkbox'].includes(type) && !rawOptions) return alert("Isi Opsi!");

    let optionsArray = rawOptions ? rawOptions.split(',').map(s=>s.trim()) : null;

    try {
        await addDoc(collection(db, `forms/${currentFormId}/questions`), {
            label, type, options: optionsArray, createdAt: new Date()
        });
        document.getElementById('field-label').value = '';
        document.getElementById('field-options').value = '';
        showToast("Pertanyaan ditambah!");
    } catch (e) { console.error(e); }
});

function loadQuestions(formId) {
    if(unsubscribeQuestions) unsubscribeQuestions();
    const q = query(collection(db, `forms/${formId}/questions`), orderBy("createdAt", "asc"));
    
    unsubscribeQuestions = onSnapshot(q, (snap) => {
        const tbody = document.getElementById('questions-list-body');
        tbody.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.label}</td>
                <td><span class="badge-type">${data.type}</span></td>
                <td><small>${data.options ? data.options.join(', ') : '-'}</small></td>
                <td><button class="btn-del-q btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-del-q').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus pertanyaan?")) {
                    await deleteDoc(doc(db, `forms/${formId}/questions`, e.target.closest('button').dataset.id));
                }
            });
        });
    });
}

async function loadResponses(formId) {
    if(unsubscribeResponses) unsubscribeResponses();
    
    const qSnap = await getDocs(query(collection(db, `forms/${formId}/questions`), orderBy("createdAt", "asc")));
    const headers = [];
    qSnap.forEach(d => headers.push(d.data().label));

    const thead = document.getElementById('responses-head');
    let headHtml = '<tr><th>Waktu</th>';
    headers.forEach(h => headHtml += `<th>${h}</th>`);
    headHtml += '<th>Hapus</th></tr>';
    thead.innerHTML = headHtml;

    const subCol = collection(db, `forms/${formId}/submissions`);
    unsubscribeResponses = onSnapshot(query(subCol, orderBy("submittedAt", "desc")), (snap) => {
        document.getElementById('response-count').innerText = snap.size;
        const tbody = document.getElementById('responses-body');
        tbody.innerHTML = '';

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const time = data.submittedAt ? data.submittedAt.toDate().toLocaleString() : '-';
            let row = `<td>${time}</td>`;
            headers.forEach(h => row += `<td>${data[h] || '-'}</td>`);
            row += `<td><button class="btn-del-resp btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = row;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-del-resp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus respon?")) {
                    await deleteDoc(doc(db, `forms/${formId}/submissions`, e.target.closest('button').dataset.id));
                }
            });
        });
    });
}

document.getElementById('btn-download-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text(`Laporan: ${document.getElementById('editor-form-title').innerText}`, 14, 15);
    doc.autoTable({ html: '#responses-table', startY: 25, styles: { fontSize: 8 } });
    doc.save('laporan.pdf');
});

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
