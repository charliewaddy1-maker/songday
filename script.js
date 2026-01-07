const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";
const qs = new URLSearchParams(window.location.search);
const game = qs.get("game");
const player = qs.get("player");

/* =====================
   START PAGE (HOST)
===================== */
const createBtn = document.getElementById("createGame");

if (createBtn) {
  createBtn.onclick = async () => {
    const names = document.getElementById("players").value
      .split("\n")
      .map(n => n.trim())
      .filter(Boolean);

    if (!names.length) return;

    const res = await fetch(`${API_BASE}/create-game`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ players: names })
    });

    const data = await res.json();
    if (!data.ok) return alert("Failed to create game");

    document.getElementById("gameArea").style.display = "block";
    document.getElementById("gameId").textContent = data.gameId;

    const links = document.getElementById("links");
    links.innerHTML = "";

    names.forEach(p => {
      const url = `/submit.html?game=${data.gameId}&player=${encodeURIComponent(p)}`;
      links.innerHTML += `<p>${p}: <a href="${url}" target="_blank">${url}</a></p>`;
    });

    document.getElementById("playlistLink").href =
      `/playlist.html?game=${data.gameId}`;
  };
}

// SUBMIT SONGS
if (url.pathname.startsWith("/submit-song") && request.method === "POST") {
  const body = await request.json();
  const { gameId, player, songs } = body;

  const gameKey = `game:${gameId}`;
  const gameRaw = await env.SONGDAY_KV.get(gameKey);

  if (!gameRaw) {
    return new Response(
      JSON.stringify({ ok: false, message: "Game not found" }),
      { status: 404, headers: corsHeaders }
    );
  }

  const game = JSON.parse(gameRaw);

  if (game.songs[player]) {
    return new Response(
      JSON.stringify({ ok: false, message: "Already submitted" }),
      { status: 400, headers: corsHeaders }
    );
  }

  game.songs[player] = songs;

  await env.SONGDAY_KV.put(gameKey, JSON.stringify(game));

  return new Response(
    JSON.stringify({ ok: true }),
    { headers: corsHeaders }
  );
}

/* =====================
   PLAYLIST (HOST)
===================== */
const songTable = document.getElementById("songs");
if (songTable) {
  fetch(`${API_BASE}/playlist?game=${game}`)
    .then(r => r.json())
    .then(data => {
      data.songs.forEach(s => {
        songTable.innerHTML += `
          <tr>
            <td>${s.title}</td>
            <td>${s.artist}</td>
            <td><a href="${s.link}" target="_blank">Link</a></td>
            <td>${s.player}</td>
          </tr>`;
      });
    });

  document.getElementById("downloadCsv").onclick = () => {
    window.location =
      `${API_BASE}/download?game=${game}`;
  };

  document.getElementById("startVoting").onclick = async () => {
    await fetch(`${API_BASE}/start-voting`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ game })
    });

    document.getElementById("status").textContent =
      "Voting started!";
  };
}
