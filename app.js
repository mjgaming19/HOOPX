"use strict";

/*
  COURT
  Real-life basketball 1v1 prototype

  Version 1:
  - Local player profile
  - Demo players
  - Challenges
  - Match results
  - XP / levels
  - Stats
  - Achievements
  - Leaderboard

  IMPORTANT:
  This version stores data in localStorage.
  Later we will replace this with Supabase so multiple
  real players can use the same database.
*/

const STORAGE_KEY = "court_basketball_v1";

const demoPlayers = [
  {
    id: 1,
    username: "Jay",
    level: 12,
    xp: 820,
    wins: 24,
    losses: 8,
    streak: 5,
    location: "Nearby",
    rank: 2,
    skills: {
      shooting: 84,
      speed: 78,
      handling: 81,
      defense: 76,
      strength: 72,
      vertical: 79
    }
  },
  {
    id: 2,
    username: "Kairo",
    level: 9,
    xp: 570,
    wins: 15,
    losses: 10,
    streak: 2,
    location: "Nearby",
    rank: 5,
    skills: {
      shooting: 79,
      speed: 86,
      handling: 75,
      defense: 70,
      strength: 68,
      vertical: 91
    }
  },
  {
    id: 3,
    username: "Ace",
    level: 16,
    xp: 1420,
    wins: 38,
    losses: 6,
    streak: 11,
    location: "Nearby",
    rank: 1,
    skills: {
      shooting: 94,
      speed: 88,
      handling: 92,
      defense: 85,
      strength: 82,
      vertical: 90
    }
  },
  {
    id: 4,
    username: "Mika",
    level: 7,
    xp: 390,
    wins: 9,
    losses: 9,
    streak: 1,
    location: "Online",
    rank: 8,
    skills: {
      shooting: 71,
      speed: 73,
      handling: 77,
      defense: 74,
      strength: 66,
      vertical: 75
    }
  },
  {
    id: 5,
    username: "Zero",
    level: 14,
    xp: 1100,
    wins: 31,
    losses: 12,
    streak: 4,
    location: "Nearby",
    rank: 3,
    skills: {
      shooting: 88,
      speed: 91,
      handling: 86,
      defense: 80,
      strength: 77,
      vertical: 85
    }
  }
];

let state = loadState();
let selectedOpponent = null;
let currentFilter = "all";

function defaultState() {
  return {
    player: {
      username: "Rookie",
      level: 1,
      xp: 0,
      wins: 0,
      losses: 0,
      games: 0,
      streak: 0,
      bestStreak: 0,
      skills: {
        shooting: 50,
        speed: 50,
        handling: 50,
        defense: 50,
        strength: 50,
        vertical: 50
      }
    },

    challenges: [],

    matches: []
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return defaultState();
    }

    const parsed = JSON.parse(saved);

    return {
      ...defaultState(),
      ...parsed,
      player: {
        ...defaultState().player,
        ...(parsed.player || {})
      }
    };
  } catch (error) {
    console.warn("Could not load save:", error);
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function xpForNextLevel(level) {
  return 100 + ((level - 1) * 50);
}

function totalXPNeeded(level) {
  let total = 0;

  for (let i = 1; i < level; i++) {
    total += xpForNextLevel(i);
  }

  return total;
}

function getLevelFromXP(xp) {
  let level = 1;
  let remaining = xp;

  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }

  return {
    level,
    currentXP: remaining,
    requiredXP: xpForNextLevel(level)
  };
}

function addXP(amount) {
  state.player.xp += amount;

  const before = state.player.level;
  const info = getLevelFromXP(state.player.xp);

  state.player.level = info.level;

  if (info.level > before) {
    showToast(`🎉 LEVEL UP! You reached Level ${info.level}`);
  }

  saveState();
  renderAll();
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ---------------- NAVIGATION ---------------- */

function setupNavigation() {
  const navButtons = document.querySelectorAll("[data-page]");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  renderAll();
}

/* ---------------- HOME ---------------- */

function renderHome() {
  const p = state.player;
  const info = getLevelFromXP(p.xp);

  document.getElementById("homeUsername").textContent = p.username;
  document.getElementById("homeLevel").textContent =
    `Level ${info.level} • ${getRankName(info.level)}`;

  document.getElementById("homeXP").textContent =
    `${info.currentXP} XP`;

  document.getElementById("homeNextXP").textContent =
    `${info.requiredXP} XP`;

  const percentage =
    Math.min(100, (info.currentXP / info.requiredXP) * 100);

  document.getElementById("homeXPBar").style.width =
    `${percentage}%`;

  document.getElementById("headerLevel").textContent =
    `LVL ${info.level}`;

  document.getElementById("headerXPBar").style.width =
    `${percentage}%`;

  const activeChallenges =
    state.challenges.filter(c => c.status === "pending").length;

  document.getElementById("challengeCount").textContent =
    `${activeChallenges} active`;
}

function getRankName(level) {
  if (level >= 30) return "Legend";
  if (level >= 20) return "All-Star";
  if (level >= 15) return "Elite";
  if (level >= 10) return "Pro";
  if (level >= 5) return "Hooper";
  return "Rookie";
}

/* ---------------- PLAYERS ---------------- */

function setupPlayerSearch() {
  const search = document.getElementById("playerSearch");

  search.addEventListener("input", renderPlayers);

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(b => {
        b.classList.remove("active");
      });

      button.classList.add("active");
      currentFilter = button.dataset.filter;

      renderPlayers();
    });
  });
}

function renderPlayers() {
  const container = document.getElementById("playersList");
  const search = document.getElementById("playerSearch");

  const query = search.value.trim().toLowerCase();

  let players = [...demoPlayers];

  if (currentFilter === "nearby") {
    players = players.filter(p => p.location === "Nearby");
  }

  if (currentFilter === "ranked") {
    players = players.filter(p => p.level >= 10);
  }

  if (query) {
    players = players.filter(p =>
      p.username.toLowerCase().includes(query)
    );
  }

  if (!players.length) {
    container.innerHTML = `
      <div class="empty">
        No players found.
      </div>
    `;
    return;
  }

  container.innerHTML = players.map(player => `
    <div class="player-card">
      <div class="avatar">🏀</div>

      <div class="player-info">
        <strong>${escapeHTML(player.username)}</strong>
        <small>
          Level ${player.level} • ${getRankName(player.level)}
          • ${player.wins}W - ${player.losses}L
        </small>
      </div>

      <button
        class="challenge-button"
        data-challenge="${player.id}">
        CHALLENGE
      </button>
    </div>
  `).join("");

  document.querySelectorAll("[data-challenge]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.challenge);
      const player = demoPlayers.find(p => p.id === id);

      if (player) {
        openChallengeModal(player);
      }
    });
  });
}

/* ---------------- CHALLENGES ---------------- */

function openChallengeModal(player) {
  selectedOpponent = player;

  document.getElementById("challengeOpponentName").textContent =
    player.username;

  document.getElementById("challengeOpponent").textContent =
    player.username;

  document.getElementById("challengeYou").textContent =
    state.player.username;

  document.getElementById("gameLocation").value = "";

  document.getElementById("gameDate").value = "";

  document.getElementById("challengeModal")
    .classList.remove("hidden");
}

function closeChallengeModal() {
  document.getElementById("challengeModal")
    .classList.add("hidden");

  selectedOpponent = null;
}

function setupChallengeModal() {
  document.getElementById("closeChallenge")
    .addEventListener("click", closeChallengeModal);

  document.getElementById("sendChallenge")
    .addEventListener("click", sendChallenge);
}

function sendChallenge() {
  if (!selectedOpponent) return;

  const location =
    document.getElementById("gameLocation").value.trim();

  const date =
    document.getElementById("gameDate").value;

  const format =
    document.getElementById("gameFormat").value;

  if (!location) {
    showToast("Enter a basketball court/location.");
    return;
  }

  if (!date) {
    showToast("Choose a date.");
    return;
  }

  const challenge = {
    id: Date.now(),
    opponentId: selectedOpponent.id,
    opponentName: selectedOpponent.username,
    format,
    location,
    date,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  state.challenges.push(challenge);

  saveState();
  closeChallengeModal();

  showToast(`🏀 Challenge sent to ${selectedOpponent.username}!`);

  showPage("challengesPage");
}

function renderChallenges() {
  const container = document.getElementById("challengesList");

  if (!state.challenges.length) {
    container.innerHTML = `
      <div class="empty">
        <div style="font-size:40px;margin-bottom:12px;">🏀</div>
        <strong>No challenges yet</strong>
        <p style="margin-top:7px;">
          Find a player and send your first 1v1 challenge.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.challenges.map(challenge => {
    const format =
      challenge.format === "timed"
        ? "15 minute game"
        : `First to ${challenge.format}`;

    return `
      <div class="challenge-card">
        <div class="avatar">🏀</div>

        <div class="player-info">
          <strong>vs ${escapeHTML(challenge.opponentName)}</strong>

          <small>
            ${escapeHTML(format)}
            • ${escapeHTML(challenge.location)}
            • ${escapeHTML(challenge.date)}
          </small>

          <div class="status">
            ${challenge.status.toUpperCase()}
          </div>
        </div>

        ${
          challenge.status === "pending"
            ? `
              <button
                class="challenge-button result-button"
                data-result="${challenge.id}">
                RESULT
              </button>
            `
            : ""
        }
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-result]").forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.result);
      openResultModal(id);
    });
  });
}

/* ---------------- RESULTS ---------------- */

let selectedChallengeId = null;

function openResultModal(challengeId) {
  const challenge =
    state.challenges.find(c => c.id === challengeId);

  if (!challenge) return;

  selectedChallengeId = challengeId;

  document.getElementById("resultOpponentName").textContent =
    `vs ${challenge.opponentName}`;

  document.getElementById("yourScore").value = 11;
  document.getElementById("opponentScore").value = 7;

  document.getElementById("resultModal")
    .classList.remove("hidden");
}

function closeResultModal() {
  document.getElementById("resultModal")
    .classList.add("hidden");

  selectedChallengeId = null;
}

function setupResultModal() {
  document.getElementById("closeResult")
    .addEventListener("click", closeResultModal);

  document.getElementById("submitResult")
    .addEventListener("click", submitResult);
}

function submitResult() {
  if (!selectedChallengeId) return;

  const challenge =
    state.challenges.find(c => c.id === selectedChallengeId);

  if (!challenge) return;

  const yourScore =
    Number(document.getElementById("yourScore").value);

  const opponentScore =
    Number(document.getElementById("opponentScore").value);

  if (
    !Number.isFinite(yourScore) ||
    !Number.isFinite(opponentScore) ||
    yourScore < 0 ||
    opponentScore < 0
  ) {
    showToast("Enter valid scores.");
    return;
  }

  if (yourScore === opponentScore) {
    showToast("A 1v1 cannot finish tied.");
    return;
  }

  const won = yourScore > opponentScore;

  state.player.games++;

  if (won) {
    state.player.wins++;
    state.player.streak++;
    state.player.bestStreak =
      Math.max(
        state.player.bestStreak,
        state.player.streak
      );
  } else {
    state.player.losses++;
    state.player.streak = 0;
  }

  challenge.status = won ? "won" : "lost";

  state.matches.push({
    id: Date.now(),
    opponent: challenge.opponentName,
    yourScore,
    opponentScore,
    result: won ? "WIN" : "LOSS",
    date: new Date().toISOString()
  });

  improveSkills(won);

  const xp = won ? 150 : 60;

  saveState();
  closeResultModal();

  addXP(xp);

  showToast(
    won
      ? `🏆 WIN! +${xp} XP`
      : `GAME COMPLETE • +${xp} XP`
  );
}

function improveSkills(won) {
  const amount = won ? 1 : 0.25;

  Object.keys(state.player.skills).forEach(skill => {
    state.player.skills[skill] = Math.min(
      99,
      state.player.skills[skill] + amount
    );
  });
}

/* ---------------- PROFILE ---------------- */

function renderProfile() {
  const p = state.player;
  const info = getLevelFromXP(p.xp);

  document.getElementById("profileUsername").textContent =
    p.username;

  document.getElementById("profileLevel").textContent =
    info.level;

  document.getElementById("profileRank").textContent =
    `Level ${info.level} • ${getRankName(info.level)}`;

  document.getElementById("profileXP").textContent =
    `${info.currentXP} / ${info.requiredXP} XP`;

  document.getElementById("profileXPBar").style.width =
    `${Math.min(
      100,
      (info.currentXP / info.requiredXP) * 100
    )}%`;

  document.getElementById("statWins").textContent =
    p.wins;

  document.getElementById("statLosses").textContent =
    p.losses;

  document.getElementById("statGames").textContent =
    p.games;

  document.getElementById("statStreak").textContent =
    p.streak;

  const skillNames = {
    shooting: "Shooting",
    speed: "Speed",
    handling: "Ball Handling",
    defense: "Defense",
    strength: "Strength",
    vertical: "Vertical"
  };

  document.getElementById("skillsList").innerHTML =
    Object.entries(p.skills).map(([key, value]) => `
      <div class="skill">
        <div class="skill-top">
          <span>${skillNames[key]}</span>
          <span>${Math.round(value)}</span>
        </div>

        <div class="skill-bar">
          <div style="width:${Math.min(100, value)}%"></div>
        </div>
      </div>
    `).join("");

  renderAchievements();
}

function renderAchievements() {
  const p = state.player;

  const achievements = [
    {
      icon: "🏀",
      name: "First Game",
      description: "Play your first 1v1",
      unlocked: p.games >= 1
    },
    {
      icon: "🏆",
      name: "First Win",
      description: "Win your first game",
      unlocked: p.wins >= 1
    },
    {
      icon: "🔥",
      name: "Hot Streak",
      description: "Win 5 games in a row",
      unlocked: p.bestStreak >= 5
    },
    {
      icon: "💯",
      name: "Century",
      description: "Reach 100 XP",
      unlocked: p.xp >= 100
    },
    {
      icon: "⭐",
      name: "Hooper",
      description: "Reach Level 5",
      unlocked: p.level >= 5
    },
    {
      icon: "👑",
      name: "Legend",
      description: "Reach Level 30",
      unlocked: p.level >= 30
    }
  ];

  document.getElementById("achievementsList").innerHTML =
    achievements.map(a => `
      <div class="achievement ${a.unlocked ? "" : "locked"}">
        <span>${a.icon}</span>
        <strong>${a.name}</strong>
        <small>${a.description}</small>
      </div>
    `).join("");
}

/* ---------------- LEADERBOARD ---------------- */

function renderLeaderboard() {
  const current = {
    id: "you",
    username: state.player.username,
    level: state.player.level,
    xp: state.player.xp,
    wins: state.player.wins,
    losses: state.player.losses,
    streak: state.player.streak
  };

  const players = [
    ...demoPlayers,
    current
  ];

  players.sort((a, b) => b.xp - a.xp);

  const container =
    document.getElementById("leaderboardList");

  container.innerHTML = players.map((player, index) => `
    <div class="leader-card">
      <div class="rank ${index < 3 ? "top" : ""}">
        ${index + 1}
      </div>

      <div class="avatar">🏀</div>

      <div class="leader-info">
        <strong>
          ${escapeHTML(player.username)}
          ${player.id === "you" ? " (YOU)" : ""}
        </strong>

        <small>
          Level ${player.level} •
          ${player.wins}W - ${player.losses}L
        </small>
      </div>

      <div class="leader-score">
        <strong>${player.xp}</strong>
        <small>XP</small>
      </div>
    </div>
  `).join("");
}

/* ---------------- SECURITY ---------------- */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------- INITIALIZATION ---------------- */

function renderAll() {
  renderHome();
  renderPlayers();
  renderChallenges();
  renderProfile();
  renderLeaderboard();
}

function setup() {
  setupNavigation();
  setupPlayerSearch();
  setupChallengeModal();
  setupResultModal();

  renderAll();
}

setup();