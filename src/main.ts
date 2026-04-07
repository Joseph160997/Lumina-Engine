import "./style.css"; // <== Importamos el archivo de estilos CSS para aplicar estilos a nuestra aplicación.
import { fetchMovie, fetchMoviesDetails } from "./api/movieApi.ts"; // <=== Importamos la api de peliculas.
import { renderMovieDetails, renderMovies } from "./ui/render.ts"; // <=== Importamos la funcion de renderizado de peliculas.
import { mapToMovieData, mapToMovieDetails } from "./utils/mapper.ts";

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
      const movies = await fetchMovie(query);
      renderMovies(movies, movieGrid);
    } catch (error) {
      console.error("Error en busqueda dinamica", error);
    }
  }, 500);
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
const handleOpenModal = async (event: Event) => {
  const target = event.target as HTMLElement; // <== Obtenemos el elemento que fue clickeado.

  // Verificamos si el elemento clickeado es un boton de detalles, usando closest para buscar el boton mas cercano al elemento clickeado que tenga el atributo data-id.
  const detailsButton = target.closest("button[data-id]") as HTMLButtonElement;

  if (!detailsButton) return;

  const movieId = detailsButton.getAttribute("data-id"); // <== Obtenemos el valor del atributo data-id, que es el ID de la pelicula seleccionada.
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
    console.log("Datos crudos de la película:", rawData); // Log para revisar los datos crudos obtenidos de la API

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

// 4. Escuchamos el evento click en el contenedor del HTML donde se renderizan las peliculas, y llamamos a la funcion handleOpenModal.
movieGrid.addEventListener("click", handleOpenModal);

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
