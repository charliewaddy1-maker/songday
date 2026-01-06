const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

/* =========================
   START PAGE
========================= */
const createBtn = document.getElementById("createGame");

if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const error = document.getElementById("error");
    error.textContent = "";

    const raw = document.getElementById("playerNames").value.trim();
    if (!raw) {
      error.textContent = "Please enter at least one player name.";
      return;
    }

    const players = raw.split(/\r?\n/).map(p => p.trim()).filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/create-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message);

      showGame(data.gameId, players);
    } catch (err) {
      error.textContent = "Error creating game.";
      console.error(err);
    }
  });
}

function showGame(gameId, players) {
  const section = document.getElementById("gameSection");
  if (!section) return;

  section.style.display = "block";
  document.getElementById("gameIdLabel").textContent = gameId;

  const linksOut = document.getElementById("linksOutput");
  linksOut.innerHTML = "";

  players.forEach(name => {
    const link = `${location.origin}/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;
    linksOut.innerHTML += `<p><strong>${name}:</strong> <a href="${link}" target="_blank">${link}</a></p>`;
  });

  document.getElementById("viewPlaylistBtn").href = `/playlist.html?game=${gameId}`;
  document.getElementById("downloadCsvBtn").onclick = () => downloadCsv(gameId);
}

/* =========================
   SUBMIT PAGE
========================= */
const submitBtn = document.getElementById("submitSongs");

if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const params = new URLSearchParams(location.search);
    const gameId = params.get("game");
    const player = params.get("player");

    if (!gameId || !player) {
      alert("Invalid game link.");
      return;
    }

    const songs = [];
    for (let i = 1; i <= 10; i++) {
      const title = document.getElementById(`title${i}`)?.value.trim();
      const artist = document.getElementById(`artist${i}`)?.value.trim();
      const link = document.getElementById(`link${i}`)?.value.trim();
      if (title && artist) songs.push({ title, artist, link });
    }

    if (songs.length === 0) {
      alert("Please enter at least one song.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/submit-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, player, songs })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message);

      alert("Thank you! Your songs have been submitted.");
      submitBtn.disabled = true;
    } catch (err) {
      alert("Error submitting songs.");
      console.error(err);
    }
  });
}

/* =========================
   PLAYLIST PAGE
========================= */
const playlistContainer = document.getElementById("playlistContainer");

if (playlistContainer) {
  const params = new URLSearchParams(location.search);
  const gameId = params.get("game");

  if (!gameId) {
    playlistContainer.innerHTML = "<p>Missing game ID.</p>";
  } else {
    loadPlaylist(gameId);
  }
}

async function loadPlaylist(gameId) {
  try {
    const res = await fetch(`${API_BASE}/playlist?game=${gameId}`);
    const game = await res.json();

    if (!game.songs) {
      playlistContainer.innerHTML = "<p>No songs yet.</p>";
      return;
    }

    let html = "<table><tr><th>Song</th><th>Artist</th><th>Player</th></tr>";
    Object.entries(game.songs).forEach(([player, songs]) => {
      songs.forEach(s => {
        html += `<tr><td>${s.title}</td><td>${s.artist}</td><td>${player}</td></tr>`;
      });
    });
    html += "</table>";

    playlistContainer.innerHTML = html;
  } catch (err) {
    playlistContainer.innerHTML = "<p>Error loading playlist.</p>";
  }
}

/* =========================
   CSV DOWNLOAD
========================= */
async function downloadCsv(gameId) {
  const res = await fetch(`${API_BASE}/playlist?game=${gameId}`);
  const game = await res.json();

  let csv = "Title,Artist,Link,Player\n";
  Object.entries(game.songs).forEach(([player, songs]) => {
    songs.forEach(song => {
      csv += `"${song.title}","${song.artist}","${song.link || ""}","${player}"\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${gameId}_playlist.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
