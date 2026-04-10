import "./style.css"; // <== Importamos el archivo de estilos CSS para aplicar estilos a nuestra aplicación.
import { fetchMovie, fetchMoviesDetails } from "./api/movieApi.ts"; // <=== Importamos la api de peliculas.
import { renderMovieDetails, renderMovies } from "./ui/render.ts"; // <=== Importamos la funcion de renderizado de peliculas.
import { mapToMovieData, mapToMovieDetails } from "./utils/mapper.ts";
import {
  toggleFavorite,
  isMovieFavorite,
} from "./services/favoritesServices.ts";
import { Movie } from "./types/movie.ts";

let currentMovies: Movie[] = []; // <== Creamos una variable global para almacenar las peliculas que se estan mostrando actualmente en el grid, esto nos servira para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos.
let debouceTimer: number;

// 1.SELECCIÓN DEL DOM.
const movieGrid = document.getElementById("movie-grid") as HTMLElement; // <== Seleccionamos el contenedor del HTML donde se van a renderizar las peliculas.
const searchForm = document.getElementById("search-form") as HTMLFormElement; // <== Seleccionamos el formulario de busqueda.
const searchInput = document.getElementById("search-input") as HTMLInputElement; // <== Seleccionamos el input de busqueda.

// Seleccion de elementos del modal de detalles de pelicula.
const movieModal = document.getElementById("movie-modal") as HTMLElement; // <== Seleccionamos el contenedor del modal de detalles de pelicula.
const closeModal = document.getElementById("modal-close") as HTMLButtonElement; // <== Seleccionamos el boton de cerrar el modal de detalles de pelicula.
const modalContent = document.getElementById("modal-content") as HTMLElement; // <== Seleccionamos el contenedor del contenido del modal de detalles de pelicula.

/**
 * Nueva función par manejar el iunput debuoce.
 */
const handleInputSeacrch = (even: Event) => {
  const target = even.target as HTMLInputElement; // <== Obtenemos el elemento del input de busqueda.
  const query = target.value.trim().toLowerCase(); // <== Obtenemos el valor del input de busqueda, y lo limpiamos (trim) para eliminar espacios al principio y al final, y lo convertimos a minusculas para evitar problemas de mayusculas.

  // Si el query esta vacio, no hacemos nada (return).
  if (!query) return;

  // LImpiamos el temporizador.
  clearTimeout(debouceTimer);

  // NO buscamos hasta tener al menos 3 caracteres.
  if (query.length < 3) return;

  // inicializamo un nuevo contador.
  debouceTimer = window.setTimeout(async () => {
    try {
      //  llamamos a la funcion fetchMovie, que hace la peticion a la API de peliculas, y le pasamos el query de busqueda (query)
      const movies = await fetchMovie(query);
      currentMovies = movies;

      //  llamamos a la funcion renderMovies, que se encarga de renderizar las peliculas en el HTML,
      //  y le pasamos el array de peliculas (movies) y el contenedor del HTML (movieGrid).
      renderMovies(movies, movieGrid);

      // si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola.
    } catch (error) {
      console.error("Error en busqueda dinamica", error);
    }
  }, 500); // <== El tiempo de espera para ejecutar la busqueda, en milisegundos (500ms = 0.5 segundos).
};

// 2. Funcion handleSearch, que se ejecuta cuando el usuario hace submit en el formulario de busqueda.
const handleSearch = async (event: Event) => {
  // Evitamos que el formulario se envie y recargue la pagina.
  event.preventDefault();

  // Obtenemos el valor del input de busqueda, y lo limpiamos (trim) para eliminar espacios al principio y al final.
  const query = searchInput.value.trim();

  // Si el query esta vacio, no hacemos nada (return).
  if (!query) return;

  try {
    //  llamamos a la funcion fetchMovie, que hace la peticion a la API de peliculas, y le pasamos el query de busqueda (query)
    const movies = await fetchMovie(query);
    currentMovies = movies; // <== Guardamos las peliculas obtenidas en la variable global currentMovies,
    // para tenerlas disponibles para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos.

    //  llamamos a la funcion renderMovies, que se encarga de renderizar las peliculas en el HTML, y le pasamos el array de peliculas (movies) y el contenedor del HTML (movieGrid).
    renderMovies(movies, movieGrid);

    // si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola.
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
};

/**
 * vamos hacer dos funciones para el modal de detalles de pelicula:
 * 1. handleOpenModal: que se encarga de abrir el modal, y mostrar los detalles de la pelicula seleccionada.
 * 2. handleCloseModal: que se encarga de cerrar el modal.
 * para esto vamos a usar una delegacion de eventos, es decir, vamos a escuchar el evento click en el contenedor del HTML donde se renderizan las peliculas (movieGrid),
 *  y cuando se haga click en un boton de detalles, vamos a abrir el modal con los detalles de la pelicula seleccionada.
 * 1. Funcion handleOpenModal, que se ejecuta cuando el usuario hace click en un boton de detalles de una pelicula.
 */
const handleOpenModal = async (movieId: string) => {
  if (!movieId) return;

  try {
    movieModal.classList.remove("hidden");

    // HTML Corregido: Spinner y Texto separados para que no rote todo
    modalContent.innerHTML = `
    <div class="flex flex-col items-center justify-center p-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p class="text-slate-400 font-medium">Cargando Detalles...</p>
    </div>
    `;

    const rawData = await fetchMoviesDetails(movieId);

    // IMPORTANTE: Verifica si es mapToMovieDetais o mapToMovieDetails
    const cleanMovieData = {
      ...mapToMovieData(rawData),
      ...mapToMovieDetails(rawData),
    };

    renderMovieDetails(cleanMovieData, modalContent);
    // Asegúrate de que este ID coincida con el contenedor en tu HTML

    // Renderizamos el consejo de la IA en el modal, pasandole el titulo, la sinopsis y los generos de la pelicula.
  } catch (error) {
    console.error("Error al cargar el modal:", error);
    modalContent.innerHTML = `
      <div class="flex flex-col items-center justify-center p-10 text-center">
        <p class="text-red-500 font-medium mb-4">Error al cargar los detalles.</p>
        <button id="close-modal-error" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Cerrar</button>
      </div>
    `;
  }
};

// 2. Funcion handleCloseModal, que se ejecuta cuando el usuario hace click en el boton de cerrar el modal, afuera del modal.
const handleCloseModal = (event: Event) => {
  // Verificamos si el elemento clickeado es el boton de cerrar el modal, o si se hizo click afuera del contenido del modal.
  const target = event.target as HTMLElement;
  if (target === closeModal || target.closest("#movie-modal")) {
    // Le agregamos la clase "hidden" al modal para ocultarlo, y le quitamos la clase "flex" para centrarlo.
    movieModal.classList.add("hidden");

    // Limpiamos el contenido del modal para que no quede la informacion de la pelicula anterior cuando se abra el modal de nuevo.
    modalContent.innerHTML = "";
  }
};

// 3. Escuchamos el evento submit en el formulario de busqueda, y llamamos a la funcion handleSearch.
searchForm.addEventListener("submit", handleSearch);

// 5. Escuchamos el evento click en el modal de detalles de pelicula, y llamamos a la funcion handleCloseModal.
movieModal.addEventListener("click", handleCloseModal);

// 6. Escuchamos el evento click en el boton de cerrar el modal, y llamamos a la funcion handleCloseModal.
closeModal.addEventListener("click", handleCloseModal);

// conexión del listener al input (debouce handleInputSearch)
searchInput.addEventListener("input", handleInputSeacrch);

//listener para el botton de cerrar el modal en caso de error
// Listener extra para el botón de error
document.getElementById("close-modal-error")?.addEventListener("click", () => {
  movieModal.classList.add("hidden");
  modalContent.innerHTML = ""; // Limpiamos el contenido del modal.
});

// Listener para evitar que el click dentro del contenido del modal cierre el modal.
modalContent.addEventListener("click", (event) => {
  event.stopPropagation(); // Evitamos que el click dentro del contenido del modal cierre el modal.
});

movieGrid?.addEventListener("click", (event) => {
  // Obtener el elemento clickeado
  const target = event.target as HTMLElement;

  // Verificar si el elemento clickeado es un botón de favorito
  const isFav = target.closest(".favorite-btn") as HTMLButtonElement;

  if (isFav) {
    event.stopPropagation(); // Evitamos que el click en el botón de favorito también dispare el evento de abrir el modal.

    // Obetener el ID de la película desde el atributo data-id del botón
    const movieId = isFav.getAttribute("data-id");

    const movie = currentMovies.find((m) => m.id === movieId); // Buscamos la película en el array de películas actualmente renderizadas.

    if (movie) {
      toggleFavorite(movie); // Llamamos a la función toggleFavorite para agregar o quitar la película de favoritos.

      // Actualizamos el estado del botón de favorito después de hacer toggle
      const isFavorite = isMovieFavorite(movie.id); // Verificamos si la película es ahora un favorito o no.

      const icon = isFav.querySelector(".heart-icon") as HTMLElement; // Seleccionamos el ícono del corazón dentro del botón.

      if (icon) {
        icon.textContent = isFavorite ? "❤️" : "🤍"; // Cambiamos el ícono del corazón según el estado de favorito.

        icon.classList.toggle("text-red-500", isFavorite); // Agregamos o quitamos la clase de color rojo según el estado de favorito.

        icon.classList.toggle("text-gray-400", !isFavorite); // Agregamos o quitamos la clase de color gris según el estado de favorito.
      }
    }
    return; // Salimos de la función para evitar que se ejecute el código de abrir el modal.
  }
  // Si no se hizo click en el botón de favorito, entonces se ejecuta el código para abrir el modal (handleOpenModal).
  const detailsBtn = target.closest(".details-btn") as HTMLButtonElement;

  if (detailsBtn) {
    event.stopPropagation(); // Evitamos que el click en el botón de detalles también dispare el evento de abrir el modal, ya que handleOpenModal se encargará de abrir el modal con los detalles de la película seleccionada.
    // Obtenemos el ID de la película desde el atributo data-id del botón de detalles, y se lo pasamo directamente a la función handleOpenModal para que abra el modal con los detalles de la película seleccionada.
    const movieId = detailsBtn.getAttribute("data-id");
    if (movieId) {
      handleOpenModal(movieId); // Llamamos a la función handleOpenModal para abrir el modal con los detalles de la película seleccionada.
    }
  }
});
