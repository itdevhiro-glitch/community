import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Ambil ID dari URL (?id=...)
const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

const container = document.getElementById('main-container');
const loading = document.getElementById('loading');
const fieldsContainer = document.getElementById('fields-container');

async function init() {
    if (!formId) return loading.innerHTML = "URL Tidak Valid.";

    try {
        // Ambil Data Form (Judul)
        const formSnap = await getDoc(doc(db, "forms", formId));
        if (!formSnap.exists()) return loading.innerHTML = "Formulir tidak ditemukan atau telah dihapus.";
        
        const info = formSnap.data();
        document.getElementById('public-title').innerText = info.title;
        document.getElementById('public-desc').innerText = info.description || '';

        // Ambil Pertanyaan
        const qSnap = await getDocs(query(collection(db, `forms/${formId}/questions`), orderBy("createdAt", "asc")));
        if (qSnap.empty) {
            fieldsContainer.innerHTML = '<p>Belum ada pertanyaan di form ini.</p>';
        } else {
            renderQuestions(qSnap);
        }

        loading.classList.add('hidden');
        container.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        loading.innerHTML = "Terjadi kesalahan memuat form.";
    }
}

function renderQuestions(snapshot) {
    snapshot.forEach(doc => {
        const data = doc.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group-modern';
        
        let html = `<label class="field-label">${data.label}</label>`;

        if(['text','email','number','date'].includes(data.type)) {
            html += `<input type="${data.type}" name="${data.label}" class="input-clean" required>`;
        } 
        else if (data.type === 'textarea') {
            html += `<textarea name="${data.label}" class="input-clean" rows="3" required></textarea>`;
        }
        else if (data.type === 'select') {
            let opts = `<option value="" disabled selected>Pilih...</option>`;
            data.options?.forEach(o => opts += `<option value="${o}">${o}</option>`);
            html += `<select name="${data.label}" class="input-clean" required>${opts}</select>`;
        }
        else if (data.type === 'radio') {
            data.options?.forEach(o => {
                html += `<label class="radio-item"><input type="radio" name="${data.label}" value="${o}" required> <span>${o}</span></label>`;
            });
        }
        else if (data.type === 'checkbox') {
            data.options?.forEach(o => {
                html += `<label class="checkbox-item"><input type="checkbox" name="${data.label}" value="${o}"> <span>${o}</span></label>`;
            });
        }

        wrapper.innerHTML = html;
        fieldsContainer.appendChild(wrapper);
    });
}

document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = {};

    // Handle Checkbox array
    const keys = [...new Set(formData.keys())];
    keys.forEach(key => {
        const vals = formData.getAll(key);
        data[key] = vals.length > 1 ? vals.join(', ') : vals[0];
    });
    
    data.submittedAt = new Date();

    try {
        await addDoc(collection(db, `forms/${formId}/submissions`), data);
        Swal.fire({
            icon: 'success',
            title: 'Terkirim!',
            text: 'Jawaban Anda telah direkam.',
            confirmButtonColor: '#2C2420'
        }).then(() => window.location.reload());
    } catch (error) {
        alert("Gagal mengirim.");
        btn.innerText = "Kirim Jawaban";
        btn.disabled = false;
    }
});

init();
