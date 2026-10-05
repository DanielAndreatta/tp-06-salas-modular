
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");

const {
    crearIdentificadorSolicitud,
    medirDuracion
} = require("./middleware/solicitudes");

const {
    prepararAreaReservas,
    validarReserva
} = require("./middleware/reservas");

const { crearServicioReservas } = require("./servicios/reservas");

const app = express();
const PORT = 3000;

// Extraemos los datos iniciales
const reservasIniciales = [
    { id: 1, estudiante: "Ana López", email: "ana@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-01", turno: "Mañana", personas: 2 },
    { id: 2, estudiante: "Carlos Ruiz", email: "carlos@ejemplo.com", sala: "Sala Multimedia", fecha: "2026-10-02", turno: "Tarde", personas: 5 },
    { id: 3, estudiante: "María Soler", email: "maria@ejemplo.com", sala: "Sala Sur", fecha: "2026-10-03", turno: "Noche", personas: 3 },
    { id: 4, estudiante: "Juan Pérez", email: "juan@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-04", turno: "Mañana", personas: 1 }
];

// Instanciamos el servicio compartiendo la semilla
const servicioReservas = crearServicioReservas(reservasIniciales);

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

app.get("/estado", (req, res) => {
    res.json({
        servicio: "activo",
        reservas: servicioReservas.contar(), // Llamada al servicio
        solicitudId: res.locals.solicitudId
    });
});

// **** Router de reservas
const reservasRouter = express.Router();
reservasRouter.use(prepararAreaReservas);

reservasRouter.get("/", (req, res) => {
    // Llamada al servicio
    res.render("reservas/lista", { titulo: "Salas reservadas", reservas: servicioReservas.listar() });
});

reservasRouter.get("/nueva", (req, res) => {
    // Nota: enviamos los datos permitidos quemados para la vista o podemos delegarlo.
    // Como los definiste en el middleware y en la vista, los pasaremos directamente aquí:
    res.render("reservas/nueva", {
        titulo: "Nueva Reserva",
        error: null,
        valores: {},
        salasPermitidas: ["Sala Norte", "Sala Sur", "Sala Multimedia"],
        turnosPermitidos: ["Mañana", "Tarde", "Noche"]
    });
});

reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const reserva = servicioReservas.obtenerPorId(id); // Llamada al servicio

    if (!reserva) {
        return res.status(404).render("no-encontrado", {
            titulo: "Reserva no encontrada",
            mensaje: "No existe una reserva con ese identificador."
        });
    }
    res.render("reservas/detalle", { titulo: `Reserva #${reserva.id}`, reserva });
});

function crearReserva(req, res) {
    servicioReservas.crear(req.reservaValidada); // Llamada al servicio
    res.redirect("/reservas");
}

reservasRouter.post("/", validarReserva, crearReserva);
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