import { getMovieDetail } from "../api/repositories/movie.repository";
import { renderMovieDetails } from "../ui/render";

/**
 * Abre el modal y carga el detalle de una película. No conoce el Event
 * que disparó la apertura (click en "Detalles") — solo necesita el id
 * y el contenedor donde pintar, igual que performSearch no conoce el
 * Event del formulario.
 */
export async function openMovieDetail(
  movieId: number,
  modal: HTMLElement,
  contentContainer: HTMLElement,
): Promise<void> {
  modal.classList.remove("hidden");

  // ✅ PALETA: spinner de carga ámbar (antes border-blue-500)
  contentContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center p-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400 mb-4"></div>
      <p class="text-slate-400 font-medium">Cargando Detalles...</p>
    </div>
  `;

  try {
    const movieDetail = await getMovieDetail(movieId);
    renderMovieDetails(movieDetail, contentContainer);
  } catch (error) {
    console.error("Error al cargar el detalle de la película:", error);
    // ✅ PALETA: botón de error ámbar (antes bg-blue-600).
    // El id "close-modal-error" se conserva — main.ts lo usa para cerrar.
    contentContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center p-10 text-center">
        <p class="text-red-400 font-medium mb-4">Error al cargar los detalles.</p>
        <button id="close-modal-error" class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer">Cerrar</button>
      </div>
    `;
  }
}

/**
 * Cierra el modal y limpia su contenido. No decide CUÁNDO cerrar (eso
 * depende de interpretar en qué elemento hizo click el usuario, lógica
 * que vive en main.ts) — solo ejecuta la acción una vez que ya se decidió.
 */
export function closeModal(
  modal: HTMLElement,
  contentContainer: HTMLElement,
): void {
  modal.classList.add("hidden");
  contentContainer.innerHTML = "";
}
