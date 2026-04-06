/**
 * Convierte un número en un string con formato de moneda.
 * (USD poir defecto) ej. 1000 -> $1,000.00
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * FORMATE UNA FECHA SIMPLE
 * ej. 2022-01-01 -> 01/01/2022
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "Fecha no disponible";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Convierte minutos totales en un formato de horas y minutos. Ej. 125 -> 2h 5m
 * @param runtime - El tiempo total en minutos.
 * @returns Strinng formateado, o  mensaje de eeror si no hay dato.
 */
export const formatRunTime = (runtime: number): string => {
  // 1. Proteccion, si no hay tiempo es cero.
  if (!runtime || runtime <= 0) return "Duración no disponible";

  // 2. Lógica matematica:
  const hours = Math.floor(runtime / 60); // <=== Calcula las horas completas
  const minutes = runtime % 60; // <=== Calcula los minutos restantes

  // 3. Retorno elegante, si no hay horas, solo devolvemosminutos, si no hay minutos solo mostramos horas.
  if (hours === 0) return `${minutes}m`;

  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}m`;
};
