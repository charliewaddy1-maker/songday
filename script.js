const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

// ---------------- CREATE GAME ----------------
document.getElementById("createGame")?.addEventListener("click", async () => {
  const error = document.getElementById("error");
  error.textContent = "";

  const raw = document.getElementById("playerNames").value.trim();
  if (!raw) {
    error.textContent = "Please enter at least one player name.";
    return;
  }

  const players = raw.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
  if (players.length === 0) {
    error.textContent = "Please enter at least one valid player.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/create-game`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.message || "Failed to create game");

    showGame(data.gameId, players);

  } catch (err) {
    error.textContent = "Error creating game. Please try again.";
    console.error(err);
  }
});

// ---------------- SHOW GAME INFO ----------------
function showGame(gameId, players) {
  document.getElementById("gameSection").style.display = "block";
  document.getElementById("gameIdLabel").textContent = gameId;

  const linksOut = document.getElementById("linksOutput");
  linksOut.innerHTML = "";

  players.forEach(name => {
    const link = `${location.origin}/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;
    linksOut.innerHTML += `<p><strong>${name}:</strong> <a href="${link}" target="_blank">${link}</a></p>`;
  });

  // View playlist button
  const viewBtn = document.getElementById("viewPlaylistBtn");
  viewBtn.href = `/playlist.html?game=${gameId}`;

  // Download CSV button
  const downloadBtn = document.getElementById("downloadCsvBtn");
  downloadBtn.onclick = () => downloadCsv(gameId);
}

// ---------------- DOWNLOAD CSV ----------------
async function downloadCsv(gameId) {
  try {
    const res = await fetch(`${API_BASE}/playlist?game=${gameId}`);
    const game = await res.json();

    if (!game.songs) {
      alert("No songs submitted yet.");
      return;
    }

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

  } catch (err) {
    alert("Failed to download playlist.");
    console.error(err);
  }
}
