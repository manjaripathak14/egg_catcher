
const gameArea = document.getElementById("gameArea");
const video = document.getElementById("webcam");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const messageElement = document.getElementById("gameMessage");
const cameraStatus = document.getElementById("cameraStatus");

const basket1 = document.getElementById("basket1");
const basket2 = document.getElementById("basket2");

const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const maxScoreElement = document.getElementById("maxScore");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const restartButton2 = document.getElementById("restartButton2");
const backButton = document.getElementById("backButton");

// -------------------- GAME SETTINGS --------------------

let score = 0;
let lives = 3;

let maxScore = Number(localStorage.getItem("eggMaxScore")) || 0;

let gameRunning = false;
let cameraStarted = false;

let eggs = [];
let lastSpawnTime = 0;
let animationFrameId = null;
let previousTime = 0;

const MIN_EGG_SPEED = 260;
const MAX_EGG_SPEED = 390;
const SPAWN_INTERVAL = 750;

let smoothX1 = null;
let smoothX2 = null;
let smoothY1 = null;
let smoothY2 = null;

const SMOOTHING = 0.22;

// -------------------- DISPLAY --------------------

function updateDisplay() {
    scoreElement.textContent = score;
    livesElement.textContent = "❤️ ".repeat(lives).trim();
    maxScoreElement.textContent = maxScore;
}

function updateMaxScore() {
    if (score > maxScore) {
        maxScore = score;
        localStorage.setItem("eggMaxScore", maxScore);
    }

    maxScoreElement.textContent = maxScore;
}

// -------------------- CREATE EGGS --------------------

function createEgg() {
    if (!gameRunning) return;

    const egg = document.createElement("img");

    const random = Math.random();

    let points;
    let image;

    if (random < 0.5) {
        points = 5;
        image = "assets/eggw.png";
    } else if (random < 0.85) {
        points = 10;
        image = "assets/eggb.png";
    } else {
        points = 20;
        image = "assets/egggo.png";
    }

    egg.src = image;
    egg.alt = "Falling egg";
    egg.className = "falling-egg";

    const areaWidth = gameArea.clientWidth;
    const eggSize = 48;

    const x = Math.random() * Math.max(1, areaWidth - eggSize);

    egg.style.position = "absolute";
    egg.style.width = `${eggSize}px`;
    egg.style.height = "auto";
    egg.style.left = `${x}px`;
    egg.style.top = "-60px";
    egg.style.zIndex = "4";
    egg.style.pointerEvents = "none";

    gameArea.appendChild(egg);

    eggs.push({
        element: egg,
        x: x,
        y: -60,
        points: points,
        speed: MIN_EGG_SPEED +
            Math.random() * (MAX_EGG_SPEED - MIN_EGG_SPEED),
        size: eggSize
    });
}

// -------------------- COLLISION --------------------

function isColliding(egg, basket) {
    const eggRect = egg.element.getBoundingClientRect();
    const basketRect = basket.getBoundingClientRect();

    // Check if the egg overlaps the basket area.
    return (
        eggRect.right > basketRect.left + 15 &&
        eggRect.left < basketRect.right - 15 &&
        eggRect.bottom > basketRect.top + 10 &&
        eggRect.top < basketRect.bottom
    );
}

function removeEgg(index) {
    eggs[index].element.remove();
    eggs.splice(index, 1);
}

// -------------------- GAME LOOP --------------------

function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (!previousTime) previousTime = timestamp;

    const deltaTime = Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;

    if (timestamp - lastSpawnTime > SPAWN_INTERVAL) {
        createEgg();
        lastSpawnTime = timestamp;
    }

    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];

        egg.y += egg.speed * deltaTime;
        egg.element.style.top = `${egg.y}px`;

        if (isColliding(egg, basket1) || isColliding(egg, basket2)) {
            score += egg.points;
            updateMaxScore();
            updateDisplay();
            removeEgg(i);
            continue;
        }

        if (egg.y > gameArea.clientHeight) {
            removeEgg(i);
            lives--;
            updateDisplay();

            if (lives <= 0) {
                endGame();
                return;
            }
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// -------------------- START / END --------------------

function startGame() {
    score = 0;
    lives = 3;

    eggs.forEach(egg => egg.element.remove());
    eggs = [];

    updateDisplay();

    gameRunning = true;
    previousTime = 0;
    lastSpawnTime = 0;

    gameOverScreen.classList.add("hidden");
    messageElement.textContent = "Catch the eggs! 🥚";

    basket1.style.display = "block";
    basket2.style.display = "block";

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    if (!cameraStarted) {
        startCamera();
    }
}

function endGame() {
    gameRunning = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    finalScoreElement.textContent = score;
    updateMaxScore();
    gameOverScreen.classList.remove("hidden");

    messageElement.textContent = "Game over! Try again 🎮";
}

function restartGame() {
    startGame();
}

// -------------------- HAND TRACKING --------------------

function onHandResults(results) {
    if (!results.multiHandLandmarks || !gameRunning) return;

    const hands = results.multiHandLandmarks;
    const areaWidth = gameArea.clientWidth;
    const areaHeight = gameArea.clientHeight;

    // First hand
    if (hands[0]) {
        const finger = hands[0][8];

        const targetX = (1 - finger.x) * areaWidth;
        const targetY = finger.y * areaHeight;

        smoothX1 = smoothX1 === null
            ? targetX
            : smoothX1 + (targetX - smoothX1) * SMOOTHING;

        smoothY1 = smoothY1 === null
            ? targetY
            : smoothY1 + (targetY - smoothY1) * SMOOTHING;

        basket1.style.display = "block";
        basket1.style.left = `${smoothX1}px`;
        basket1.style.top = `${Math.min(areaHeight - 50, smoothY1 + 15)}px`;
    } else {
        basket1.style.display = "none";
    }

    // Second hand
    if (hands[1]) {
        const finger = hands[1][8];

        const targetX = (1 - finger.x) * areaWidth;
        const targetY = finger.y * areaHeight;

        smoothX2 = smoothX2 === null
            ? targetX
            : smoothX2 + (targetX - smoothX2) * SMOOTHING;

        smoothY2 = smoothY2 === null
            ? targetY
            : smoothY2 + (targetY - smoothY2) * SMOOTHING;

        basket2.style.display = "block";
        basket2.style.left = `${smoothX2}px`;
        basket2.style.top = `${Math.min(areaHeight - 50, smoothY2 + 15)}px`;
    } else {
        basket2.style.display = "none";
    }
}

// -------------------- CAMERA --------------------

async function startCamera() {
    if (cameraStarted) return;

    try {
        cameraStatus.textContent = "Camera: Starting...";

        const hands = new Hands({
            locateFile: file =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        hands.onResults(onHandResults);

        const camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: 640,
            height: 480
        });

        await camera.start();

        cameraStarted = true;
        cameraStatus.textContent = "Camera: On ✅";
    } catch (error) {
        console.error("Camera error:", error);
        cameraStatus.textContent =
            "Camera: Could not start. Check permission and localhost/HTTPS.";
    }
}

// -------------------- BUTTONS --------------------

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
restartButton2.addEventListener("click", restartGame);

backButton.addEventListener("click", () => {
    window.location.href = "index.html";
});

// -------------------- INITIAL SETUP --------------------

updateDisplay();

basket1.style.display = "none";
basket2.style.display = "none";
maxScoreElement.textContent = maxScore;