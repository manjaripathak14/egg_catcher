
"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const video = document.getElementById("demoVideo");

const bucket1 = document.getElementById("fingerBucket");
const bucket2 = document.getElementById("fingerBucket2");

const buckets = [bucket1, bucket2];

const message = document.getElementById("demoMessage");
const statusText = document.getElementById("cameraStatus");

const watchDemo = document.getElementById("watchDemo");
const startButton = document.getElementById("startGame");
const backButton = document.getElementById("backButton");

let camera = null;
let hands = null;
let cameraStarted = false;


// ==========================================
// HELPER: SHOW MESSAGE
// ==========================================

function showMessage(text) {
    message.textContent = text;
    message.style.display = "block";
}


// ==========================================
// HIDE ALL BASKETS
// ==========================================

function hideBuckets() {
    buckets.forEach((bucket) => {
        bucket.style.display = "none";
    });
}


// ==========================================
// HANDLE HAND TRACKING RESULTS
// ==========================================

function onHandResults(results) {

    const detectedHands = results.multiHandLandmarks;

    // Hide both baskets before updating positions
    hideBuckets();

    // No hands detected
    if (!detectedHands || detectedHands.length === 0) {
        showMessage("SHOW YOUR FINGER 👆");
        return;
    }

    // Show a helpful message when only one hand is detected
    if (detectedHands.length === 1) {
        showMessage("SHOW YOUR OTHER HAND FOR BASKET 2 👋");
    } else {
        message.style.display = "none";
    }


    // Each detected hand controls one basket
    detectedHands.forEach((landmarks, index) => {

        // Only two baskets are available
        if (index >= buckets.length) return;

        const basket = buckets[index];

        // Index fingertip landmark
        const indexTip = landmarks[8];

        // Mirror X to match the mirrored camera preview
        const x = (1 - indexTip.x) * 100;
        const y = indexTip.y * 100;

        // Position basket at the fingertip
        basket.style.left = `${x}%`;
        basket.style.top = `${y}%`;

        basket.style.display = "block";
    });
}


// ==========================================
// START CAMERA DEMO
// ==========================================

async function startDemo() {

    if (cameraStarted) return;


    // Check secure context
    if (!window.isSecureContext) {

        statusText.textContent =
            "⚠️ Open this page using Live Server or HTTPS.";

        showMessage("PLEASE USE LOCALHOST OR HTTPS");

        return;
    }


    // Check camera availability
    if (!navigator.mediaDevices?.getUserMedia) {

        statusText.textContent =
            "⚠️ Camera access is unavailable in this browser.";

        showMessage("CAMERA NOT AVAILABLE");

        return;
    }


    // Check MediaPipe libraries
    if (
        typeof Hands === "undefined" ||
        typeof Camera === "undefined"
    ) {

        statusText.textContent =
            "⚠️ Hand-tracking libraries did not load.";

        showMessage("CHECK YOUR INTERNET CONNECTION");

        console.error("MediaPipe Hands or Camera library is missing.");

        return;
    }


    watchDemo.disabled = true;
    watchDemo.textContent = "STARTING CAMERA...";

    statusText.textContent =
        "📷 Requesting camera permission...";


    try {

        // Create MediaPipe Hands
        hands = new Hands({

            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`

        });


        // Allow detection of two hands
        hands.setOptions({

            maxNumHands: 2,

            modelComplexity: 1,

            minDetectionConfidence: 0.6,

            minTrackingConfidence: 0.5

        });


        // Process detected hands
        hands.onResults(onHandResults);


        // Start webcam
        camera = new Camera(video, {

            onFrame: async () => {

                if (hands && video.readyState >= 2) {
                    await hands.send({ image: video });
                }

            },

            width: 640,

            height: 480

        });


        await camera.start();

        cameraStarted = true;

        statusText.textContent =
            "🟢 CAMERA ON — SHOW YOUR INDEX FINGERS";

        showMessage("SHOW YOUR FINGER 👆");

        watchDemo.textContent = "CAMERA IS ON ✓";


    } catch (error) {

        console.error("Camera error:", error);

        statusText.textContent =
            "⚠️ Camera could not start. Check browser permission.";

        showMessage("ALLOW CAMERA ACCESS AND TRY AGAIN");

        watchDemo.disabled = false;

        watchDemo.textContent = "▶ TRY CAMERA AGAIN";

    }

}


// ==========================================
// BUTTON EVENTS
// ==========================================

watchDemo.addEventListener("click", startDemo);


backButton.addEventListener("click", () => {

    window.location.href = "index.html";

});


startButton.addEventListener("click", () => {

    window.location.href = "game.html";

});


// ==========================================
// INITIAL STATE
// ==========================================

hideBuckets();