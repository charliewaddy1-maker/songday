const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

document.addEventListener("DOMContentLoaded", () => {

  // START PAGE
  const startBtn = document.getElementById("startGame");
  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      try {
        const res = await fetch(`${API_BASE}/create-game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players: ["Player1"] })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        // Redirect player to submit page
        window.location.href = `submit.html?game=${data.gameId}&player=Player1`;
      } catch (err) {
        console.error(err);
        alert("Error creating game: " + err.message);
      }
    });
  }

  // SUBMIT PAGE
  const form = document.getElementById("songForm");
  if (form) {
    const player = new URLSearchParams(window.location.search).get("player");
    const game = new URLSearchParams(window.location.search).get("game");
    const label = document.getElementById("playerLabel");
    if (label) label.textContent = `Game: ${game}, Player: ${player}`;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value.trim();
      const artist = document.getElementById("artist").value.trim();
      if (!title || !artist) return alert("Enter song title and artist.");

      try {
        const res = await fetch(`${API_BASE}/submit-song`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: game, player, songs: [{ title, artist }] })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        window.location.href = `playlist.html?game=${game}`;
      } catch (err) {
        console.error(err);
        alert("Error submitting song: " + err.message);
      }
    });
  }

  // PLAYLIST PAGE
  const playlistContainer = document.getElementById("playlistContainer");
  const voteBtn = document.getElementById("voteBtn");
  if (playlistContainer && voteBtn) {
    const game = new URLSearchParams(window.location.search).get("game");

    async function loadPlaylist() {
      try {
        const res = await fetch(`${API_BASE}/playlist?game=${game}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);

        const songsHtml = [];
        for (const player in data.songs) {
          data.songs[player].forEach(s => {
            songsHtml.push(`<p>${s.title} — ${s.artist} (Submitted by ${player})</p>`);
          });
        }
        playlistContainer.innerHTML = songsHtml.join("");
      } catch (err) {
        playlistContainer.innerHTML = `<p>Error loading playlist: ${err.message}</p>`;
      }
    }

    voteBtn.addEventListener("click", () => alert("Vote submitted! (placeholder)"));

    loadPlaylist();
  }
});
