document.addEventListener("DOMContentLoaded", function() {

    // --- 1. LOGIKA PEMUTAR MUSIK ---
    const musicPlayer = document.getElementById("music-player");
    const musicButton = document.getElementById("music-toggle-btn");
    musicPlayer.volume = 0.2;
    musicButton.addEventListener("click", function() {
        if (musicPlayer.paused) {
            musicPlayer.play();
            musicButton.classList.add("playing"); 
        } else {
            musicPlayer.pause();
            musicButton.classList.remove("playing"); 
        }
    });

    // --- 2. ANIMASI FADE-IN SAAT SCROLL ---
    const animatedElements = document.querySelectorAll(".scroll-fade");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // [FIX] 'isIntersecting' sudah benar
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 });
    animatedElements.forEach(el => { observer.observe(el); });

    // --- 3. LOGIKA MENU HAMBURGER ---
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');

    function closeMenu() {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
    }

    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // --- 4. ANIMASI STATS COUNTER ---
    const statCounters = document.querySelectorAll('.stat-counter');
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3); 
    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; 
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const easedPercentage = easeOutCubic(percentage);
            const current = Math.floor(easedPercentage * target);
            counter.innerText = current;
            if (percentage < 1) {
                window.requestAnimationFrame(step);
            } else {
                counter.innerText = target; 
            }
        };
        window.requestAnimationFrame(step);
    };
    const counterObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter); 
                obs.unobserve(counter); 
            }
        });
    }, { threshold: 0.7 }); 
    statCounters.forEach(counter => {
        counterObserver.observe(counter);
    });


    // --- 
    // [LOGIKA CANVAS FINAL]
    // ---
    const canvas = document.getElementById('starrySkyCanvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let constellationLines = [];
    const NUM_STARS = 400; 
    const MAX_CONSTELLATION_SIZE = 5; // 1 pusat + 4 bintang
    const CONSTELLATION_COUNT = 5; // Jumlah cluster rasi bintang

    // Ambil warna dari CSS
    const LATTE_FOAM_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-latte-foam').trim();
    const MOKKA_ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-mokka-accent').trim();
    const NIGHT_SKY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-night-sky-dark').trim();

    // Fungsi untuk mengubah ukuran canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init(); 
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Panggil saat inisialisasi

    // --- Kelas Bintang Statik ---
    class Star {
        constructor(x, y, radius, color) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.originalOpacity = 0.5 + Math.random() * 0.5; 
            this.opacity = this.originalOpacity;
            this.twinkleSpeed = 0.01 + Math.random() * 0.02;
            this.twinkleDirection = 1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = `rgba(249, 246, 242, ${this.opacity})`;
            ctx.fill();
        }

        update() {
            if (this.opacity > this.originalOpacity) {
                this.twinkleDirection = -1;
            } else if (this.opacity < 0.2) {
                this.twinkleDirection = 1;
            }
            this.opacity += this.twinkleSpeed * this.twinkleDirection;
            this.draw();
        }
    }

    // --- Kelas Bintang Jatuh ---
    class ShootingStar {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.speed = 5 + Math.random() * 5;
            this.angle = Math.PI / 4;
            this.opacity = 1;
            this.color = MOKKA_ACCENT_COLOR;
            this.trail = []; 
            this.trailLength = 15; 
        }

        draw() {
            for (let i = this.trail.length - 1; i > 0; i--) {
                const segment = this.trail[i];
                const prevSegment = this.trail[i - 1];
                ctx.beginPath();
                ctx.moveTo(segment.x, segment.y);
                ctx.lineTo(prevSegment.x, prevSegment.y);
                ctx.strokeStyle = `rgba(160, 124, 91, ${segment.opacity * (i / this.trailLength)})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        update() {
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
            this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
            this.opacity -= 0.02;
        }
    }

    // --- Inisialisasi Bintang dan Rasi Bintang ---
    function init() {
        stars = [];
        constellationLines = [];

        // 1. Buat Bintang Statik
        for (let i = 0; i < NUM_STARS; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let radius = 0.5 + Math.random() * 1;
            stars.push(new Star(x, y, radius, LATTE_FOAM_COLOR));
        }
        
        // 2. Buat Rasi Bintang (Logika Baru: Cluster)
        let constellationPoints = stars.slice(0, CONSTELLATION_COUNT * MAX_CONSTELLATION_SIZE);
        for (let i = 0; i < CONSTELLATION_COUNT; i++) {
            let constellationGroup = [];
            for (let j = 0; j < MAX_CONSTELLATION_SIZE; j++) {
                const star = constellationPoints[i * MAX_CONSTELLATION_SIZE + j];
                if(star) constellationGroup.push(star);
            }
            
            const centerStar = constellationGroup[0];
            if (!centerStar) continue; 

            for (let k = 1; k < constellationGroup.length; k++) {
                const otherStar = constellationGroup[k];
                constellationLines.push({
                    x1: centerStar.x, y1: centerStar.y,
                    x2: otherStar.x, y2: otherStar.y
                });
            }
        }
    }

    // --- Fungsi Animasi Utama (Loop) ---
    function animate() {
        requestAnimationFrame(animate);
        
        ctx.fillStyle = NIGHT_SKY_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gambar Rasi Bintang (dengan 'glow')
        ctx.strokeStyle = `rgba(160, 124, 91, 0.7)`; // Mokka (opacity 70%)
        ctx.lineWidth = 1; // 1 pixel
        ctx.shadowBlur = 4; // Efek 'glow'
        ctx.shadowColor = MOKKA_ACCENT_COLOR; // Warna glow

        constellationLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });

        ctx.shadowBlur = 0; // Matikan glow untuk elemen lain
        
        // Update Bintang Statik (kerlap-kerlip)
        stars.forEach(star => {
            star.update();
        });

        // Update Bintang Jatuh
        shootingStars.forEach((star, index) => {
            if (star.opacity <= 0 && star.trail.length === 0) {
                shootingStars.splice(index, 1);
            } else {
                star.update(); 
                star.draw(); 
            }
        });
    }

    // --- Interaktivitas (Klik untuk Bintang Jatuh) ---
    canvas.addEventListener('click', function(event) {
        for(let i=0; i < 3; i++) {
            shootingStars.push(new ShootingStar(event.clientX, event.clientY));
        }
    });

    // Panggil fungsi animasi (init() tidak perlu dipanggil di sini, sudah dipanggil oleh resizeCanvas)
    animate();
    
});