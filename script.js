// --- [ TUGAS 1, 4, 5 HANYA UNTUK DESKTOP (OPTIMASI) ] ---
// Cek jika ini bukan mobile (lebar layar lebih dari 768px)
if (window.innerWidth > 768) {

    // --- [ TUGAS 1: EFEK GLOW KARTU SAAT HOVER ] ---
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

    // --- [ TUGAS 4: EFEK BACKGROUND SHIFT SAAT HOVER TEAM ] ---
    const teamCards = document.querySelectorAll('.profile-card[data-bg-color]');
    teamCards.forEach(card => {
        const colorClass = 'bg-shift-' ' + card.dataset.bgColor; 
        card.addEventListener('mouseenter', () => {
            document.body.classList.add(colorClass);
        });
        card.addEventListener('mouseleave', () => {
            document.body.classList.remove(colorClass);
        });
    });

    // --- [ TUGAS 5: EFEK POKEMON MELAYANG ] ---
    const pokemonImages = [
        'https://projectpokemon.org/images/sprites-models/xy-sprites/303.gif', // Mawile
        'https://projectpokemon.org/images/sprites-models/xy-sprites/094.gif', // Gengar
        'https://projectpokemon.org/images/sprites-models/xy-sprites/144.gif', // Articuno
        'https://projectpokemon.org/images/sprites-models/xy-sprites/145.gif', // Zapdos
        'https://projectpokemon.org/images/sprites-models/xy-sprites/146.gif', // Moltres
        'https://projectpokemon.org/images/sprites-models/xy-sprites/250.gif', // Ho-Oh
        'https://projectpokemon.org/images/sprites-models/xy-sprites/249.gif', // Lugia
        'https://projectpokemon.org/images/sprites-models/xy-sprites/384.gif', // Rayquaza
        'https://projectpokemon.org/images/sprites-models/xy-sprites/700.gif', // Sylveon
    ];

    function createFloatingPokemon() {
        const pokemon = document.createElement('img');
        pokemon.src = pokemonImages[Math.floor(Math.random() * pokemonImages.length)];
        pokemon.classList.add('floating-pokemon');
        pokemon.style.left = `${Math.random() * 100}vw`;
        pokemon.style.top = `${Math.random() * 20 + 10}vh`; 
        const randomSize = Math.random() * (120 - 60) + 60; 
        pokemon.style.width = `${randomSize}px`;
        pokemon.style.height = 'auto'; 
        const lifeDuration = Math.random() * (20 - 10) + 10; 
        const moveDuration = Math.random() * (15 - 8) + 8; 
        pokemon.style.animation = `fadeInOut ${lifeDuration}s forwards, floatMovement ${moveDuration}s ease-in-out infinite alternate`;
        document.body.appendChild(pokemon);
        setTimeout(() => {
            pokemon.remove();
        }, lifeDuration * 1000); 
    }

    setInterval(() => {
        if (document.querySelectorAll('.floating-pokemon').length < 5) {
            createFloatingPokemon();
        }
    }, Math.random() * (7000 - 3000) + 3000);

} // --- [ AKHIR DARI BLOK 'HANYA DESKTOP' ] ---


// --- [ TUGAS 2 & 3 (TETAP JALAN DI MOBILE) ] ---

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
