// Shared utility
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// ------------------------- START PAGE -------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Start page logic
  const createBtn = document.getElementById("createGame");
  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const raw = document.getElementById("playerNames").value.trim();
      if (!raw) { alert("Enter at least one player name."); return; }

      const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (!names.length) { alert("Enter at least one player name."); return; }

      try {
        const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/create-game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({players: names})
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Failed to create game");

        const gameId = data.gameId;
        const info = document.getElementById("gameInfo");
        info.innerHTML = `<p class="small">Game ID: <strong>${gameId}</strong></p>
                          <p class="small">Share these links with players:</p>`;

        const out = document.getElementById("linksOutput");
        out.innerHTML = "";
        names.forEach((name, idx) => {
          const pname = encodeURIComponent(name);
          const link = `${window.location.origin}/submit.html?game=${gameId}&player=${pname}`;
          out.innerHTML += `<p>Player ${idx+1} (${name}): <a href="${link}" target="_blank">${link}</a></p>`;
        });

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
  }

  // ------------------------- SUBMIT PAGE -------------------------
  const form = document.getElementById("songForm");
  if (form) {
    const player = getQueryParam("player");
    const game = getQueryParam("game");
    const label = document.getElementById("playerLabel");
    if (!player || !game) {
      label.innerHTML = `<span class="small">Missing game or player in URL. Use the invite link provided by the host.</span>`;
    } else {
      label.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    }

    // Generate 10 song input rows
    for (let i=1;i<=10;i++){
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `<input placeholder="Song ${i} Title" id="title${i}" />
                       <input placeholder="Artist ${i}" id="artist${i}" />
                       <input placeholder="Link (optional)" id="link${i}" />`;
      form.appendChild(div);
    }

    const saveBtn = document.getElementById("saveSongs");
    const status = document.getElementById("status");

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!player || !game) return alert("Missing game or player info.");

      const songs = [];
      for (let i=1;i<=10;i++){
        const title = document.getElementById(`title${i}`).value.trim();
        const artist = document.getElementById(`artist${i}`).value.trim();
        const link = document.getElementById(`link${i}`).value.trim();
        if (title && artist) songs.push({title, artist, link});
      }
      if (!songs.length) return alert("Enter at least one song (title and artist).");

      try {
        const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/submit-song", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({gameId: game, player: player, songs})
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message || "Failed to submit songs");

        status.style.color = "green";
        status.textContent = "Thank you! Songs submitted successfully.";
        saveBtn.disabled = true;

      } catch (err) {
        status.style.color = "red";
        status.textContent = "Error submitting songs: " + err.message;
        console.error(err);
      }
    });
  }

  // ------------------------- PLAYLIST PAGE -------------------------
  const playlistContainer = document.getElementById("playlistContainer");
  const downloadBtn = document.getElementById("downloadPlaylist");

  if (playlistContainer && downloadBtn) {
    const game = getQueryParam("game");
    const info = document.getElementById("playlistInfo");
    if (!game){
      info.innerHTML = '<span class="small">Provide a game id in the URL like ?game=Game1</span>';
      return;
    }
    info.innerHTML = `Game ID: <strong>${game}</strong>`;

    fetch(`https://songday-api.charlie-waddy1.workers.dev/get-playlist?gameId=${game}`)
      .then(res => res.json())
      .then(data => {
        if (!data.ok || !data.songs || !data.songs.length){
          playlistContainer.innerHTML = "<p class='small'>No submissions found for this game yet.</p>";
          return;
        }

        const all = data.songs;

        // Shuffle
        for (let i = all.length -1; i>0; i--){
          const j = Math.floor(Math.random()*(i+1));
          [all[i], all[j]] = [all[j], all[i]];
        }

        // Build table
        let html = `<table><thead><tr><th>#</th><th>Song</th><th>Artist</th><th>Link</th><th>Player</th></tr></thead><tbody>`;
        all.forEach((s, idx) => {
          const link = s.link ? `<a href="${s.link}" target="_blank">play</a>` : "";
          html += `<tr><td>${idx+1}</td><td>${escapeHtml(s.title)}</td><td>${escapeHtml(s.artist)}</td><td>${link}</td><td>${escapeHtml(s.player)}</td></tr>`;
        });
        html += `</tbody></table>`;
        playlistContainer.innerHTML = html;

        // CSV download
        downloadBtn.addEventListener("click", () => {
          let csv = "Title,Artist,Link,Player\n";
          all.forEach(song => {
            csv += `${song.title.replace(/,/g," ")},${song.artist.replace(/,/g," ")},${song.link},${song.player}\n`;
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

      }).catch(err => {
        playlistContainer.innerHTML = `<p class='small'>Error fetching playlist: ${err.message}</p>`;
        console.error(err);
      });
  }

});
