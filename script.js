$(document).ready(function() {
    const $gameBoard    = $('#gameBoard');
    const $movesDisplay = $('#moves');
    const $timerDisplay = $('#timer');
    const $bgm          = $('#bgm');
    const $volumeSlider = $('#volumeSlider');
    const $muteBtn      = $('#muteBtn');
    
    let deck           = [];
    let flipped        = [];
    let moves          = 0;
    let timeElapsed    = 0;
    let timerInterval  = null;
    let gameStarted    = false;
    let isPaused       = false;
    let isProcessing   = false;
    let isCountingDown = false;
    let isSliding      = false;
    let canSwitchScene = true;
    let currentScene   = 0;

    const scenes = [
        {
            images: ['img/01_一般/01_綠水靈.png', 'img/01_一般/02_菇菇寶貝.png', 'img/01_一般/03_緞帶肥肥.png', 'img/01_一般/04_大眼鴨.png', 'img/01_一般/05_小仙人掌.png', 'img/01_一般/06_沙漠蛇.png', 'img/01_一般/07_猴子.png', 'img/01_一般/08_毒河豚.png', 'img/01_一般/09_豪豬.png', 'img/01_一般/10_邪惡綿羊.png'],
            bgm: 'audio/01_一般/maplestory_bg.mp3',
            background: 'img/01_一般/maplestory_bg.jpg'
        },
        {
            images: ['img/02_水世界/01_綠海馬.png', 'img/02_水世界/02_獨角尼莫.png', 'img/02_水世界/03_黃金海馬.png', 'img/02_水世界/04_泡泡魚.png', 'img/02_水世界/05_花鯰魚.png', 'img/02_水世界/06_活跳蝦.png', 'img/02_水世界/07_蒙面河豚.png', 'img/02_水世界/08_短牙海豹.png', 'img/02_水世界/09_長牙海豹.png', 'img/02_水世界/10_致命烏賊怪.png'],
            bgm: 'audio/02_水世界/maplestory_bg.mp3',
            background: 'img/02_水世界/maplestory_bg.png'
        },
        {
            images: ['img/03_神木村/01_化石龍.png', 'img/03_神木村/02_噴火龍.png', 'img/03_神木村/03_幼年龍.png', 'img/03_神木村/04_黑翼龍.png', 'img/03_神木村/05_藍翼龍.png', 'img/03_神木村/06_進化迅猛龍.png', 'img/03_神木村/07_獨角迅猛龍.png', 'img/03_神木村/08_暗黑三角龍.png', 'img/03_神木村/09_藍色雙角龍.png', 'img/03_神木村/10_格瑞芬多.png'],
            bgm: 'audio/03_神木村/maplestory_bg.mp3',
            background: 'img/03_神木村/maplestory_bg.png'
        },
        {
            images: ['img/04_玩具城/01_褐色發條熊.png', 'img/04_玩具城/02_兔子鼓手.png', 'img/04_玩具城/03_粉紅色戰鬥機.png', 'img/04_玩具城/04_粉紅發條熊.png', 'img/04_玩具城/05_積木泥人.png', 'img/04_玩具城/06_發條貓熊.png', 'img/04_玩具城/07_發條楓葉鼠.png', 'img/04_玩具城/08_機器章魚.png', 'img/04_玩具城/09_藍色戰鬥機.png', 'img/04_玩具城/10_鼬鼠鬧鐘.png'],
            bgm: 'audio/04_玩具城/maplestory_bg.mp3',
            background: 'img/04_玩具城/maplestory_bg.png'
        },
        {
            images: ['img/05_日本神社/01_下忍.png', 'img/05_日本神社/02_河童.png', 'img/05_日本神社/03_女忍.png', 'img/05_日本神社/04_上忍.png', 'img/05_日本神社/05_雪女.png', 'img/05_日本神社/06_忍者頭目.png', 'img/05_日本神社/07_天狗.png', 'img/05_日本神社/08_鎧甲武士.png', 'img/05_日本神社/09_妖媚歌姬.png', 'img/05_日本神社/10_天皇.png'],
            bgm: 'audio/05_日本神社/maplestory_bg.mp3',
            background: 'img/05_日本神社/maplestory_bg.png'
        }
    ];

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function createBoard(showAll = true) {
        $gameBoard.empty();
        const sceneImages = scenes[currentScene].images;
        deck = [...sceneImages, ...sceneImages];            
        if (!showAll) shuffle(deck);

        deck.forEach(src => {
            const $container = $('<div class="card-container"></div>');
            const $inner = $(`<div class="card-inner" data-img="${src}"></div>`);
            const $front = $('<div class="card-front"></div>').append(`<img src="${src}" alt="card">`);
            const $back = $('<div class="card-back"></div>');
            $inner.append($front, $back).on('click', function() {
                if (!gameStarted || isPaused) return;
                handleFlip($(this));
            });
            $container.append($inner);
            $gameBoard.append($container);
            if (showAll) $inner.addClass('flipped');
        });
        moves = 0; $movesDisplay.text(moves);
        flipped = []; timeElapsed = 0; updateTimerDisplay();            
    }

    function handleFlip($card) {
        if (isProcessing || flipped.length === 2 || $card.hasClass('flipped') || $card.hasClass('matched')) return;
        $card.addClass('flipped');
        flipped.push($card);
        if (flipped.length === 2) {
            moves++; $movesDisplay.text(moves);
            isProcessing = true;
            setTimeout(() => checkMatch(flipped[0], flipped[1]), 500);
        }
    }

    function checkMatch($a, $b) {
        if ($a.data('img') === $b.data('img')) {
            $a.addClass('matched success'); $b.addClass('matched success');
            createLottieEffect($a); createLottieEffect($b);
            setTimeout(() => {
                $a.removeClass('success'); $b.removeClass('success');
                isProcessing = false; checkWin();
            }, 1000);
        } else {
            $a.addClass('fail'); $b.addClass('fail');
            setTimeout(() => {
                $a.removeClass('flipped fail'); $b.removeClass('flipped fail');
                isProcessing = false;
            }, 800);
        }
        flipped = [];
    }

    function checkWin() {
        if ($('.card-inner.flipped').length === deck.length) {
            stopTimer();
            $('#finalMovesWin').text(moves); $('#finalTimeWin').text($timerDisplay.text());
            new bootstrap.Modal('#winModal').show();
            $('#pauseBtn').prop('disabled', true); $('#startBtn').prop('disabled', false);
            canSwitchScene = true;
        }
    }

    async function dealAnimation() {
        const $cards = $('.card-inner');
        const boardRect = $gameBoard[0].getBoundingClientRect();
        const centerX = boardRect.width / 2;
        const centerY = boardRect.height / 2;

        $cards.each(function(i) {
            const rect = this.getBoundingClientRect();
            const dx = centerX - (rect.left - boardRect.left + rect.width / 2);
            const dy = centerY - (rect.top - boardRect.top + rect.height / 2);
            $(this).css({
                'transition': 'transform 0.6s ease',
                'transform': `translate(${dx}px, ${dy}px) rotate(${Math.random()*20-10}deg)`,
                'z-index': i
            });
        });

        await new Promise(r => setTimeout(r, 700));
        shuffle(deck);

        for (let i = 0; i < $cards.length; i++) {
            $cards.eq(i).css({ 'transform': 'translate(0,0) rotate(0deg)', 'z-index': 0 });
            await new Promise(r => setTimeout(r, 100));
        }

        $cards.each(function() {
            $(this).css({ 'transition': '', 'transform': '', 'z-index': '' });
        });
    }

    async function previewCards() {
        const $cards = $('.card-inner');
        for (let i = 0; i < $cards.length; i++) {
            $cards.eq(i).addClass('flipped');
            await new Promise(r => setTimeout(r, 500));
            $cards.eq(i).removeClass('flipped');
            await new Promise(r => setTimeout(r, 200));
        }
    }

    async function startGameSequence() {
        if (isCountingDown || isProcessing) return;
        canSwitchScene = false; gameStarted = false;
        $('#pauseBtn').prop('disabled', true); $('#startBtn').prop('disabled', true);

        const $alreadyFlipped = $('.card-inner.flipped');
        if ($alreadyFlipped.length > 0) {
            for (let i = 0; i < $alreadyFlipped.length; i++) {
                $alreadyFlipped.eq(i).removeClass('flipped');
                await new Promise(r => setTimeout(r, 150));
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        stopTimer(true); createBoard(false);
        await dealAnimation();
        await startCountdown(3);
        await previewCards();

        gameStarted = true; startTimer();
        $('#pauseBtn').prop('disabled', false);
    }

    async function startCountdown(seconds) {
        if (isCountingDown) return;
        isCountingDown = true;
        const $el = $('#countdown'); $el.show();
        for (let i = seconds; i > 0; i--) {
            $el.text(i).removeClass('countdown-animate');
            void $el[0].offsetWidth; 
            $el.addClass('countdown-animate');
            await new Promise(r => setTimeout(r, 1000));
        }
        $el.hide(); isCountingDown = false;
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => { timeElapsed++; updateTimerDisplay(); }, 1000);
    }

    function stopTimer(reset = false) {
        clearInterval(timerInterval); timerInterval = null;
        if (reset) { timeElapsed = 0; updateTimerDisplay(); }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timeElapsed / 60);
        const secs = (timeElapsed % 60).toString().padStart(2, '0');
        $timerDisplay.text(`${mins}:${secs}`);
    }

    function createLottieEffect($card) {
        const $container = $('<div class="lottie-effect"></div>');
        $card.append($container);
        lottie.loadAnimation({
            container: $container[0], renderer: 'svg', loop: false, autoplay: true,
            path: 'animations/sparkle.json'
        });
        setTimeout(() => $container.remove(), 1500);
    }

    $('#startBtn').on('click', () => { $bgm[0].play().catch(() => {}); startGameSequence(); });

    $('#pauseBtn').on('click', function() {
        if (!gameStarted) return;
        isPaused = !isPaused;
        if (isPaused) { $bgm[0].pause(); stopTimer(false); new bootstrap.Modal('#pauseModal').show(); }
        else { $bgm[0].play(); startTimer(); }
    });

    $('#giveUpBtn').on('click', function() {
        stopTimer(false); $bgm[0].play();
        gameStarted = false; isPaused = false;
        $('#finalMovesFail').text(moves); $('#finalTimeFail').text($timerDisplay.text());
        $('#finalPairsFail').text($('.card-inner.matched').length / 2);
        new bootstrap.Modal('#failModal').show();
        $('#pauseBtn').prop('disabled', true); $('#startBtn').prop('disabled', false); canSwitchScene = true;
    });

    async function switchScene(direction) {
        if (!canSwitchScene || isSliding) return;
        isSliding = true;
        const offset = direction === 'left' ? 100 : -100;
        currentScene = direction === 'left' ? (currentScene - 1 + scenes.length) % scenes.length : (currentScene + 1) % scenes.length;
        $bgm.attr('src', scenes[currentScene].bgm)[0].play();
        $('body').css('background-image', `url('${scenes[currentScene].background}')`);
        const $wrapper = $('#sceneWrapper');
        $wrapper.css({ 'transition': 'transform 0.6s ease', 'transform': `translateX(${offset}vw)` });
        await new Promise(r => setTimeout(r, 300));
        $wrapper.css({ 'transition': '', 'transform': '' });
        createBoard(true); isSliding = false;
    }

    $('#leftSceneBtn').on('click', () => switchScene('left'));
    $('#rightSceneBtn').on('click', () => switchScene('right'));

    $volumeSlider.on('input', function() {
        const val = $(this).val(); $bgm[0].volume = val / 100;
        $muteBtn.text(val == 0 ? "🔇" : "🔊");
    });

    $muteBtn.on('click', function() {
        const isMuted = $bgm[0].muted; $bgm[0].muted = !isMuted;
        $(this).text(!isMuted ? "🔇" : "🔊");
        $volumeSlider.val(!isMuted ? 0 : $bgm[0].volume * 100);
    });

    $('#playAgainWinBtn, #playAgainFailBtn').on('click', () => startGameSequence());

    createBoard(true);
});