# 🎬 Lumina Engine | Movie Discovery Platform

## 📚 Tabla de Contenidos

- [📋 Inicio](#inicio)
- [📚 Tabla de Contenidos](#tabla-de-contenidos)
- [🛠️ Stack Tecnológico](#stack-tecnológico)
- [🏗️ Arquitectura del Sistema](#arquitectura-del-sistema)
- [📦 Componentes](#componentes)
- [📝 Documentación](#documentación)
- [🚀 Ejecución](#ejecución)
- [🛠️ Instalación](#instalación)
- [📝 Configuración](#configuración)
- [🤝 Colaboración](#colaboración)
- [📝 Licencia](#licencia)

## 📋 Inicio

Lumina Engine es una plataforma de descubrimiento de películas construida con Vanilla TypeScript y Tailwind CSS. El proyecto proporciona una interfaz moderna para buscar películas, ver detalles detallados y gestionar una lista personalizada de películas favoritas con persistencia en almacenamiento local.

## 🛠️ Stack Tecnológico

- TypeScript
- Vite
- Tailwind CSS v4
- Fetch API
- The Movie Database (TMDB) API
- LocalStorage API

## 🏗️ Arquitectura del Sistema

La arquitectura de Lumina Engine está diseñada para ser modular, mantenible y escalable.

- **Service-Mapper Pattern**: separa la obtención de datos de la API de su transformación y presentación en la UI.
- **UI Composition**: `src/main.ts` orquesta la carga de componentes, los estados de búsqueda y la renderización de películas.
- **Favorites Management**: servicio de favoritos con persistencia automática en `localStorage`.
- **Debouncing**: búsqueda optimizada que evita llamadas innecesarias a la API.

## 📦 Componentes

- `movieApi`: acceso directo a The Movie Database API para búsqueda y detalles de películas.
- `favoritesServices`: gestión de películas favoritas con persistencia en `localStorage`.
- `storage`: abstracción para manejo de `localStorage`.
- `render`: renderización dinámica de películas, detalles y modal.
- `mapper`: transformación de respuestas de API a modelos de dominio.
- `formatters`: funciones de utilidad para formato de datos.

## 📝 Documentación

La documentación del proyecto se apoya en los comentarios del código fuente y la estructura de carpetas de `src`. Los principales puntos de interés son:

- `src/main.ts`: orquestación principal de la aplicación y gestión de eventos.
- `src/api/movieApi.ts`: integración con TMDB API.
- `src/services`: lógica de datos y gestión de favoritos.
- `src/ui/render.ts`: renderización de componentes.
- `src/utils`: funciones auxiliares y mapeos de datos.
- `src/types`: definiciones de tipos TypeScript.

## 🚀 Ejecución

1. Clonar el repositorio: `git clone https://github.com/Joseph160997/lumina-engine.git`
2. Instalar dependencias: `pnpm install`
3. Ejecutar en modo desarrollo: `pnpm run dev`
4. Compilar para producción: `pnpm run build`

## 🛠️ Instalación

1. Clonar el repositorio: `git clone https://github.com/Joseph160997/lumina-engine.git`
2. Navegar al directorio: `cd lumina-engine`
3. Instalar dependencias: `pnpm install`

## 📝 Configuración

1. **`src/main.ts`**: ajusta los selectores del DOM y la lógica de eventos.
2. **`src/api/movieApi.ts`**: configura la clave de API de TMDB y los endpoints.
3. **`src/services/favoritesServices.ts`**: personaliza la gestión de favoritos.
4. **`src/ui/render.ts`**: modifica las plantillas de renderizado de componentes.
5. **Variables de entorno**: asegúrate de configurar tu clave de API de TMDB.

## 🤝 Colaboración

Las contribuciones son bienvenidas. Puedes colaborar mediante:

- **Issues**: reporte de bugs o solicitud de nuevas funcionalidades.
- **Pull Requests**: mejoras de código, nuevas características o correcciones.

Algunas áreas de mejora sugeridas:

- Filtrado avanzado de películas
- Sistema de puntuaciones y reseñas
- Tema oscuro/claro persistente
- Paginación mejorada
- Integración con más fuentes de datos

## 📝 Licencia

Este proyecto está publicado bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para ver los términos completos de uso, modificación y distribución.
