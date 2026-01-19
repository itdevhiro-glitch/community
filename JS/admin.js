import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
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

// --- STATE ---
const announcementsCol = collection(db, "announcements");

// --- 1. LOGIN SYSTEM (SIMPLE) ---
document.getElementById('btn-login').addEventListener('click', () => {
    const input = document.getElementById('admin-pass-input').value;
    if(input === "admin123") { // Password Hardcoded
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        loadData(); // Load data only after login
    } else {
        const err = document.getElementById('login-error');
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 3000);
    }
});

// --- 2. DATA LOADING & REALTIME LISTENER ---
function loadData() {
    const q = query(announcementsCol, orderBy("createdAt", "desc"));
    
    // Realtime Listener: Table updates automatically
    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('announcement-table-body');
        const countSpan = document.getElementById('stat-count-posts');
        
        tbody.innerHTML = ''; // Clear table
        countSpan.innerText = snapshot.size; // Update Stats

        if(snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No announcements found.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : '-';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${data.imageUrl}" class="thumb-img" alt="img"></td>
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

        // Attach Delete Events
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    });
}

// --- 3. CRUD ACTIONS ---

// DELETE
async function handleDelete(e) {
    // Cari tombol terdekat (karena mungkin klik icon)
    const btn = e.target.closest('.btn-delete');
    const id = btn.getAttribute('data-id');
    
    if(confirm("Are you sure you want to delete this post?")) {
        try {
            await deleteDoc(doc(db, "announcements", id));
            showToast("Post deleted successfully!");
        } catch (error) {
            console.error(error);
            alert("Error deleting post.");
        }
    }
}

// ADD NEW POST
document.getElementById('btn-publish').addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const desc = document.getElementById('new-desc').value;
    const file = document.getElementById('new-image').files[0];
    const btn = document.getElementById('btn-publish');

    if(!title || !desc || !file) {
        alert("Please fill all fields!");
        return;
    }

    btn.innerText = "Uploading...";
    btn.disabled = true;

    try {
        // Upload Image
        const storageRef = ref(storage, 'announcements/' + Date.now() + '-' + file.name);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        // Add to Firestore
        await addDoc(announcementsCol, {
            title: title,
            description: desc,
            imageUrl: url,
            createdAt: new Date()
        });

        showToast("Announcement Published!");
        document.getElementById('add-modal').classList.add('hidden');
        
        // Reset Form
        document.getElementById('new-title').value = '';
        document.getElementById('new-desc').value = '';
        document.getElementById('new-image').value = '';

    } catch (error) {
        console.error(error);
        alert("Upload Failed: " + error.message);
    } finally {
        btn.innerText = "Publish Now";
        btn.disabled = false;
    }
});

// UPDATE YOUTUBE
document.getElementById('btn-update-yt').addEventListener('click', async () => {
    const link = document.getElementById('yt-link-input').value;
    if(!link) return;

    const btn = document.getElementById('btn-update-yt');
    btn.innerText = "Saving...";

    try {
        await setDoc(doc(db, "youtube", "main"), { videoUrl: link });
        showToast("Video Updated Successfully!");
        document.getElementById('yt-link-input').value = '';
    } catch (error) {
        alert("Failed to update video.");
    } finally {
        btn.innerText = "Save Changes";
    }
});

// --- HELPER: TOAST ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}