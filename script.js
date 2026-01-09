console.log("script.js loaded");

const startBtn = document.getElementById("startGame");
const output = document.getElementById("output");

if (!startBtn) {
  alert("Start button NOT found");
} else {
  startBtn.addEventListener("click", () => {
    const name = document.getElementById("playerName").value.trim();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    const gameId = "Game1"; // temporary hardcoded game

    const submitLink = `/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;

    output.innerHTML = `
      <p>Game created!</p>
      <p>
        <a href="${submitLink}">Submit your song</a>
      </p>
    `;
  });
}
