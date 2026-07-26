import "./style.css";
import { getGenreCatalog } from "./api/repositories/genre.repository";
import {
  refreshFavoritesButton,
  toggleMovieFavorite,
} from "./controllers/favoritesController";
import { openMovieDetail, closeModal } from "./controllers/modalController";
import { performSearch } from "./controllers/searchController";
import { getFavorites } from "./services/favoritesServices";
import {
  getIsViewingFavorites,
  getLastSearchMovies,
  setCurrentMovies,
  setIsViewingFavorites,
  setResolvedGenreCatalog,
} from "./state/appState";
import { renderMovies } from "./ui/render";

// Elementos de búsqueda y grilla.
const movieGrid = document.getElementById("movie-grid") as HTMLElement;
const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;

// Navegación entre búsqueda y favoritos.
const btnFavorites = document.getElementById(
  "btn-favorites",
) as HTMLButtonElement;
const btnBack = document.getElementById("btn-back") as HTMLButtonElement;

// Modal de detalle.
const movieModal = document.getElementById("movie-modal") as HTMLElement;
const btnCloseModal = document.getElementById(
  "modal-close",
) as HTMLButtonElement;
const modalContent = document.getElementById("modal-content") as HTMLElement;

/** Extrae y valida el id numérico desde el data-id de un elemento del DOM. */
function getMovieIdFromElement(element: HTMLElement | null): number | null {
  if (!element) return null;
  const idString = element.getAttribute("data-id");
  if (!idString) return null;
  const id = parseInt(idString, 10);
  return Number.isNaN(id) ? null : id;
}

async function initApp(): Promise<void> {
  try {
    const genreCatalog = await getGenreCatalog();
    setResolvedGenreCatalog(genreCatalog);
  } catch (error) {
    console.error("Error al obtener el catálogo de géneros:", error);
  }

  refreshFavoritesButton(btnFavorites);
}

initApp();

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

// Búsqueda con debounce al escribir: evita llamar a la API en cada tecla.
const handleInputSearch = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const query = target.value;

  clearTimeout(debounceTimer);

  if (query.trim().length < 3) return;

  debounceTimer = window.setTimeout(() => {
    performSearch(query, movieGrid);
  }, 500);
};

// Búsqueda al enviar el formulario.
const handleSearch = (event: Event): void => {
  event.preventDefault();
  performSearch(searchInput.value, movieGrid);
};

// Abrir modal al hacer click en "Detalles" de una película.
const handleOpenModal = (movieId: number): void => {
  openMovieDetail(movieId, movieModal, modalContent);
};

// Cerrar modal al hacer click en el backdrop o en el botón de cerrar.
const handleCloseModal = (event: Event): void => {
  const target = event.target as HTMLElement;
  const clickedBackdrop = target === movieModal;
  const clickedClose =
    target === btnCloseModal || Boolean(target.closest("#modal-close"));

  if (clickedBackdrop || clickedClose) {
    closeModal(movieModal, modalContent);
  }
};

// Favoritos, error de carga, y cualquier otro click dentro del modal.
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

    const isFavorite = toggleMovieFavorite(movieId);

    const icon = favBtn.querySelector(".modal-heart-icon") as HTMLElement;
    if (icon) {
      icon.textContent = isFavorite ? "❤️" : "🤍";
      icon.classList.toggle("text-red-500", isFavorite);
      icon.classList.toggle("text-slate-400", !isFavorite);
    }

    const label = favBtn.querySelector(".modal-fav-label") as HTMLElement;
    if (label) {
      label.textContent = isFavorite
        ? "Quitar de Favoritos"
        : "Agregar a Favoritos";
    }

    const gridBtn = movieGrid.querySelector(
      `.favorite-btn[data-id="${movieId}"]`,
    ) as HTMLElement | null;
    if (gridBtn) {
      const gridIcon = gridBtn.querySelector(".heart-icon") as HTMLElement;
      if (gridIcon) {
        gridIcon.textContent = isFavorite ? "❤️" : "🤍";
        gridIcon.classList.toggle("text-red-500", isFavorite);
        gridIcon.classList.toggle("text-slate-300", !isFavorite);
      }
    }

    if (getIsViewingFavorites()) {
      const updatedFavorites = getFavorites();
      setCurrentMovies(updatedFavorites);
      renderMovies(updatedFavorites, movieGrid);
    }

    refreshFavoritesButton(btnFavorites);
    return;
  }

  event.stopPropagation();
});

// Favoritos y detalles dentro del grid.
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

    const isFavorite = toggleMovieFavorite(movieId);

    const icon = favBtn.querySelector(".heart-icon") as HTMLElement;
    if (icon) {
      icon.textContent = isFavorite ? "❤️" : "🤍";
      icon.classList.toggle("text-red-500", isFavorite);
      icon.classList.toggle("text-slate-300", !isFavorite);
    }

    if (getIsViewingFavorites()) {
      const updatedFavorites = getFavorites();
      setCurrentMovies(updatedFavorites);
      renderMovies(updatedFavorites, movieGrid);
    }

    refreshFavoritesButton(btnFavorites);
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
  refreshFavoritesButton(btnFavorites);
  searchForm.classList.remove("opacity-50", "pointer-events-none");

  setIsViewingFavorites(false);
});

// Eventos
searchForm.addEventListener("submit", handleSearch);
searchInput.addEventListener("input", handleInputSearch);
movieModal.addEventListener("click", handleCloseModal);
