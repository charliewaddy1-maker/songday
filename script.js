const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

/* =========================
   START PAGE LOGIC ONLY
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
