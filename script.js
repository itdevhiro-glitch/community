// --- [ TUGAS 3: ANIMASI ON-SCROLL ] ---
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 
};
function observerCallback(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}
const observer = new IntersectionObserver(observerCallback, observerOptions);
// Menargetkan semua elemen yang memiliki class fade-in
const elementsToFadeIn = document.querySelectorAll('.fade-in');
elementsToFadeIn.forEach(element => {
    observer.observe(element);
});


// --- [ TUGAS 2: STATE NAVBAR SAAT SCROLL ] ---
const navbar = document.querySelector('.navbar');
function handleScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}
window.addEventListener('scroll', handleScroll);


// --- [ FUNGSI BARU: TAB SECTION INTERAKTIF ] ---
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Atur tab pertama sebagai aktif saat loading
document.addEventListener('DOMContentLoaded', () => {
    if (tabContents.length > 0) {
        tabContents[0].classList.add('active-tab');
    }
});

function handleTabClick(event) {
    const tabId = event.target.dataset.tab;

    // Hapus kelas 'active' dari semua tombol dan konten
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active-tab'));
    
    // Tambahkan kelas 'active' ke tombol yang diklik
    event.target.classList.add('active');

    // Tampilkan konten yang sesuai dengan ID tab
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active-tab');
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', handleTabClick);
});


// --- [ TUGAS 1: EFEK GLOW KARTU SAAT HOVER (Hanya berjalan saat mousemove) ] ---
// Cek jika ini bukan mobile (lebar layar lebih dari 768px)
if (window.innerWidth > 768) {
    const cards = document.querySelectorAll('.activity-card, .profile-card'); 
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', x + 'px');
            card.style.setProperty('--mouse-y', y + 'px');
        });
    });
}

// --- [ TUGAS 5: EFEK POKEMON MELAYANG (DIHAPUS TOTAL) ] ---
