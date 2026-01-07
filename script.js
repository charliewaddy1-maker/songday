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

/* =====================
   SUBMIT SONGS (PLAYER)
===================== */
let songs = [];

const addSong = document.getElementById("addSong");
if (addSong) {
  document.getElementById("title").textContent =
    `Submit songs for ${player}`;

  addSong.onclick = () => {
    songs.push({
      title: songTitle.value,
      artist: artist.value,
      link: link.value
    });

    songTitle.value = artist.value = link.value = "";
  };

  document.getElementById("submitSongs").onclick = async () => {
    const res = await fetch(`${API_BASE}/submit-songs`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ game, player, songs })
    });

    const data = await res.json();
    document.getElementById("msg").textContent =
      data.ok ? "Submitted 🎉" : "Error submitting songs";
  };
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
