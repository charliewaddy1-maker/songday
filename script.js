const API_BASE = "https://songday-api.charlie-waddy1.workers.dev";

document.addEventListener("DOMContentLoaded", () => {

  /* ===== START PAGE ===== */
  const startBtn = document.getElementById("startGame");
  if (startBtn){
    startBtn.addEventListener("click", async () => {
      const error = document.getElementById("error");
      error.textContent = "";

      const playerName = document.getElementById("playerName").value.trim();
      if (!playerName){ error.textContent="Enter your name"; return; }

      try {
        const res = await fetch(`${API_BASE}/create-game`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ players:[playerName] })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);

        const linksOut = document.getElementById("linksOutput");

const submitLink = `${location.origin}/submit.html?game=${data.gameId}&player=${encodeURIComponent(playerName)}`;

linksOut.innerHTML = `
  <p><strong>Game created!</strong></p>
  <p>
    <a class="btn" href="${submitLink}">
      Submit your song
    </a>
  </p>
  <p>
    <a class="btn" href="playlist.html?game=${data.gameId}">
      View Playlist
    </a>
  </p>
`;

  /* ===== SUBMIT PAGE ===== */
  const form = document.getElementById("songForm");
  if (form){
    const player = new URLSearchParams(window.location.search).get("player");
    const game = new URLSearchParams(window.location.search).get("game");
    const label = document.getElementById("playerLabel");
    if (player && game){
      label.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    } else {
      label.innerHTML = `<span style="color:red">Missing game or player in URL</span>`;
    }

    const saveBtn = document.getElementById("saveSongs");
    const status = document.getElementById("status");
    saveBtn.addEventListener("click", async (e)=>{
      e.preventDefault();
      if (!player || !game){ alert("Missing info"); return; }

      const songs = [{
        title: document.getElementById("title1").value.trim(),
        artist: document.getElementById("artist1").value.trim(),
        link: document.getElementById("link1").value.trim()
      }];

      if (!songs[0].title || !songs[0].artist){ alert("Enter a song"); return; }

      try {
        const res = await fetch(`${API_BASE}/submit-song`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ gameId:game, player:player, songs })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);

        status.textContent = "Song submitted! Go to playlist to vote.";
        saveBtn.disabled=true;

      } catch(err){
        status.style.color="red";
        status.textContent="Error submitting song";
        console.error(err);
      }
    });
  }

  /* ===== PLAYLIST PAGE ===== */
  const playlistContainer = document.getElementById("playlistContainer");
  if (playlistContainer){
    const game = new URLSearchParams(window.location.search).get("game");
    const info = document.getElementById("playlistInfo");
    if (!game){ info.textContent="Missing game ID"; return; }

    fetch(`${API_BASE}/playlist?game=${game}`)
      .then(r=>r.json())
      .then(data=>{
        if (!data.ok){ playlistContainer.textContent="No submissions yet"; return; }
        const songsArr = [];
        for (let p in data.songs){
          data.songs[p].forEach(s => songsArr.push({...s, player:p}));
        }

        // show songs
        let html = "<table border=1><tr><th>Player</th><th>Title</th><th>Artist</th><th>Link</th></tr>";
        songsArr.forEach(s=> {
          const link = s.link ? `<a href="${s.link}" target="_blank">play</a>` : "";
          html += `<tr><td>${s.player}</td><td>${s.title}</td><td>${s.artist}</td><td>${link}</td></tr>`;
        });
        html+="</table>";
        playlistContainer.innerHTML = html;

        // download CSV
        const downloadBtn = document.getElementById("downloadPlaylist");
        downloadBtn.onclick = ()=>{
          let csv = "Player,Title,Artist,Link\n";
          songsArr.forEach(s=>{
            csv+=`${s.player},${s.title},${s.artist},${s.link}\n`;
          });
          const blob = new Blob([csv], {type:"text/csv"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href=url;
          a.download=`songday_playlist_${game}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
      });
  }

});
