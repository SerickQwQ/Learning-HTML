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