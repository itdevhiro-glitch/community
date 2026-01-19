import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        document.querySelector('.user-profile span').innerText = user.email;
        loadData();
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

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
