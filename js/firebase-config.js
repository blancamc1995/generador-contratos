// Configuración del proyecto Firebase "contratos-pisos".
// No son secretos: Firebase está pensado para que esta configuración sea
// pública. La seguridad la dan las reglas de firestore.rules.

export const CONFIG = {
  firebase: {
    apiKey: "AIzaSyA_Py8ZCWaEZZdnGS2ZHuQTnW-EefjROmA",
    authDomain: "contratos-pisos.firebaseapp.com",
    projectId: "contratos-pisos",
    storageBucket: "contratos-pisos.firebasestorage.app",
    messagingSenderId: "221718655510",
    appId: "1:221718655510:web:386338d202aa7327aefb37",
  },

  // ID de cliente OAuth "Web client (auto created by Google Service)"
  // de Google Cloud → APIs y servicios → Credenciales.
  googleClientId: "221718655510-vncb0h6rbu7fpe4k1grva7j07f9v5oir.apps.googleusercontent.com",

  // Número del proyecto (Configuración del proyecto en Firebase → General).
  googleProjectNumber: "221718655510",

  // Nombre con el que os saluda el panel.
  saludo: "Blanca y Manu",
};
