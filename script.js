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
    // [LOGIKA CANVAS "VECTOR SHAPE" - PERBAIKAN TOTAL]
    // ---
    const canvas = document.getElementById('starrySkyCanvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let constellationLines = [];
    const NUM_STARS = 400; // Bintang latar
    const CONSTELLATION_COUNT = 7; // Total bentuk rasi bintang

    // Ambil warna dari CSS
    const LATTE_FOAM_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-latte-foam').trim();
    const MOKKA_ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-mokka-accent').trim();
    const NIGHT_SKY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-night-sky-dark').trim();

    
    // ---
    // Perpustakaan Bentuk Vektor
    // ---
    const shapeLibrary = {
        
        "MICROPHONE": {
            points: [
                [-0.2, -0.8], [0.2, -0.8], [0.5, -0.5], [0.5, -0.1], // Kepala (4)
                [0.2, 0.2], [-0.2, 0.2], [-0.5, -0.1], [-0.5, -0.5], // Kepala (4)
                [-0.1, 0.2], [0.1, 0.2], [-0.1, 1.0], [0.1, 1.0] // Leher & Batang (4)
            ],
            lines: [
                [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], // Kepala
                [5, 8], [4, 9], [8, 9], // Leher
                [8, 10], [9, 11], [10, 11] // Batang
            ]
        },
        
        "PAINTBRUSH": {
            points: [
                [-0.1, -1.0], [0.1, -1.0], [0.1, 0.0], [-0.1, 0.0], // Gagang (4)
                [-0.2, 0.0], [0.2, 0.0], [0.2, 0.2], [-0.2, 0.2], // Ferrule/Logam (4)
                [-0.2, 0.2], [0.0, 0.8], [0.2, 0.2] // Kuas/Bulu (3)
            ],
            lines: [
                [0, 1], [1, 2], [2, 3], [3, 0], // Gagang
                [3, 4], [2, 5], [4, 7], [5, 6], [6, 7], // Ferrule
                [8, 9], [9, 10] // Kuas
            ]
        },

        "MUSIC_NOTE_COMPLEX": { // Not Seperenambelas
            points: [
                [-0.4, 0.8], [0.0, 0.5], [0.4, 0.8], [0.0, 1.1], // Kepala Not (4)
                [0.4, 0.8], [0.4, -1.0], // Batang (2)
                [0.4, -1.0], [0.8, -0.8], // Bendera 1 (2)
                [0.4, -0.8], [0.8, -0.6]  // Bendera 2 (2)
            ],
            lines: [
                [0, 1], [1, 2], [2, 3], [3, 0], // Kepala Not
                [4, 5], // Batang
                [6, 7], // Bendera 1
                [8, 9]  // Bendera 2
            ]
        }
    };
    
    // Ambil daftar nama bentuk
    const SHAPE_KEYS = Object.keys(shapeLibrary);


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


    // --- Fungsi Inisialisasi dan Animasi ---
    
    // Fungsi untuk mengubah ukuran canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init(); 
    }
    
    // Logika Init menggunakan Vector Library
    function init() {
        stars = [];
        constellationLines = [];

        // 1. Buat Bintang Latar Acak
        for (let i = 0; i < NUM_STARS; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let radius = 0.5 + Math.random() * 1;
            stars.push(new Star(x, y, radius, LATTE_FOAM_COLOR));
        }
        
        // 2. Buat Rasi Bintang Berbentuk (Total 7, tipe acak)
        for (let i = 0; i < CONSTELLATION_COUNT; i++) {
            
            // Pilih bentuk acak dari perpustakaan
            let shapeKey = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
            let shape = shapeLibrary[shapeKey];
            let currentShapeStars = []; // Array lokal untuk menyimpan bintang bentuk ini

            // Tentukan posisi acak & ukuran
            let startX = Math.random() * canvas.width;
            let startY = Math.random() * canvas.height;
            let size = 50 + Math.random() * 40; // Ukuran rasi bintang

            // Buat Bintang: Loop melalui 'points' bentuk
            shape.points.forEach(p => {
                // Hitung posisi x,y asli di layar
                let x = startX + p[0] * size;
                let y = startY + p[1] * size;
                
                let star = new Star(x, y, 1.5, LATTE_FOAM_COLOR); // Bintang rasi lebih besar
                stars.push(star); // Tambahkan ke daftar global untuk digambar
                currentShapeStars.push(star); // Tambahkan ke daftar lokal untuk dihubungkan
            });

            // Buat Garis: Loop melalui 'lines' bentuk
            shape.lines.forEach(line => {
                let star1 = currentShapeStars[line[0]]; // Titik mulai
                let star2 = currentShapeStars[line[1]]; // Titik akhir

                // Pastikan kedua bintang ada
                if (star1 && star2) {
                    constellationLines.push({
                        x1: star1.x, y1: star1.y,
                        x2: star2.x, y2: star2.y
                    });
                }
            });
        }
    }

    // Fungsi Animasi Utama (Loop)
    function animate() {
        requestAnimationFrame(animate);
        
        ctx.fillStyle = NIGHT_SKY_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gambar Rasi Bintang (dengan 'glow')
        ctx.strokeStyle = `rgba(160, 124, 91, 0.7)`; 
        ctx.lineWidth = 1.5; 
        ctx.shadowBlur = 5; 
        ctx.shadowColor = MOKKA_ACCENT_COLOR; 

        constellationLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });

        ctx.shadowBlur = 0; // Matikan glow untuk elemen lain
        
        // Update Bintang Statik
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

    // --- Mulai Semuanya ---
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Panggil saat inisialisasi
    animate(); // Mulai loop animasi
    
});
