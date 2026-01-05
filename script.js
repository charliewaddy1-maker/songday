// --- Shared utility ---
function getQueryParam(name){
  return new URLSearchParams(window.location.search).get(name);
}

// Escape HTML helper
function escapeHtml(str){
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// --- START page ---
document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createGame");
  const out = document.getElementById("linksOutput");

  if (createBtn && out){
    createBtn.addEventListener("click", async () => {
      const raw = document.getElementById("playerNames").value.trim();
      if (!raw) return alert("Enter at least one player name");

      const players = raw.split(/\r?\n/).map(p=>p.trim()).filter(Boolean);
      if (players.length === 0) return alert("Enter at least one player name");

      try {
        const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/create-game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({players})
        });
        const data = await res.json();
        if (!data.gameId) return alert("Failed to create game");

        const gameId = data.gameId;

        // Display player links
        out.innerHTML = `<p><strong>Game ID: ${gameId}</strong></p>`;
        players.forEach((player, idx)=>{
          const encoded = encodeURIComponent(player);
          const link = `${window.location.origin}/submit.html?game=${gameId}&player=${encoded}`;
          out.innerHTML += `<p>Player ${idx+1} (${player}): <a href="${link}" target="_blank">${link}</a></p>`;
        });
        out.innerHTML += `<hr><a class="btn" href="/playlist.html?game=${gameId}">View Playlist</a>`;

      } catch(err){ console.error(err); alert("Error creating game: "+err.message); }
    });
  }
});

// --- SUBMIT page ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("songForm");
  const saveBtn = document.getElementById("saveSongs");
  const status = document.getElementById("status");
  const playerLabel = document.getElementById("playerLabel");

  const player = getQueryParam("player");
  const game = getQueryParam("game");

  if (playerLabel) {
    if (player && game) {
      playerLabel.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    } else {
      playerLabel.innerHTML = `<span class="small">Missing game or player in URL. Use the invite link from the host.</span>`;
    }
  }

  // generate 10 song input rows
  if (form) {
    for (let i=1;i<=10;i++){
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `<input placeholder="Song ${i} Title" id="title${i}" /> 
                       <input placeholder="Artist ${i}" id="artist${i}" /> 
                       <input placeholder="Link (optional)" id="link${i}" />`;
      form.appendChild(div);
    }
  }

  // submission
  if (saveBtn) {
    saveBtn.addEventListener("click", async (e)=>{
      e.preventDefault();
      if (!game || !player) return alert("Missing game/player info.");

      const songs = [];
      for (let i=1;i<=10;i++){
        const title = document.getElementById(`title${i}`)?.value.trim();
        const artist = document.getElementById(`artist${i}`)?.value.trim();
        const link = document.getElementById(`link${i}`)?.value.trim();
        if (title && artist) songs.push({title, artist, link});
      }

      if (songs.length===0) return alert("Enter at least one song");

      try {
        const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/submit-song", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({gameId: game, player: player, songs})
        });
        const data = await res.json();
        if (data.ok){
          status.style.color = "green";
          status.textContent = "Thank you! Songs submitted — waiting for full playlist.";
          saveBtn.disabled = true;
        } else {
          alert("Error: "+data.message);
        }
      } catch(err){
        console.error(err);
        alert("Network error, could not submit songs.");
      }
    });
  }

  // --- PLAYLIST page ---
  const playlistContainer = document.getElementById("playlistContainer");
  const playlistInfo = document.getElementById("playlistInfo");

  if (playlistContainer && playlistInfo){
    if (!game) { playlistInfo.innerHTML="<span class='small'>Missing game id in URL.</span>"; return; }
    playlistInfo.innerHTML = `Game ID: <strong>${game}</strong>`;

    (async ()=>{
      try {
        const res = await fetch(`https://songday-api.charlie-waddy1.workers.dev/get-playlist?gameId=${game}`);
        const all = await res.json();

        if (!all || all.length===0){ playlistContainer.innerHTML="<p class='small'>No songs submitted yet.</p>"; return; }

        // shuffle
        for (let i=all.length-1;i>0;i--){
          const j=Math.floor(Math.random()*(i+1));
          [all[i],all[j]]=[all[j],all[i]];
        }

        let html = `<table><thead><tr><th>#</th><th>Song</th><th>Artist</th><th>Link</th><th>Player</th></tr></thead><tbody>`;
        all.forEach((s,idx)=>{
          const link = s.link ? `<a href="${s.link}" target="_blank">play</a>` : "";
          html += `<tr><td>${idx+1}</td><td>${escapeHtml(s.title)}</td><td>${escapeHtml(s.artist)}</td><td>${link}</td><td>${escapeHtml(s.player)}</td></tr>`;
        });
        html += `</tbody></table>`;
        playlistContainer.innerHTML = html;

        // download button
        const downloadBtn = document.getElementById("downloadPlaylist");
        if (downloadBtn){
          downloadBtn.addEventListener("click", ()=>{
            let csv = "Title,Artist,Link,Player\n";
            all.forEach(s=>{
              csv += `${s.title.replace(/,/g," ")},"${s.artist.replace(/,/g," ")}",${s.link},${s.player.replace(/,/g," ")}\n`;
            });
            const blob = new Blob([csv], {type:"text/csv"});
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

      } catch(err){
        console.error(err);
        playlistContainer.innerHTML="<p class='small'>Error loading playlist.</p>";
      }
    })();
  }
});
