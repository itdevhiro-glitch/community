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
    // [LOGIKA CANVAS "LENGKAP" DENGAN SEMUA BENTUK SENI]
    // ---
    const canvas = document.getElementById('starrySkyCanvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let constellationLines = [];
    const NUM_STARS = 400; // Jumlah bintang latar acak
    
    // [PERUBAHAN] Tentukan *semua* bentuk yang kita inginkan
    const SHAPE_TYPES = ['MUSIC_NOTE', 'FIVE_POINT_STAR', 'MICROPHONE'];
    const CONSTELLATION_COUNT = 7; // Total 7 rasi bintang (acak dari 3 tipe)

    // Ambil warna dari CSS
    const LATTE_FOAM_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-latte-foam').trim();
    const MOKKA_ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-mokka-accent').trim();
    const NIGHT_SKY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-night-sky-dark').trim();

    
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
    
    // ---
    // [LOGIKA RASI BINTANG "LENGKAP"]
    // ---
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
        
        // 2. Buat Rasi Bintang Berbentuk Khusus (Total 7, tipe acak)
        for (let i = 0; i < CONSTELLATION_COUNT; i++) {
            let shapeStars = [];
            let shapeLines = [];
            
            // [PERUBAHAN] Pilih bentuk acak dari array
            let randomShapeType = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];

            let startX = 100 + Math.random() * (canvas.width - 200);
            let startY = 100 + Math.random() * (canvas.height - 200);
            let size = 50 + Math.random() * 60; // Ukuran sedikit lebih kecil agar pas

            if (randomShapeType === "MUSIC_NOTE") {
                // Bentuk Not Musik
                shapeStars.push(new Star(startX, startY, 1.5, LATTE_FOAM_COLOR)); // Batang atas
                shapeStars.push(new Star(startX, startY + size * 0.6, 1.5, LATTE_FOAM_COLOR)); // Batang bawah
                shapeStars.push(new Star(startX + size * 0.2, startY + size * 0.6, 2, LATTE_FOAM_COLOR)); // Kepala not
                shapeStars.push(new Star(startX + size * 0.2, startY + size * 0.3, 1.5, LATTE_FOAM_COLOR)); // Ekor
                
                shapeLines.push({x1: shapeStars[0].x, y1: shapeStars[0].y, x2: shapeStars[1].x, y2: shapeStars[1].y}); // Batang
                shapeLines.push({x1: shapeStars[1].x, y1: shapeStars[1].y, x2: shapeStars[2].x, y2: shapeStars[2].y}); // ke kepala
                shapeLines.push({x1: shapeStars[2].x, y1: shapeStars[2].y, x2: shapeStars[3].x, y2: shapeStars[3].y}); // ke ekor

            } else if (randomShapeType === "FIVE_POINT_STAR") {
                // Bentuk Bintang Berujung Lima
                let numPoints = 5;
                let outerRadius = size * 0.6;
                let innerRadius = size * 0.25;
                let angleOffset = -Math.PI / 2; 

                for (let k = 0; k < numPoints * 2; k++) {
                    let radius = (k % 2 == 0) ? outerRadius : innerRadius;
                    let angle = angleOffset + k * Math.PI / numPoints;
                    let x = startX + Math.cos(angle) * radius;
                    let y = startY + Math.sin(angle) * radius;
                    shapeStars.push(new Star(x, y, 1.5, LATTE_FOAM_COLOR));
                }
                
                // Hubungkan titik untuk Bintang 5 sudut
                for(let k = 0; k < shapeStars.length; k++) {
                    let nextIndex = (k + 4) % shapeStars.length; // Lompat 4 titik (untuk bintang 5 sudut)
                    if (k % 2 == 0) { // Hanya gambar garis dari titik luar
                         shapeLines.push({
                            x1: shapeStars[k].x, y1: shapeStars[k].y,
                            x2: shapeStars[nextIndex].x, y2: shapeStars[nextIndex].y
                         });
                    }
                }

            } else if (randomShapeType === "MICROPHONE") {
                // [BARU] Bentuk Mikrofon Retro
                shapeStars.push(new Star(startX + size * 0.2, startY, 1.5, LATTE_FOAM_COLOR)); // Atas
                shapeStars.push(new Star(startX, startY + size * 0.2, 1.5, LATTE_FOAM_COLOR)); // Kiri
                shapeStars.push(new Star(startX + size * 0.4, startY + size * 0.2, 1.5, LATTE_FOAM_COLOR)); // Kanan
                shapeStars.push(new Star(startX + size * 0.2, startY + size * 0.4, 2, LATTE_FOAM_COLOR)); // Bawah/Leher (besar)
                shapeStars.push(new Star(startX + size * 0.2, startY + size * 0.8, 1.5, LATTE_FOAM_COLOR)); // Batang bawah
                
                // Garis kepala mic
                shapeLines.push({x1: shapeStars[0].x, y1: shapeStars[0].y, x2: shapeStars[1].x, y2: shapeStars[1].y});
                shapeLines.push({x1: shapeStars[1].x, y1: shapeStars[1].y, x2: shapeStars[3].x, y2: shapeStars[3].y});
                shapeLines.push({x1: shapeStars[3].x, y1: shapeStars[3].y, x2: shapeStars[2].x, y2: shapeStars[2].y});
                shapeLines.push({x1: shapeStars[2].x, y1: shapeStars[2].y, x2: shapeStars[0].x, y2: shapeStars[0].y});
                // Garis batang mic
                shapeLines.push({x1: shapeStars[3].x, y1: shapeStars[3].y, x2: shapeStars[4].x, y2: shapeStars[4].y});
            }
            
            // Tambahkan bintang dan garis baru ke daftar global
            stars.push(...shapeStars);
            constellationLines.push(...shapeLines);
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
