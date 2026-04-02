import "./style.css";
import { fetchMovie, fetchMoviesDetails } from "./api/movieApi.ts"; // <=== Importamos la api de peliculas.
import { renderMovieDetails, renderMovies } from "./ui/render.ts"; // <=== Importamos la funcion de renderizado de peliculas.

// 1.SELECCIÓN DEL DOM.
const movieGrid = document.getElementById("movie-grid") as HTMLElement; // <== Seleccionamos el contenedor del HTML donde se van a renderizar las peliculas.
const searchForm = document.getElementById("search-form") as HTMLFormElement; // <== Seleccionamos el formulario de busqueda.
const searchInput = document.getElementById("search-input") as HTMLInputElement; // <== Seleccionamos el input de busqueda.

// Seleccion de elementos del modal de detalles de pelicula.
const movieModal = document.getElementById("movie-modal") as HTMLElement; // <== Seleccionamos el contenedor del modal de detalles de pelicula.
const closeModal = document.getElementById("modal-close") as HTMLButtonElement; // <== Seleccionamos el boton de cerrar el modal de detalles de pelicula.
const modalContent = document.getElementById("modal-content") as HTMLElement; // <== Seleccionamos el contenedor del contenido del modal de detalles de pelicula.
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
  // Verificamos si el elemento clickeado es un boton de detalles, usando el metodo closest para buscar el boton mas cercano al elemento clickeado.
  const target = event.target as HTMLElement;
  const detailsButton = target.closest("button[data-id]") as HTMLButtonElement;

  // Si no se encontro un boton de detalles, no hacemos nada (return).
  if (!detailsButton) return;

  const movieId = detailsButton.getAttribute("data-id"); // <== Obtenemos el id de la pelicula del atributo data-id del boton de detalles.
  if (!movieId) return; // <== Si no se encontro el id de la pelicula, no hacemos nada (return).

  try {
    // mostramos el modal vacion con un loader
    movieModal.classList.remove("hidden");

    modalContent.innerHTML = "<p class='text-center'>Cargando Detalles</p>";

    // Pedimos los datos a la api
    const movieData = await fetchMoviesDetails(movieId);

    // Renderizamos lod datos en el contenedor del modal
    renderMovieDetails(movieData, modalContent);
  } catch (error) {
    console.error("Error al cargar el modal:", error);
    modalContent.innerHTML =
      "<p class='text-2xl font-bold bg-amber-950'>No se pudo cargar la información</p> ";
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
