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
const announcementsCol = collection(db, "announcements");
const formConfigCol = collection(db, "form_config");
const submissionsCol = collection(db, "form_submissions");

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.querySelector('.user-profile span').innerText = user.email;
        loadData();
        loadFormConfig();
        loadSubmissions();
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
        let message = "Login Failed.";
        if(error.code === 'auth/wrong-password') message = "Password salah.";
        if(error.code === 'auth/user-not-found') message = "Email tidak terdaftar.";
        if(error.code === 'auth/invalid-email') message = "Format email salah.";
        errMsg.innerText = message;
        errMsg.classList.remove('hidden');
    } finally {
        btnText.innerText = "Login System";
    }
});

document.querySelector('.logout').addEventListener('click', async (e) => {
    e.preventDefault();
    if(confirm("Yakin ingin logout?")) {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }
});

function loadData() {
    const q = query(announcementsCol, orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('announcement-table-body');
        const countSpan = document.getElementById('stat-count-posts');
        
        if (!tbody) return;

        tbody.innerHTML = '';
        countSpan.innerText = snapshot.size;

        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Belum ada pengumuman.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID') : '-';
            const localPath = `asset/Content/thumbnail/${data.imageName}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${localPath}" class="thumb-img" alt="img" onerror="this.src='asset/Content/thumbnail/default.jpg'"></td>
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
            btn.addEventListener('click', handleDelete);
        });
    });
}

async function handleDelete(e) {
    const btn = e.target.closest('.btn-delete');
    const id = btn.getAttribute('data-id');
    
    if(confirm("Hapus postingan ini?")) {
        try {
            await deleteDoc(doc(db, "announcements", id));
            showToast("Postingan dihapus.");
        } catch (error) {
            alert("Gagal menghapus.");
        }
    }
}

document.getElementById('btn-publish').addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const desc = document.getElementById('new-desc').value;
    const imageName = document.getElementById('new-image-name').value;
    const btn = document.getElementById('btn-publish');

    if(!title || !desc || !imageName) {
        alert("Mohon lengkapi judul, deskripsi, dan nama file!");
        return;
    }

    btn.innerText = "Menyimpan...";
    btn.disabled = true;

    try {
        await addDoc(announcementsCol, {
            title: title,
            description: desc,
            imageName: imageName,
            createdAt: new Date()
        });

        showToast("Pengumuman diterbitkan!");
        document.getElementById('add-modal').classList.add('hidden');
        
        document.getElementById('new-title').value = '';
        document.getElementById('new-desc').value = '';
        document.getElementById('new-image-name').value = '';

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan data: " + error.message);
    } finally {
        btn.innerText = "Publish Now";
        btn.disabled = false;
    }
});

document.getElementById('btn-update-yt').addEventListener('click', async () => {
    const link = document.getElementById('yt-link-input').value;
    if(!link) return;

    const btn = document.getElementById('btn-update-yt');
    btn.innerText = "Menyimpan...";

    try {
        await setDoc(doc(db, "youtube", "main"), { videoUrl: link });
        showToast("Video berhasil diupdate!");
        document.getElementById('yt-link-input').value = '';
    } catch (error) {
        alert("Gagal update video.");
    } finally {
        btn.innerText = "Save Changes";
    }
});

const fieldTypeSelect = document.getElementById('field-type');
const optionsContainer = document.getElementById('options-container');

if(fieldTypeSelect) {
    fieldTypeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if(['select', 'radio', 'checkbox'].includes(val)) {
            optionsContainer.classList.remove('hidden');
        } else {
            optionsContainer.classList.add('hidden');
        }
    });
}

function loadFormConfig() {
    const q = query(formConfigCol, orderBy("createdAt", "asc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('form-config-body');
        if(!tbody) return;
        tbody.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const optionsDisplay = data.options ? data.options.join(', ') : '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${data.label}</strong></td>
                <td><span class="badge-type">${data.type}</span></td>
                <td><small>${optionsDisplay}</small></td>
                <td>
                    <button class="btn-delete-field btn-delete" data-id="${docSnap.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-field').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.closest('button').getAttribute('data-id');
                if(confirm("Hapus pertanyaan ini?")) {
                    await deleteDoc(doc(db, "form_config", id));
                }
            });
        });
    });
}

const btnAddField = document.getElementById('btn-add-field');
if(btnAddField) {
    btnAddField.addEventListener('click', async () => {
        const label = document.getElementById('field-label').value;
        const type = document.getElementById('field-type').value;
        const rawOptions = document.getElementById('field-options').value;

        if(!label) return alert("Masukkan label pertanyaan!");
        
        if(['select', 'radio', 'checkbox'].includes(type) && !rawOptions) {
            return alert("Tipe ini membutuhkan opsi pilihan (pisahkan dengan koma)!");
        }

        let optionsArray = null;
        if(rawOptions) {
            optionsArray = rawOptions.split(',').map(s => s.trim());
        }

        try {
            await addDoc(formConfigCol, {
                label: label,
                type: type,
                options: optionsArray,
                createdAt: new Date()
            });
            
            document.getElementById('field-label').value = '';
            document.getElementById('field-options').value = '';
            document.getElementById('options-container').classList.add('hidden');
            document.getElementById('field-type').value = 'text';
            
            showToast("Pertanyaan ditambahkan!");
        } catch (error) {
            console.error(error);
            alert("Gagal menambah field.");
        }
    });
}

async function loadSubmissions() {
    const configSnap = await getDocs(query(formConfigCol, orderBy("createdAt", "asc")));
    const headers = [];
    configSnap.forEach(doc => headers.push(doc.data().label));

    const thead = document.getElementById('submission-head');
    if(!thead) return;
    
    let headHtml = '<tr><th>Tanggal</th>';
    headers.forEach(h => { headHtml += `<th>${h}</th>`; });
    headHtml += '<th>Action</th></tr>';
    thead.innerHTML = headHtml;

    const q = query(submissionsCol, orderBy("submittedAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('submission-body');
        tbody.innerHTML = '';

        if(snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="${headers.length + 2}" style="text-align:center;">Belum ada data masuk.</td></tr>`;
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.submittedAt ? data.submittedAt.toDate().toLocaleDateString('id-ID') + ' ' + data.submittedAt.toDate().toLocaleTimeString('id-ID') : '-';
            
            let rowHtml = `<td>${date}</td>`;
            headers.forEach(h => {
                rowHtml += `<td>${data[h] || '-'}</td>`;
            });

            rowHtml += `<td><button class="btn-delete-sub btn-delete" data-id="${docSnap.id}"><i class="fa-solid fa-trash"></i></button></td>`;

            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-delete-sub').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus data ini?")) {
                    const id = e.target.closest('button').getAttribute('data-id');
                    await deleteDoc(doc(db, "form_submissions", id));
                }
            });
        });
    });
}

const btnPdf = document.getElementById('btn-download-pdf');
if(btnPdf) {
    btnPdf.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.text("Laporan Data Form Tachibana", 14, 20);
        doc.setFontSize(10);
        doc.text("Dicetak pada: " + new Date().toLocaleString('id-ID'), 14, 28);

        doc.autoTable({
            html: '#submission-table',
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [44, 36, 32] },
            styles: { fontSize: 8 },
            columns: [
                { header: 'Tanggal', dataKey: 'date' },
            ]
        });

        doc.save('form-data-tachibana.pdf');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
