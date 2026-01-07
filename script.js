const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

document.addEventListener("DOMContentLoaded", () => {

  /* ======================
     CREATE GAME (START)
  ====================== */
  const createBtn = document.getElementById("createGame");

  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const errorEl = document.getElementById("error");
      if (errorEl) errorEl.textContent = "";

      const textarea = document.getElementById("playerNames");
      if (!textarea) return;

      const raw = textarea.value.trim();
      if (!raw) {
        if (errorEl) errorEl.textContent = "Please enter at least one player name.";
        return;
      }

      const players = raw
        .split(/\r?\n/)
        .map(p => p.trim())
        .filter(Boolean);

      try {
        const res = await fetch(`${API_BASE}/create-game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players })
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed");

        showGame(data.gameId, players);

      } catch (err) {
        if (errorEl) errorEl.textContent = "Error creating game.";
        console.error(err);
      }
    });
  }

  /* ======================
     SHOW GAME
  ====================== */
  function showGame(gameId, players) {
    const section = document.getElementById("gameSection");
    const linksOut = document.getElementById("linksOutput");
    const gameIdLabel = document.getElementById("gameIdLabel");
    const viewBtn = document.getElementById("viewPlaylistBtn");
    const downloadBtn = document.getElementById("downloadCsvBtn");

    if (!section || !linksOut || !gameIdLabel || !viewBtn || !downloadBtn) {
      console.error("Missing required HTML elements on start page");
      return;
    }

    section.style.display = "block";
    gameIdLabel.textContent = gameId;
    linksOut.innerHTML = "";

    players.forEach(name => {
      const link = `${location.origin}/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;
      linksOut.innerHTML += `
        <p>
          <strong>${name}</strong>:
          <a href="${link}" target="_blank">${link}</a>
        </p>`;
    });

    viewBtn.href = `/playlist.html?game=${gameId}`;
    downloadBtn.onclick = () => downloadCsv(gameId);
  }

  /* ======================
     DOWNLOAD CSV
  ====================== */
  async function downloadCsv(gameId) {
    try {
      const res = await fetch(`${API_BASE}/playlist?game=${gameId}`);
      const data = await res.json();
      if (!data.ok) throw new Error("No playlist");

      let csv = "Title,Artist,Link,Player\n";
      data.songs.forEach(s => {
        csv += `"${s.title}","${s.artist}","${s.link || ""}","${s.player}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `songday_${gameId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      alert("Failed to download playlist.");
      console.error(err);
    }
  }

});

/* ======================
   SUBMIT SONGS PAGE
====================== */
const submitBtn = document.getElementById("submitSongs");

if (submitBtn) {
  const params = new URLSearchParams(window.location.search);
  const game = params.get("game");
  const player = params.get("player");

  const info = document.getElementById("submitInfo");
  const form = document.getElementById("songForm");
  const errorEl = document.getElementById("submitError");
  const successEl = document.getElementById("submitSuccess");

  if (!game || !player) {
    info.textContent = "Invalid submission link.";
  } else {
    info.textContent = `Submitting for game ${game} as ${player}`;
  }

  // Generate 10 song inputs
  for (let i = 1; i <= 10; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <input placeholder="Song title ${i}" id="title${i}" />
      <input placeholder="Artist ${i}" id="artist${i}" />
      <input placeholder="Link (optional)" id="link${i}" />
    `;
    form.appendChild(div);
  }

  submitBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    successEl.textContent = "";

    if (!game || !player) {
      errorEl.textContent = "Missing game or player.";
      return;
    }

    const songs = [];

    for (let i = 1; i <= 10; i++) {
      const title = document.getElementById(`title${i}`).value.trim();
      const artist = document.getElementById(`artist${i}`).value.trim();
      const link = document.getElementById(`link${i}`).value.trim();

      if (title && artist) {
        songs.push({ title, artist, link });
      }
    }

    if (songs.length === 0) {
      errorEl.textContent = "Please enter at least one song.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/submit-songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game, player, songs })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      successEl.textContent = "Songs submitted successfully!";
      submitBtn.disabled = true;

    } catch (err) {
      errorEl.textContent = "Error submitting songs.";
      console.error(err);
    }
  });
}
