# Lumina Engine ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)

Lumina Engine es una experiencia cinematográfica interactiva que transforma la búsqueda de películas en una aventura visual y elegante. Aquí puedes descubrir títulos, explorar detalles con estilo de streaming, guardar tus favoritos y sumergirte en una interfaz que parece sacada de una plataforma de entretenimiento de alto impacto. 🎬🌙

## ✨ Lo que hace especial

- Una experiencia de exploración de películas con estética de streaming premium.
- Un flujo de búsqueda y detalle pensado para ser fluido, claro y visualmente atractivo.
- Lógica de negocio robusta con caché, fallbacks y manejo de errores elegante.
- Una arquitectura modular que facilita mantenimiento, escalabilidad y futuras mejoras.

## 🌐 Demo / Screenshot

- Demo en vivo: https://lumina-engine-kappa.vercel.app/

## ✨ Características principales

- Búsqueda dinámica de películas con resultados instantáneos.
- Hero rotativo con películas destacadas en tendencia.
- Modal de detalle con póster, metadata, reparto, tráiler y métricas.
- Gestión de favoritos persistente para seguir tus títulos preferidos.
- Caché inteligente para reducir peticiones y mejorar la experiencia.
- Diseño responsivo y visualmente moderno con Tailwind CSS.

## 🛠️ Stack tecnológico

- TypeScript
- Vite
- Tailwind CSS
- Vitest
- IndexedDB
- localStorage
- TMDB API
- ESLint, Prettier y Husky

## 🧠 Arquitectura

La estructura del proyecto está organizada para separar responsabilidades de forma clara:

- src/main.ts: orquesta la inicialización y los eventos de la app.
- src/controllers: gestiona la lógica de búsqueda, modal, héroe y favoritos.
- src/services y src/api: encapsulan la interacción con TMDB y el almacenamiento local.
- src/state: mantiene el estado compartido de la aplicación.
- src/ui: se encarga de renderizar la interfaz y los componentes visuales.

Esta organización facilita mantener el proyecto escalable y fácil de extender.

## 🚀 Instalación y ejecución

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Joseph160997/lumina-engine.git
   ```

2. Entra al directorio del proyecto:

   ```bash
   cd lumina-engine
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Crea tu archivo de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

5. Agrega tu clave de TMDB en el archivo .env:

   ```env
   VITE_TMDB_API_KEY=tu_api_key_aqui
   ```

6. Inicia el proyecto en modo desarrollo:

   ```bash
   npm run dev
   ```

7. Abre la app en tu navegador en:
   ```text
   http://localhost:5173/
   ```

## 🔐 Variables de entorno

| Variable          | Descripción                                                 |
| ----------------- | ----------------------------------------------------------- |
| VITE_TMDB_API_KEY | Clave de acceso de The Movie Database para consumir la API. |

## 📜 Scripts disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo
npm run build      # Compila la app para producción
npm run preview    # Previsualiza la build localmente
npm run test       # Ejecuta la suite de tests
npm run test:watch # Ejecuta Vitest en modo observación
npm run test:coverage # Genera reporte de cobertura
npm run lint       # Revisa calidad del código
npm run format     # Formatea el proyecto con Prettier
npm run verify     # Ejecuta lint, tests y build
```

## 🧪 Testing

La calidad del proyecto está respaldada por una suite de pruebas unitarias bien organizada, con foco en la lógica de negocio, la integración con APIs externas y la resiliencia del sistema frente a fallos.

### ▶️ Ejecutar pruebas

```bash
npm run test
```

### 📊 Cobertura

```bash
npm run test:coverage
```

### 🧩 Módulos testeados

| Módulo                   | Archivo de pruebas                                                                                                                                                           | Qué se valida                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Repositorio de películas | [src/api/repositories/movie.repository.test.ts](src/api/repositories/movie.repository.test.ts)                                                                               | Búsqueda, detalle, featured movies, caché, fallbacks y errores tipados.                       |
| Caché IndexedDB          | [src/api/indexeddb/indexeddb-cache.test.ts](src/api/indexeddb/indexeddb-cache.test.ts)                                                                                       | TTL, validación de entradas, lectura/escritura y manejo de caché vencida.                     |
| Validadores TMDB         | [src/api/tmdb/validators/movie.validator.test.ts](src/api/tmdb/validators/movie.validator.test.ts)                                                                           | Aceptación y rechazo de DTOs, validación de campos obligatorios y estructura de respuestas.   |
| Mappers TMDB             | [src/api/tmdb/mappers/mapper.test.ts](src/api/tmdb/mappers/mapper.test.ts)                                                                                                   | Transformación de datos crudos a modelos de dominio, URLs, fechas, géneros, reparto y videos. |
| Favoritos                | [src/services/favoritesServices.test.ts](src/services/favoritesServices.test.ts)                                                                                             | Persistencia, lectura de storage, filtrado de datos corruptos, agregar/quitar favoritos.      |
| Controladores            | [src/controllers/favoritesController.test.ts](src/controllers/favoritesController.test.ts), [src/controllers/heroController.test.ts](src/controllers/heroController.test.ts) | Lógica de toggle de favoritos, priorización de fuentes y rotación del hero.                   |
| Utilidades               | [src/utils/formatters.test.ts](src/utils/formatters.test.ts)                                                                                                                 | Formateo de moneda, fechas y duración.                                                        |

### 🔒 Enfoque de calidad

- Pruebas con mocks controlados para red y almacenamiento.
- Validación de escenarios felices y de degradación.
- Cobertura orientada a la lógica crítica del producto y a la experiencia del usuario.

## 📁 Estructura del proyecto

```text
lumina-engine/
├── public/
├── src/
│   ├── api/
│   │   ├── http/
│   │   ├── indexeddb/
│   │   ├── repositories/
│   │   └── tmdb/
│   ├── controllers/
│   ├── services/
│   ├── state/
│   ├── test/
│   ├── types/
│   ├── ui/
│   └── utils/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Si quieres colaborar:

1. Haz un fork del proyecto.
2. Crea una rama con tu mejora.
3. Envía un pull request con una descripción clara.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

## 🌟 Créditos / Atribución

- Datos y recursos multimedia proporcionados por TMDB.
- Diseño y desarrollo impulsado con Vite, TypeScript y Tailwind CSS.
- Inspiración visual en experiencias de streaming modernas y narrativas cinematográficas.
