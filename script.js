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
    // [LOGIKA CANVAS "MELAYANG-LAYANG" - PERBAIKAN TOTAL]
    // ---
    const canvas = document.getElementById('starrySkyCanvas');
    const ctx = canvas.getContext('2d');
    let stars = []; // Hanya bintang latar
    let shootingStars = [];
    let constellations = []; // [BARU] Array untuk objek rasi bintang
    const NUM_STARS = 400; // Bintang latar
    const CONSTELLATION_COUNT = 7; // Total bentuk rasi bintang

    // Ambil warna dari CSS
    const LATTE_FOAM_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-latte-foam').trim();
    const MOKKA_ACCENT_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-mokka-accent').trim();
    const NIGHT_SKY_COLOR = getComputedStyle(document.documentElement).getPropertyValue('--color-night-sky-dark').trim();

    
    // ---
    // Perpustakaan Bentuk Vektor (Tidak berubah)
    // ---
    const shapeLibrary = {
        "MICROPHONE": {
            points: [[-0.2, -0.8], [0.2, -0.8], [0.5, -0.5], [0.5, -0.1], [0.2, 0.2], [-0.2, 0.2], [-0.5, -0.1], [-0.5, -0.5], [-0.1, 0.2], [0.1, 0.2], [-0.1, 1.0], [0.1, 1.0]],
            lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [5, 8], [4, 9], [8, 9], [8, 10], [9, 11], [10, 11]]
        },
        "PAINTBRUSH": {
            points: [[-0.1, -1.0], [0.1, -1.0], [0.1, 0.0], [-0.1, 0.0], [-0.2, 0.0], [0.2, 0.0], [0.2, 0.2], [-0.2, 0.2], [-0.2, 0.2], [0.0, 0.8], [0.2, 0.2]],
            lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 5], [4, 7], [5, 6], [6, 7], [8, 9], [9, 10]]
        },
        "MUSIC_NOTE_COMPLEX": {
            points: [[-0.4, 0.8], [0.0, 0.5], [0.4, 0.8], [0.0, 1.1], [0.4, 0.8], [0.4, -1.0], [0.4, -1.0], [0.8, -0.8], [0.4, -0.8], [0.8, -0.6]],
            lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [6, 7], [8, 9]]
        }
    };
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
            this.draw(); // Update sekarang juga menggambar
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

    // ---
    // [KELAS BARU] Rasi Bintang yang Bisa Bergerak
    // ---
    class ConstellationShape {
        constructor(shapeKey, x, y, size) {
            this.shape = shapeLibrary[shapeKey];
            this.x = x; // Posisi pusat
            this.y = y;
            this.size = size;
            
            // Kecepatan melayang (delta x, delta y)
            this.dx = (Math.random() - 0.5) * 0.2; // Kecepatan acak yg sangat lambat
            this.dy = (Math.random() - 0.5) * 0.2;

            this.stars = []; // Bintang-bintang yang membentuk rasi ini
            this.buildShape();
        }

        buildShape() {
            // Buat bintang-bintang untuk bentuk ini
            this.shape.points.forEach(p => {
                let x = this.x + p[0] * this.size;
                let y = this.y + p[1] * this.size;
                this.stars.push(new Star(x, y, 1.5, LATTE_FOAM_COLOR));
            });
        }

        update() {
            // 1. Gerakkan posisi pusat rasi bintang
            this.x += this.dx;
            this.y += this.dy;

            // 2. Buat rasi bintang memantul di tepi layar (margin 100px)
            if (this.x < 100 || this.x > canvas.width - 100) {
                this.dx *= -1; // Balik arah horizontal
            }
            if (this.y < 100 || this.y > canvas.height - 100) {
                this.dy *= -1; // Balik arah vertikal
            }

            // 3. Gerakkan semua bintang di dalam rasi bintang ini
            this.stars.forEach(star => {
                star.x += this.dx;
                star.y += this.dy;
            });
        }

        draw() {
            // 1. Gambar garis penghubung
            ctx.strokeStyle = `rgba(160, 124, 91, 0.7)`; 
            ctx.lineWidth = 1.5; 
            ctx.shadowBlur = 5; 
            ctx.shadowColor = MOKKA_ACCENT_COLOR; 

            this.shape.lines.forEach(line => {
                let star1 = this.stars[line[0]];
                let star2 = this.stars[line[1]];
                if (star1 && star2) {
                    ctx.beginPath();
                    ctx.moveTo(star1.x, star1.y);
                    ctx.lineTo(star2.x, star2.y);
                    ctx.stroke();
                }
            });

            // 2. Gambar (dan update kerlip) bintang-bintangnya
            this.stars.forEach(star => {
                star.update(); // Panggil update() star, yg juga akan .draw()
            });

            ctx.shadowBlur = 0; // Matikan glow
        }
    }


    // --- Fungsi Inisialisasi dan Animasi ---
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init(); 
    }
    
    // ---
    // [LOGIKA INIT BARU - MEMBUAT OBJEK MELAYANG]
    // ---
    function init() {
        stars = [];
        constellations = []; // Kosongkan array rasi bintang

        // 1. Buat Bintang Latar Acak
        for (let i = 0; i < NUM_STARS; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let radius = 0.5 + Math.random() * 1;
            stars.push(new Star(x, y, radius, LATTE_FOAM_COLOR));
        }
        
        // 2. Buat Objek Rasi Bintang yang Melayang
        for (let i = 0; i < CONSTELLATION_COUNT; i++) {
            let shapeKey = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let size = 50 + Math.random() * 40; 
            
            // Buat objek baru dan masukkan ke array
            constellations.push(new ConstellationShape(shapeKey, x, y, size));
        }
    }

    // ---
    // [LOGIKA ANIMATE BARU - MENGGAMBAR 3 LAPISAN]
    // ---
    function animate() {
        requestAnimationFrame(animate);
        
        // 1. Bersihkan layar
        ctx.fillStyle = NIGHT_SKY_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Update & Gambar BINTANG LATAR (Latar Belakang)
        stars.forEach(star => {
            star.update();
        });

        // 3. Update & Gambar RASI BINTANG (Tengah)
        constellations.forEach(con => {
            con.update(); // Perbarui posisi melayang
            con.draw();   // Gambar garis & bintangnya
        });
        
        // 4. Update & Gambar BINTANG JATUH (Depan)
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
