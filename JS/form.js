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

const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

const container = document.getElementById('main-container');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');
const fieldsContainer = document.getElementById('fields-container');

async function init() {
    if (!formId) {
        loadingText.innerHTML = "Error: ID Form tidak ditemukan di URL.";
        return;
    }

    try {
        const formRef = doc(db, "forms", formId);
        const formSnap = await getDoc(formRef);

        if (!formSnap.exists()) {
            loadingText.innerHTML = "Formulir tidak ditemukan.";
            return;
        }
        
        const info = formSnap.data();
        document.getElementById('public-title').innerText = info.title;
        document.getElementById('public-desc').innerText = info.description || '';
        document.title = info.title;

        const qRef = collection(db, `forms/${formId}/questions`);
        const qSnap = await getDocs(query(qRef, orderBy("createdAt", "asc")));
        
        if (qSnap.empty) {
            fieldsContainer.innerHTML = '<div style="text-align:center; color:#888;">Belum ada pertanyaan.</div>';
        } else {
            renderQuestions(qSnap);
        }

        loading.classList.add('hidden');
        container.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        loadingText.innerHTML = "Gagal memuat data. Coba refresh halaman.";
    }
}

function renderQuestions(snapshot) {
    fieldsContainer.innerHTML = ''; 

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'field-wrapper';
        
        let html = `<label class="field-label">${data.label}</label>`;

        if(data.type === 'text' || data.type === 'email' || data.type === 'number') {
            html += `<input type="${data.type}" name="${data.label}" class="input-clean" placeholder="Jawaban Anda..." required>`;
        } 
        else if (data.type === 'date') {
            html += `<input type="date" name="${data.label}" class="input-clean" required>`;
        }
        else if (data.type === 'textarea') {
            html += `<textarea name="${data.label}" class="input-clean" rows="3" placeholder="Jawaban Anda..." required></textarea>`;
        }
        else if (data.type === 'select') {
            let opts = `<option value="" disabled selected>Pilih Salah Satu</option>`;
            if(Array.isArray(data.options)) {
                data.options.forEach(o => opts += `<option value="${o}">${o}</option>`);
            }
            html += `<select name="${data.label}" class="input-clean" required>${opts}</select>`;
        }
        else if (data.type === 'radio' || data.type === 'checkbox') {
            html += `<div class="option-group">`;
            if(Array.isArray(data.options)) {
                data.options.forEach(o => {
                    html += `
                    <label class="option-item">
                        <input type="${data.type}" name="${data.label}" value="${o}" ${data.type === 'radio' ? 'required' : ''}>
                        <span>${o}</span>
                    </label>`;
                });
            }
            html += `</div>`;
        }

        wrapper.innerHTML = html;
        fieldsContainer.appendChild(wrapper);
    });
}

document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    const originalContent = btn.innerHTML;
    
    btn.innerHTML = `Mengirim...`;
    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const data = {};

        const keys = [...new Set(formData.keys())];
        keys.forEach(key => {
            const vals = formData.getAll(key);
            data[key] = vals.length > 1 ? vals.join(', ') : vals[0];
        });
        
        data.submittedAt = new Date();

        await addDoc(collection(db, `forms/${formId}/submissions`), data);

        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Jawaban Anda telah direkam.',
            confirmButtonColor: '#2C2420'
        }).then(() => {
            window.location.reload();
        });

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Gagal mengirim jawaban.',
            confirmButtonColor: '#d33'
        });
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
});

init();
