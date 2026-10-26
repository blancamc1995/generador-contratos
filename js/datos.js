// Capa de datos: Firebase de verdad, o un "modo demostración" que guarda
// todo en este navegador (se activa solo mientras firebase-config.js no
// está rellenado, o añadiendo ?demo a la dirección).

import { CONFIG } from "./firebase-config.js";

export const DEMO = window.__DEMO__ === true || String(CONFIG.firebase.apiKey).startsWith("PEGAR") || new URLSearchParams(location.search).has("demo");

const V = "13.0.0";
let api;

if (!DEMO) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const fb = initializeApp(CONFIG.firebase);
  api = {
    auth: A.getAuth(fb), db: F.getFirestore(fb),
    GoogleAuthProvider: A.GoogleAuthProvider, signInWithPopup: A.signInWithPopup,
    onAuthStateChanged: A.onAuthStateChanged, signOut: A.signOut,
    doc: F.doc, getDoc: F.getDoc, setDoc: F.setDoc, addDoc: F.addDoc, updateDoc: F.updateDoc,
    deleteDoc: F.deleteDoc, collection: F.collection, getDocs: F.getDocs, query: F.query,
    orderBy: F.orderBy, where: F.where, serverTimestamp: F.serverTimestamp, arrayUnion: F.arrayUnion,
  };
} else {
  api = crearDemo();
}

export const { auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy,
  where, serverTimestamp, arrayUnion } = api;

// ================= modo demostración =================

function crearDemo() {
  const CLAVE = "contratos-demo-v6";
  let memoria = null;
  const cargar = () => {
    if (memoria) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { memoria = null; }
    if (!memoria) { memoria = semilla(); try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch { /* sin almacenamiento */ } }
    return memoria;
  };
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch { /* sin almacenamiento */ } };

  const id20 = () => [...crypto.getRandomValues(new Uint8Array(20))].map(b => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
  const ruta = (segs) => segs.join("/");
  const revivir = (v) => {
    if (Array.isArray(v)) return v.map(revivir);
    if (v && typeof v === "object") {
      if ("__ts" in v) return { __ts: v.__ts, toDate: () => new Date(v.__ts) };
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revivir(x)]));
    }
    return v;
  };
  const limpiar = (v, previo) => {
    if (v && v.__union) return [...new Set([...(previo || []), ...v.__union])];
    if (v && v.__ts) return { __ts: v.__ts };
    if (Array.isArray(v)) return v.map(x => limpiar(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, limpiar(x)]));
    return v;
  };
  const snap = (path) => {
    const datos = cargar()[path];
    return { id: path.split("/").pop(), exists: () => !!datos, data: () => (datos ? revivir(datos) : undefined) };
  };
  const ordenar = (a, b) => {
    const x = a?.__ts ?? a ?? "", y = b?.__ts ?? b ?? "";
    return x < y ? -1 : x > y ? 1 : 0;
  };

  const usuario = { uid: "demo", email: "demo@ejemplo.com", displayName: "Demo" };
  return {
    auth: {}, db: {},
    GoogleAuthProvider: class {},
    signInWithPopup: async () => ({ user: usuario }),
    onAuthStateChanged: (_a, cb) => setTimeout(() => cb(usuario), 0),
    signOut: async () => { try { localStorage.removeItem(CLAVE); } catch { /* nada */ } location.reload(); },
    doc: (_db, ...segs) => ({ path: ruta(segs) }),
    collection: (_db, ...segs) => ({ path: ruta(segs) }),
    query: (col, ...cs) => ({ path: col.path, cs }),
    where: (campo, _op, valor) => ({ tipo: "where", campo, valor }),
    orderBy: (campo, dir = "asc") => ({ tipo: "orden", campo, dir }),
    serverTimestamp: () => ({ __ts: Date.now() }),
    arrayUnion: (...v) => ({ __union: v }),
    getDoc: async (ref) => snap(ref.path),
    getDocs: async (q) => {
      const m = cargar();
      const prof = q.path.split("/").length + 1;
      let docs = Object.keys(m).filter(p => p.startsWith(q.path + "/") && p.split("/").length === prof).map(snap);
      for (const c of q.cs || []) {
        if (c.tipo === "where") docs = docs.filter(d => d.data()[c.campo] === c.valor);
        if (c.tipo === "orden") docs.sort((a, b) => ordenar(a.data()[c.campo], b.data()[c.campo]) * (c.dir === "desc" ? -1 : 1));
      }
      return { docs };
    },
    setDoc: async (ref, datos, op = {}) => {
      const m = cargar();
      const previo = op.merge ? m[ref.path] || {} : {};
      m[ref.path] = { ...previo, ...Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, limpiar(v, previo[k])])) };
      guardar();
    },
    addDoc: async (col, datos) => {
      const id = id20();
      const m = cargar();
      m[`${col.path}/${id}`] = limpiar(datos);
      guardar();
      return { id };
    },
    updateDoc: async (ref, datos) => {
      const m = cargar();
      if (!m[ref.path]) throw new Error("No existe");
      const previo = m[ref.path];
      Object.entries(datos).forEach(([k, v]) => (previo[k] = limpiar(v, previo[k])));
      guardar();
    },
    deleteDoc: async (ref) => { delete cargar()[ref.path]; guardar(); },
  };
}

function semilla() {
  const ahora = Date.now();
  const ts = (dias = 0) => ({ __ts: ahora - dias * 864e5 });
  const m = {};
  m["ajustes/general"] = {
    propietarios: [
      { tratamiento: "D.", nombre: "Propietario Ejemplo Uno", tipoDoc: "DNI", numDoc: "00000000T" },
      { tratamiento: "Dña.", nombre: "Propietaria Ejemplo Dos", tipoDoc: "DNI", numDoc: "00000001R" },
    ],
    domicilio: "Calle Mayor, 1, 46001 Valencia",
    iban: "ES00 0000 0000 0000 0000 0000",
    ciudadFirma: "Valencia",
    carpetaDriveId: "demo-rentas", carpetaDriveNombre: "Rentas (demo)",
  };
  m["pisos/centro"] = { nombre: "Piso Centro", direccion: "Calle de los Olivos, 12, 2º A, 46002 Valencia", ciudad: "Valencia",
    plantilla: "temporada_habitacion", numHabitaciones: 4, habitaciones: ["1", "2", "3", "4"], renta: "320", luz: { opcion: "B", cuota: "25", tope: "40" }, agua: { opcion: "incluida" }, wifi: { opcion: "incluida" } };
  m["pisos/universidad"] = { nombre: "Piso Universidad", direccion: "Avenida del Campus, 8, 3º B, 46010 Valencia", ciudad: "Valencia",
    plantilla: "habitacion", numHabitaciones: 4, habitaciones: ["1", "2", "3", "4"], renta: "290", luz: { opcion: "D", cuota: "", tope: "180" }, agua: { opcion: "incluida" }, wifi: { opcion: "incluida" } };
  m["pisos/atico"] = { nombre: "Ático Jardines", direccion: "Plaza de los Jardines, 3, 5º, 46004 Valencia", ciudad: "Valencia",
    plantilla: "temporada_piso", numHabitaciones: 3, habitaciones: ["1", "2", "3"], renta: "900", luz: { opcion: "A" }, agua: { opcion: "cuota", cuota: "15", tope: "25" }, wifi: { opcion: "titularidad" } };
  m["pisos/rio"] = { nombre: "Casa del Río", direccion: "Calle del Río, 21, 50003 Zaragoza", ciudad: "Zaragoza",
    plantilla: "larga_duracion", habitaciones: [], renta: "680", descripcion: "con dos dormitorios, cocina, salón, baño y terraza",
    luz: { opcion: "A" }, agua: { opcion: "cuota", cuota: "10" }, wifi: { opcion: "titularidad" },
    gastos: { comunidad: { quien: "arrendador" }, ibi: { quien: "arrendador" }, basura: { quien: "arrendatario", importe: "90" } } };
  m["invitaciones/demoInvitacion1"] = {
    pisoId: "universidad", pisoNombre: "Piso Universidad", pisoDireccion: m["pisos/universidad"].direccion, ciudad: "Valencia",
    plantilla: "habitacion", habitacion: "2", plazas: 1, renta: "290", fianza: "", fechaInicio: "2026-09-01", fechaFin: "2027-07-31",
    fechaEntrega: "", luz: { opcion: "D", tope: "180" }, agua: { opcion: "incluida" }, wifi: { opcion: "incluida" }, estado: "abierta", creada: ts(2), creadaPor: "demo",
  };
  m["invitaciones/demoInvitacion1/respuestas/r1"] = {
    tratamiento: "Dña.", nombre: "Lucía Ejemplo Prueba", tipoDoc: "DNI", numDoc: "12345678Z",
    domicilio: "Calle del Sol, 5, 30001 Murcia", telefono: "600 000 000", email: "lucia@ejemplo.com",
    avales: [
      { tratamiento: "Dña.", nombre: "Ana Prueba Ejemplo", tipoDoc: "DNI", numDoc: "00000002W", parentesco: "Madre" },
      { tratamiento: "D.", nombre: "Luis Ejemplo Ejemplo", tipoDoc: "DNI", numDoc: "00000003A", parentesco: "Padre" },
    ],
    consentimiento: true, enviada: ts(1),
  };
  // Todo vive dentro de la cuenta de demostración.
  const out = {};
  for (const [k, v] of Object.entries(m)) out["cuentas/demo/" + k] = v;
  out["cuentas/demo/ajustes/general"].condiciones = { ccaa: "Comunitat Valenciana", diaPago: 7, garantiaMeses: 0 };
  out["cuentas/demo/ajustes/general"].modoDrive = "propia";
  out["cuentas/demo/invitaciones/demoInvitacion1"].arrendadores = "Propietario Ejemplo Uno y Propietaria Ejemplo Dos";
  out["cuentas/demo"] = { nombre: "Demo", propietario: "demo", miembros: ["demo"], emailsMiembros: ["demo@ejemplo.com"], correos: { demo: "demo@ejemplo.com" }, plan: "prueba" };
  out["usuarios/demo"] = { cuentaId: "demo", email: "demo@ejemplo.com" };
  out["enlaces/demoInvitacion1"] = { cuentaId: "demo" };
  return out;
}
