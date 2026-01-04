document.getElementById("createGame").addEventListener("click", async () => {
  const raw = document.getElementById("playerNames").value.trim();
  if (!raw) return alert("Enter at least one player name.");
  const players = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  // Call Worker to create game
  const res = await fetch("https://songday-api.YOURACCOUNT.workers.dev/create-game", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({players})
  });

  const data = await res.json();
  if (res.ok) {
    const gameId = data.gameId;
    const out = document.getElementById("linksOutput");
    out.innerHTML = "";
    data.players.forEach((name, idx) => {
      const pname = encodeURIComponent(name);
      const link = `${window.location.origin}/submit.html?game=${gameId}&player=${pname}`;
      out.innerHTML += `<p>Player ${idx+1} (${name}): <a href="${link}" target="_blank">${link}</a></p>`;
    });
    out.innerHTML += `<hr/><p><a class="btn" href="playlist.html?game=${gameId}">View Combined Playlist (Game ${gameId})</a></p>`;
  } else {
    alert(data.error || "Failed to create game");
  }
});
