/**
 * Se lanza cuando `searchMovies()` agota todas las estrategias
 * disponibles para resolver una búsqueda: ni la red respondió con éxito,
 * ni existe una entrada en caché (ni siquiera vencida) para esa
 * combinación exacta de query + page.
 *
 * Guarda `query` y `page` como propiedades propias (no solo dentro del
 * mensaje) para que quien atrape este error pueda, por ejemplo, mostrar
 * "no se pudo completar tu búsqueda de 'batman'" sin tener que parsear
 * el string del mensaje.
 */
export class MovieSearchUnavailableError extends Error {
  constructor(
    public readonly query: string,
    public readonly page: number,
    cause?: unknown,
  ) {
    super(
      `No se pudo obtener resultados para "${query}" (página ${page}): sin conexión y sin caché disponible.`,
      { cause },
    );
    this.name = "MovieSearchUnavailableError";
  }
}

/**
 * Se lanza cuando `getMovieDetail()` agota todas las estrategias
 * disponibles para resolver los detalles de una película: ni la red respondió
 * con éxito, ni existe una entrada en caché (ni siquiera vencida) para esa
 * combinación exacta de movieId.
 */
export class MovieDetailUnavailableError extends Error {
  constructor(
    public readonly movieId: number,
    cause?: unknown,
  ) {
    super(
      `No se pudo obtener detalles para la película con ID ${movieId}: sin conexión y sin caché disponible.`,
      { cause },
    );
    this.name = "MovieDetailUnavailableError";
  }
}

/**
 * ✅ NUEVA — Se lanza cuando `getFeaturedMovies()` agota todas las
 * estrategias disponibles para resolver las destacadas de la semana:
 * ni la red respondió con éxito, ni existe una entrada en caché
 * (ni siquiera vencida).
 *
 * DECISIÓN DE DISEÑO (explícita, no accidental):
 * A diferencia de `MovieSearchUnavailableError` y `MovieDetailUnavailableError`,
 * este error NO se traduce en un mensaje visible para el usuario. El hero
 * simplemente se oculta (degradación graciosa) y la app sigue funcionando
 * con la búsqueda. La clase existe por dos razones:
 *   1. Consistencia con el patrón de errores del repository.
 *   2. Logging/debugging tipado — quien atrape el error puede hacer
 *      `instanceof FeaturedMoviesUnavailableError` sin parsear strings.
 *
 * No guarda propiedades extras (query/page/movieId) porque el endpoint
 * de tendencias no tiene parámetros que identifiquen la llamada.
 */
export class FeaturedMoviesUnavailableError extends Error {
  constructor(cause?: unknown) {
    super(
      "No se pudieron obtener las películas destacadas: sin conexión y sin caché disponible.",
      { cause },
    );
    this.name = "FeaturedMoviesUnavailableError";
  }
}
