
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");

const {
    crearIdentificadorSolicitud,
    medirDuracion
} = require("./middleware/solicitudes");

// Solo importamos las fábricas de servicio, controlador y router
const { crearServicioReservas } = require("./servicios/reservas");
const { crearControladorReservas } = require("./controladores/reservas");
const { crearRouterReservas } = require("./rutas/reservas");

const app = express();
const PORT = 3000;

const reservasIniciales = [
    { id: 1, estudiante: "Ana López", email: "ana@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-01", turno: "Mañana", personas: 2 },
    { id: 2, estudiante: "Carlos Ruiz", email: "carlos@ejemplo.com", sala: "Sala Multimedia", fecha: "2026-10-02", turno: "Tarde", personas: 5 },
    { id: 3, estudiante: "María Soler", email: "maria@ejemplo.com", sala: "Sala Sur", fecha: "2026-10-03", turno: "Noche", personas: 3 },
    { id: 4, estudiante: "Juan Pérez", email: "juan@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-04", turno: "Mañana", personas: 1 }
];

// Instanciamos el servicio, el controlador y el router en cadena
const servicioReservas = crearServicioReservas(reservasIniciales);
const controladorReservas = crearControladorReservas(servicioReservas);
const reservasRouter = crearRouterReservas(controladorReservas);

// * Middleware global
app.use(morgan("dev"));
app.use(crearIdentificadorSolicitud());
app.use(medirDuracion);

// ** Configuración de vistas y parsers
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// *** Rutas de aplicación
app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Reserva de Salas" });
});

app.get("/estado", controladorReservas.estado);

// **** Montaje del router de reservas
app.use("/reservas", reservasRouter);

// ***** Middleware de página 404
app.use((req, res) => {
    res.status(404).render("no-encontrado", {
        titulo: "Página no encontrada",
        mensaje: "La dirección solicitada no existe."
    });
});

app.listen(PORT, () => {
    console.log(`Aplicación disponible en http://localhost:${PORT}`);
});