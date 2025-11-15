// --- [ TUGAS 1: EFEK GLOW KARTU SAAT HOVER ] ---

// [DIPERBARUI] Pilih SEMUA kartu interaktif (aktivitas AND team)
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


// --- [ TUGAS 3: ANIMASI ON-SCROLL DENGAN INTERSECTION OBSERVER ] ---
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
const elementsToFadeIn = document.querySelectorAll('.fade-in');
elementsToFadeIn.forEach(element => {
    observer.observe(element);
});


// --- [ TUGAS 4 BARU: EFEK BACKGROUND SHIFT SAAT HOVER TEAM ] ---
const teamCards = document.querySelectorAll('.profile-card[data-bg-color]');

teamCards.forEach(card => {
    const colorClass = 'bg-shift-' + card.dataset.bgColor; // hasilnya "bg-shift-primary"

    card.addEventListener('mouseenter', () => {
        document.body.classList.add(colorClass);
    });
    
    card.addEventListener('mouseleave', () => {
        document.body.classList.remove(colorClass);
    });
});

