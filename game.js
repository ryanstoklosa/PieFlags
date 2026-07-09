// game.js
// -------
// Core logic for PieFlags.
// Uses the global `flags` array from flag.js (Option A, no JSON/fetch).

// Game state variables
let currentFlag = null;      // currently active flag
let guessesLeft = 5;         // remaining guesses this round
let missedFlags = 0;         // total missed flags
let hintIndex = 0;           // which hint to show next (0,1,2)
let previousGuesses = [];    // wrong guesses this round
let unusedFlags = [];        // pool of flags not yet used in this cycle
let currentMode = "easy";   // default mode

// Fisher–Yates shuffle for randomizing flag order
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Draws the pie chart for the current flag's color distribution
function drawPieChart(colors) {
    const canvas = document.getElementById("pie-chart");
    const ctx = canvas.getContext("2d");

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sum of all color values (ratios)
    const total = Object.values(colors).reduce((a, b) => a + b, 0);
    let startAngle = 0;

    // Each entry: key = hex color, value = ratio
    Object.entries(colors).forEach(([hexColor, value]) => {
        const sliceAngle = (value / total) * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(150, 150); // center of canvas
        ctx.arc(150, 150, 150, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = hexColor;
        ctx.fill();

        startAngle += sliceAngle;
    });
}

// Builds the list of hints for a given flag
function getHints(flag) {
    const colors = Object.keys(flag.colors);
    const dominantColor = colors.reduce((a, b) =>
        flag.colors[a] > flag.colors[b] ? a : b
    );

    return [
        `Continent: ${flag.continent}`,
        `Number of colors: ${colors.length}`,
        `Dominant color (hex): ${dominantColor}`
    ];
}

// Shows the next hint after a wrong guess
function showNextHint() {
    const hints = getHints(currentFlag);
    const hintsDiv = document.getElementById("hints");

    if (hintIndex < hints.length) {
        const p = document.createElement("p");
        p.textContent = `Hint ${hintIndex + 1}: ${hints[hintIndex]}`;
        hintsDiv.appendChild(p);
        hintIndex++;
    }
}

// Displays the popup summary at the end of a round
function showPopup(correct) {
    const popup = document.getElementById("popup");
    popup.classList.remove("hidden");

    // Show flag image
    document.getElementById("popup-flag").src = currentFlag.img;

    // Show correct answer
    document.getElementById("popup-answer").textContent =
        `Correct Answer: ${currentFlag.country}`;

    // Show number of guesses used
    const used = correct ? (previousGuesses.length + 1) : 5;
    document.getElementById("popup-guesses").textContent =
        `Guesses Used: ${used}`;

    // Show wrong guesses
    const wrongDiv = document.getElementById("popup-wrong");
    wrongDiv.innerHTML = "";
    previousGuesses.forEach(g => {
        const div = document.createElement("div");
        div.textContent = g;
        wrongDiv.appendChild(div);
    });
}

// Hides popup and starts a new round
document.getElementById("popup-next-btn").addEventListener("click", () => {
    document.getElementById("popup").classList.add("hidden");
    newGame();
});

// Starts a new round with a new flag

function newGame() {
    // Filter flags by difficulty
    unusedFlags = flags.filter(flag => flag.difficulty === currentMode);
    // Shuffle the filtered list
    shuffle(unusedFlags);
    // Pick the next flag
    currentFlag = unusedFlags.pop();


    // Pick the next flag from the pool
    currentFlag = unusedFlags.pop();
    guessesLeft = 5;
    hintIndex = 0;
    previousGuesses = [];

    // Reset UI elements
    document.getElementById("message").textContent = "";
    document.getElementById("guess-input").value = "";
    document.getElementById("hints").innerHTML = "";
    document.getElementById("previous-guesses").innerHTML = "";
    document.getElementById("difficulty-display").textContent =
    `Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;


    // Draw the pie chart for this flag
    drawPieChart(currentFlag.colors);
}

// Handles a guess submission
function submitGuess() {
    const guessInput = document.getElementById("guess-input");
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    // Correct guess
    if (guess === currentFlag.country.toLowerCase()) {
        showPopup(true);
        return;
    }

    // Wrong guess
    guessesLeft--;

    // Track wrong guess
    previousGuesses.push(guess);
    updatePreviousGuesses();

    if (guessesLeft > 0) {
        document.getElementById("message").textContent =
            `Wrong! ${guessesLeft} guesses left.`;

        // Reveal next hint
        showNextHint();
    } else {
        // Out of guesses
        document.getElementById("message").textContent = `Out of guesses!`;

        missedFlags++;
        document.getElementById("missed-count").textContent =
            `Missed Flags: ${missedFlags}`;

        // Show summary popup
        showPopup(false);
    }
}

function giveUp() {
    // Mark the round as missed
    missedFlags++;
    document.getElementById("missed-count").textContent =
        `Missed Flags: ${missedFlags}`;

    // End the round immediately
    showPopup(false);
}

// Updates the list of previous wrong guesses in the main UI
function updatePreviousGuesses() {
    const container = document.getElementById("previous-guesses");
    container.innerHTML = "";

    previousGuesses.forEach(g => {
        const div = document.createElement("div");
        div.className = "wrong-guess";
        div.textContent = g;
        container.appendChild(div);
    });
}

// Attach event listeners for main buttons
document.getElementById("guess-btn").addEventListener("click", submitGuess);
document.getElementById("new-game-btn").addEventListener("click", newGame);
document.getElementById("give-up-btn").addEventListener("click", giveUp);
document.getElementById("difficulty-display").textContent = "Mode: Easy";


document.getElementById("easy-mode-btn").addEventListener("click", () => {
    currentMode = "easy";
    newGame();
});
document.getElementById("hard-mode-btn").addEventListener("click", () => {
    currentMode = "hard";
    newGame();
});



// Initialize game: set up unusedFlags and start first round
function initGame() {
    // Copy all flags into the unused pool and shuffle
    unusedFlags = [...flags];
    shuffle(unusedFlags);

    // Start first round
    newGame();
}

// Kick off the game once the script loads
initGame();
