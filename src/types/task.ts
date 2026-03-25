export interface Task {
  id: string; // <=== El 'DNI' de la tarea
  title: string; // <=== El nombre de la tarea
  completed: boolean; // <=== El estado de la tarea
  category: "movie" | "subscription" | "general"; // <=== La categoría de la tarea
  cost?: number; // <=== El costo de la tarea  lleva "?" para indicar que es opcional
  dueDate?: string; // <=== La fecha de vencimiento de la tarea
}
