// Helper: get URL query param
function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.addEventListener("DOMContentLoaded", () => {

  // ---------- START / Create Game ----------
  const createBtn = document.getElementById("createGame");
  if(createBtn){
    createBtn.addEventListener("click", async () => {
      const raw = document.getElementById("playerNames").value.trim();
      if(!raw) { alert("Enter at least one player name"); return; }
      const players = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      if(players.length === 0) { alert("Enter at least one player name"); return; }

      const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/create-game", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({players})
      });
      const data = await res.json();
      if(!res.ok){ alert(data.error||"Failed to create game"); return; }

      const gameId = data.gameId;
      const out = document.getElementById("linksOutput");
      out.innerHTML = "";
      data.players.forEach((name, idx)=>{
        const link = `${window.location.origin}/submit.html?game=${gameId}&player=${encodeURIComponent(name)}`;
        out.innerHTML += `<p>Player ${idx+1} (${name}): <a href="${link}" target="_blank">${link}</a></p>`;
      });
      out.innerHTML += `<hr/><p><a class="btn" href="playlist.html?game=${gameId}">View Combined Playlist (Game ${gameId})</a></p>`;
    });
  }

  // ---------- SUBMIT / Player Submit Songs ----------
  const form = document.getElementById("songForm");
  if(form){
    for(let i=1;i<=10;i++){
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `<input placeholder="Song ${i} Title" id="title${i}" /> <input placeholder="Artist ${i}" id="artist${i}" /> <input placeholder="Link (optional)" id="link${i}" />`;
      form.appendChild(div);
    }

    const player = getQueryParam("player");
    const game = getQueryParam("game");
    const label = document.getElementById("playerLabel");
    if(player && game){
      label.innerHTML = `Submitting for Game <strong>${game}</strong> as <strong>${decodeURIComponent(player)}</strong>`;
    } else {
      label.innerHTML = `<span class="small">Missing game or player in URL.</span>`;
    }

    const saveBtn = document.getElementById("saveSongs");
    const status = document.getElementById("status");
    saveBtn.addEventListener("click", async (e)=>{
      e.preventDefault();
      if(!player||!game){ alert("Missing game or player info"); return; }
      const songs=[];
      for(let i=1;i<=10;i++){
        const title = document.getElementById(`title${i}`).value.trim();
        const artist = document.getElementById(`artist${i}`).value.trim();
        const link = document.getElementById(`link${i}`).value.trim();
        if(title&&artist) songs.push({title,artist,link});
      }
      if(songs.length===0){ alert("Enter at least one song"); return; }

      const res = await fetch("https://songday-api.charlie-waddy1.workers.dev/submit-song", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({gameId:game, player, songs})
      });
      const data = await res.json();
      if(res.ok){
        status.style.color="green";
        status.textContent="Thank you! Songs submitted.";
        saveBtn.disabled=true;
      } else {
        alert(data.error||"Submission failed");
      }
    });
  }

  // ---------- PLAYLIST / Display Playlist ----------
  const playlistContainer = document.getElementById("playlistContainer");
  if(playlistContainer){
    const game = getQueryParam("game");
    const info = document.getElementById("playlistInfo");
    if(!game){ info.textContent="Missing game ID"; return; }

    async function loadPlaylist(){
      const res = await fetch(`https://songday-api.charlie-waddy1.workers.dev/playlist?game=${game}`);
      const data = await res.json();
      if(!res.ok || !data.songs.length){ playlistContainer.innerHTML="<p>No submissions yet.</p>"; return; }

      let html=`<table><thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Link</th><th>Player</th></tr></thead><tbody>`;
      data.songs.forEach((s,i)=>{
        const link = s.link ? `<a href="${s.link}" target="_blank">play</a>` : "";
        html+=`<tr><td>${i+1}</td><td>${s.title}</td><td>${s.artist}</td><td>${link}</td><td>${s.player}</td></tr>`;
      });
      html+="</tbody></table>";
      playlistContainer.innerHTML=html;

      // Download CSV
      const downloadBtn = document.getElementById("downloadPlaylist");
      if(downloadBtn){
        downloadBtn.onclick=()=> window.open(`https://songday-api.charlie-waddy1.workers.dev/playlist-csv?game=${game}`,"_blank");
      }
    }
    loadPlaylist();
  }

});
