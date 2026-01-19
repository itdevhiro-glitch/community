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
const fieldsContainer = document.getElementById('fields-container');

async function init() {
    // 1. Validasi ID
    if (!formId) {
        loading.innerHTML = '<p style="color:red">Error: Link formulir tidak valid (ID hilang).</p>';
        return;
    }

    try {
        // 2. Ambil Info Form
        const formSnap = await getDoc(doc(db, "forms", formId));
        if (!formSnap.exists()) {
            loading.innerHTML = '<p>Formulir tidak ditemukan atau telah dihapus oleh admin.</p>';
            return;
        }
        
        const info = formSnap.data();
        document.getElementById('public-title').innerText = info.title;
        document.getElementById('public-desc').innerText = info.description || 'Silakan isi formulir berikut dengan benar.';
        document.title = `${info.title} | Tachibana Form`;

        // 3. Ambil Pertanyaan
        const qSnap = await getDocs(query(collection(db, `forms/${formId}/questions`), orderBy("createdAt", "asc")));
        
        if (qSnap.empty) {
            fieldsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Belum ada pertanyaan yang ditambahkan.</div>';
        } else {
            renderQuestions(qSnap);
        }

        // 4. Tampilkan Form
        loading.style.display = 'none'; // Pakai style display agar transisi smooth jika mau ditambah CSS nanti
        container.classList.remove('hidden');

    } catch (error) {
        console.error("Error loading form:", error);
        loading.innerHTML = '<p>Gagal memuat data. Periksa koneksi internet Anda.</p>';
    }
}

function renderQuestions(snapshot) {
    fieldsContainer.innerHTML = ''; // Reset container

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'field-wrapper';
        
        // Label Pertanyaan
        let html = `<label class="field-label">${data.label}</label>`;

        // Render Input berdasarkan Tipe
        if(data.type === 'text' || data.type === 'email' || data.type === 'number') {
            html += `<input type="${data.type}" name="${data.label}" class="input-clean" placeholder="Ketik jawaban Anda di sini..." required>`;
        } 
        else if (data.type === 'date') {
            html += `<input type="date" name="${data.label}" class="input-clean" required>`;
        }
        else if (data.type === 'textarea') {
            html += `<textarea name="${data.label}" class="input-clean" rows="3" placeholder="Ketik jawaban panjang di sini..." required></textarea>`;
        }
        else if (data.type === 'select') {
            let opts = `<option value="" disabled selected>-- Pilih Salah Satu --</option>`;
            if(Array.isArray(data.options)) {
                data.options.forEach(o => opts += `<option value="${o}">${o}</option>`);
            }
            html += `<select name="${data.label}" class="input-clean" required>${opts}</select>`;
        }
        else if (data.type === 'radio' || data.type === 'checkbox') {
            // Bungkus dalam option-group agar rapi
            html += `<div class="option-group">`;
            if(Array.isArray(data.options)) {
                data.options.forEach(o => {
                    // Gunakan ID unik untuk label 'for' jika ingin klik teks (opsional, disini pakai wrapping label)
                    html += `
                    <label class="option-item">
                        <input type="${data.type}" name="${data.label}" value="${o}" ${data.type === 'radio' ? 'required' : ''}>
                        <span>${o}</span>
                    </label>`;
                });
            } else {
                html += `<p style="color:red; font-size:0.8rem;">Error: Opsi belum diatur oleh admin.</p>`;
            }
            html += `</div>`;
        }

        wrapper.innerHTML = html;
        fieldsContainer.appendChild(wrapper);
    });
}

// LOGIC SUBMIT
document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    const originalText = btn.innerHTML;
    
    // UI Loading State
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...`;
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
        const formData = new FormData(e.target);
        const data = {};

        // Handle Form Data (termasuk checkbox multiple value)
        const keys = [...new Set(formData.keys())];
        keys.forEach(key => {
            const vals = formData.getAll(key);
            data[key] = vals.length > 1 ? vals.join(', ') : vals[0];
        });
        
        data.submittedAt = new Date();

        // Kirim ke Firestore
        await addDoc(collection(db, `forms/${formId}/submissions`), data);

        // Sukses Alert
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Terkirim!',
            text: 'Terima kasih, jawaban Anda telah kami terima.',
            confirmButtonColor: '#2C2420',
            confirmButtonText: 'Tutup'
        }).then(() => {
            window.location.reload();
        });

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal Mengirim',
            text: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
            confirmButtonColor: '#d33'
        });
        
        // Reset Button jika gagal
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
});

init();
