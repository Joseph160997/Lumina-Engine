import { getFavorites, isMovieFavorite } from "../services/favoritesServices";
import { getIsViewingFavorites, setCurrentMovies } from "../state/appState";
import { renderMovies } from "./render";

/**
 * Configuración para sincronizar un botón de favorito.
 * Cada contexto (grid, modal, hero) tiene selectores y textos propios,
 * pero el CRITERIO DE COLOR es uno solo (FAV_ACTIVE / FAV_INACTIVE).
 */
export interface FavButtonConfig {
  iconSelector: string;
  labelSelector?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

// ── Configuraciones por contexto ──
// El grid solo tiene icono (sin label).
export const GRID_FAV_CONFIG: FavButtonConfig = {
  iconSelector: ".heart-icon",
};

// El modal tiene icono + label corto (el botón es angosto, ancho del póster).
export const MODAL_FAV_CONFIG: FavButtonConfig = {
  iconSelector: ".modal-heart-icon",
  labelSelector: ".modal-fav-label",
  activeLabel: "Quitar",
  inactiveLabel: "Favoritos",
};

// El hero tiene icono + label largo (el botón es ancho).
export const HERO_FAV_CONFIG: FavButtonConfig = {
  iconSelector: ".hero-fav-icon",
  labelSelector: ".hero-fav-label",
  activeLabel: "En favoritos",
  inactiveLabel: "Agregar a favoritos",
};

// ── UN solo criterio de color para "favorito" en toda la app ──
const FAV_ACTIVE = "text-red-500";
const FAV_INACTIVE = "text-slate-400";

/** Elementos que syncFavoriteUI necesita para sincronizar toda la UI. */
export interface FavoriteSyncElements {
  grid: HTMLElement;
  modalContent: HTMLElement;
  heroFavButton: HTMLElement;
  navbarFavButton: HTMLButtonElement;
}

/**
 * Sincroniza TODA la UI de favoritos para una película dada:
 * grid, modal, hero y navbar. Un solo lugar, un solo criterio.
 *
 * Se llama después de cada toggleMovieFavorite().
 */
export function syncFavoriteUI(
  movieId: number,
  els: FavoriteSyncElements,
): void {
  const isFav = isMovieFavorite(movieId);

  // Grid: icono de la tarjeta (si la película está visible en el grid)
  const gridBtn = els.grid.querySelector(
    `.favorite-btn[data-id="${movieId}"]`,
  ) as HTMLElement | null;
  if (gridBtn) applyFavState(gridBtn, isFav, GRID_FAV_CONFIG);

  // Modal: icono + label (si el modal está abierto mostrando esta película)
  const modalBtn = els.modalContent.querySelector(
    `.modal-favorite-btn[data-id="${movieId}"]`,
  ) as HTMLElement | null;
  if (modalBtn) applyFavState(modalBtn, isFav, MODAL_FAV_CONFIG);

  // Hero: icono + label (si el hero está mostrando esta película)
  if (els.heroFavButton.dataset.id === String(movieId)) {
    applyFavState(els.heroFavButton, isFav, HERO_FAV_CONFIG);
  }

  // Si estamos en la vista de favoritos y se quitó uno, re-renderizar
  if (getIsViewingFavorites()) {
    const updated = getFavorites();
    setCurrentMovies(updated);
    renderMovies(updated, els.grid);
  }

  refreshNavbarButton(els.navbarFavButton);
}

/**
 * Sincroniza un botón de favorito individual.
 * Uso: paints iniciales (renderHeroSlide) donde ya se conoce el movieId
 * y solo hay que reflejar el estado actual, no reaccionar a un toggle.
 */
export function syncFavoriteButton(
  button: HTMLElement,
  movieId: number,
  config: FavButtonConfig,
): void {
  applyFavState(button, isMovieFavorite(movieId), config);
}

/**
 * Actualiza el botón de favoritos del navbar (contador + visibilidad).
 * Mudado desde favoritesController: es una operación de DOM, no de negocio.
 */
export function refreshNavbarButton(button: HTMLButtonElement): void {
  const favorites = getFavorites();
  if (favorites.length > 0) {
    button.classList.remove("hidden");
    button.innerText = `❤️ Mis favoritos (${favorites.length})`;
  } else {
    button.classList.add("hidden");
  }
}

// ── Privado ──

/**
 * ÚNICA función que toca clases de color de favoritos.
 * Aplica icono (emoji + color) y label opcional según el estado.
 */
function applyFavState(
  button: HTMLElement,
  isFav: boolean,
  config: FavButtonConfig,
): void {
  const icon = button.querySelector(config.iconSelector);
  if (icon) {
    icon.textContent = isFav ? "❤️" : "🤍";
    icon.classList.toggle(FAV_ACTIVE, isFav);
    icon.classList.toggle(FAV_INACTIVE, !isFav);
  }
  if (config.labelSelector && config.activeLabel && config.inactiveLabel) {
    const label = button.querySelector(config.labelSelector);
    if (label) {
      label.textContent = isFav ? config.activeLabel : config.inactiveLabel;
    }
  }
}
