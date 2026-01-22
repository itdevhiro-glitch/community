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
        showFatalError("Link Error", "ID Formulir tidak ditemukan di URL.");
        return;
    }

    try {
        const formRef = doc(db, "forms", formId);
        const formSnap = await getDoc(formRef);

        if (!formSnap.exists()) {
            showFatalError("Tidak Ditemukan", "Formulir yang Anda cari tidak tersedia atau telah dihapus.");
            return;
        }
        
        const info = formSnap.data();
        document.getElementById('public-title').innerText = info.title;
        document.getElementById('public-desc').innerText = info.description || '';
        document.title = `${info.title} | Tachibana`;

        // Render Questions
        const qRef = collection(db, `forms/${formId}/questions`);
        const qSnap = await getDocs(query(qRef, orderBy("createdAt", "asc")));
        
        if (qSnap.empty) {
            fieldsContainer.innerHTML = `
                <div style="text-align:center; padding: 40px; background: #f9f9f9; border-radius: 12px; color: #666;">
                    <i class="fa-regular fa-clipboard" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                    Belum ada pertanyaan.
                </div>`;
        } else {
            renderQuestions(qSnap);
        }

        // Smooth Transition
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.classList.add('hidden');
            container.classList.remove('hidden');
            setTimeout(() => {
                container.classList.add('visible');
            }, 50);
        }, 300);

    } catch (error) {
        console.error(error);
        showFatalError("Koneksi Gagal", "Gagal memuat data. Silakan periksa internet Anda dan refresh halaman.");
    }
}

function showFatalError(title, msg) {
    loadingText.innerHTML = `<span style="color:#d33">${msg}</span>`;
    Swal.fire({
        icon: 'error',
        title: title,
        text: msg,
        confirmButtonColor: '#2C2420'
    });
}

function renderQuestions(snapshot) {
    fieldsContainer.innerHTML = ''; 
    let delay = 0;

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'field-group';
        wrapper.style.animationDelay = `${delay}ms`; // Stagger animation
        delay += 100;
        
        const isRequired = data.required ? '<span style="color:#ef4444; margin-left:4px">*</span>' : '';
        const uniqueId = docSnap.id;

        // Header Label for the Question
        let html = `<label class="field-label-block">${data.label} ${isRequired}</label>`;

        // INPUT: TEXT, EMAIL, NUMBER, DATE
        if(['text', 'email', 'number', 'date'].includes(data.type)) {
            html += `
            <div class="input-wrapper">
                <input type="${data.type}" name="${data.label}" class="form-control" placeholder="Ketik jawaban Anda..." ${data.required ? 'required' : ''}>
            </div>`;
        } 
        // INPUT: TEXTAREA
        else if (data.type === 'textarea') {
            html += `
            <div class="input-wrapper">
                <textarea name="${data.label}" class="form-control" rows="4" placeholder="Ketik jawaban panjang di sini..." ${data.required ? 'required' : ''}></textarea>
            </div>`;
        }
        // INPUT: SELECT
        else if (data.type === 'select') {
            let opts = `<option value="" disabled selected>-- Pilih Salah Satu --</option>`;
            if(Array.isArray(data.options)) {
                data.options.forEach(o => opts += `<option value="${o}">${o}</option>`);
            }
            html += `
            <div class="input-wrapper" style="position:relative">
                <select name="${data.label}" class="form-control" style="cursor:pointer" ${data.required ? 'required' : ''}>${opts}</select>
                <i class="fa-solid fa-chevron-down" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); color:#999; pointer-events:none;"></i>
            </div>`;
        }
        // INPUT: RADIO / CHECKBOX
        else if (data.type === 'radio' || data.type === 'checkbox') {
            html += `<div class="options-grid">`;
            if(Array.isArray(data.options)) {
                data.options.forEach((o, index) => {
                    const optId = `${uniqueId}_${index}`;
                    html += `
                    <label class="option-card" for="${optId}">
                        <input type="${data.type}" id="${optId}" name="${data.label}" value="${o}" ${data.type === 'radio' && data.required ? 'required' : ''}>
                        <div class="option-content">
                            <div class="option-marker"></div>
                            <span>${o}</span>
                        </div>
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
    
    // Loading State Button
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> &nbsp; Mengirim...`;
    btn.disabled = true;
    btn.style.opacity = '0.7';

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
            title: 'Terima Kasih!',
            text: 'Jawaban Anda telah berhasil kami rekam.',
            confirmButtonColor: '#2C2420',
            confirmButtonText: 'Tutup',
            backdrop: `rgba(44, 36, 32, 0.4)`
        }).then(() => {
            window.location.reload();
        });

    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Terjadi kesalahan saat mengirim data. Silakan coba lagi.',
            confirmButtonColor: '#d33'
        });
        
        // Reset Button
        btn.innerHTML = originalContent;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
});

init();
