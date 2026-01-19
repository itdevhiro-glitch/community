import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

let currentFormId = null; 
let unsubscribeQuestions = null;
let unsubscribeResponses = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.querySelector('.user-profile span').innerText = user.email;
        loadFormList();
    } else {
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        document.getElementById('login-error').classList.remove('hidden');
    }
});

document.querySelector('.logout').addEventListener('click', async () => {
    if(confirm("Logout?")) await signOut(auth);
});

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
                    <p>${data.description || 'Tidak ada deskripsi'}</p>
                    <small>Dibuat: ${date}</small>
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
                if(confirm("Hapus formulir ini beserta semua datanya? (Tidak bisa dikembalikan)")) {
                    const id = e.target.closest('button').dataset.id;
                    await deleteDoc(doc(db, "forms", id));
                }
            });
        });
    });
}

document.getElementById('btn-create-form').addEventListener('click', async () => {
    const title = document.getElementById('new-form-title').value;
    const desc = document.getElementById('new-form-desc').value;
    if(!title) return alert("Judul wajib diisi");

    const btn = document.getElementById('btn-create-form');
    btn.innerText = "Memproses...";
    
    try {
        await addDoc(collection(db, "forms"), {
            title: title,
            description: desc,
            createdAt: new Date()
        });
        document.getElementById('create-form-modal').classList.add('hidden');
        document.getElementById('new-form-title').value = '';
        document.getElementById('new-form-desc').value = '';
    } catch (e) {
        alert("Gagal membuat form");
    } finally {
        btn.innerText = "Buat Sekarang";
    }
});

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
    showToast("Link berhasil disalin!");
};

document.getElementById('field-type').addEventListener('change', (e) => {
    const val = e.target.value;
    const optContainer = document.getElementById('options-container');
    if(['select', 'radio', 'checkbox'].includes(val)) {
        optContainer.classList.remove('hidden');
    } else {
        optContainer.classList.add('hidden');
    }
});

document.getElementById('btn-add-field').addEventListener('click', async () => {
    if(!currentFormId) return;
    
    const label = document.getElementById('field-label').value;
    const type = document.getElementById('field-type').value;
    const rawOptions = document.getElementById('field-options').value;

    if(!label) return alert("Isi pertanyaan");
    if(['select','radio','checkbox'].includes(type) && !rawOptions) return alert("Isi opsi jawaban");

    let optionsArray = rawOptions ? rawOptions.split(',').map(s=>s.trim()) : null;

    try {
        const questionsCol = collection(db, `forms/${currentFormId}/questions`);
        await addDoc(questionsCol, {
            label, type, options: optionsArray, createdAt: new Date()
        });
        
        document.getElementById('field-label').value = '';
        document.getElementById('field-options').value = '';
        showToast("Pertanyaan ditambahkan");
    } catch (e) {
        console.error(e);
    }
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
                <td><button class="btn-delete-q btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-q').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus?")) {
                    const qId = e.target.closest('button').dataset.id;
                    await deleteDoc(doc(db, `forms/${formId}/questions`, qId));
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
            headers.forEach(h => {
                row += `<td>${data[h] || '-'}</td>`;
            });
            row += `<td><button class="btn-del-resp btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = row;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-del-resp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus data ini?")) {
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
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleString()}`, 14, 22);

    doc.autoTable({
        html: '#responses-table',
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [44, 36, 32] },
        styles: { fontSize: 8 }
    });
    doc.save('laporan-form.pdf');
});

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}
