// Shared utility functions
function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

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

      // Store player list for this game
      localStorage.setItem(`songday_game_${gameId}_players`, JSON.stringify(names));

      // Display game ID and player links
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

      // Playlist links for host
      out.innerHTML += `
        <hr/>
        <p>
          <a class="btn" href="playlist.html?game=${gameId}" target="_blank">View Combined Playlist</a>
        </p>
        <p>
          <a class="btn" href="playlist.html?game=${gameId}&download=true" target="_blank">Download Playlist CSV</a>
        </p>`;

      // Optional: auto-download CSV
      // window.open(`playlist.html?game=${gameId}&download=true`, "_blank");
    });
  }

});
