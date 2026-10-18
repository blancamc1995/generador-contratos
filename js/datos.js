// Capa de datos: Firebase de verdad, o un "modo demostración" que guarda
// todo en este navegador (se activa solo mientras firebase-config.js no
// está rellenado, o añadiendo ?demo a la dirección).

import { CONFIG } from "./firebase-config.js";

export const DEMO = String(CONFIG.firebase.apiKey).startsWith("PEGAR") || new URLSearchParams(location.search).has("demo");

const V = "10.12.2";
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
  const CLAVE = "contratos-demo-v3";
  let memoria = null;
  const cargar = () => {
    if (memoria) return memoria;
    try { memoria = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch { memoria = null; }
    if (!memoria) memoria = semilla();
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
    domicilio: "Calle Ejemplo, 1, 14000 Córdoba",
    iban: "ES00 0000 0000 0000 0000 0000",
    ciudadFirma: "Córdoba",
    carpetaDriveId: "demo-rentas", carpetaDriveNombre: "Rentas (demo)",
  };
  m["pisos/lope"] = { nombre: "Lope de Sosa", direccion: "Calle Ejemplo, 2, 14000 Córdoba", ciudad: "Córdoba",
    plantilla: "habitacion", habitaciones: ["1", "2", "3", "4"], renta: "262", luz: { opcion: "C", cuota: "22.5", tope: "" }, agua: { opcion: "incluida" } };
  m["pisos/priego"] = { nombre: "Maestro Priego", direccion: "Calle Ejemplo, 3, 14000 Córdoba", ciudad: "Córdoba",
    plantilla: "habitacion", habitaciones: ["1", "2", "3", "4"], renta: "300", luz: { opcion: "D", cuota: "", tope: "200" }, agua: { opcion: "incluida" } };
  m["pisos/alderetes"] = { nombre: "Alderetes", direccion: "Calle Ejemplo, 4, 14000 Córdoba", ciudad: "Córdoba",
    plantilla: "piso_entero", habitaciones: [], renta: "750", luz: { opcion: "A" }, agua: { opcion: "incluida" } };
  m["pisos/ciudadreal"] = { nombre: "Ciudad Real", direccion: "Calle Ejemplo, 5, 13000 Ciudad Real", ciudad: "Ciudad Real",
    plantilla: "larga_duracion", habitaciones: [], renta: "550", descripcion: "con tres dormitorios, cocina con lavadero, salón y baño",
    luz: { opcion: "A" }, agua: { opcion: "cuota", cuota: "8" }, carpetaFacturas: "Piso ciudad real" };
  m["invitaciones/demoPriego2"] = {
    pisoId: "priego", pisoNombre: "Maestro Priego", pisoDireccion: m["pisos/priego"].direccion, ciudad: "Córdoba",
    plantilla: "habitacion", habitacion: "2", plazas: 1, renta: "300", fianza: "", fechaInicio: "2026-09-01", fechaFin: "2027-07-31",
    fechaEntrega: "", luz: { opcion: "D", tope: "200" }, agua: { opcion: "incluida" }, estado: "abierta", creada: ts(2), creadaPor: "demo",
  };
  m["invitaciones/demoPriego2/respuestas/r1"] = {
    tratamiento: "Dña.", nombre: "Lucía Ejemplo Prueba", tipoDoc: "DNI", numDoc: "12345678Z",
    domicilio: "Calle Mayor, 1, 23001 Jaén", telefono: "600 000 000", email: "lucia@ejemplo.com",
    avales: [
      { tratamiento: "Dña.", nombre: "Ana Prueba Ejemplo", tipoDoc: "DNI", numDoc: "00000002W", parentesco: "Madre" },
      { tratamiento: "D.", nombre: "Luis Ejemplo Ejemplo", tipoDoc: "DNI", numDoc: "00000003A", parentesco: "Padre" },
    ],
    consentimiento: true, enviada: ts(1),
  };
  return m;
}
