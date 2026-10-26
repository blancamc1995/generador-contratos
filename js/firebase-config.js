// Configuración del proyecto Firebase "gestion-alquileres-35943" (versión general).
// No son secretos: Firebase está pensado para que esta configuración sea
// pública. La seguridad la dan las reglas de firestore.rules.

export const CONFIG = {
  firebase: {
    apiKey: "AIzaSyABnpa7bshQxa7uGCiCCR86mixGTeeA3P4",
    authDomain: "gestion-alquileres-35943.firebaseapp.com",
    projectId: "gestion-alquileres-35943",
    storageBucket: "gestion-alquileres-35943.firebasestorage.app",
    messagingSenderId: "772414745528",
    appId: "1:772414745528:web:32bf23743b3fefaff57d4d",
  },

  // ID de cliente OAuth "Web client (auto created by Google Service)"
  // de Google Cloud → APIs y servicios → Credenciales.
  googleClientId: "772414745528-r4uccjhq9j1acrnjm3p9idgsu05ujbkj.apps.googleusercontent.com",

  // Número del proyecto (Configuración del proyecto en Firebase → General).
  googleProjectNumber: "772414745528",

  // Nombre de la aplicación (portada, textos legales, pestaña).
  nombreApp: "Contratos de alquiler",

  // Permitir el modo «Mis carpetas» de Drive (permiso de todo el Drive).
  // Exige que Google audite la app, así que en la versión general va apagado.
  driveCompleto: false,

  // Carpeta que crea la app en el Drive de cada usuario (modo «carpeta propia»).
  carpetaRaiz: "Alquileres",

  // Titular del servicio: aparece en el aviso legal y la política de privacidad.
  // ⚠️ Rellenar antes de comercializar (la LSSI obliga a mostrarlo).
  titular: {
    nombre: "",
    nif: "",
    domicilio: "",
    email: "",
    fechaTextos: "octubre de 2026",
  },
  versionTextos: "1",

  // Dirección pública de la app (para el enlace a la demo).
  urlApp: "https://gestion-alquileres-35943.web.app/",

  // Pago de la beta. Si rellenas precio y bizum, la pantalla de espera
  // muestra cómo pagar; después activas la cuenta en Ajustes → Administración.
  pago: { precio: "", bizum: "", duracion: "un año" },
};
