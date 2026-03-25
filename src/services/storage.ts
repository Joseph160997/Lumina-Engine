/**
 * Guarda caulquier tipo de dato bajo una clave específica.
 * Usamo 'any' aqui termporalmente, para poder usarlo con cualquier cosa.
 */
export const saveData = (key: string, data: any): void => {
  // . Usamos try-catch para manejar posibles errores
  try {
    // Convertimos el arry a JSON, ya que localStorage solo acepta strings y no objetos.
    const serialzedData = JSON.stringify(data);

    // Guardamos ese texto en el "cajón" que indica la variable "key"
    localStorage.setItem(key, serialzedData);

    // Si todo sale bien la función termina en silencio.

    // Si algo falla, mostramos un error en la consola.
  } catch (error) {
    console.error("error saving to Localstorage", error);
  }
};

/**
 * Recupera los datos del localStorage
 * Si sino encuenra nada devuelve un array vacio.
 */
export const getData = (key: string): any => {
  // Intentamos recuperar los datos guardaos en el "cajón" que indica la variable "key"
  const data = localStorage.getItem(key);

  // Si no tenemos datos, devolvemos un array vacío.
  if (!data) return [];

  // Si tenemos datos, los convertimos de nuevo a un objeto de JS.
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("error getting data from Localstorage", error);
    return [];
  }
};
