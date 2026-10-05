# Trabajo práctico 05

## Descripción
Aplicación para consultar salas de estudio disponibles y reservar turnos temporalmente. Este proyecto implementa un pipeline robusto de middleware en Express para registrar, medir, preparar variables de área y validar datos.

## Instalación
1. Clonar el repositorio.
2. Ejecutar **npm install** en la terminal para instalar Express, EJS, Express-EJS-Layouts y Morgan.

## Ejecución
Ejecutar **npm start** en la terminal. El servidor se iniciará en `http://localhost:3000`.

## Rutas
- `GET /`: Inicio de la aplicación.
- `GET /estado`: Devuelve un JSON con estadísticas del servicio.
- `GET /reservas`: Listado de reservas activas.
- `GET /reservas/nueva`: Formulario de reserva.
- `GET /reservas/:id`: Detalle de una reserva o error 404.
- `POST /reservas`: Envío y validación del formulario.

## Pipeline de middleware

### Diagrama del POST válido
```text
POST /reservas
│
├── morgan("dev")
├── identificarSolicitud
├── medirDuracion
├── expressLayouts
├── express.static
├── express.urlencoded
├── express.json
│
└── reservasRouter
    ├── prepararAreaReservas
    ├── validarReserva (prepara req.reservaValidada y llama a next())
    └── crearReserva (agrega en memoria y redirige)
        └── 302 /reservas
            └── finish: ID + estado + duración
```

### Diagrama del POST inválido
```text
POST /reservas
│
├── morgan("dev")
├── identificarSolicitud
├── medirDuracion
├── expressLayouts
├── express.static
├── express.urlencoded
├── express.json
│
└── reservasRouter
    ├── prepararAreaReservas
    └── validarReserva (falla la validación)
        └── status 400 y render del formulario (Fin del ciclo de middleware)
            └── finish: ID + estado + duración
```

### Justificación del orden general
El orden de registro en Express determina el orden de ejecución, creando dependencias vitales entre las funciones:
1. **Morgan:** Se registra al inicio para que observe y registre absolutamente todas las solicitudes entrantes, incluyendo la carga de recursos estáticos.
2. **identificarSolicitud:** Se coloca inmediatamente después para generar el ID. Debe ir estrictamente antes de `medirDuracion`, ya que la función de medición necesita leer el `solicitudId` de `res.locals` para imprimirlo en la terminal al finalizar.
3. **Parsers (`express.urlencoded` y `express.json`):** Se ubican antes del enrutador (`reservasRouter`) para garantizar que el objeto `req.body` ya esté interpretado y construido cuando el middleware de ruta `validarReserva` intente acceder a los datos del formulario.
4. **Página 404:** Se ubica al final de todo el pipeline para actuar como red de contención, capturando únicamente aquellas solicitudes que no hicieron "match" con ningún recurso estático ni ruta definida.

## Alcance de cada función
- **Middleware incorporado, de terceros y personalizado:** El incorporado viene con Express (ej. `express.urlencoded`). El de terceros se instala vía npm (ej. `morgan`). El personalizado es desarrollado a medida en el código (ej. `identificarSolicitud` y `medirDuracion`).
- **Uso de `next()`:** Se utiliza para ceder el control de la petición a la siguiente función aplicable en el pipeline de middleware; omitirlo suspende la solicitud a menos que se finalice la respuesta (con `.send`, `.json`, `.render`, etc.).
- **Orden de parsers:** `express.urlencoded` y `express.json` aparecen antes de las validaciones de ruta porque el validador requiere leer la información procesada desde el objeto `req.body`. Si se ejecutan después, el body llega vacío.
- **Alcances (Global, Router, Ruta):** Global (`app.use`) afecta a toda la aplicación; de Router (`router.use`) afecta a todas las rutas dependientes de ese bloque (ej. `/reservas`); y de Ruta (`router.post('/', middleware, handler)`) afecta exclusivamente a esa URL y método específico.
- **Motivo del evento `finish`:** Se usa en la medición de duración porque permite iniciar el temporizador en la entrada, liberar el flujo con `next()` y capturar el momento exacto en que la respuesta termina de enviarse, posibilitando leer el código de estado final emitido por el handler.
- **Resultado del montaje del router:** Al usar `app.use("/reservas", reservasRouter)`, todas las rutas definidas relativas (`/` o `/nueva`) en el router se componen y anteponen automáticamente con el prefijo `/reservas`.
- **POST 302 vs GET:** Un POST procesa el cuerpo de la petición. Si es exitoso, emitir un 302 obliga al navegador a realizar una petición limpia mediante un método `GET` a la nueva URL, evitando la recarga accidental del formulario.

## Validación
El middleware `validarReserva` interviene la ruta POST antes del alta. Se encarga de limpiar espacios, validar la estructura del correo electrónico, controlar la coincidencia exacta de los enumeradores (sala y turno) y garantizar que la cantidad de personas se evalúe matemáticamente. Ante un fallo interrumpe la cadena respondiendo tempranamente con error 400.

## Pruebas manuales
Cumple la matriz de validaciones: los campos vacíos, correos malformados (sin `@`), cantidades erróneas y salas manipuladas en el HTML retornan siempre al formulario original con los datos conservados y mensaje de alerta.

## Persistencia temporal
Las reservas desaparecen al reiniciar porque la lógica usa una variable de memoria local (`reservas` como array). Al detener Node.js, este proceso se destruye y al reiniciar se vuelven a cargar únicamente los objetos escritos estáticamente en el código fuente.