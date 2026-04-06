/// <reference types="vite/client" />

// Este archivo es para declarar los tipos de las variables de entorno que vamos a usar en nuestro proyecto.
// Esto es necesario para que TypeScript no nos de errores cuando intentemos acceder a estas variables a través de import.meta.env.
// Aquí declaramos que tenemos una variable de entorno llamada VITE_TMDB_API_KEY, la cual es una string.
interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module "*.css";
