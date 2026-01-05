document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createGame");
  const out = document.getElementById("linksOutput");

  if (createBtn && out) {
    createBtn.addEventListener("click", async () => {
      const raw = document.getElementById("playerNames").value.trim();
      if (!raw) { alert("Enter at least one player name"); return; }

      const players = raw.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
      if (players.length === 0) { alert("Enter at least one player name"); return; }

      try {
        // Call your Worker to create a game
        const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/create-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players })
        });

        const data = await res.json();
        if (!data.gameId) { alert("Failed to create game"); return; }

        const gameId = data.gameId;

        // Generate player links
        out.innerHTML = `<p><strong>Game ID: ${gameId}</strong></p>`;
        players.forEach((player, idx) => {
          const encoded = encodeURIComponent(player);
          const link = `${window.location.origin}/submit.html?game=${gameId}&player=${encoded}`;
          out.innerHTML += `<p>Player ${idx+1} (${player}): <a href="${link}" target="_blank">${link}</a></p>`;
        });

        out.innerHTML += `<hr><a class="btn" href="/playlist.html?game=${gameId}">View Playlist</a>`;

      } catch (err) {
        console.error(err);
        alert("Error creating game: " + err.message);
      }
    });
  }
});
