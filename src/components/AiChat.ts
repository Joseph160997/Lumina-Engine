import { getMovieAdvice } from "../services/aiService";
import type { Movie } from "../types/movie.ts";

/**
 * Renderizamos la seccion de la Ai dentro del contendor del modal.
 */
export const renderAiAdvice = async (movie: Movie, containerId: string) => {
  const container = document.getElementById(containerId) as HTMLElement;

  // Si no encontramos el contenedor, mostramos un mensaje de error y salimos de la funcion.
  if (!container) {
    console.error(`No se encontró el contenedor con id ${containerId}`);
    return;
  }

  // 1. Ponemos el estado de carga suti.
  container.innerHTML = `
    <div class="bg-blue-900/20 bordr border-blue-500/30 rounded-2xl p-6 mt-8 animate-pulse text-center">
       <p class="text-blue-500 text-sm text-medium">Consultando a mi experto en cine...</p>
    </div>
    `;

  // 2. Obtenemos el consejo de la Ai.
  const advice = await getMovieAdvice(
    movie.title,
    movie.overview ?? "No hay sinopsis disponible",
    movie.genres || [],
  );

  // 3. renderezamos el resultado de la Ai.
  container.innerHTML = `
  <div lass="bg-gradient-to-br from-blue-900/40 to-slate-900/60 border border-blue-500/30 rounded-2xl p-6 mt-8 shadow-lg">
    <div class="flex items-center gap-3 mb-4"> 
      <div class="bg-blue-500p-2 rounded-lg">
        <span class="text-white text-xl">🤖 Ai</span>
        </div>
          <h3 class="text-white font-bold text-lg tracking-tight">Mi experto en cine dice:</h3>
      </div>
      <p class="text-slate-300 leading-relaxed italic text-sm md:text-base">"${advice}"</p>
  </div>
  `;
};
