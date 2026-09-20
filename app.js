/*
====================================================
HOOPX
Real Players. Real Courts. Real Games.
====================================================

CURRENT VERSION:
- Browser-only prototype
- No fake/demo players
- Local accounts
- Player profiles
- 1v1 challenges
- Results
- XP
- Levels
- Skills
- Achievements
- Leaderboard

IMPORTANT:
This is NOT production authentication.

Passwords are stored locally only for this prototype.
When we connect Supabase, authentication will be
handled securely by Supabase Auth.
====================================================
*/


/* ================= STORAGE ================= */

const STORAGE_KEY = "hoopx_v2";


/* ================= DEFAULT SKILLS ================= */

const defaultSkills = {

  shooting: 50,

  handles: 50,

  defense: 50,

  athleticism: 50,

  finishing: 50

};


/* ================= ACHIEVEMENTS ================= */

const achievements = [

  {
    id: "first-game",

    icon: "🏀",

    title: "First Bucket",

    desc: "Play your first game.",

    check: player =>
      player.wins + player.losses >= 1
  },

  {
    id: "first-win",

    icon: "🔥",

    title: "First Win",

    desc: "Win your first 1v1.",

    check: player =>
      player.wins >= 1
  },

  {
    id: "three-streak",

    icon: "⚡",

    title: "Heat Check",

    desc: "Reach a 3-game win streak.",

    check: player =>
      player.streak >= 3
  },

  {
    id: "five-wins",

    icon: "👑",

    title: "Five Up",

    desc: "Reach 5 wins.",

    check: player =>
      player.wins >= 5
  }

];


/* ================= APP STATE ================= */

let state = loadState();

let currentPage = "home";

let authMode = "signup";

let toastTimer;


/* ================= STATE ================= */

function freshState() {

  return {

    users: [],

    challenges: [],

    currentUserId: null

  };

}


function loadState() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      );

    if (
      saved &&
      Array.isArray(saved.users)
    ) {

      return saved;

    }

  } catch (_) {}

  return freshState();

}


function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


/* ================= USER ================= */

function currentUser() {

  return state.users.find(
    user =>
      user.id === state.currentUserId
  ) || null;

}


function getUser(userId) {

  return state.users.find(
    user => user.id === userId
  );

}


/* ================= ID ================= */

function generateId() {

  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


/* ================= SECURITY HELPERS ================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      })[character]
    );

}


/* ================= USERNAME ================= */

function normalizeUsername(value) {

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9_]/g,
      ""
    );

}


/* ================= INITIALS ================= */

function initials(name) {

  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase()
      || "H"
  );

}


/* ================= LEVEL SYSTEM ================= */

function levelForXP(xp) {

  return Math.max(
    1,
    Math.floor(xp / 500) + 1
  );

}


function XPProgress(xp) {

  const level =
    levelForXP(xp);

  const levelStart =
    (level - 1) * 500;

  const current =
    xp - levelStart;

  const needed = 500;

  const percent =
    Math.min(
      100,
      (current / needed) * 100
    );

  return {

    level,

    current,

    needed,

    percent

  };

}


/* ================= TOAST ================= */

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(
      () =>
        toast.classList.remove("show"),
      3000
    );

}


/* ================= NAVIGATION ================= */

function navigate(page) {

  currentPage = page;

  document
    .querySelectorAll(".page")
    .forEach(pageElement => {

      pageElement.classList.remove(
        "active"
      );

    });


  document
    .getElementById(`page-${page}`)
    ?.classList.add("active");


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  render();

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


/* ================= AUTH REQUIRED ================= */

function requireUser() {

  if (!currentUser()) {

    showToast(
      "Create a HOOPX account first."
    );

    navigate("auth");

    return false;

  }

  return true;

}


/* ================= MAIN RENDER ================= */

function render() {

  updateHeader();

  renderPlayers();

  renderChallenges();

  renderProfile();

  renderLeaderboard();

  updateAuthModeUI();

}


/* ================= HEADER ================= */

function updateHeader() {

  const button =
    document.getElementById(
      "headerAuthBtn"
    );

  const user =
    currentUser();


  if (user) {

    button.textContent =
      `@${user.username}`;

    button.dataset.page =
      "profile";

  } else {

    button.textContent =
      "Create account";

    button.dataset.page =
      "auth";

  }

}


/* ================= PLAYERS ================= */

function renderPlayers() {

  const list =
    document.getElementById(
      "playersList"
    );


  const search =
    (
      document.getElementById(
        "playerSearch"
      )?.value || ""
    ).toLowerCase();


  const filter =
    document.getElementById(
      "playerLevelFilter"
    )?.value || "all";


  const me =
    currentUser();


  let users =
    state.users.filter(
      user =>
        !me ||
        user.id !== me.id
    );


  if (search) {

    users =
      users.filter(user =>

        user.username
          .toLowerCase()
          .includes(search)

        ||

        user.displayName
          .toLowerCase()
          .includes(search)

        ||

        user.location
          .toLowerCase()
          .includes(search)

      );

  }


  if (filter !== "all") {

    users =
      users.filter(user => {

        const level =
          levelForXP(user.xp);


        if (
          filter === "1-5"
        ) {

          return (
            level >= 1 &&
            level <= 5
          );

        }


        if (
          filter === "6-10"
        ) {

          return (
            level >= 6 &&
            level <= 10
          );

        }


        return level >= 11;

      });

  }


  if (!users.length) {

    list.innerHTML = `

      <div
        class="empty-state"
        style="grid-column:1/-1">

        <div class="empty-icon">
          🏀
        </div>

        <h2>
          ${
            state.users.length
              ? "No players found"
              : "The court is empty"
          }
        </h2>

        <p>

          ${
            state.users.length
              ? "Try a different search or level filter."
              : "You're early. Create an account and become one of the first HOOPX players."
          }

        </p>

        ${
          !me
            ? `
              <button
                class="btn btn-primary"
                data-page="auth">
                Create your player
              </button>
            `
            : ""
        }

      </div>

    `;

    return;

  }


  list.innerHTML =
    users
      .map(playerCard)
      .join("");

}


/* ================= SKILLS ================= */

function skillName(key) {

  return {

    shooting: "Shooting",

    handles: "Handles",

    defense: "Defense",

    athleticism: "Athleticism",

    finishing: "Finishing"

  }[key] || key;

}


function skillMarkup(skills) {

  return Object
    .entries(skills)
    .map(
      ([key, value]) => `

        <div class="skill-line">

          <span>
            ${skillName(key)}
          </span>

          <div class="skill-track">

            <div
              class="skill-fill"
              style="width:${Math.min(
                100,
                value
              )}%">
            </div>

          </div>

          <strong>
            ${value}
          </strong>

        </div>

      `
    )
    .join("");

}


/* ================= PLAYER CARD ================= */

function playerCard(user) {

  const level =
    levelForXP(user.xp);


  return `

    <article class="player-card">

      <div class="player-top">

        <div class="avatar">

          ${escapeHTML(
            initials(user.displayName)
          )}

        </div>


        <div>

          <h3>
            ${escapeHTML(
              user.displayName
            )}
          </h3>

          <div class="muted">

            @${escapeHTML(
              user.username
            )}

            · 📍

            ${escapeHTML(
              user.location
            )}

          </div>

        </div>


        <div class="player-level">

          LVL ${level}

        </div>

      </div>


      <div class="player-skills">

        ${skillMarkup(
          user.skills
        )}

      </div>


      <button
        class="btn btn-primary"
        data-challenge-player="${escapeHTML(
          user.id
        )}">

        Challenge 1v1

      </button>

    </article>

  `;

}


/* ================= CHALLENGES ================= */

function renderChallenges() {

  const user =
    currentUser();


  const prompt =
    document.getElementById(
      "challengeLoginPrompt"
    );


  const content =
    document.getElementById(
      "challengesContent"
    );


  prompt.classList.toggle(
    "hidden",
    !!user
  );


  content.classList.toggle(
    "hidden",
    !user
  );


  if (!user) return;


  const list =
    document.getElementById(
      "challengesList"
    );


  const challenges =
    state.challenges

      .filter(
        challenge =>
          challenge.fromId === user.id ||
          challenge.toId === user.id
      )

      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );


  if (!challenges.length) {

    list.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🏀
        </div>

        <h2>
          No challenges yet
        </h2>

        <p>
          Find a player and send your first
          1v1 challenge.
        </p>

        <button
          class="btn btn-primary"
          data-page="players">

          Find players

        </button>

      </div>

    `;

    return;

  }


  list.innerHTML =
    challenges
      .map(challengeCard)
      .join("");

}


/* ================= CHALLENGE CARD ================= */

function challengeCard(challenge) {

  const me =
    currentUser();


  const opponent =
    getUser(
      challenge.fromId === me.id
        ? challenge.toId
        : challenge.fromId
    );


  const outgoing =
    challenge.fromId === me.id;


  return `

    <article class="challenge-card">

      <div>

        <strong>

          ${
            outgoing
              ? "You challenged"
              : "Challenge from"
          }

          ${escapeHTML(
            opponent?.displayName ||
            "Player"
          )}

        </strong>


        <div class="challenge-meta">

          <span>
            🏀
            ${escapeHTML(
              challenge.format
            )}
          </span>

          <span>
            📍
            ${escapeHTML(
              challenge.location
            )}
          </span>

          <span>
            📅
            ${escapeHTML(
              challenge.date
            )}
          </span>

          <span
            class="status
            ${escapeHTML(
              challenge.status
            )}">

            ${escapeHTML(
              challenge.status
            )}

          </span>

        </div>


        ${
          challenge.result
            ? `

              <div
                class="muted"
                style="margin-top:8px">

                Final:

                ${challenge.result.youScore}

                —

                ${challenge.result.opponentScore}

              </div>

            `
            : ""
        }

      </div>


      <div>

        ${
          !outgoing &&
          challenge.status === "pending"

            ? `

              <button
                class="btn btn-primary"
                data-challenge-action="accept"
                data-id="${challenge.id}">

                Accept

              </button>


              <button
                class="btn btn-ghost"
                data-challenge-action="decline"
                data-id="${challenge.id}">

                Decline

              </button>

            `

            : ""
        }


        ${
          challenge.status === "accepted"

            ? `

              <button
                class="btn btn-primary"
                data-result-id="${challenge.id}">

                Record result

              </button>

            `

            : ""
        }

      </div>

    </article>

  `;

}


/* ================= PROFILE ================= */

function renderProfile() {

  const user =
    currentUser();


  const loggedOut =
    document.getElementById(
      "profileLoggedOut"
    );


  const content =
    document.getElementById(
      "profileContent"
    );


  loggedOut.classList.toggle(
    "hidden",
    !!user
  );


  content.classList.toggle(
    "hidden",
    !user
  );


  if (!user) return;


  const progress =
    XPProgress(user.xp);


  document.getElementById(
    "profileAvatar"
  ).textContent =
    initials(
      user.displayName
    );


  document.getElementById(
    "profileUsername"
  ).textContent =
    `@${user.username}`;


  document.getElementById(
    "profileName"
  ).textContent =
    user.displayName;


  document.getElementById(
    "profileLocation"
  ).textContent =
    `📍 ${user.location}`;


  document.getElementById(
    "profileLevel"
  ).textContent =
    `LVL ${progress.level}`;


  document.getElementById(
    "profileXpText"
  ).textContent =
    `${progress.current} / ${progress.needed} XP`;


  document.getElementById(
    "profileXpBar"
  ).style.width =
    `${progress.percent}%`;


  document.getElementById(
    "statWins"
  ).textContent =
    user.wins;


  document.getElementById(
    "statLosses"
  ).textContent =
    user.losses;


  document.getElementById(
    "statGames"
  ).textContent =
    user.wins +
    user.losses;


  document.getElementById(
    "statStreak"
  ).textContent =
    user.streak;


  document.getElementById(
    "skillsList"
  ).innerHTML =

    Object
      .entries(user.skills)
      .map(
        ([key, value]) => `

          <div class="skill-card">

            <div class="skill-card-top">

              <span>
                ${skillName(key)}
              </span>

              <strong>
                ${value}
              </strong>

            </div>


            <div class="skill-track">

              <div
                class="skill-fill"
                style="width:${value}%">
              </div>

            </div>

          </div>

        `
      )
      .join("");


  document.getElementById(
    "achievementsList"
  ).innerHTML =

    achievements
      .map(achievement => {

        const unlocked =
          achievement.check(user);


        return `

          <div
            class="achievement
            ${
              unlocked
                ? "unlocked"
                : ""
            }">

            <div
              class="achievement-icon">

              ${achievement.icon}

            </div>

            <h3>
              ${achievement.title}
            </h3>

            <p>
              ${achievement.desc}
            </p>

          </div>

        `;

      })
      .join("");

}


/* ================= LEADERBOARD ================= */

function renderLeaderboard() {

  const list =
    document.getElementById(
      "leaderboardList"
    );


  if (!state.users.length) {

    list.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🏆
        </div>

        <h2>
          Leaderboard waiting
        </h2>

        <p>
          No one has created a HOOPX player yet.
        </p>

        <button
          class="btn btn-primary"
          data-page="auth">

          Be the first player

        </button>

      </div>

    `;

    return;

  }


  const players =
    [...state.users]
      .sort(
        (a, b) =>
          b.xp - a.xp ||
          b.wins - a.wins
      );


  list.innerHTML =
    players
      .map(
        (user, index) => `

          <article class="rank-card">

            <div class="rank-number">

              #${index + 1}

            </div>


            <div class="player-top">

              <div class="avatar">

                ${escapeHTML(
                  initials(
                    user.displayName
                  )
                )}

              </div>


              <div>

                <h3>
                  ${escapeHTML(
                    user.displayName
                  )}
                </h3>

                <div class="muted">

                  @${escapeHTML(
                    user.username
                  )}

                  ·

                  ${user.wins}W

                  ${user.losses}L

                </div>

              </div>

            </div>


            <div class="rank-level">

              LVL
              ${levelForXP(user.xp)}

            </div>


            <div class="rank-xp">

              ${user.xp}
              XP

            </div>

          </article>

        `
      )
      .join("");

}


/* ================= MODALS ================= */

function openModal(id) {

  document
    .getElementById(id)
    .classList.remove(
      "hidden"
    );

}


function closeModal(id) {

  document
    .getElementById(id)
    .classList.add(
      "hidden"
    );

}


/* ================= CHALLENGE MODAL ================= */

function populateOpponentSelect(
  selectedId = ""
) {

  const select =
    document.getElementById(
      "challengeOpponent"
    );


  const me =
    currentUser();


  select.innerHTML =

    state.users

      .filter(
        user =>
          user.id !== me?.id
      )

      .map(
        user => `

          <option
            value="${escapeHTML(
              user.id
            )}"

            ${
              user.id === selectedId
                ? "selected"
                : ""
            }>

            ${escapeHTML(
              user.displayName
            )}

            (@${escapeHTML(
              user.username
            )})

          </option>

        `
      )

      .join("");

}


function openChallengeModal(
  opponentId = ""
) {

  if (!requireUser()) return;


  const otherPlayers =
    state.users.filter(
      user =>
        user.id !==
        currentUser().id
    );


  if (!otherPlayers.length) {

    showToast(
      "There are no other HOOPX players yet."
    );

    navigate("players");

    return;

  }


  populateOpponentSelect(
    opponentId
  );


  document.getElementById(
    "challengeDate"
  ).min =
    new Date()
      .toISOString()
      .slice(0, 10);


  openModal(
    "challengeModal"
  );

}


/* ================= CREATE CHALLENGE ================= */

function submitChallenge(event) {

  event.preventDefault();


  const me =
    currentUser();


  if (!me) return;


  const opponentId =
    document.getElementById(
      "challengeOpponent"
    ).value;


  if (!opponentId) {

    showToast(
      "You need another player to challenge."
    );

    return;

  }


  const challenge = {

    id: generateId(),

    fromId: me.id,

    toId: opponentId,

    format:
      document.getElementById(
        "challengeFormat"
      ).value,

    location:
      document.getElementById(
        "challengeLocation"
      ).value.trim(),

    date:
      document.getElementById(
        "challengeDate"
      ).value,

    status: "pending",

    result: null,

    createdAt:
      new Date().toISOString()

  };


  state.challenges.push(
    challenge
  );


  saveState();


  closeModal(
    "challengeModal"
  );


  document
    .getElementById(
      "challengeForm"
    )
    .reset();


  showToast(
    "Challenge sent 🏀"
  );


  navigate(
    "challenges"
  );

}


/* ================= ACCEPT ================= */

function acceptChallenge(
  challengeId
) {

  const challenge =
    state.challenges.find(
      item =>
        item.id === challengeId
    );


  if (!challenge) return;


  challenge.status =
    "accepted";


  saveState();

  render();


  showToast(
    "Challenge accepted. Get to the court 🔥"
  );

}


/* ================= DECLINE ================= */

function declineChallenge(
  challengeId
) {

  const challenge =
    state.challenges.find(
      item =>
        item.id === challengeId
    );


  if (!challenge) return;


  challenge.status =
    "declined";


  saveState();

  render();


  showToast(
    "Challenge declined."
  );

}


/* ================= RESULT ================= */

function openResultModal(
  challengeId
) {

  const challenge =
    state.challenges.find(
      item =>
        item.id === challengeId
    );


  if (
    !challenge ||
    challenge.status !==
      "accepted"
  ) {

    return;

  }


  const me =
    currentUser();


  const opponent =
    getUser(
      challenge.fromId === me.id
        ? challenge.toId
        : challenge.fromId
    );


  document.getElementById(
    "resultChallengeId"
  ).value =
    challengeId;


  document.getElementById(
    "resultMatchText"
  ).textContent =

    `You vs ${
      opponent?.displayName ||
      "Player"
    } · ${
      challenge.format
    }`;


  openModal(
    "resultModal"
  );

}


/* ================= SAVE RESULT ================= */

function submitResult(event) {

  event.preventDefault();


  const challenge =
    state.challenges.find(
      item =>
        item.id ===
        document.getElementById(
          "resultChallengeId"
        ).value
    );


  const me =
    currentUser();


  if (!challenge || !me) return;


  const myScore =
    Number(
      document.getElementById(
        "yourScore"
      ).value
    );


  const opponentScore =
    Number(
      document.getElementById(
        "opponentScore"
      ).value
    );


  if (
    myScore === opponentScore
  ) {

    showToast(
      "A 1v1 result can't be a tie."
    );

    return;

  }


  const opponent =
    getUser(
      challenge.fromId === me.id
        ? challenge.toId
        : challenge.fromId
    );


  if (!opponent) return;


  const meWon =
    myScore >
    opponentScore;


  const winner =
    meWon
      ? me
      : opponent;


  const loser =
    meWon
      ? opponent
      : me;


  /* ================= UPDATE STATS ================= */

  winner.wins += 1;

  winner.streak += 1;

  winner.xp += 150;


  loser.losses += 1;

  loser.streak = 0;

  loser.xp += 60;


  /* ================= SKILL XP ================= */

  const skillPool = [

    "shooting",

    "handles",

    "finishing"

  ];


  const randomSkill =
    skillPool[
      Math.floor(
        Math.random() *
        skillPool.length
      )
    ];


  winner.skills[
    randomSkill
  ] = Math.min(
    100,
    winner.skills[randomSkill] + 1
  );


  /* ================= RESULT ================= */

  challenge.status =
    "completed";


  challenge.result = {

    yourScore:
      myScore,

    opponentScore:
      opponentScore,

    winnerId:
      winner.id

  };


  saveState();


  closeModal(
    "resultModal"
  );


  document
    .getElementById(
      "resultForm"
    )
    .reset();


  render();


  if (meWon) {

    showToast(
      "+150 XP — W 🏆"
    );

  } else {

    showToast(
      "+60 XP — keep grinding 💪"
    );

  }

}


/* ================= AUTH MODE ================= */

function setAuthMode(mode) {

  authMode =
    mode;

  updateAuthModeUI();

}


function updateAuthModeUI() {

  const signup =
    authMode === "signup";


  document
    .getElementById(
      "signupTab"
    )
    .classList.toggle(
      "active",
      signup
    );


  document
    .getElementById(
      "loginTab"
    )
    .classList.toggle(
      "active",
      !signup
    );


  document
    .getElementById(
      "signupFields"
    )
    .classList.toggle(
      "hidden",
      !signup
    );


  document
    .getElementById(
      "confirmPasswordLabel"
    )
    .classList.toggle(
      "hidden",
      !signup
    );


  document
    .getElementById(
      "authTitle"
    )
    .textContent =

    signup
      ? "CREATE YOUR PLAYER."
      : "WELCOME BACK.";


  document
    .getElementById(
      "authSubtitle"
    )
    .textContent =

    signup

      ? "Your account is your player. Build your stats, meet hoopers and start your run."

      : "Log back into your HOOPX player.";


  document
    .getElementById(
      "authSubmit"
    )
    .textContent =

    signup
      ? "Create account"
      : "Log in";


  document
    .getElementById(
      "password"
    )
    .autocomplete =

    signup
      ? "new-password"
      : "current-password";

}


/* ================= AUTH SUBMIT ================= */

function handleAuth(event) {

  event.preventDefault();


  const email =
    document
      .getElementById(
        "email"
      )
      .value
      .trim()
      .toLowerCase();


  const password =
    document.getElementById(
      "password"
    ).value;


  /* ================= SIGN UP ================= */

  if (
    authMode === "signup"
  ) {

    const displayName =
      document.getElementById(
        "displayName"
      ).value.trim();


    const username =
      normalizeUsername(
        document.getElementById(
          "username"
        ).value
      );


    const age =
      Number(
        document.getElementById(
          "age"
        ).value
      );


    const location =
      document.getElementById(
        "location"
      ).value.trim();


    const confirm =
      document.getElementById(
        "confirmPassword"
      ).value;


    if (
      !displayName ||
      !username ||
      !location
    ) {

      showToast(
        "Fill in all player fields."
      );

      return;

    }


    if (
      username.length < 3
    ) {

      showToast(
        "Username needs at least 3 characters."
      );

      return;

    }


    if (
      !Number.isInteger(age) ||
      age < 13
    ) {

      showToast(
        "HOOPX accounts currently require age 13+."
      );

      return;

    }


    if (
      password.length < 6
    ) {

      showToast(
        "Password needs at least 6 characters."
      );

      return;

    }


    if (
      password !== confirm
    ) {

      showToast(
        "Passwords don't match."
      );

      return;

    }


    if (
      state.users.some(
        user =>
          user.email === email
      )
    ) {

      showToast(
        "An account with this email already exists."
      );

      return;

    }


    if (
      state.users.some(
        user =>
          user.username === username
      )
    ) {

      showToast(
        "That username is already taken."
      );

      return;

    }


    const user = {

      id:
        generateId(),

      email,

      password,

      displayName,

      username,

      age,

      location,

      xp: 0,

      wins: 0,

      losses: 0,

      streak: 0,

      skills:
        {
          ...defaultSkills
        },

      createdAt:
        new Date().toISOString()

    };


    state.users.push(
      user
    );


    state.currentUserId =
      user.id;


    saveState();


    event.target.reset();


    showToast(
      "Welcome to HOOPX 🏀"
    );


    navigate(
      "profile"
    );


    return;

  }


  /* ================= LOGIN ================= */

  const user =
    state.users.find(
      item =>
        item.email === email &&
        item.password === password
    );


  if (!user) {

    showToast(
      "Email or password is incorrect."
    );

    return;

  }


  state.currentUserId =
    user.id;


  saveState();


  event.target.reset();


  showToast(
    `Welcome back, ${user.displayName} 🔥`
  );


  navigate(
    "profile"
  );

}


/* ================= EDIT PROFILE ================= */

function editProfile() {

  const user =
    currentUser();


  if (!user) return;


  document.getElementById(
    "editDisplayName"
  ).value =
    user.displayName;


  document.getElementById(
    "editLocation"
  ).value =
    user.location;


  openModal(
    "profileModal"
  );

}


function saveProfile(event) {

  event.preventDefault();


  const user =
    currentUser();


  if (!user) return;


  user.displayName =
    document
      .getElementById(
        "editDisplayName"
      )
      .value
      .trim();


  user.location =
    document
      .getElementById(
        "editLocation"
      )
      .value
      .trim();


  saveState();


  closeModal(
    "profileModal"
  );


  render();


  showToast(
    "Profile updated."
  );

}


/* ================= LOGOUT ================= */

function logout() {

  state.currentUserId =
    null;


  saveState();


  navigate(
    "home"
  );


  showToast(
    "Logged out."
  );

}


/* ================= GLOBAL CLICK HANDLER ================= */

document.addEventListener(
  "click",
  event => {


    /* Navigation */

    const pageButton =
      event.target.closest(
        "[data-page]"
      );


    if (pageButton) {

      event.preventDefault();

      navigate(
        pageButton.dataset.page
      );

      return;

    }


    /* Challenge player */

    const challengeButton =
      event.target.closest(
        "[data-challenge-player]"
      );


    if (challengeButton) {

      openChallengeModal(
        challengeButton.dataset
          .challengePlayer
      );

      return;

    }


    /* Close modal */

    const closeButton =
      event.target.closest(
        "[data-close-modal]"
      );


    if (closeButton) {

      closeModal(
        closeButton.dataset
          .closeModal
      );

      return;

    }


    /* Challenge actions */

    const actionButton =
      event.target.closest(
        "[data-challenge-action]"
      );


    if (actionButton) {

      if (
        actionButton.dataset
          .challengeAction ===
        "accept"
      ) {

        acceptChallenge(
          actionButton.dataset.id
        );

      }


      if (
        actionButton.dataset
          .challengeAction ===
        "decline"
      ) {

        declineChallenge(
          actionButton.dataset.id
        );

      }

      return;

    }


    /* Result */

    const resultButton =
      event.target.closest(
        "[data-result-id]"
      );


    if (resultButton) {

      openResultModal(
        resultButton.dataset
          .resultId
      );

    }

  }
);


/* ================= HOME BUTTONS ================= */

document
  .getElementById(
    "heroCreateBtn"
  )
  .addEventListener(
    "click",
    () => {

      setAuthMode(
        "signup"
      );

      navigate(
        "auth"
      );

    }
  );


document
  .getElementById(
    "heroLoginBtn"
  )
  .addEventListener(
    "click",
    () => {

      setAuthMode(
        "login"
      );

      navigate(
        "auth"
      );

    }
  );


document
  .getElementById(
    "bannerCreateBtn"
  )
  .addEventListener(
    "click",
    () => {

      setAuthMode(
        "signup"
      );

      navigate(
        "auth"
      );

    }
  );


/* ================= CHALLENGE ================= */

document
  .getElementById(
    "newChallengeBtn"
  )
  .addEventListener(
    "click",
    () =>
      openChallengeModal()
  );


document
  .getElementById(
    "challengeForm"
  )
  .addEventListener(
    "submit",
    submitChallenge
  );


/* ================= RESULT ================= */

document
  .getElementById(
    "resultForm"
  )
  .addEventListener(
    "submit",
    submitResult
  );


/* ================= PROFILE ================= */

document
  .getElementById(
    "profileForm"
  )
  .addEventListener(
    "submit",
    saveProfile
  );


document
  .getElementById(
    "editProfileBtn"
  )
  .addEventListener(
    "click",
    editProfile
  );


/* ================= AUTH ================= */

document
  .getElementById(
    "authForm"
  )
  .addEventListener(
    "submit",
    handleAuth
  );


document
  .getElementById(
    "signupTab"
  )
  .addEventListener(
    "click",
    () =>
      setAuthMode(
        "signup"
      )
  );


document
  .getElementById(
    "loginTab"
  )
  .addEventListener(
    "click",
    () =>
      setAuthMode(
        "login"
      )
  );


/* ================= SEARCH ================= */

document
  .getElementById(
    "playerSearch"
  )
  .addEventListener(
    "input",
    renderPlayers
  );


document
  .getElementById(
    "playerLevelFilter"
  )
  .addEventListener(
    "change",
    renderPlayers
  );


/* ================= MENU ================= */

document
  .getElementById(
    "menuBtn"
  )
  .addEventListener(
    "click",
    () => {

      const user =
        currentUser();


      if (user) {

        const logoutUser =
          confirm(
            `Logged in as @${user.username}.\n\nPress OK to log out, or Cancel to stay logged in.`
          );


        if (logoutUser) {

          logout();

        }

      } else {

        navigate(
          "auth"
        );

      }

    }
  );


/* ================= ESCAPE ================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      document
        .querySelectorAll(
          ".modal:not(.hidden)"
        )
        .forEach(
          modal =>
            closeModal(
              modal.id
            )
        );

    }

  }
);


/* ================= START ================= */

render();
