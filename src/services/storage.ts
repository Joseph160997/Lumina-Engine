/**
 * Capa genérica sobre localStorage: serializa JSON al guardar y parsea al leer.
 * No asume que el valor sea un array; eso lo decide cada servicio (p. ej. favoritos).
 */

/**
 * Guarda cualquier valor serializable en localStorage bajo `key`.
 * @param key - Clave del "cajón" en localStorage.
 * @param data - Objeto/array/número/etc. que JSON.stringify pueda convertir.
 */
export const saveData = (key: string, data: unknown): void => {
  try {
    // localStorage solo acepta strings; JSON.stringify convierte el valor a texto.
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error("error saving to Localstorage", error);
  }
};

/**
 * Lee y parsea JSON desde localStorage.
 * @param key - Clave a leer.
 * @returns El valor parseado, o `null` si no hay clave, hay error de parseo, o getItem falla conceptualmente (vacío).
 *          No devuelve `[]` aquí: un array vacío es decisión de quien interpreta los datos (p. ej. lista de favoritos).
 */
export const getData = (key: string): unknown | null => {
  const raw = localStorage.getItem(key);

  // Sin clave o string vacío: no hay dato guardado.
  if (raw === null || raw === "") {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    console.error("error getting data from Localstorage", error);
    return null;
  }
};
