// Shared utility functions
function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Escape HTML helper
function escapeHtml(str){
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function(m){ 
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; 
  });
}

document.addEventListener("DOMContentLoaded", () => {

  // ===== START page logic =====
  const createBtn = document.getElementById("createGame");
  if (createBtn){
    createBtn.addEventListener("click", () => {
      const raw = document.getElementById("playerNames").value.trim();
      if (!raw) { alert("Enter at least one player name."); return; }
      const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (names.length === 0) { alert("Enter at least one player name."); return; }

      // Sequential Game ID logic
      let lastGameNum = parseInt(localStorage.getItem("songday_lastGameNum") || "0", 10);
      lastGameNum += 1;
      localStorage.setItem("songday_lastGameNum", lastGameNum);
      const gameId = `Game${lastGameNum}`;

      localStorage.setItem(`songday_game_${gameId}_players`, JSON.stringify(names));

      // Display game ID and links
      const info = document.getElementById("gameInfo");
      info.innerHTML = `<p class="small">Game ID: <strong>${gameId}</strong></p>
                        <p class="small">Share these links with players (or copy them).</p>`;

      const out = document.getElementById("linksOutput");
      out.innerHTML = "";
      names.forEach((name, idx) => {
        const pname = encodeURIComponent(name);
        const link = `${window.location.origin}/submit.html?game=${gameId}&player=${pname}`;
        out.innerHTML += `<p>Player ${idx+1} (${name}): <a href="${link}" target="_blank">${link}</a></p>`;
      });

      // Provide playlist link and download link
      out.innerHTML += `<hr/>
                        <p>
                          <a class="btn" href="playlist.html?game=${gameId}">View Combined Playlist</a>
                        </p>
                        <p>
                          <a class="btn" href="playlist.html?game=${gameId}&download=true">Download Playlist CSV</a>
                        </p>`;
    });
  }

  // ===== SUBMIT page logic =====
  const form = document.getElementById("songForm");
  if (form){
    for (let i=1;i<=10;i++){
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `<input placeholder="Song ${i} Title" id="title${i}" /> 
                       <input placeholder="Artist ${i}" id="artist${i}" /> 
                       <input placeholder="Link (optional)" id="link${i}" />`;
      form.appendChild(div);
    }

    const player = getQueryParam("player");
    const game = getQueryParam("game");
    const label = document.getElementById("playerLabel");
    if (player && game){
      label.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    } else {
      label.innerHTML = `<span class="small">Missing game or player in URL. Use the invite link provided by the host.</span>`;
    }

    const saveBtn = document.getElementById("saveSongs");
    const status = document.getElementById("status");
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!player || !game){ alert("Missing game or player information."); return; }
      const key = `songday_game_${game}_player_${player}`;
      if (localStorage.getItem(key)){
        status.style.color = "green";
        status.textContent = "You have already submitted your songs. Thank you!";
        return;
      }
      const songs = [];
      for (let i=1;i<=10;i++){
        const title = document.getElementById(`title${i}`).value.trim();
        const artist = document.getElementById(`artist${i}`).value.trim();
        const link = document.getElementById(`link${i}`).value.trim();
        if (title && artist){
          songs.push({title, artist, link});
        }
      }
      if (songs.length === 0){
        alert("Please enter at least one song (title and artist).");
        return;
      }
      localStorage.setItem(key, JSON.stringify(songs));
      status.style.color = "green";
      status.textContent = "Thank you! Songs submitted — waiting on full playlist to be created by the host.";
      saveBtn.disabled = true;
    });
  }

  // ===== PLAYLIST page logic =====
  const playlistContainer = document.getElementById("playlistContainer");
  if (playlistContainer){
    const game = getQueryParam("game");
    const info = document.getElementById("playlistInfo");
    if (!game){
      info.innerHTML = '<span class="small">Provide a game id in the URL like ?game=Game1</span>';
      return;
    }
    info.innerHTML = `Game ID: <strong>${game}</strong>`;

    const all = [];
    const prefix = `songday_game_${game}_player_`;
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)){
        const playerName = decodeURIComponent(k.substring(prefix.length));
        try {
          const songs = JSON.parse(localStorage.getItem(k) || "[]");
          songs.forEach(s => all.push({title:s.title, artist:s.artist, link:s.link, player:playerName}));
        } catch(e){}
      }
    }
    if (all.length === 0){
      playlistContainer.innerHTML = "<p class='small'>No submissions found for this game yet.</p>";
      return;
    }

    // shuffle
    for (let i = all.length -1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    // build table
    let html = `<table><thead><tr><th>#</th><th>Song title</th><th>Artist</th><th>Link</th><th>Player</th></tr></thead><tbody>`;
    all.forEach((s, idx) => {
      const link = s.link ? `<a href="${s.link}" target="_blank">play</a>` : "";
      html += `<tr><td>${idx+1}</td><td>${escapeHtml(s.title)}</td><td>${escapeHtml(s.artist)}</td><td>${link}</td><td>${escapeHtml(s.player)}</td></tr>`;
    });
    html += `</tbody></table>`;
    playlistContainer.innerHTML = html;

    // ===== Download button logic =====
    const downloadBtn = document.getElementById("downloadPlaylist");
    if (downloadBtn){
      downloadBtn.addEventListener("click", () => {
        let csv = "Title,Artist,Link,Player\n";
        all.forEach(song => {
          const safeTitle = song.title.replace(/,/g, " ");
          const safeArtist = song.artist.replace(/,/g, " ");
          const safePlayer = song.player.replace(/,/g, " ");
          csv += `${safeTitle},${safeArtist},${song.link},${safePlayer}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `songday_playlist_${game}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // ===== Auto-download if ?download=true in URL =====
    if (window.location.search.includes("download=true") && downloadBtn){
      downloadBtn.click();
    }
  }

}); // end DOMContentLoaded
