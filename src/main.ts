import "./style.css"; // <== Importamos el archivo de estilos CSS para aplicar estilos a nuestra aplicación.
import { fetchMovieDetails, searchMovies } from "./api/movieApi.ts";
import { renderMovieDetails, renderMovies } from "./ui/render.ts"; // <=== Importamos la funcion de renderizado de peliculas.
import { mapToMovieData, mapToMovieDetails } from "./utils/mapper.ts";
import {
  toggleFavorite,
  isMovieFavorite,
  getFavorites,
} from "./services/favoritesServices.ts";
import type { Movie } from "./types/movie.ts";

let currentMovies: Movie[] = []; // <== Creamos una variable global para almacenar las peliculas que se estan mostrando actualmente en el grid, esto nos servira para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos.
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let lastSearchMovie: Movie[] = []; // <== Creamos una variable global para almacenar el resultado de la ultima busqueda de peliculas, esto nos servira para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos, y para mantener la consistencia entre el estado de currentMovies y lo que se muestra en el grid, especialmente para manejar los favoritos dentro del modal de detalles de película.
let isViewingFavorites = false; // <== Creamos una variable global para saber si estamos viendo la lista de favoritos o no, esto nos servira para manejar los favoritos dentro del modal de detalles de película, y para mantener la consistencia visual en toda la aplicación.

// 1.SELECCIÓN DEL DOM.
const movieGrid = document.getElementById("movie-grid") as HTMLElement; // <== Seleccionamos el contenedor del HTML donde se van a renderizar las peliculas.
const searchForm = document.getElementById("search-form") as HTMLFormElement; // <== Seleccionamos el formulario de busqueda.
const searchInput = document.getElementById("search-input") as HTMLInputElement; // <== Seleccionamos el input de busqueda.
const btnFavorites = document.getElementById(
  "btn-favorites",
) as HTMLButtonElement; // <== Seleccionamos el boton de favoritos.
const btnBack = document.getElementById("btn-back") as HTMLButtonElement; // <== Seleccionamos el boton de volver, para volver a la lista de peliculas despues de ver los favoritos.

// Seleccion de elementos del modal de detalles de pelicula.
const movieModal = document.getElementById("movie-modal") as HTMLElement; // <== Seleccionamos el contenedor del modal de detalles de pelicula.
const closeModal = document.getElementById("modal-close") as HTMLButtonElement; // <== Seleccionamos el boton de cerrar el modal de detalles de pelicula.
const modalContent = document.getElementById("modal-content") as HTMLElement; // <== Seleccionamos el contenedor del contenido del modal de detalles de pelicula.

/**
 * Búsqueda con debounce al escribir: evita llamar a la API en cada tecla.
 */
const handleInputSearch = (event: Event): void => {
  const target = event.target as HTMLInputElement;

  const query = target.value.trim().toLowerCase();

  if (!query) return;

  clearTimeout(debounceTimer);

  if (query.length < 3) return;

  debounceTimer = window.setTimeout(async () => {
    try {
      //  llamamos a searchMovies (TMDB), con el texto de búsqueda (query)
      const movies = await searchMovies(query);

      // Guardamos las peliculas obtenidas en la variable global currentMovies, para tenerlas disponibles para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos.
      currentMovies = movies;

      // Guardamos una copia de las peliculas obtenidas en la variable global lastSearchMovie, para tenerlas disponibles para manejar los favoritos sin tener que volver a hacer la peticion a la API cada vez que queremos agregar o quitar una pelicula de favoritos.
      lastSearchMovie = movies;

      //  llamamos a la funcion renderMovies, que se encarga de renderizar las peliculas en el HTML, y le pasamos el array de peliculas (movies) y el contenedor del HTML (movieGrid)
      renderMovies(movies, movieGrid);

      // si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola (console.error).
    } catch (error) {
      console.error("Error en busqueda dinamica", error);
    }
  }, 500);
};

/**
 * Funcion que se encarga de hacer la busqueda de peliculas, cuando el usuario hace submit en el formulario de busqueda.
 * @param event - El evento que se ejecuta cuando el usuario hace submit en el formulario de busqueda.
 * @returns void - No retorna nada, solo ejecuta la funcion.
 */
const handleSearch = async (event: Event) => {
  // Evitamos que el formulario se envie y recargue la pagina, para que no se recargue la pagina cuando el usuario haga submit en el formulario de busqueda, evitando el comportamiento por defecto del formulario.
  event.preventDefault();

  // Obtenemos el valor del input de busqueda, y lo limpiamos (trim) para eliminar espacios al principio y al final, y lo convertimos a minusculas para evitar problemas de mayusculas.
  const query = searchInput.value.trim().toLowerCase();

  // Si el query esta vacio, no hacemos nada (return).
  if (!query) return;

  try {
    //  llamamos a searchMovies (TMDB), con el query de búsqueda (query)
    const movies = await searchMovies(query);
    currentMovies = movies; // <== Guardamos las peliculas obtenidas en la variable global currentMovies,

    lastSearchMovie = movies; // <=== Guardamos una copia

    //  llamamos a la funcion renderMovies, que se encarga de renderizar las peliculas en el HTML, y le pasamos el array de peliculas (movies) y el contenedor del HTML (movieGrid).
    renderMovies(movies, movieGrid);

    // si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola.
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
};

/**
 * Funcion que se encarga de abrir el modal, y mostrar los detalles de la pelicula seleccionada.
 * Paso 1: Verificar si el ID de la pelicula es valido, si no es el caso, la funcion termina sin hacer nada.
 * Paso 2: Intentar abrir el modal, y mostrar un spinner y un texto de carga mientras se cargan los detalles de la pelicula.
 * Paso 3: Hacer la peticion a la API de TMDB para obtener los detalles de la pelicula, y le pasamos el ID de la pelicula (movieId).
 * Paso 4: Mapeamos los datos de la pelicula, y le pasamos los datos mapeados a la funcion renderMovieDetails, que se encarga de renderizar los detalles de la pelicula en el modal.
 * Paso 6: Si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola.
 * @param movieId - El ID de la pelicula a mostrar en el modal.
 * @returns void
 */
const handleOpenModal = async (movieId: string) => {
  // Paso 1: Verificar si el ID de la pelicula es valido, si no es el caso, la funcion termina sin hacer nada.
  if (!movieId) return;

  // Paso 2: Intentar abrir el modal, y mostrar un spinner y un texto de carga mientras se cargan los detalles de la pelicula.
  try {
    movieModal.classList.remove("hidden");

    // HTML Corregido: Spinner y Texto separados para que no rote todo
    modalContent.innerHTML = `
    <div class="flex flex-col items-center justify-center p-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p class="text-slate-400 font-medium">Cargando Detalles...</p>
    </div>
    `;
    // Paso 3: Hacer la peticion a la API de TMDB para obtener los detalles de la pelicula, y le pasamos el ID de la pelicula (movieId).
    const rawData = await fetchMovieDetails(movieId);

    // Paso 4: Mapeamos los datos de la pelicula, y le pasamos los datos mapeados a la funcion renderMovieDetails, que se encarga de renderizar los detalles de la pelicula en el modal.
    // Creamos un objeto con los datos mapeados, y le pasamos los datos mapeados a la funcion renderMovieDetails, que se encarga de renderizar los detalles de la pelicula en el modal.
    const cleanMovieData = {
      ...mapToMovieData(rawData),
      ...mapToMovieDetails(rawData),
    }; // <== esos tres puntos (...), son el operador de propagacion, que se utiliza para copiar los propiedades de un objeto a otro.

    //  llamamos a la funcion renderMovieDetails, que se encarga de renderizar los detalles de la pelicula en el modal, y le pasamos los datos mapeados (cleanMovieData) y el contenedor del modal (modalContent), para que se renderice el contenido del modal.
    renderMovieDetails(cleanMovieData, modalContent);

    // Paso 5: Si algo sale mal en la peticion a la API, o en el renderizado, lo capturamos con el catch, y mostramos un error en la consola.
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

/**
 * Funcion que se encarga de cerrar el modal, y limpiar el contenido del modal.
 * Paso 1: Verificamos si el elemento clickeado es el boton de cerrar el modal, o si se hizo click afuera del contenido del modal.
 * Paso 2: Le agregamos la clase "hidden" al modal para ocultarlo, y le quitamos la clase "flex" para centrarlo.
 * Paso 3: Limpiamos el contenido del modal para que no quede la informacion de la pelicula anterior cuando se abra el modal de nuevo.
 * @param event - El evento que se ejecuta cuando el usuario hace click en el boton de cerrar el modal, afuera del modal.
 * @returns void
 */
const closeModalAndClear = () => {
  movieModal.classList.add("hidden");
  modalContent.innerHTML = "";
};

/**
 * Cierra solo si: click en el fondo (overlay) o en el botón X del modal.
 * No cerramos por clicks genéricos dentro del panel (evita condiciones demasiado amplias).
 */
const handleCloseModal = (event: Event) => {
  const target = event.target as HTMLElement;
  const clickedBackdrop = target === movieModal;
  const clickedClose =
    target === closeModal || Boolean(target.closest("#modal-close"));

  if (clickedBackdrop || clickedClose) {
    closeModalAndClear();
  }
};

/**
 * Funcion que controla si el boton de favoritos debe estar visible o no, dependiendo de si hay peliculas renderizadas en el grid o no.
 * Primero obtenemos el array de peliculas favoritas desde el servicio de favoritos.
 * Luego, verificamos si el array de peliculas favoritas tiene elementos.
 * Si tiene elementos, mostramos el boton de favoritos y actualizamos su texto para mostrar la cantidad de peliculas favoritas que hay.
 * Si no tiene elementos, ocultamos el boton de favoritos.
 * @returns void
 */
const checkFavoritesVisibility = () => {
  const favorites = getFavorites(); // Obtenemos el array de peliculas favoritas desde el servicio de favoritos.

  // Verificamos si el array de peliculas favoritas tiene elementos.
  if (favorites.length > 0) {
    // Si tiene elementos, mostramos el boton de favoritos.
    btnFavorites.classList.remove("hidden");

    // Actualizamos el texto del botón de favoritos para mostrar la cantidad de películas favoritas.
    btnFavorites.innerText = `❤️ Mis favoritos (${favorites.length})`;
  } else {
    // Si no tiene elementos, ocultamos el boton de favoritos.
    btnFavorites.classList.add("hidden");
  }
};

// 3. Escuchamos el evento submit en el formulario de busqueda, y llamamos a la funcion handleSearch.
searchForm.addEventListener("submit", handleSearch);

// 5. Escuchamos el evento click en el modal de detalles de pelicula, y llamamos a la funcion handleCloseModal.
movieModal.addEventListener("click", handleCloseModal);

// El botón X está cubierto por handleCloseModal (closest #modal-close) al hacer burbuja en #movie-modal.

// Debounce en el input de búsqueda
searchInput.addEventListener("input", handleInputSearch);

/**
 * El botón "Cerrar" del estado de error se inyecta después en el DOM; por eso no sirve
 * getElementById al cargar el script. Aquí: si es ese botón, cerramos; si no, paramos la burbuja
 * para que un click en el contenido no actúe como click en el overlay.
 */
modalContent.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  if (target.closest("#close-modal-error")) {
    closeModalAndClear();
    return;
  }
  event.stopPropagation();
});

/**
 * Listener para el grid de peliculas, que se encarga de manejar el click en el grid de peliculas, para agregar o quitar la pelicula de favoritos, y actualizar el estado del boton de favoritos dentro del grid.
 * @param event - El evento que se ejecuta cuando el usuario hace click en el grid de peliculas.
 * @returns void - No retorna nada, solo ejecuta la funcion.
 */
movieGrid?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  if (target.closest(".empty-state-reload")) {
    window.location.reload();
    return;
  }

  const isFav = target.closest(".favorite-btn") as HTMLButtonElement;

  if (isFav) {
    event.stopPropagation(); // Evitamos que el click en el botón de favorito también dispare el evento de abrir el modal, evitando que se abra el modal cuando se hace click en el botón de favorito.

    // Obtener el ID de la película desde data-id del botón favorito.
    const movieId = isFav.getAttribute("data-id");

    const movie = currentMovies.find((m) => m.id === movieId); // Buscamos la película en el array de películas actualmente renderizadas (currentMovies), para poder agregar o quitar la pelicula de favoritos.

    if (movie) {
      toggleFavorite(movie); // Llamamos a la función toggleFavorite para agregar o quitar la película de favoritos, esto es necesario para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.

      // Actualizamos el estado del botón de favorito después de hacer toggle, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.
      const isFavorite = isMovieFavorite(movie.id); // Verificamos si la película es ahora un favorito o no.

      const icon = isFav.querySelector(".heart-icon") as HTMLElement; // Seleccionamos el ícono del corazón dentro del botón (isFav), para poder cambiar el color del corazón según el estado de favorito.

      if (icon) {
        icon.textContent = isFavorite ? "❤️" : "🤍"; // Cambiamos el ícono del corazón según el estado de favorito, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.

        icon.classList.toggle("text-red-500", isFavorite); // Agregamos o quitamos la clase de color rojo según el estado de favorito, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.

        icon.classList.toggle("text-slate-300", !isFavorite);
      }

      if (isViewingFavorites) {
        // Si estamos viendo la lista de favoritos, actualizamos el grid para mostrar solo las películas que siguen siendo favoritas después del toggle, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.
        const updatedFavorites = getFavorites(); // Obtenemos el array actualizado de películas favoritas después del toggle.

        renderMovies(updatedFavorites, movieGrid); // Renderizamos las películas favoritas actualizadas en el grid, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.

        currentMovies = updatedFavorites; // Actualizamos el estado de currentMovies para que coincida con las películas que se están mostrando actualmente en el grid, que en este caso son las películas favoritas actualizadas, esto es necesario para mantener la consistencia entre el estado de currentMovies y lo que se muestra en el grid, especialmente para manejar los favoritos dentro del modal de detalles de película.
      }
      checkFavoritesVisibility(); // Verificamos si el botón de favoritos debe estar visible o no, dependiendo de si hay películas favoritas o no, después de hacer toggle, para mantener la consistencia entre el estado de favoritos dentro del grid y el estado de favoritos en el resto de la aplicación.
    }
    return; // Salimos de la función para evitar que se ejecute el código de abrir el modal, evitando que se abra el modal cuando se hace click en el botón de favorito.
  }
  // Si no se hizo click en el botón de favorito, entonces se ejecuta el código para abrir el modal (handleOpenModal), para abrir el modal con los detalles de la película seleccionada.
  const detailsBtn = target.closest(".details-btn") as HTMLButtonElement;

  if (detailsBtn) {
    event.stopPropagation();

    // Obtenemos el ID de la película desde el atributo data-id del botón de detalles, y se lo pasamo directamente a la función handleOpenModal para que abra el modal con los detalles de la película seleccionada.
    const movieId = detailsBtn.getAttribute("data-id");
    if (movieId) {
      handleOpenModal(movieId); // Llamamos a la función handleOpenModal para abrir el modal con los detalles de la película seleccionada.
    }
  }
});

/**
 * Listener para el boton de favoritos dentro del modal de detalles de pelicula.
 * Este listener se encarga de manejar el click en el boton de favoritos dentro del modal, para agregar o quitar la pelicula de favoritos, y actualizar el estado del boton de favoritos dentro del modal.
 */
modalContent?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement; // Obtenemos el elemento clickeado.

  // Verificamos si el elemento clickeado es un botón de favorito dentro del modal.
  const favBtn = target.closest(".modal-favorite-btn") as HTMLButtonElement;

  if (!favBtn) return; // Si no se hizo click en un botón de favorito dentro del modal, salimos de la función.

  // Obtenemos el ID de la película desde el atributo data-id del botón de favorito dentro del modal, como el modal se genera dinámicamente, el botón de favorito dentro del modal también se genera dinámicamente, por lo que obtenemos el ID de la película desde el atributo data-id del botón de favorito dentro del modal.
  const movieId = favBtn.getAttribute("data-id");

  if (!movieId) return; // Si no se pudo obtener el ID de la película, salimos de la función.

  // para que esto funcione, la pelicula debe estar en currentMovie, ya que el modal se genera a partir de las peliculas que se estan renderizando actualmente en el grid, y currentMovies es el array de peliculas que se estan renderizando actualmente en el grid, por lo que la pelicula que se esta mostrando en el modal debe estar en currentMovies, o podemos buscarla en el array de favoritos, si ya existia.
  const movie =
    currentMovies.find((m) => m.id === movieId) ||
    getFavorites().find((m) => m.id === movieId); // Buscamos la película en el array de películas actualmente renderizadas, y si no la encontramos, la buscamos en el array de favoritos.

  if (!movie) return; // Si no se pudo encontrar la película, salimos de la función.

  toggleFavorite(movie); // Llamamos a la función toggleFavorite para agregar o quitar la película de favoritos, esto es necesario para mantener la consistencia entre el estado de favoritos dentro del modal y el estado de favoritos en el resto de la aplicación.

  // Actualizamos el estado del botón de favorito dentro del modal tras el toggle.
  const isFav = isMovieFavorite(movie.id); // Verificamos si la película es ahora un favorito o no.

  const icon = favBtn.querySelector(".modal-heart-icon") as HTMLElement; // Seleccionamos el ícono del corazón dentro del botón de favorito del modal.

  if (icon) {
    icon.textContent = isFav ? "❤️" : "🤍"; // Cambiamos el ícono del corazón según el estado de favorito.
    icon.classList.toggle("text-red-500", isFav); // Agregamos o quitamos la clase de color rojo según el estado de favorito.
    icon.classList.toggle("text-slate-300", !isFav); // Agregamos o quitamos la clase de color gris según el estado de favorito.
  }
  // SINCRONIZACIÓN: actualizar tambien el boton del grid si el modal esta abierto, para mantener la consistencia visual en toda la aplicación.
  // Buscamos el boton del grid que tenga el mismo id, y le cambiamos el color.
  const gridBtn = document.querySelector(
    `.favorite-btn[data-id="${movie.id}"]`,
  );

  if (gridBtn) {
    const gridIcon = gridBtn.querySelector(".heart-icon");
    if (gridIcon) {
      gridIcon.textContent = isFav ? "❤️" : "🤍";

      gridIcon.classList.toggle("text-red-500", isFav); // Agregamos o quitamos la clase de color rojo según el estado de favorito.
      gridIcon.classList.toggle("text-slate-300", !isFav);
    }
  }
  // Actualizar el contador nav.
  checkFavoritesVisibility(); // Verificamos si el botón de favoritos debe estar visible o no, dependiendo de si hay películas favoritas o no, después de hacer toggle.
});

btnFavorites.addEventListener("click", () => {
  const favorites = getFavorites(); // Obtenemos el array de películas favoritas desde el servicio de favoritos.

  if (favorites.length > 0) {
    // Renderizamos las películas favoritas en el grid, usando la función renderMovies, y le pasamos el array de películas favoritas (favorites) y el contenedor del HTML (movieGrid).
    renderMovies(favorites, movieGrid);

    // Actualizamos el estado de currentMovies para que coincida con las películas que se están mostrando actualmente en el grid, que en este caso son las películas favoritas, esto es necesario para mantener la consistencia entre el estado de currentMovies y lo que se muestra en el grid, especialmente para manejar los favoritos dentro del modal de detalles de película.
    currentMovies = favorites;

    // Gestion de UI
    btnFavorites.classList.add("hidden");
    btnBack.classList.remove("hidden"); // <==
    searchForm.classList.add("opacity-50", "pointer-events-none"); // <== Deshabilitamos el formulario de búsqueda mientras estamos viendo los favoritos, para evitar que el usuario intente hacer una búsqueda mientras está viendo los favoritos, lo que podría causar confusión o problemas de usabilidad. Al agregar la clase "opacity-50", hacemos que el formulario se vea atenuado, indicando visualmente que está deshabilitado, y al agregar la clase "pointer-events-none", evitamos que el usuario pueda interactuar con el formulario, como hacer clic en el input o en el botón de búsqueda, lo que refuerza aún más la idea de que el formulario está deshabilitado mientras se están mostrando los favoritos.

    isViewingFavorites = true; // Actualizamos el estado para indicar que estamos viendo los favoritos, esto es necesario para mantener la consistencia visual en toda la aplicación, especialmente para manejar los favoritos dentro del modal de detalles de película.
  }
});
btnBack?.addEventListener("click", () => {
  // Restauramos la última búsqueda en el grid (puede ser [] si aún no había búsqueda).
  renderMovies(lastSearchMovie, movieGrid);

  currentMovies = lastSearchMovie;

  //Gestion de Ui
  btnBack.classList.add("hidden");

  checkFavoritesVisibility();
  searchForm.classList.remove("opacity-50", "pointer-events-none");

  isViewingFavorites = false; // Actualizamos el estado para indicar que ya no estamos viendo los favoritos, esto es necesario para mantener la consistencia visual en toda la aplicación, especialmente para manejar los favoritos dentro del modal de detalles de película.
});

// Al cargar la página, verificamos si hay películas favoritas para mostrar u ocultar el botón de favoritos.
checkFavoritesVisibility();
