console.log("SCRIPT LOADED");

const API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3OTMwZTViYTU1OTk3MGMwMzQzODdjYmI3ZDA5ZTBmNSIsIm5iZiI6MTc4MDkwNTIzMi41MTYsInN1YiI6IjZhMjY3NTEwMjUyOTFjNGJmYmE1YzBlMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.l61rzP_HblOP4khP2COhf9JlGpuOIiREOY4WEHg64AU";

let movies = JSON.parse(localStorage.getItem("movies")) || [];
let genreMap = {};
let currentTab = "all";

// ---------------- SAVE ----------------
function save() {
  localStorage.setItem("movies", JSON.stringify(movies));
}

// ---------------- THEME ----------------
function loadTheme() {
  const theme = localStorage.getItem("theme");

  if (theme === "dark") {
    document.body.classList.add("dark");
    setIcon(true);
  } else {
    setIcon(false);
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  setIcon(isDark);
}

function setIcon(isDark) {
  const btn = document.getElementById("themeBtn");

  if (!btn) return;

  btn.innerHTML = isDark
    ? `<i class="fa-solid fa-sun"></i>`
    : `<i class="fa-solid fa-moon"></i>`;
}

// ---------------- TAB ----------------
function setTab(tab) {
  currentTab = tab;

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.remove("active-tab")
  );

  const active = document.getElementById("tab-" + tab);
  if (active) active.classList.add("active-tab");

  render();
}

// ---------------- RENDER ----------------
function render() {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = "";

  movies.forEach((m, i) => {

    if (currentTab !== "all" && m.status !== currentTab) return;

    list.innerHTML += `
      <div class="card">

        <div class="poster-wrap">

          <img src="${m.image}">
        </div>

        <div class="card-body">

          <h2>${m.title}</h2>

          <div class="status-inline">
  <button
    class="${m.status === 'watchlist' ? 'status active-status' : 'status'}"
    onclick="setStatus(${i}, 'watchlist')"
  >
    👀 Хочу посмотреть
  </button>

  <button
    class="${m.status === 'watched' ? 'status active-status' : 'status'}"
    onclick="setStatus(${i}, 'watched')"
  >
    ✅ Посмотрел
  </button>
</div>

          <div class="movie-info">
            <span class="year">📅 ${m.year || "—"}</span>

            <span class="tmdb-rating">
              TMDB ⭐ ${Number(m.tmdbRating || 0).toFixed(1)}
            </span>

            <span class="genres">
              ${
                m.genreIds?.length
                  ? `🎬 ${m.genreIds.map(id => genreMap[id]).filter(Boolean).join(" • ")}`
                  : ""
              }
            </span>
          </div>

          <div class="overview">
            ${m.overview || ""}
          </div>

          <button class="trailer-btn" onclick="showTrailer(${i})">
           ▶ Смотреть трейлер
          </button>

          <div class="stars" onmouseleave="resetHover(${i})">
            ${[1,2,3,4,5].map(n => `
              <span
                class="star ${n <= (m.rating || 0) ? 'active' : ''}"
                id="star-${i}-${n}"
                onmouseover="hoverStars(${i}, ${n})"
                onclick="setRating(${i}, ${n})"
              >★</span>
            `).join('')}
          </div>

          ${m.review ? `
            <div class="review-text">📝 ${m.review}</div>
          ` : ""}

          ${m.editing ? `
            <div class="review-editor">
              <textarea
                 id="review-input-${i}"
                 placeholder="Напишите отзыв..."
              >${m.review || ""}</textarea>
              <button onclick="saveReview(${i})">Сохранить</button>
            </div>
          ` : ""}

          <div class="menu" onclick="toggleMenu(${i})">⋮</div>

          <div class="menu-box" id="menu-${i}">
            <button onclick="editReview(${i})">✏ Редактировать</button>
            <button onclick="deleteMovie(${i})">🗑 Удалить</button>
          </div>

        </div>
      </div>
    `;
  });
}

// ---------------- SEARCH ----------------
async function autoSearch() {
  const input = document.getElementById("searchInput");
  const box = document.getElementById("suggestions");

  if (!input || !box) return;

  const value = input.value.trim();

  if (value.length < 2) {
    box.innerHTML = "";
    return;
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(value)}&language=ru`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    }
  );

  const data = await res.json();

  box.innerHTML = "";

  data.results.slice(0, 5).forEach(movie => {
    box.innerHTML += `
      <div class="suggest" onclick="selectMovie('${movie.title.replace(/'/g, "")}')">
        🎬 ${movie.title}
      </div>
    `;
  });
}

function selectMovie(title) {
  addMovie(title);
}

// ---------------- ADD MOVIE ----------------
async function addMovie(title) {

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=ru`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    }
  );

  const data = await res.json();
  const movie = data.results[0];

  movies.push({
    id: movie.id,
    title: movie.title,
    image: movie.poster_path
      ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
      : "",

    rating: 0,
    review: "",
    editing: false,
    status: "",

    year: movie.release_date
      ? movie.release_date.slice(0, 4)
      : "—",

    tmdbRating: movie.vote_average || 0,
    overview: movie.overview || "Описание отсутствует",
    genreIds: movie.genre_ids || [],

    trailer: null
  });

  save();
  render();

  document.getElementById("searchInput").value = "";
  document.getElementById("suggestions").innerHTML = "";
}

// ---------------- RATING ----------------
function setRating(i, value) {
  movies[i].rating = value;
  save();
  render();
}

// ---------------- HOVER ----------------
function hoverStars(i, value) {
  for (let x = 1; x <= 5; x++) {
    const star = document.getElementById(`star-${i}-${x}`);
    if (!star) continue;

    if (x <= value) star.classList.add("hover");
    else star.classList.remove("hover");
  }
}

function resetHover(i) {
  for (let x = 1; x <= 5; x++) {
    const star = document.getElementById(`star-${i}-${x}`);
    if (!star) continue;

    star.classList.remove("hover");

    if (x <= (movies[i].rating || 0)) {
      star.classList.add("active");
    }
  }
}

// ---------------- MENU ----------------
function toggleMenu(i) {
  const el = document.getElementById(`menu-${i}`);
  if (!el) return;

  el.style.display = el.style.display === "block" ? "none" : "block";
}

// ---------------- EDIT ----------------
function editReview(i) {
  movies[i].editing = true;
  render();
}

// ---------------- DELETE ----------------
function deleteMovie(i) {
  movies.splice(i, 1);
  save();
  render();
}

// ---------------- SAVE REVIEW ----------------
function saveReview(i) {
  const input = document.getElementById(`review-input-${i}`);

  movies[i].review = input.value.trim();
  movies[i].editing = false;

  save();
  render();
}

// ---------------- STATUS ----------------
function setStatus(i, status) {

  // если нажали на уже активный статус
  if (movies[i].status === status) {
    movies[i].status = "";
  } else {
    movies[i].status = status;
  }

  save();
  render();
}
// ---------------- GENRES ----------------
async function loadGenres() {
  const res = await fetch(
    "https://api.themoviedb.org/3/genre/movie/list?language=ru",
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    }
  );

  const data = await res.json();

  data.genres.forEach(g => {
    genreMap[g.id] = g.name.toLowerCase();
  });

  render();
}

// ---------------- INIT ----------------
loadTheme();
loadGenres();
render();

// ---------------- CLOSE SEARCH ----------------
document.addEventListener("click", (e) => {
  const searchBox = document.querySelector(".search-box");

  if (!searchBox) return;

  if (!searchBox.contains(e.target)) {
    document.getElementById("suggestions").innerHTML = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("suggestions").innerHTML = "";
  }
});

document.addEventListener("click", (e) => {

  // если клик НЕ по кнопке ⋮ и НЕ по самому меню
  if (
    !e.target.closest(".menu") &&
    !e.target.closest(".menu-box")
  ) {
    document.querySelectorAll(".menu-box").forEach(menu => {
      menu.style.display = "none";
    });
  }

});

// TREYLER
async function getTrailer(movieId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/videos?language=ru`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    }
  );

  const data = await res.json();

  const trailer = data.results.find(
    v => v.site === "YouTube" && v.type === "Trailer"
  );

  return trailer
    ? `https://www.youtube.com/embed/${trailer.key}`
    : null;
}

//
async function showTrailer(i) {

  const modal = document.getElementById("trailerModal");
  const frame = document.getElementById("trailerFrame");

  if (modal.style.display === "flex") {
    closeTrailer();
    return;
  }

  if (!movies[i].trailer) {
    movies[i].trailer = await getTrailer(movies[i].id);
    save();
  }

  if (!movies[i].trailer) {
    showToast("🎬 Трейлер для этого фильма не найден");
    return;
  }

  frame.src = movies[i].trailer + "?autoplay=1";

  modal.style.display = "flex";
}

//
function closeTrailer() {

  const modal = document.getElementById("trailerModal");
  const frame = document.getElementById("trailerFrame");

  modal.style.display = "none";

  frame.src = "";
}

// клик по фону
document.addEventListener("click", (e) => {

  const modal = document.getElementById("trailerModal");

  if (e.target === modal) {
    closeTrailer();
  }

});

// ESC
document.addEventListener("keydown", (e) => {

  if (e.key === "Escape") {
    closeTrailer();
  }

});

// обновление страницы
window.addEventListener("beforeunload", () => {
  closeTrailer();
});

//
function showToast(text) {

  const toast = document.getElementById("toast");

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}