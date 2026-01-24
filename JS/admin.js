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

let currentFormId = null;
let unsubQuestions = null;
let unsubResponses = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.querySelector('.user-profile span').innerText = user.email;
        loadAnnouncements();
        loadFormList();
        loadMembers();
    } else {
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('dashboard-container').classList.add('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    const btnText = document.getElementById('btn-text');
    const errMsg = document.getElementById('login-error');

    btnText.innerText = "Authenticating...";
    errMsg.classList.add('hidden');

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        errMsg.innerText = "Login Gagal. Cek Email/Password.";
        errMsg.classList.remove('hidden');
    } finally {
        btnText.innerText = "Login System";
    }
});

document.querySelector('.logout').addEventListener('click', async (e) => {
    e.preventDefault();
    if(confirm("Yakin ingin logout?")) {
        await signOut(auth);
    }
});

function loadAnnouncements() {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('announcement-table-body');
        const countSpan = document.getElementById('stat-count-posts');
        
        if (!tbody) return;
        tbody.innerHTML = '';
        if(countSpan) countSpan.innerText = snapshot.size;

        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada pengumuman.</td></tr>';
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
                <td>
                    <button class="btn-delete" data-id="${docSnap.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
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

    if(!title || !desc || !imageName) return alert("Data tidak lengkap!");

    btn.innerText = "Menyimpan...";
    try {
        await addDoc(collection(db, "announcements"), {
            title, description: desc, imageName, createdAt: new Date()
        });
        showToast("Berhasil diterbitkan!");
        document.getElementById('add-modal').classList.add('hidden');
        document.getElementById('new-title').value = ''; 
        document.getElementById('new-desc').value = '';
    } catch (e) {
        alert("Gagal: " + e.message);
    } finally {
        btn.innerText = "Publish Now";
    }
});

document.getElementById('btn-update-yt').addEventListener('click', async () => {
    const link = document.getElementById('yt-link-input').value;
    if(!link) return;
    try {
        await setDoc(doc(db, "youtube", "main"), { videoUrl: link });
        showToast("Video Updated!");
        document.getElementById('yt-link-input').value = '';
    } catch (e) { alert("Gagal update video."); }
});

function loadFormList() {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById('form-list-container');
        const statForms = document.getElementById('stat-total-forms');
        if(statForms) statForms.innerText = snapshot.size;
        
        container.innerHTML = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '-';
            
            const card = document.createElement('div');
            card.className = 'form-card-item';
            card.innerHTML = `
                <div style="font-size:2rem; color:#A68A64; margin-bottom:10px;"><i class="fa-solid fa-file-lines"></i></div>
                <div>
                    <h4 style="margin:0 0 5px 0;">${data.title}</h4>
                    <p style="font-size:0.8rem; color:#888; margin:0;">${date}</p>
                </div>
                <div style="margin-top:15px; display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn-edit-form" onclick="window.openEditor('${docSnap.id}', '${data.title}')" style="background:#2C2420; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Edit</button>
                    <button class="btn-del-form" data-id="${docSnap.id}" style="background:#ffe5e5; color:red; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            card.style.background = 'white';
            card.style.padding = '20px';
            card.style.borderRadius = '12px';
            card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';
            
            container.appendChild(card);
        });

        document.querySelectorAll('.btn-del-form').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus form ini beserta datanya?")) {
                    await deleteDoc(doc(db, "forms", e.target.closest('button').dataset.id));
                }
            });
        });
    });
}

document.getElementById('btn-create-form').addEventListener('click', async () => {
    const title = document.getElementById('new-form-title').value;
    const desc = document.getElementById('new-form-desc').value;
    if(!title) return alert("Judul wajib diisi");

    try {
        await addDoc(collection(db, "forms"), { title, description: desc, createdAt: new Date() });
        document.getElementById('create-form-modal').classList.add('hidden');
        document.getElementById('new-form-title').value = '';
        showToast("Form dibuat!");
    } catch (e) { alert("Error."); }
});

window.openEditor = (id, title) => {
    currentFormId = id;
    document.getElementById('view-form-list').classList.add('hidden');
    document.getElementById('view-form-editor').classList.remove('hidden');
    document.getElementById('editor-form-title').innerText = title;
    
    const link = `${window.location.origin}/form.html?id=${id}`;
    document.getElementById('share-link-text').innerText = link;
    window.currentFormLink = link;

    loadQuestions(id);
    loadResponses(id);
};

window.copyFormLink = () => {
    navigator.clipboard.writeText(window.currentFormLink);
    showToast("Link disalin!");
};

document.getElementById('field-type').addEventListener('change', (e) => {
    const val = e.target.value;
    const optArea = document.getElementById('options-area');
    const container = document.getElementById('dynamic-options-container');
    
    if(['select','radio','checkbox'].includes(val)) {
        optArea.classList.remove('hidden');
        if(container.children.length === 0) addOptionInput(); 
    } else {
        optArea.classList.add('hidden');
        container.innerHTML = '';
    }
});

function addOptionInput(value = '') {
    const container = document.getElementById('dynamic-options-container');
    const div = document.createElement('div');
    div.className = 'option-row'; 
    div.style.cssText = "display:flex; gap:10px; margin-bottom:8px; align-items:center;";
    
    div.innerHTML = `
        <i class="fa-solid fa-circle-dot" style="color:#ccc; font-size:0.8rem;"></i>
        <input type="text" class="input-clean option-input" value="${value}" placeholder="Tulis opsi..." style="margin-bottom:0; flex:1;">
        <button onclick="this.parentElement.remove()" style="color:red; background:none; border:none; cursor:pointer;">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    container.appendChild(div);
}

document.getElementById('btn-add-option-row')?.addEventListener('click', () => {
    addOptionInput();
});

document.getElementById('btn-add-field').addEventListener('click', async () => {
    const label = document.getElementById('field-label').value;
    const type = document.getElementById('field-type').value;
    
    if(!label) return alert("Label pertanyaan wajib diisi!");

    let finalOptions = null;

    if(['select','radio','checkbox'].includes(type)) {
        const inputs = document.querySelectorAll('.option-input');
        finalOptions = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(text => text !== "");

        if(finalOptions.length === 0) return alert("Minimal isi satu opsi jawaban!");
    }

    const btn = document.getElementById('btn-add-field');
    btn.innerText = "Menyimpan...";
    
    try {
        await addDoc(collection(db, `forms/${currentFormId}/questions`), {
            label, 
            type, 
            options: finalOptions,
            createdAt: new Date()
        });
        
        document.getElementById('field-label').value = '';
        document.getElementById('dynamic-options-container').innerHTML = '';
        if(['select','radio','checkbox'].includes(type)) addOptionInput();
        
        showToast("Pertanyaan berhasil ditambahkan!");
    } catch(e) { 
        console.error(e); 
        alert("Gagal menyimpan: " + e.message); 
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Simpan Pertanyaan';
    }
});

function loadQuestions(id) {
    if(unsubQuestions) unsubQuestions();
    const q = query(collection(db, `forms/${id}/questions`), orderBy("createdAt", "asc"));
    unsubQuestions = onSnapshot(q, (snap) => {
        const tbody = document.getElementById('questions-list-body');
        tbody.innerHTML = '';
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.label}</td>
                <td><span style="background:#eee; padding:2px 5px; border-radius:4px; font-size:0.8rem">${data.type}</span></td>
                <td><small>${data.options ? (Array.isArray(data.options) ? data.options.join(', ') : data.options) : '-'}</small></td>
                <td><button class="btn-del-q" data-id="${docSnap.id}" style="color:red; border:none; background:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
        document.querySelectorAll('.btn-del-q').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus?")) await deleteDoc(doc(db, `forms/${id}/questions`, e.target.closest('button').dataset.id));
            });
        });
    });
}

async function loadResponses(id) {
    if(unsubResponses) unsubResponses();
    
    const qSnap = await getDocs(query(collection(db, `forms/${id}/questions`), orderBy("createdAt", "asc")));
    const headers = [];
    qSnap.forEach(d => headers.push(d.data().label));
    
    const thead = document.getElementById('responses-head');
    let hHtml = '<tr><th>Waktu</th>';
    headers.forEach(h => hHtml += `<th>${h}</th>`);
    hHtml += '<th>Hapus</th></tr>';
    thead.innerHTML = hHtml;

    const subCol = collection(db, `forms/${id}/submissions`);
    unsubResponses = onSnapshot(query(subCol, orderBy("submittedAt", "desc")), (snap) => {
        document.getElementById('response-count').innerText = snap.size;
        const tbody = document.getElementById('responses-body');
        tbody.innerHTML = '';
        
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const time = data.submittedAt ? data.submittedAt.toDate().toLocaleString() : '-';
            let rHtml = `<td>${time}</td>`;
            headers.forEach(h => rHtml += `<td>${data[h] || '-'}</td>`);
            rHtml += `<td><button class="btn-del-resp" data-id="${docSnap.id}" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button></td>`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = rHtml;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-del-resp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus respon?")) await deleteDoc(doc(db, `forms/${id}/submissions`, e.target.closest('button').dataset.id));
            });
        });
    });
}

document.getElementById('btn-download-pdf').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text(`Laporan: ${document.getElementById('editor-form-title').innerText}`, 14, 15);
    doc.autoTable({ html: '#responses-table', startY: 25, styles: { fontSize: 8 } });
    doc.save('data-respon.pdf');
});

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function loadMembers() {
    const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('member-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada member.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const localPath = `asset/member/${data.imageName}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${localPath}" class="thumb-img" style="border-radius:50%; object-fit:cover;" onerror="this.src='asset/Content/thumbnail/default.jpg'"></td>
                <td><strong>${data.username}</strong></td>
                <td>${data.division}</td>
                <td><span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.8rem;">${data.gen}</span></td>
                <td>
                    <button class="btn-delete-mem" data-id="${docSnap.id}" style="color:red; background:none; border:none; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-mem').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus data member ini?")) {
                    await deleteDoc(doc(db, "members", e.target.closest('button').dataset.id));
                    showToast("Member dihapus!");
                }
            });
        });
    });
}

const btnSaveMem = document.getElementById('btn-save-member');
if(btnSaveMem){
    btnSaveMem.addEventListener('click', async () => {
        const username = document.getElementById('mem-username').value;
        const gen = document.getElementById('mem-gen').value;
        const division = document.getElementById('mem-division').value;
        const motto = document.getElementById('mem-motto').value;
        const ig = document.getElementById('mem-ig').value;
        const discord = document.getElementById('mem-discord').value;
        const reality = document.getElementById('mem-reality').value;
        const image = document.getElementById('mem-image').value;

        if(!username || !division || !image) return alert("Username, Divisi, dan Foto wajib diisi!");

        btnSaveMem.innerText = "Menyimpan...";
        try {
            await addDoc(collection(db, "members"), {
                username, gen, division, motto, 
                social: { instagram: ig, discord: discord, reality: reality },
                imageName: image,
                createdAt: new Date()
            });
            showToast("Member berhasil ditambahkan!");
            document.getElementById('member-modal').classList.add('hidden');
            
            document.getElementById('mem-username').value = '';
            document.getElementById('mem-gen').value = '';
            document.getElementById('mem-division').value = '';
            document.getElementById('mem-motto').value = '';
            document.getElementById('mem-ig').value = '';
            document.getElementById('mem-discord').value = '';
            document.getElementById('mem-reality').value = '';
            document.getElementById('mem-image').value = '';
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btnSaveMem.innerText = "Simpan Data Member";
        }
    });
}
