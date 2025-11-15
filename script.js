// --- [ TUGAS 1: EFEK GLOW KARTU SAAT HOVER ] ---
const cards = document.querySelectorAll('.activity-card');

cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');
    });
});


// --- [ TUGAS 2: STATE NAVBAR SAAT SCROLL ] ---
const navbar = document.querySelector('.navbar');

// Fungsi untuk mengecek posisi scroll
function handleScroll() {
    if (window.scrollY > 50) {
        // Jika scroll lebih dari 50px, tambahkan class 'scrolled'
        navbar.classList.add('scrolled');
    } else {
        // Jika tidak, hapus class 'scrolled'
        navbar.classList.remove('scrolled');
    }
}

// Jalankan fungsi saat event 'scroll' terjadi
window.addEventListener('scroll', handleScroll);


// --- [ TUGAS 3: ANIMASI ON-SCROLL DENGAN INTERSECTION OBSERVER ] ---

// Opsi untuk Observer (kapan animasi harus trigger)
const observerOptions = {
    root: null, // 'root' null berarti viewport browser
    rootMargin: '0px',
    threshold: 0.1 // Trigger saat 10% elemen terlihat
};

// Fungsi yang akan dijalankan saat elemen terlihat
function observerCallback(entries, observer) {
    entries.forEach(entry => {
        // Jika elemen 'entry' sekarang terlihat (isIntersecting)
        if (entry.isIntersecting) {
            // Tambahkan class '.is-visible'
            entry.target.classList.add('is-visible');
            
            // Hentikan observasi pada elemen ini (hemat resource)
            observer.unobserve(entry.target);
        }
    });
}

// Buat Observer baru
const observer = new IntersectionObserver(observerCallback, observerOptions);

// Pilih semua elemen yang ingin dianimasikan
const elementsToFadeIn = document.querySelectorAll('.fade-in');

// Terapkan 'observe' pada setiap elemen
elementsToFadeIn.forEach(element => {
    observer.observe(element);
});
