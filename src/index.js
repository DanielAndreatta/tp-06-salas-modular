
const { crearServicioReservas } = require("./servicios/reservas");
const { crearApp } = require("./app");

const PORT = 3000;

// Semilla inicial
const reservasIniciales = [
    { id: 1, estudiante: "Ana López", email: "ana@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-01", turno: "Mañana", personas: 2 },
    { id: 2, estudiante: "Carlos Ruiz", email: "carlos@ejemplo.com", sala: "Sala Multimedia", fecha: "2026-10-02", turno: "Tarde", personas: 5 },
    { id: 3, estudiante: "María Soler", email: "maria@ejemplo.com", sala: "Sala Sur", fecha: "2026-10-03", turno: "Noche", personas: 3 },
    { id: 4, estudiante: "Juan Pérez", email: "juan@ejemplo.com", sala: "Sala Norte", fecha: "2026-10-04", turno: "Mañana", personas: 1 }
];

function main() {
    // 1. Crear el servicio con los datos iniciales
    const servicioReservas = crearServicioReservas(reservasIniciales);
    
    // 2. Crear la aplicación Express
    const app = crearApp({ servicioReservas });

    // 3. Arrancar el proceso
    app.listen(PORT, () => {
        console.log(`Aplicación disponible en http://localhost:${PORT}`);
    });
}

// Ejecutamos la función principal y capturamos posibles errores
try {
    main();
} catch (error) {
    console.error("No se pudo iniciar la aplicación:", error);
    process.exitCode = 1;
}