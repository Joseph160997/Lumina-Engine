import "./style.css";
import { fetchMovie } from "./api/movieApi.ts"; // <=== Importamos la api de peliculas.
import { renderMovies } from "./ui/render.ts"; // <=== Importamos la funcion de renderizado de peliculas.

// 1.SELECCIÓN DEL DOM.
const movieGrid = document.getElementById("movie-grid") as HTMLElement; // <== Seleccionamos el contenedor del HTML donde se van a renderizar las peliculas.
const searchForm = document.getElementById("search-form") as HTMLFormElement; // <== Seleccionamos el formulario de busqueda.
const searchInput = document.getElementById("search-input") as HTMLInputElement; // <== Seleccionamos el input de busqueda.

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

// 3. Escuchamos el evento submit en el formulario de busqueda, y llamamos a la funcion handleSearch.
searchForm.addEventListener("submit", handleSearch);
