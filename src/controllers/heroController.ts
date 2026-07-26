import { getFeaturedMovies } from "../api/repositories/movie.repository";
import type { Movie } from "../types/movie";
import { getResolvedGenreCatalog } from "../state/appState";
import {
  getHeroMovies,
  setHeroMovies,
  getHeroIndex,
  setHeroIndex,
} from "../state/heroState";
import {
  renderHeroSlide,
  renderHeroTicks,
  updateHeroTicks,
  type HeroSlideElements,
} from "../ui/renderHero";

/**
 * Bundle de elementos del hero que main.ts inyecta al controlador.
 * El controlador NO conoce `document` — recibe referencias, igual que
 * modalController recibe `modal` y `contentContainer`. Esto lo hace
 * testeable y reutilizable.
 */
export interface HeroElements {
  section: HTMLElement;
  bgA: HTMLImageElement;
  bgB: HTMLImageElement;
  copy: HTMLElement; // contenedor .hero-copy (para la transición is-swapping)
  ticks: HTMLElement; // contenedor de los indicadores
  title: HTMLElement;
  meta: HTMLElement;
  overview: HTMLElement;
  cta: HTMLButtonElement;
  favButton: HTMLButtonElement;
}

const HERO_COUNT = 5;
const HERO_DELAY_MS = 7000;
const SWAP_MS = 300;

// Estado privado del módulo — mismo patrón que appState/heroState.
// `els`, `heroTimer` y `showingA` son detalles de implementación del
// rotador; nadie fuera de este archivo debe tocarlos.
let els: HeroElements | null = null;
let heroTimer: number | undefined;
let showingA = true;

/**
 * Carga las películas en tendencia, pinta la primera diapositiva y
 * arranca el rotador. Si no hay datos (ni red ni caché), oculta el
 * hero y la app sigue funcionando con la búsqueda.
 */
export async function initHero(elements: HeroElements): Promise<void> {
  els = elements;
  try {
    const featured = await loadFeaturedMovies();
    if (featured.length === 0) {
      hideHero();
      return;
    }

    preloadBackdrops(featured.map((m) => m.backdropUrl as string));
    renderHeroTicks(featured.length, elements.ticks);
    setHeroIndex(0);
    paintSlide(featured[0], true); // primer slide sin transición
    resumeTimer();
  } catch (error) {
    console.error("No se pudo cargar el hero:", error);
    hideHero();
  }
}

/**
 * Carga las destacadas desde el repository, filtra las que tienen
 * backdrop y las registra en heroState. Separada de initHero para
 * mantener a initHero enfocado en orquestar el DOM.
 */
export async function loadFeaturedMovies(): Promise<ReadonlyArray<Movie>> {
  const catalog = getResolvedGenreCatalog();
  const page = await getFeaturedMovies(catalog);
  const withBackdrop = page.movies
    .filter((m) => m.backdropUrl)
    .slice(0, HERO_COUNT);
  setHeroMovies(withBackdrop);
  return withBackdrop;
}

/** Índice siguiente con wrap-around. Lógica pura, fácil de testear. */
export function getNextHeroIndex(currentIndex: number): number {
  const total = getHeroMovies().length;
  if (total === 0) return 0;
  return (currentIndex + 1) % total;
}

/** Avanza a la siguiente diapositiva (lo llama el timer). */
export function nextSlide(): void {
  if (getHeroMovies().length === 0) return;
  const next = getNextHeroIndex(getHeroIndex());
  setHeroIndex(next);
  paintSlide(getHeroMovies()[next]);
}

/** Salta a una diapositiva concreta y reinicia el countdown. */
export function goToSlide(index: number): void {
  if (getHeroMovies().length === 0) return;
  setHeroIndex(index);
  paintSlide(getHeroMovies()[index]);
  resumeTimer(); // reinicia el countdown tras un salto manual
}

export function pauseTimer(): void {
  if (heroTimer) {
    clearInterval(heroTimer);
    heroTimer = undefined;
  }
}

export function resumeTimer(): void {
  pauseTimer(); // idempotente: nunca duplica intervalos
  heroTimer = window.setInterval(nextSlide, HERO_DELAY_MS);
}

// ── Privados ──

/**
 * Pinta una diapositiva: crossfade de backdrops, indicador activo y
 * swap de texto. El TIMING de la transición vive aquí (orquestación);
 * el CONTENIDO lo pinta renderHero (presentación).
 */
function paintSlide(movie: Movie, instant = false): void {
  const elements = els;
  if (!elements) return;

  crossfade(movie.backdropUrl as string, elements);
  updateHeroTicks(elements.ticks, getHeroIndex());

  const slide: HeroSlideElements = {
    title: elements.title,
    meta: elements.meta,
    overview: elements.overview,
    cta: elements.cta,
    favButton: elements.favButton,
  };

  if (instant) {
    renderHeroSlide(movie, slide);
    return;
  }
  elements.copy.classList.add("is-swapping");
  window.setTimeout(() => {
    renderHeroSlide(movie, slide);
    elements.copy.classList.remove("is-swapping");
  }, SWAP_MS);
}

/** Alterna las capas A/B del backdrop (crossfade + reinicio del Ken Burns). */
function crossfade(url: string, elements: HeroElements): void {
  const incoming = showingA ? elements.bgB : elements.bgA;
  const outgoing = showingA ? elements.bgA : elements.bgB;
  incoming.src = url;
  incoming.classList.add("is-active");
  outgoing.classList.remove("is-active");
  showingA = !showingA;
}

/** Precarga los backdrops para crossfades sin parpadeos. */
function preloadBackdrops(urls: ReadonlyArray<string>): void {
  urls.forEach((url) => {
    const pre = new Image();
    pre.src = url;
  });
}

function hideHero(): void {
  els?.section.classList.add("hidden");
}
