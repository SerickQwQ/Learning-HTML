/* ================= Background music toggle ================= */
(function() {
    const audio = document.getElementById('bgm');
    const btn = document.getElementById('soundBtn');
    if (!audio || !btn) return;

    audio.volume = 0.35; // background level, not too loud
    const KEY = 'bgm-on';

    function setUI(on) {
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? '♪ Sound On' : '♪ Sound Off';
    }

    function tryPlay() {
        const p = audio.play();
        if (p && p.catch) {
            // Browser blocked autoplay (usually on first visit)
            p.catch(function() {
                setUI(false);
                localStorage.setItem(KEY, 'off');
            });
        }
    }

    btn.addEventListener('click', function() {
        if (audio.paused) {
            tryPlay();
            setUI(true);
            localStorage.setItem(KEY, 'on');
        } else {
            audio.pause();
            setUI(false);
            localStorage.setItem(KEY, 'off');
        }
    });

    // Remember the last choice; first visit defaults to off
    if (localStorage.getItem(KEY) === 'on') {
        setUI(true);
        tryPlay();
    } else {
        setUI(false);
    }
})();

/* ================= Interactive background ================= */
(function() {
    const canvas = document.getElementById('bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const GAP = 30; // distance between dots
    const R = 1.1; // base dot radius
    const HOVER = 130; // mouse influence radius

    let W = 0,
        H = 0;

    // current + target mouse position (eased)
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const ripples = []; // click ripples

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const now = performance.now();

        for (let x = GAP / 2; x < W; x += GAP) {
            for (let y = GAP / 2; y < H; y += GAP) {
                let r = R;
                let a = 0.16;

                // mouse glow
                const d = Math.hypot(x - mouse.x, y - mouse.y);
                if (d < HOVER) {
                    const t = 1 - d / HOVER;
                    r += 1.6 * t;
                    a += 0.30 * t;
                }

                // ripple rings
                for (let i = 0; i < ripples.length; i++) {
                    const rp = ripples[i];
                    const age = (now - rp.t) / 900; // 0 → 1
                    const ring = age * 220;
                    const dd = Math.abs(Math.hypot(x - rp.x, y - rp.y) - ring);
                    if (dd < 26) {
                        a += 0.28 * (1 - dd / 26) * (1 - age);
                    }
                }

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(17,17,17,' + a.toFixed(3) + ')';
                ctx.fill();
            }
        }
    }

    function tick() {
        let dirty = false;

        // ease towards the pointer
        const dx = mouse.tx - mouse.x;
        const dy = mouse.ty - mouse.y;
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
            mouse.x += dx * 0.16;
            mouse.y += dy * 0.16;
            dirty = true;
        }

        // drop finished ripples
        const now = performance.now();
        while (ripples.length && now - ripples[0].t > 900) {
            ripples.shift();
            dirty = true;
        }
        if (ripples.length) dirty = true;

        if (dirty) draw();

        requestAnimationFrame(tick);
    }

    if (!reduced) {
        window.addEventListener('pointermove', function(e) {
            mouse.tx = e.clientX;
            mouse.ty = e.clientY;
            if (mouse.x < -1000) { mouse.x = mouse.tx;
                mouse.y = mouse.ty; }
        }, { passive: true });

        window.addEventListener('pointerdown', function(e) {
            ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        }, { passive: true });

        document.documentElement.addEventListener('mouseleave', function() {
            mouse.tx = mouse.x = -9999;
            mouse.ty = mouse.y = -9999;
        });

        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    resize();
})();

/* ================= Page switching ================= */
(function() {
    const tabs = document.querySelectorAll('.tab');
    const pages = document.querySelectorAll('.page');

    function show(name) {
        pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + name));
        tabs.forEach(t => t.classList.toggle('active', t.dataset.page === name));
        history.replaceState(null, '', '#' + name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (name === 'game') {
            setTimeout(() => document.getElementById('guessInput').focus(), 320);
        }
    }

    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.page)));

    const initial = location.hash.slice(1);
    if (initial && document.getElementById('page-' + initial)) show(initial);
})();

/* ================= Useless Machine (guess 1–1000) ================= */
(function() {
    const MIN = 1,
        MAX = 1000;
    const $ = id => document.getElementById(id);

    const input = $('guessInput');
    const guessBtn = $('guessBtn');
    const resetBtn = $('resetBtn');
    const feedback = $('feedback');
    const countEl = $('count');
    const historyEl = $('history');

    let target, count, over;

    const setFeedback = (msg, type) => {
        feedback.textContent = msg;
        feedback.className = 'feedback ' + (type || '');
    };

    function addHistory(text, type) {
        const li = document.createElement('li');
        li.className = 'history-item ' + (type || '');
        li.textContent = text;
        historyEl.appendChild(li);
        historyEl.scrollTop = historyEl.scrollHeight;
    }

    function reset() {
        target = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
        count = 0;
        over = false;
        input.value = '';
        input.disabled = guessBtn.disabled = false;
        countEl.textContent = '0';
        historyEl.innerHTML = '';
        setFeedback(`I picked a whole number between ${MIN} and ${MAX}. Try to guess it ✨`);
    }

    function guess() {
        if (over) return;

        const n = Number(input.value.trim());
        if (!Number.isInteger(n) || n < MIN || n > MAX) {
            setFeedback(`Please enter a whole number between ${MIN} and ${MAX}.`, 'error');
            input.select();
            return;
        }

        countEl.textContent = ++count;

        if (n === target) {
            over = true;
            input.disabled = guessBtn.disabled = true;
            setFeedback(`🎉 Correct! The number was ${target}. You guessed it in ${count} tries.`, 'win');
            addHistory(`Guess ${count}: ${n} — correct!`, 'win');
            return;
        }

        const high = n > target;
        setFeedback(`${n} is too ${high ? 'high' : 'low'}. Try a ${high ? 'smaller' : 'bigger'} number ${high ? '👇' : '👆'}`, 'warn');
        addHistory(`Guess ${count}: ${n} — too ${high ? 'high' : 'low'}`, 'warn');
        input.value = '';
        input.focus();
    }

    guessBtn.addEventListener('click', guess);
    resetBtn.addEventListener('click', reset);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') guess(); });

    reset();
})();