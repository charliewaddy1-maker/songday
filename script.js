const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

/* =========================
   START PAGE LOGIC
========================= */
const startBtn = document.getElementById("startGame");
if (startBtn) {
  startBtn.addEventListener("click", async () => {
    const error = document.getElementById("error");
    error.textContent = "";

    const playerName = document.getElementById("playerName").value.trim();
    if (!playerName) { error.textContent = "Enter your name"; return; }

    try {
      const res = await fetch(`${API_BASE}/create-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: [playerName] })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);

      const linksOut = document.getElementById("linksOutput");
      linksOut.innerHTML = `<a href="submit.html?game=${data.gameId}&player=${encodeURIComponent(playerName)}" target="_blank">Click to submit your song</a>`;
      document.getElementById("viewPlaylistBtn").href = `playlist.html?game=${data.gameId}`;
      document.getElementById("gameSection").style.display = "block";
    } catch (err) {
      error.textContent = "Error creating game";
      console.error(err);
    }
  });
}

/* =========================
   SUBMIT PAGE LOGIC
========================= */
const form = document.getElementById("songForm");
if (form) {
  const urlParams = new URLSearchParams(window.location.search);
  const player = urlParams.get("player");
  const game = urlParams.get("game");

  document.getElementById("playerLabel").textContent = `Game: ${game}, Player: ${player}`;

  const submitBtn = document.getElementById("submitSong");
  const status = document.getElementById("status");

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const title = document.getElementById("songTitle").value.trim();
    const artist = document.getElementById("songArtist").value.trim();
    if (!title || !artist) return alert("Enter both title and artist");

    try {
      const res = await fetch(`${API_BASE}/submit-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game, player, songs: [{title, artist}] })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      status.textContent = "Song submitted! Go to Playlist to vote.";
      submitBtn.disabled = true;
    } catch (err) {
      status.style.color = "red";
      status.textContent = "Error submitting song";
      console.error(err);
    }
  });
}

/* =========================
   PLAYLIST PAGE LOGIC
========================= */
const playlistContainer = document.getElementById("playlistContainer");
const downloadBtn = document.getElementById("downloadPlaylist");

if (playlistContainer) {
  const urlParams = new URLSearchParams(window.location.search);
  const game = urlParams.get("game");

  fetch(`${API_BASE}/playlist?game=${game}`)
    .then(r=>r.json())
    .then(gameData => {
      const songsArr = [];
      for (let p in gameData.songs) {
        gameData.songs[p].forEach(s => {
          songsArr.push({player: p, title: s.title, artist: s.artist});
        });
      }
      let html = "<ul>";
      songsArr.forEach(s => {
        html += `<li>${s.title} - ${s.artist} (submitted by ${s.player})</li>`;
      });
      html += "</ul>";
      playlistContainer.innerHTML = html;

      downloadBtn.onclick = () => {
        let csv = "Title,Artist,Player\n";
        songsArr.forEach(s => { csv += `${s.title},${s.artist},${s.player}\n`; });
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `playlist_${game}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    })
    .catch(console.error);
}
