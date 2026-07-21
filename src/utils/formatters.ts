/**
 * Convierte un número en un string con formato de moneda.
 * (USD por defecto) ej. 1000 -> $1,000.00
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Formatea una fecha (Date) para mostrar en español, o un mensaje si no hay dato.
 * ej. new Date("2022-01-01") -> "1 ene 2022"
 */
export const formatDate = (date: Date | null): string => {
  if (!date || Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Convierte minutos totales en un formato de horas y minutos. Ej. 125 -> 2h 5m
 * @param runtime - El tiempo total en minutos.
 * @returns String formateado, o mensaje si no hay dato.
 */
export const formatRunTime = (runtime: number | null): string => {
  // 1. Proteccion, si no hay tiempo es cero.
  if (runtime === null || runtime <= 0) return "Duración no disponible";

  // 2. Lógica matematica:
  const hours = Math.floor(runtime / 60); // <=== Calcula las horas completas, Math.floor es una funcion que se utiliza para redondear un numero hacia abajo.
  const minutes = runtime % 60; // <=== Calcula los minutos restantes, % es el operador modulo, que se utiliza para obtener el resto de la division.

  // 3. Si no hay horas, solo minutos; si no hay minutos, solo horas.
  if (hours === 0) return `${minutes}m`;

  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
};
