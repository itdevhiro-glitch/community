import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const formConfigCol = collection(db, "form_config");
const submissionsCol = collection(db, "form_submissions");

const container = document.getElementById('form-fields-container');
let formFields = [];

async function renderForm() {
    try {
        const q = query(formConfigCol, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        
        if(snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;">Form belum dikonfigurasi oleh Admin.</p>';
            document.getElementById('btn-submit-form').style.display = 'none';
            return;
        }

        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            formFields.push(data.label);
            
            const wrapper = document.createElement('div');
            wrapper.className = 'input-group-modern';
            
            let inputHtml = '';
            if(data.type === 'textarea') {
                inputHtml = `<textarea name="${data.label}" class="input-clean" rows="4" placeholder="${data.label}..." required></textarea>`;
            } else {
                inputHtml = `<input type="${data.type}" name="${data.label}" class="input-clean" placeholder="${data.label}" required>`;
            }

            wrapper.innerHTML = `
                <label>${data.label}</label>
                ${inputHtml}
            `;
            container.appendChild(wrapper);
        });

    } catch (error) {
        console.error("Error loading form:", error);
        container.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat form.</p>';
    }
}

document.getElementById('public-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-submit-form');
    const formData = new FormData(e.target);
    const dataToSave = {};

    formData.forEach((value, key) => {
        dataToSave[key] = value;
    });

    dataToSave.submittedAt = new Date();

    btn.innerText = "Mengirim...";
    btn.disabled = true;

    try {
        await addDoc(submissionsCol, dataToSave);
        
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Data Anda telah terkirim.',
            confirmButtonColor: '#2C2420'
        }).then(() => {
            window.location.reload();
        });

    } catch (error) {
        console.error("Submit error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Gagal mengirim data. Coba lagi nanti.'
        });
        btn.innerText = "Kirim Data";
        btn.disabled = false;
    }
});

renderForm();