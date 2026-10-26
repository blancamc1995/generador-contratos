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
  const CLAVE = "contratos-demo-v9";
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
    plantilla: "temporada_piso", numHabitaciones: 3, habitaciones: ["1", "2", "3"], renta: "900", luz: { opcion: "A" }, agua: { opcion: "cuota", cuota: "15" }, wifi: { opcion: "titularidad" } };
  m["pisos/rio"] = { nombre: "Casa del Río", direccion: "Calle del Río, 21, 50003 Zaragoza", ciudad: "Zaragoza",
    plantilla: "larga_duracion", habitaciones: [], renta: "680", descripcion: "con dos dormitorios, cocina, salón, baño y terraza",
    luz: { opcion: "A" }, agua: { opcion: "cuota", cuota: "10" }, wifi: { opcion: "nomencionar" },
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

  // Contratos de ejemplo para ver cómo quedan.
  const FIRMA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABuCAYAAACdmi6mAAADX0lEQVR42u3dQXLiMBAFUEjlHDlJjp+TcJFklaosoAgYSf1b761nJhn789UyxpxOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABX18fH47Csxydgh4ZVFdLl8yhcIic5JSYCgsSk5Tpi4UFuXK6l4BPfN34D/eHAJeXTzX/oyL8y4dmLBYugUcVXjk52bUeRYehpaM0pIbW0JiQqec5EZhERU6pbWXkedbYTEldH//PRfg5UZhUT50Sqv3ZD5jklZYTA+d0pIbhUVUWdEnNzMpLKFbut00ZaGwKL0dU1q9sjNzMldYAldiO6i0lJXC4qmJp+vPxJYQZWVrKDsKi/EjfYUpR2nJjsIioqyQHYXF3cDZWpCaHYUlcOVKy7aQW6xsG5ZV5Ymm+7Y17bn3q29jUFjK6pz0O3corUcnxir/54rn4t3Luv8q2Xli6bgNrzBlVt2WC3DTVTJ5Ukmfso5MthWm4sqTucKasMqsDlz6Cz7l9x/55R2zjkP1ywgKq9kq2eVLH9JKa8Rxn11cCdlxW8OVk3b0xN36Xr7R1wV8Q01mXh6dzGddX6qYHWFuskp2LKvqtzjMPOajc5Qy0ZqwGqySXSertJtJRx7zy+XrPOobtZNu1B22yidfKE1aJXfYBlbM1cqJpMPF/TJbwt+DkFpYq96JefRnp94L1mG7UmWRSL99olRhJRyAiqvkf36PncqqUmFVPO6pt96UKayU0qq2whwJ3g7vBK4urYSJJPUjQKUKK+XEVr02sntRVZ2IE+8L65CZ7Qorae9+ZNu4Q2HNOg4dP5CtsAJOshsrTVkyk23YfVgJz+oWvDwzc6WsNiqs3VdmsktLWW1YWIkXsumxICkrhXW4tFYUh/DtMWW9KivyUtuSt4U9aoVqW31ZMWEt3aIJoAKTFYUVG1oB3Gdr+Mizx2TFlnD4+C6AHD33u30eU2EVLC1lxbOXG+TElnBowISQW+f81sPu5MSEVWYScmMo8qGwIkrLVpCOBSvDhQrrFUXjwimVsjtie+tIFyqsI6VlqmJlmcjbpoX1TPkoK4WiTBRWbIiFU6GgsCJeLJ68qVBQWGVfkKnP0lYo0LSwTCcAJw/zAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoJUfa94TcZZ01N8AAAAASUVORK5CYII=";
  const propietarios = m["ajustes/general"].propietarios;
  const comun = { ciudadFirma: "Valencia", condiciones: { ccaa: "Comunitat Valenciana", diaPago: 7, garantiaMeses: 0 }, cambiosModelo: [],
    propietarios, domicilioPropietarios: m["ajustes/general"].domicilio, iban: m["ajustes/general"].iban, conFotos: false };
  const persona = (tratamiento, nombre, numDoc, domicilio, avales = []) => ({ tratamiento, nombre, tipoDoc: "DNI", numDoc, domicilio, avales });
  const firmantes = (d) => {
    const out = propietarios.map((p, i) => ({ fid: `arr${i}`, rol: "arrendador", nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc }));
    let k = 0;
    d.inquilinos.forEach((p, i) => out.push({ fid: `inq${i}`, rol: "arrendatario", nombre: p.nombre, tipoDoc: "DNI", numDoc: p.numDoc }));
    d.inquilinos.forEach(p => p.avales.forEach(a => out.push({ fid: `fia${k++}`, rol: "fiador", nombre: a.nombre, tipoDoc: "DNI", numDoc: a.numDoc, avalaA: p.nombre })));
    return out;
  };
  const firmar = (cid, f, dias) => {
    m[`contratos/${cid}/firmas/${f.fid}`] = { nombre: f.nombre, numDoc: f.numDoc, rol: f.rol, imagen: FIRMA, huella: "demo", aceptado: true, firmadoEl: ts(dias), dispositivo: "Demo" };
    m[`contratos/${cid}/estados/${f.fid}`] = { nombre: f.nombre, rol: f.rol, firmadoEl: ts(dias) };
  };
  const enDrive = (años, piso, nombre) => años.map(a => ({ año: a, carpetaId: "demo", id: `demo-${nombre}-${a}`, link: "#" }));

  // 1) Temporada · habitación, firmado por todos.
  const d1 = { ...comun, plantilla: "temporada_habitacion", fechaFirma: "2026-08-28",
    piso: { nombre: "Piso Centro", direccion: m["pisos/centro"].direccion, descripcion: "", numHabitaciones: 4 }, habitacion: "1",
    inquilinos: [persona("D.", "Pablo Ejemplo Muestra", "00000004G", "Calle Real, 8, 03001 Alicante",
      [{ tratamiento: "D.", nombre: "Antonio Ejemplo Real", tipoDoc: "DNI", numDoc: "00000005M", parentesco: "Padre" }])],
    renta: "320", fianza: "", fechaInicio: "2026-09-01", fechaFin: "2027-06-30", fechaEntrega: "",
    motivoTemporada: "la realización de estudios universitarios durante el curso 2026-2027",
    luz: m["pisos/centro"].luz, agua: { opcion: "incluida" }, wifi: { opcion: "incluida" }, gastos: {} };
  const f1 = firmantes(d1);
  m["contratos/demoContrato1"] = { pisoId: "centro", pisoNombre: "Piso Centro", plantilla: d1.plantilla, curso: "2026-27", años: [2026, 2027],
    inquilinos: ["Pablo Ejemplo Muestra"], nombreArchivo: "Contrato_PisoCentro_Hab1_PabloEjemploMuestra_2026-27.pdf", datos: d1,
    enDrive: enDrive([2026, 2027], "centro", "c1"), firmado: enDrive([2026, 2027], "centro", "c1f"), estado: "firmado",
    firmantes: f1, firmantesIds: f1.map(f => f.fid), huella: "demo", firmaElectronica: true, creada: ts(60), creadaPor: "demo", firmadoEl: ts(55) };
  f1.forEach((f, i) => firmar("demoContrato1", f, 58 - i));

  // 2) Vivienda habitual · piso entero, esperando la firma de los propietarios.
  const d2 = { ...comun, ciudadFirma: "Zaragoza", plantilla: "larga_duracion", fechaFirma: "2026-10-20",
    piso: { nombre: "Casa del Río", direccion: m["pisos/rio"].direccion, descripcion: m["pisos/rio"].descripcion, numHabitaciones: 2 }, habitacion: "",
    inquilinos: [persona("Dña.", "Marta Ejemplo Prueba", "00000006Y", "Avenida de la Paz, 40, 50008 Zaragoza")],
    renta: "680", fianza: "", fechaInicio: "2026-11-01", fechaFin: "", fechaEntrega: "2026-11-01", motivoTemporada: "",
    luz: m["pisos/rio"].luz, agua: m["pisos/rio"].agua, wifi: m["pisos/rio"].wifi, gastos: m["pisos/rio"].gastos };
  const f2 = firmantes(d2);
  m["contratos/demoContrato2"] = { pisoId: "rio", pisoNombre: "Casa del Río", plantilla: d2.plantilla, curso: "2026", años: [2026],
    inquilinos: ["Marta Ejemplo Prueba"], nombreArchivo: "Contrato_CasadelRio_MartaEjemploPrueba_2026.pdf", datos: d2,
    enDrive: enDrive([2026], "rio", "c2"), estado: "firmando", firmantes: f2, firmantesIds: f2.map(f => f.fid), huella: "demo",
    creada: ts(6), creadaPor: "demo", enviadoAFirmar: ts(5) };
  f2.filter(f => f.rol !== "arrendador").forEach(f => firmar("demoContrato2", f, 4));

  // 3) Temporada · piso entero, generado y pendiente de enviar.
  const d3 = { ...comun, plantilla: "temporada_piso", fechaFirma: "2026-10-25",
    piso: { nombre: "Ático Jardines", direccion: m["pisos/atico"].direccion, descripcion: "", numHabitaciones: 3 }, habitacion: "",
    inquilinos: [
      persona("Dña.", "Elena Muestra Ejemplo", "00000007F", "Calle Nueva, 3, 12001 Castellón", [{ tratamiento: "Dña.", nombre: "Rosa Muestra Prueba", tipoDoc: "DNI", numDoc: "00000008P", parentesco: "Madre" }]),
      persona("D.", "Sergio Prueba Muestra", "00000009D", "Plaza Alta, 2, 02001 Albacete"),
      persona("Dña.", "Irene Ejemplo Ejemplo", "00000010X", "Calle Baja, 11, 16001 Cuenca")],
    renta: "900", fianza: "", fechaInicio: "2026-11-01", fechaFin: "2027-06-30", fechaEntrega: "",
    motivoTemporada: "la realización de unas prácticas profesionales en la ciudad durante el curso 2026-2027",
    luz: m["pisos/atico"].luz, agua: m["pisos/atico"].agua, wifi: m["pisos/atico"].wifi, gastos: {} };
  m["contratos/demoContrato3"] = { pisoId: "atico", pisoNombre: "Ático Jardines", plantilla: d3.plantilla, curso: "2026-27", años: [2026, 2027],
    inquilinos: d3.inquilinos.map(i => i.nombre), nombreArchivo: "Contrato_AticoJardines_Completo_2026-27.pdf", datos: d3,
    enDrive: enDrive([2026, 2027], "atico", "c3"), estado: "generado", creada: ts(1), creadaPor: "demo" };

  // Números de ejemplo: datos económicos de los pisos y algunas facturas.
  const eco = (o) => ({ imputacion: "1.1", reduccion: "50", otros: [], ...o });
  m["pisos/centro"].economia = eco({ precioCompra: "165000", gastosCompra: "13800", fechaCompra: "2021-06-15", mejoras: "14000", mobiliario: "6500",
    valorCatastral: "72000", valorCatastralConstruccion: "41000", hipoteca: { cuotaMensual: "610", interesesAnuales: "2900", importeInicial: "132000", capitalPendiente: "112000" },
    ibi: "420", basura: "90", comunidad: "720", seguroHogar: "260", seguroImpago: "0", suministros: "2100", otros: [{ concepto: "Gestoría", importe: "180" }] });
  m["pisos/universidad"].economia = eco({ precioCompra: "138000", gastosCompra: "11200", fechaCompra: "2019-09-01", mejoras: "8000", mobiliario: "5200",
    valorCatastral: "61000", valorCatastralConstruccion: "35000", hipoteca: { cuotaMensual: "480", interesesAnuales: "1700", importeInicial: "110000", capitalPendiente: "84000" },
    ibi: "380", basura: "85", comunidad: "600", seguroHogar: "230", suministros: "2400" });
  m["pisos/atico"].economia = eco({ precioCompra: "210000", gastosCompra: "17500", fechaCompra: "2022-02-10", mobiliario: "7000",
    valorCatastral: "95000", valorCatastralConstruccion: "58000", ibi: "610", basura: "95", comunidad: "960", seguroHogar: "310", seguroImpago: "280", reduccion: "0" });
  m["pisos/rio"].economia = eco({ precioCompra: "118000", gastosCompra: "9500", fechaCompra: "2018-04-20", mejoras: "6000", mobiliario: "3000",
    valorCatastral: "54000", valorCatastralConstruccion: "30000", hipoteca: { cuotaMensual: "395", interesesAnuales: "1100", importeInicial: "94000", capitalPendiente: "61000" },
    ibi: "330", comunidad: "540", seguroHogar: "210", seguroImpago: "240" });
  const factura = (id, pisoId, proveedor, concepto, fecha, importe, categoria) =>
    (m[`facturas/${id}`] = { pisoId, pisoNombre: m[`pisos/${pisoId}`].nombre, proveedor, concepto, fecha, importe, categoria, nombre: `${concepto}.pdf`, link: "#", creada: ts(10) });
  factura("f1", "centro", "Fontanería Ejemplo", "Reparación calentador", "2025-11-12", "240", "reparacion");
  factura("f2", "centro", "Muebles Ejemplo", "Colchones habitaciones", "2025-08-20", "780", "mobiliario");
  factura("f3", "universidad", "Electricidad Ejemplo", "Factura luz agosto", "2025-08-31", "96", "suministros");
  factura("f4", "rio", "Pinturas Ejemplo", "Pintura salón", "2025-03-05", "650", "reparacion");
  factura("f5", "atico", "Reformas Ejemplo", "Cambio de ventanas", "2025-10-01", "3200", "mejora");
  // Contratos firmados del año pasado para que haya ingresos en el resumen de la Renta.
  const viejo = (id, pisoId, plantilla, nombre, renta, ini, fin, extra = {}) => {
    const p = m[`pisos/${pisoId}`];
    m[`contratos/${id}`] = { pisoId, pisoNombre: p.nombre, plantilla, curso: ini.slice(0, 4), años: [+ini.slice(0, 4)], inquilinos: [nombre],
      nombreArchivo: `Contrato_${p.nombre.replace(/\s/g, "")}_${nombre.replace(/\s/g, "")}_${ini.slice(0, 4)}.pdf`, estado: "firmado", creada: ts(400), creadaPor: "demo", firmado: [], enDrive: [],
      datos: { ...comun, plantilla, piso: { nombre: p.nombre, direccion: p.direccion }, inquilinos: [persona("D.", nombre, "", "")], renta, fianza: "",
        fechaInicio: ini, fechaFin: fin, luz: p.luz, agua: p.agua, wifi: p.wifi, ...extra } };
  };
  viejo("antiguo1", "centro", "temporada_habitacion", "Inquilino Pasado Uno", "310", "2024-09-01", "2025-06-30", { motivoTemporada: "estudios" });
  viejo("antiguo2", "centro", "temporada_habitacion", "Inquilino Pasado Dos", "310", "2024-09-01", "2025-06-30", { motivoTemporada: "estudios" });
  viejo("antiguo3", "centro", "temporada_habitacion", "Inquilino Pasado Tres", "320", "2025-09-01", "2026-06-30", { motivoTemporada: "estudios" });
  viejo("antiguo4", "universidad", "habitacion", "Inquilina Pasada Cuatro", "285", "2024-09-01", "2025-07-31");
  viejo("antiguo5", "universidad", "habitacion", "Inquilina Pasada Cinco", "290", "2025-09-01", "2026-07-31");
  viejo("antiguo6", "rio", "larga_duracion", "Inquilino Pasado Seis", "650", "2023-11-01", "");
  m["contratos/antiguo6"].finalizado = "2026-10-15";
  viejo("antiguo7", "atico", "temporada_piso", "Grupo Pasado Siete", "880", "2024-10-01", "2025-06-30", { motivoTemporada: "estudios" });
  viejo("antiguo8", "atico", "temporada_piso", "Grupo Actual Ocho", "900", "2025-10-01", "2026-06-30", { motivoTemporada: "estudios" });
  viejo("actual1", "centro", "temporada_habitacion", "Inquilina Actual Uno", "320", "2026-09-01", "2027-06-30", { motivoTemporada: "estudios" });
  viejo("actual2", "centro", "temporada_habitacion", "Inquilino Actual Dos", "330", "2026-09-01", "2027-06-30", { motivoTemporada: "estudios" });
  viejo("actual3", "universidad", "habitacion", "Inquilina Actual Tres", "290", "2026-09-01", "2027-07-31");
  viejo("actual4", "universidad", "habitacion", "Inquilino Actual Cuatro", "295", "2026-09-01", "2027-07-31");
  viejo("actual5", "universidad", "habitacion", "Inquilina Actual Cinco", "285", "2026-09-01", "2027-07-31");
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
