/**
 * Convierte un número en un strind conm formato de moneda.
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
