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


const navbar = document.querySelector('.navbar');
function handleScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}
window.addEventListener('scroll', handleScroll);


const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

document.addEventListener('DOMContentLoaded', () => {
    if (tabContents.length > 0) {
        tabContents[0].classList.add('active-tab');
    }
});

function handleTabClick(event) {
    const tabId = event.target.dataset.tab;

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active-tab'));
    
    event.target.classList.add('active');

    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.add('active-tab');
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', handleTabClick);
});


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
