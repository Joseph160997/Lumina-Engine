import "./style.css";
import { getGenreCatalog } from "./api/repositories/genre.repository";
import { toggleMovieFavorite } from "./controllers/favoritesController";
import { openMovieDetail, closeModal } from "./controllers/modalController";
import { performSearch } from "./controllers/searchController";
import {
  initHero,
  goToSlide,
  pauseTimer,
  resumeTimer,
  type HeroElements,
} from "./controllers/heroController";
import { getFavorites } from "./services/favoritesServices";
import {
  getLastSearchMovies,
  setCurrentMovies,
  setIsViewingFavorites,
  setResolvedGenreCatalog,
} from "./state/appState";
import { renderMovies } from "./ui/render";
import {
  syncFavoriteUI,
  refreshNavbarButton,
  type FavoriteSyncElements,
} from "./ui/favoritesSync";

// ═══════════════════════════════════════════════════════════
// 1. DECLARACIÓN DE ELEMENTOS DEL DOM
// ═══════════════════════════════════════════════════════════

// Búsqueda y grilla
const movieGrid = document.getElementById("movie-grid") as HTMLElement;
const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;

// Navegación
const btnFavorites = document.getElementById(
  "btn-favorites",
) as HTMLButtonElement;
const btnBack = document.getElementById("btn-back") as HTMLButtonElement;

// Modal
const movieModal = document.getElementById("movie-modal") as HTMLElement;
const btnCloseModal = document.getElementById(
  "modal-close",
) as HTMLButtonElement;
const modalContent = document.getElementById("modal-content") as HTMLElement;

// Hero
const heroSection = document.getElementById("hero") as HTMLElement;
const heroBgA = document.getElementById("hero-bg-a") as HTMLImageElement;
const heroBgB = document.getElementById("hero-bg-b") as HTMLImageElement;
const heroCopy = document.getElementById("hero-copy") as HTMLElement;
const heroTitle = document.getElementById("hero-title") as HTMLElement;
const heroMeta = document.getElementById("hero-meta") as HTMLElement;
const heroOverview = document.getElementById("hero-overview") as HTMLElement;
const heroCta = document.getElementById("hero-cta") as HTMLButtonElement;
const heroFav = document.getElementById("hero-fav") as HTMLButtonElement;
const heroTicks = document.getElementById("hero-ticks") as HTMLElement;

// ═══════════════════════════════════════════════════════════
// 2. BUNDLES DE INYECCIÓN (Dependency Injection)
// ═══════════════════════════════════════════════════════════

const heroEls: HeroElements = {
  section: heroSection,
  bgA: heroBgA,
  bgB: heroBgB,
  copy: heroCopy,
  ticks: heroTicks,
  title: heroTitle,
  meta: heroMeta,
  overview: heroOverview,
  cta: heroCta,
  favButton: heroFav,
};

const favSyncEls: FavoriteSyncElements = {
  grid: movieGrid,
  modalContent: modalContent,
  heroFavButton: heroFav,
  navbarFavButton: btnFavorites,
};

// ═══════════════════════════════════════════════════════════
// 3. HELPERS
// ═══════════════════════════════════════════════════════════

function getMovieIdFromElement(element: HTMLElement | null): number | null {
  if (!element) return null;
  const idString = element.getAttribute("data-id");
  if (!idString) return null;
  const id = parseInt(idString, 10);
  return Number.isNaN(id) ? null : id;
}

// ═══════════════════════════════════════════════════════════
// 4. INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════

async function initApp(): Promise<void> {
  try {
    const genreCatalog = await getGenreCatalog();
    setResolvedGenreCatalog(genreCatalog);
  } catch (error) {
    console.error("Error al obtener el catálogo de géneros:", error);
  }

  // Inicializamos el navbar y el hero rotatorio
  refreshNavbarButton(btnFavorites);
  initHero(heroEls);
}

initApp();

// ═══════════════════════════════════════════════════════════
// 5. LÓGICA DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const handleInputSearch = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const query = target.value;
  clearTimeout(debounceTimer);
  if (query.trim().length < 3) return;
  debounceTimer = window.setTimeout(() => {
    performSearch(query, movieGrid);
  }, 500);
};

const handleSearch = (event: Event): void => {
  event.preventDefault();
  performSearch(searchInput.value, movieGrid);
};

// ═══════════════════════════════════════════════════════════
// 6. LÓGICA DEL MODAL
// ═══════════════════════════════════════════════════════════

const handleOpenModal = (movieId: number): void => {
  openMovieDetail(movieId, movieModal, modalContent);
};

const handleCloseModal = (event: Event): void => {
  const target = event.target as HTMLElement;
  const clickedBackdrop = target === movieModal;
  const clickedClose =
    target === btnCloseModal || Boolean(target.closest("#modal-close"));

  if (clickedBackdrop || clickedClose) {
    closeModal(movieModal, modalContent);
  }
};

// ═══════════════════════════════════════════════════════════
// 7. EVENT LISTENERS (Solo cableado, delegan a controllers)
// ═══════════════════════════════════════════════════════════

// -- Modal --
modalContent.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  const errorCloseBtn = target.closest("#close-modal-error");
  if (errorCloseBtn) {
    closeModal(movieModal, modalContent);
    return;
  }

  const favBtn = target.closest(".modal-favorite-btn") as HTMLElement | null;
  if (favBtn) {
    const movieId = getMovieIdFromElement(favBtn);
    if (movieId === null) return;
    toggleMovieFavorite(movieId);
    syncFavoriteUI(movieId, favSyncEls); // 1 línea reemplaza ~20
    return;
  }

  event.stopPropagation();
});

// -- Grid --
movieGrid.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  if (target.closest(".empty-state-reload")) {
    window.location.reload();
    return;
  }

  const favBtn = target.closest(".favorite-btn") as HTMLElement | null;
  if (favBtn) {
    event.stopPropagation();
    const movieId = getMovieIdFromElement(favBtn);
    if (movieId === null) return;
    toggleMovieFavorite(movieId);
    syncFavoriteUI(movieId, favSyncEls); // 1 línea reemplaza ~15
    return;
  }

  const detailsBtn = target.closest(".details-btn") as HTMLElement | null;
  if (detailsBtn) {
    event.stopPropagation();
    const movieId = getMovieIdFromElement(detailsBtn);
    if (movieId === null) return;
    handleOpenModal(movieId);
  }
});

// -- Navbar --
btnFavorites.addEventListener("click", (event) => {
  event.preventDefault();
  const favorites = getFavorites();
  if (favorites.length > 0) {
    setCurrentMovies(favorites);
    renderMovies(favorites, movieGrid);
    btnFavorites.classList.add("hidden");
    btnBack.classList.remove("hidden");
    searchForm.classList.add("opacity-50", "pointer-events-none");
    setIsViewingFavorites(true);
  }
});

btnBack.addEventListener("click", (event) => {
  event.preventDefault();
  const lastSearch = getLastSearchMovies();
  setCurrentMovies(lastSearch);
  renderMovies(lastSearch, movieGrid);
  btnBack.classList.add("hidden");
  refreshNavbarButton(btnFavorites);
  searchForm.classList.remove("opacity-50", "pointer-events-none");
  setIsViewingFavorites(false);
});

// -- Hero --
heroCta.addEventListener("click", (event) => {
  event.preventDefault();
  const id = Number(heroCta.dataset.id);
  if (!Number.isNaN(id)) openMovieDetail(id, movieModal, modalContent);
});

heroFav.addEventListener("click", (event) => {
  event.preventDefault();
  const id = Number(heroFav.dataset.id);
  if (Number.isNaN(id)) return;
  toggleMovieFavorite(id);
  syncFavoriteUI(id, favSyncEls); // 1 línea reemplaza ~5
});

heroTicks.addEventListener("click", (event) => {
  const btn = (event.target as HTMLElement).closest(
    ".hero-tick",
  ) as HTMLElement | null;
  if (!btn) return;
  goToSlide(Number(btn.dataset.tick)); // Delega al controller
});

heroSection.addEventListener("mouseenter", pauseTimer);
heroSection.addEventListener("mouseleave", resumeTimer);

// -- Globales --
searchForm.addEventListener("submit", handleSearch);
searchInput.addEventListener("input", handleInputSearch);
movieModal.addEventListener("click", handleCloseModal);
