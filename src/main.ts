import "./style.css";
import { fetchMovie } from "./api/movieApi"; // <== Importamos la api de peliculas.
import type { Movie } from "./types/movie"; // <== Importamos la interfaz de peliculas.

// Seleccionamos el contenedor del HTML donde vamos a pintar la grilla de peliculas.
const movieGrid = document.getElementById("movie-grid") as HTMLElement;
const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searInput = document.getElementById("search-input") as HTMLInputElement;

/**
 * FUNCIÓN QUE TRANSFORMA LOS OBJETOS MOVIE A TARJETAS VISUALES.
 */
const renderMovies = (movies: Movie[]): void => {
  // El .map() recorre cada pelicula y la transforma en una tarjeta visual.
  const htmlContent = movies
    .map(
      (movie) => `
        <article class="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
        <img src="${movie.posterUrl || "https://via.placeholder.com/500x750?text=No+Image"}" class="w-full h-80 object-cover" />
         <div class="p-4">
           <p class="text-slate-400 text-sm">${movie.releaseDate.split("-")[0]}</p>
           <div calss="mt-3 flex justify-between items-center">
            <span class="text-indigo-400 font-semibold">✨${movie.rating.toFixed(1)}</span>
            
            <button class="bg-indigo-600 hover:bg-indigo-400 px-3 py-1 rounded text-xs transition-colors duration-300">Detalles</button>
           </div>
         </div>
       </article>
    `,
    )
    .join("");

  // INYECTAMOS EL RESULTADO EN EL DOM
  movieGrid.innerHTML = htmlContent;
};

// FUNCIÓN QUE MANEJA EL FORMULARIO DE BUSQUEDA.
const handleSearch = async (event: Event) => {
  event.preventDefault(); // Evitamos que se recargue la pagina al enviar el formulario.

  // Obtenemos el valor que el usuario escribe en el input.
  const query = searInput.value;

  // Validación: si el entrada esta vacia, o solo tiene espacios en blanco, no hacemos nada.
  if (query.trim() === "") return;

  // Buscamos la pelicula en la api, y obtenemos los resultados, de lo que el usuario escriba.
  const movies = await fetchMovie(query);

  // Renderizamos, con los resultados de la busqueda.
  renderMovies(movies);
};

searchForm.addEventListener("submit", handleSearch);

/* Pureba inicial de la api de peliculas, buscamos "batman" al inicial la app.
const init = async () => {
  const movies = await searchMovies("batman");
  renderMovies(movies);
};

init();
*/
