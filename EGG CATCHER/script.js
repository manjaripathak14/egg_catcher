/* =====================================================
   GRAB THE EGG
   HOME PAGE LOGIC
   ===================================================== */

"use strict";


const playButton = document.getElementById("playButton");


/*
    PLAY BUTTON
    ------------------------------------
    For now this sends the player to
    the How To Play page.

    We will create that page next.
*/

playButton.addEventListener("click", () => {

    playButton.disabled = true;

    playButton.querySelector(".play-text").textContent =
        "LET'S GO!";

    playButton.querySelector(".play-arrow").textContent =
        "→";


    setTimeout(() => {

        window.location.href =
            "how-to-play.html";

    }, 300);

});