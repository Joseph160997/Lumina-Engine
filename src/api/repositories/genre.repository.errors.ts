/**
 * Se lanza cuando `getGenreCatalog()` agota todas las estrategias
 * disponibles para resolver el catálogo de géneros: ni la red respondió
 * con éxito, ni existe una entrada en caché (ni siquiera vencida) que
 * sirva como último recurso.
 *
 * A diferencia de `HttpClientError` o `IndexedDbError`, esto no describe
 * el fallo de una pieza de infraestructura puntual — es una regla de
 * negocio de esta capa: sin catálogo de géneros no se puede mapear
 * ninguna película correctamente, así que preferimos fallar de forma
 * explícita y tipada antes que devolver un Map vacío que oculte el
 * problema en silencio.
 */
export class GenreCatalogUnavailableError extends Error {
  constructor(cause?: unknown) {
    super(
      "No se pudo obtener el catálogo de géneros: sin conexión y sin caché disponible.",
      { cause },
    );
    this.name = "GenreCatalogUnavailableError";
  }
}
