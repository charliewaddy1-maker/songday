// Shared utility
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// START page logic
document.addEventListener("DOMContentLoaded", async () => {
  const createBtn = document.getElementById("createGame");
  if (!createBtn) return;

  createBtn.addEventListener("click", async () => {
    const raw = document.getElementById("playerNames").value.trim();
    if (!raw) { alert("Enter at least one player name."); return; }

    const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) { alert("Enter at least one player name."); return; }

    // Create game via Worker API
    try {
      const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/create-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: names })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to create game");
      const gameId = data.gameId; // e.g., Game1

      // Show Game ID and playlist button
      const info = document.getElementById("gameInfo");
      info.innerHTML = `<p class="small">Game ID: <strong>${gameId}</strong></p>
                        <p class="small">Share the links below with players:</p>`;

      const out = document.getElementById("linksOutput");
      out.innerHTML = "";
      names.forEach((name, idx) => {
        const pname = encodeURIComponent(name);
        const link = `${window.location.origin}/submit.html?game=${gameId}&player=${pname}`;
        out.innerHTML += `<p>Player ${idx + 1} (${name}): <a href="${link}" target="_blank">${link}</a></p>`;
      });

      // Auto playlist button for host
      const playlistBtn = document.createElement("a");
      playlistBtn.href = `${window.location.origin}/playlist.html?game=${gameId}`;
      playlistBtn.textContent = `View Playlist (Game ${gameId})`;
      playlistBtn.className = "btn";
      out.appendChild(document.createElement("hr"));
      out.appendChild(playlistBtn);

    } catch (err) {
      alert("Error creating game: " + err.message);
      console.error(err);
    }
  });
});
