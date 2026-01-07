const API_BASE = "https://songday-api.charlie-waddy1.workers.dev/";

document.addEventListener("DOMContentLoaded", () => {

  /* ====== START PAGE LOGIC ====== */
  const createBtn = document.getElementById("createGame");
  if (createBtn) {
    createBtn.addEventListener("click", async () => {
      const error = document.getElementById("error");
      error.textContent = "";

      const raw = document.getElementById("playerNames").value.trim();
      if (!raw) { error.textContent = "Please enter at least one player name."; return; }
      const players = raw.split(/\r?\n/).map(p=>p.trim()).filter(Boolean);

      try {
        const res = await fetch(`${API_BASE}create-game`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ players })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        showGame(data.gameId, players);
      } catch(err) {
        error.textContent = "Error creating game.";
        console.error(err);
      }
    });
  }

 function showGame(gameId, players) {
  const section = document.getElementById("gameSection");
  const linksOut = document.getElementById("linksOutput");
  const gameIdLabel = document.getElementById("gameIdLabel");
  const viewBtn = document.getElementById("viewPlaylistBtn");
  const downloadBtn = document.getElementById("downloadCsvBtn");

  if (!section || !linksOut || !gameIdLabel || !viewBtn || !downloadBtn) {
    console.error("Start page HTML is missing required elements");
    return;
  }

  section.style.display = "block";
  gameIdLabel.textContent = gameId;
  linksOut.innerHTML = "";

  players.forEach(name => {
    const link = `${location.origin}/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;
    linksOut.innerHTML += `<p><strong>${name}</strong>: <a href="${link}" target="_blank">${link}</a></p>`;
  });

  viewBtn.href = `/playlist.html?game=${gameId}`;
  downloadBtn.onclick = () => downloadCsv(gameId);
}


  /* ====== SUBMIT PAGE LOGIC ====== */
  const form = document.getElementById("songForm");
  if (form) {
    // Generate 10 song inputs
    for (let i=1;i<=10;i++){
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `<input placeholder="Song ${i} Title" id="title${i}" /> <input placeholder="Artist ${i}" id="artist${i}" /> <input placeholder="Link (optional)" id="link${i}" />`;
      form.appendChild(div);
    }

    const player = getQueryParam("player");
    const game = getQueryParam("game");
    const label = document.getElementById("playerLabel");
    if (player && game){
      label.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    } else {
      label.innerHTML = `<span class="small">Missing game or player in URL.</span>`;
    }

    const saveBtn = document.getElementById("saveSongs");
    const status = document.getElementById("status");
    saveBtn.addEventListener("click", async (e)=>{
      e.preventDefault();
      if (!player || !game){ alert("Missing game or player."); return; }

      const songs = [];
      for (let i=1;i<=10;i++){
        const title = document.getElementById(`title${i}`).value.trim();
        const artist = document.getElementById(`artist${i}`).value.trim();
        const link = document.getElementById(`link${i}`).value.trim();
        if (title && artist) songs.push({title, artist, link});
      }
      if (songs.length === 0){ alert("Enter at least one song."); return; }

      try {
        const res = await fetch(`${API_BASE}submit-song`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ game, player, songs })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message);
        status.style.color="green";
        status.textContent="Thank you! Songs submitted.";
        saveBtn.disabled=true;
      } catch(err){
        status.style.color="red";
        status.textContent="Error submitting songs.";
        console.error(err);
      }
    });
  }

  /* ====== PLAYLIST PAGE LOGIC ====== */
  const playlistContainer = document.getElementById("playlistContainer");
  const downloadBtn = document.getElementById("downloadPlaylist");
  if (playlistContainer && downloadBtn){
    const game = getQueryParam("game");
    if (!game){
      playlistContainer.innerHTML="<p class='small'>No game ID provided.</p>";
      return;
    }

    fetch(`${API_BASE}get-playlist?game=${game}`)
      .then(res=>res.json())
      .then(data=>{
        if (!data.ok){ playlistContainer.innerHTML="No songs yet."; return; }
        const all = data.songs;
        // shuffle
        for(let i=all.length-1;i>0;i--){
          const j=Math.floor(Math.random()*(i+1));
          [all[i],all[j]]=[all[j],all[i]];
        }

        // build table
        let html="<table><thead><tr><th>#</th><th>Song</th><th>Artist</th><th>Link</th><th>Player</th></tr></thead><tbody>";
        all.forEach((s, idx)=>{
          const link=s.link?`<a href="${s.link}" target="_blank">play</a>`:"";
          html+=`<tr><td>${idx+1}</td><td>${escapeHtml(s.title)}</td><td>${escapeHtml(s.artist)}</td><td>${link}</td><td>${escapeHtml(s.player)}</td></tr>`;
        });
        html+="</tbody></table>";
        playlistContainer.innerHTML=html;

        // CSV download
        downloadBtn.onclick=()=>{
          let csv="Title,Artist,Link,Player\n";
          all.forEach(song=>{
            const t=song.title.replace(/,/g," ");
            const a=song.artist.replace(/,/g," ");
            const p=song.player.replace(/,/g," ");
            csv+=`${t},${a},${song.link},${p}\n`;
          });
          const blob=new Blob([csv],{type:"text/csv"});
          const url=URL.createObjectURL(blob);
          const a=document.createElement("a");
          a.href=url;
          a.download=`songday_${game}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

      })
      .catch(err=>{playlistContainer.innerHTML="Error loading playlist."; console.error(err);});
  }

  // ======= Helper Functions =======
  function getQueryParam(name){
    return new URLSearchParams(window.location.search).get(name);
  }

  function escapeHtml(str){
    if(!str) return "";
    return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
  }

});
