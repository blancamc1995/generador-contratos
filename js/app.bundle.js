// js/firebase-config.js
var CONFIG = {
  firebase: {
    apiKey: "AIzaSyABnpa7bshQxa7uGCiCCR86mixGTeeA3P4",
    authDomain: "gestion-alquileres-35943.firebaseapp.com",
    projectId: "gestion-alquileres-35943",
    storageBucket: "gestion-alquileres-35943.firebasestorage.app",
    messagingSenderId: "772414745528",
    appId: "1:772414745528:web:32bf23743b3fefaff57d4d"
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
    fechaTextos: "octubre de 2026"
  },
  versionTextos: "1",
  // Dirección pública de la app (para el enlace a la demo).
  urlApp: "https://gestion-alquileres-35943.web.app/",
  // Pago de la beta. Si rellenas precio y bizum, la pantalla de espera
  // muestra cómo pagar; después activas la cuenta en Ajustes → Administración.
  pago: { precio: "", bizum: "", duracion: "un a\xF1o" }
};

// js/datos.js
var DEMO = window.__DEMO__ === true || String(CONFIG.firebase.apiKey).startsWith("PEGAR") || new URLSearchParams(location.search).has("demo");
var V = "13.0.0";
var api;
if (!DEMO) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
  ]);
  const fb = initializeApp(CONFIG.firebase);
  api = {
    auth: A.getAuth(fb),
    db: F.getFirestore(fb),
    GoogleAuthProvider: A.GoogleAuthProvider,
    signInWithPopup: A.signInWithPopup,
    onAuthStateChanged: A.onAuthStateChanged,
    signOut: A.signOut,
    doc: F.doc,
    getDoc: F.getDoc,
    setDoc: F.setDoc,
    addDoc: F.addDoc,
    updateDoc: F.updateDoc,
    deleteDoc: F.deleteDoc,
    collection: F.collection,
    getDocs: F.getDocs,
    query: F.query,
    orderBy: F.orderBy,
    where: F.where,
    serverTimestamp: F.serverTimestamp,
    arrayUnion: F.arrayUnion
  };
} else {
  api = crearDemo();
}
var {
  auth,
  db,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion
} = api;
function crearDemo() {
  const CLAVE = "contratos-demo-v6";
  let memoria = null;
  const cargar = () => {
    if (memoria) return memoria;
    try {
      memoria = JSON.parse(localStorage.getItem(CLAVE) || "null");
    } catch {
      memoria = null;
    }
    if (!memoria) {
      memoria = semilla();
      try {
        localStorage.setItem(CLAVE, JSON.stringify(memoria));
      } catch {
      }
    }
    return memoria;
  };
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(memoria));
    } catch {
    }
  };
  const id20 = () => [...crypto.getRandomValues(new Uint8Array(20))].map((b) => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 56]).join("");
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
    if (v && v.__union) return [.../* @__PURE__ */ new Set([...previo || [], ...v.__union])];
    if (v && v.__ts) return { __ts: v.__ts };
    if (Array.isArray(v)) return v.map((x) => limpiar(x));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, limpiar(x)]));
    return v;
  };
  const snap = (path) => {
    const datos = cargar()[path];
    return { id: path.split("/").pop(), exists: () => !!datos, data: () => datos ? revivir(datos) : void 0 };
  };
  const ordenar = (a, b) => {
    const x = a?.__ts ?? a ?? "", y = b?.__ts ?? b ?? "";
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const usuario2 = { uid: "demo", email: "demo@ejemplo.com", displayName: "Demo" };
  return {
    auth: {},
    db: {},
    GoogleAuthProvider: class {
    },
    signInWithPopup: async () => ({ user: usuario2 }),
    onAuthStateChanged: (_a, cb) => setTimeout(() => cb(usuario2), 0),
    signOut: async () => {
      try {
        localStorage.removeItem(CLAVE);
      } catch {
      }
      location.reload();
    },
    doc: (_db, ...segs) => ({ path: ruta(segs) }),
    collection: (_db, ...segs) => ({ path: ruta(segs) }),
    query: (col, ...cs) => ({ path: col.path, cs }),
    where: (campo2, _op, valor) => ({ tipo: "where", campo: campo2, valor }),
    orderBy: (campo2, dir = "asc") => ({ tipo: "orden", campo: campo2, dir }),
    serverTimestamp: () => ({ __ts: Date.now() }),
    arrayUnion: (...v) => ({ __union: v }),
    getDoc: async (ref) => snap(ref.path),
    getDocs: async (q) => {
      const m = cargar();
      const prof = q.path.split("/").length + 1;
      let docs = Object.keys(m).filter((p2) => p2.startsWith(q.path + "/") && p2.split("/").length === prof).map(snap);
      for (const c of q.cs || []) {
        if (c.tipo === "where") docs = docs.filter((d) => d.data()[c.campo] === c.valor);
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
      Object.entries(datos).forEach(([k, v]) => previo[k] = limpiar(v, previo[k]));
      guardar();
    },
    deleteDoc: async (ref) => {
      delete cargar()[ref.path];
      guardar();
    }
  };
}
function semilla() {
  const ahora = Date.now();
  const ts = (dias = 0) => ({ __ts: ahora - dias * 864e5 });
  const m = {};
  m["ajustes/general"] = {
    propietarios: [
      { tratamiento: "D.", nombre: "Propietario Ejemplo Uno", tipoDoc: "DNI", numDoc: "00000000T" },
      { tratamiento: "D\xF1a.", nombre: "Propietaria Ejemplo Dos", tipoDoc: "DNI", numDoc: "00000001R" }
    ],
    domicilio: "Calle Mayor, 1, 46001 Valencia",
    iban: "ES00 0000 0000 0000 0000 0000",
    ciudadFirma: "Valencia",
    carpetaDriveId: "demo-rentas",
    carpetaDriveNombre: "Rentas (demo)"
  };
  m["pisos/centro"] = {
    nombre: "Piso Centro",
    direccion: "Calle de los Olivos, 12, 2\xBA A, 46002 Valencia",
    ciudad: "Valencia",
    plantilla: "temporada_habitacion",
    numHabitaciones: 4,
    habitaciones: ["1", "2", "3", "4"],
    renta: "320",
    luz: { opcion: "B", cuota: "25", tope: "40" },
    agua: { opcion: "incluida" },
    wifi: { opcion: "incluida" }
  };
  m["pisos/universidad"] = {
    nombre: "Piso Universidad",
    direccion: "Avenida del Campus, 8, 3\xBA B, 46010 Valencia",
    ciudad: "Valencia",
    plantilla: "habitacion",
    numHabitaciones: 4,
    habitaciones: ["1", "2", "3", "4"],
    renta: "290",
    luz: { opcion: "D", cuota: "", tope: "180" },
    agua: { opcion: "incluida" },
    wifi: { opcion: "incluida" }
  };
  m["pisos/atico"] = {
    nombre: "\xC1tico Jardines",
    direccion: "Plaza de los Jardines, 3, 5\xBA, 46004 Valencia",
    ciudad: "Valencia",
    plantilla: "temporada_piso",
    numHabitaciones: 3,
    habitaciones: ["1", "2", "3"],
    renta: "900",
    luz: { opcion: "A" },
    agua: { opcion: "cuota", cuota: "15", tope: "25" },
    wifi: { opcion: "titularidad" }
  };
  m["pisos/rio"] = {
    nombre: "Casa del R\xEDo",
    direccion: "Calle del R\xEDo, 21, 50003 Zaragoza",
    ciudad: "Zaragoza",
    plantilla: "larga_duracion",
    habitaciones: [],
    renta: "680",
    descripcion: "con dos dormitorios, cocina, sal\xF3n, ba\xF1o y terraza",
    luz: { opcion: "A" },
    agua: { opcion: "cuota", cuota: "10" },
    wifi: { opcion: "titularidad" },
    gastos: { comunidad: { quien: "arrendador" }, ibi: { quien: "arrendador" }, basura: { quien: "arrendatario", importe: "90" } }
  };
  m["invitaciones/demoInvitacion1"] = {
    pisoId: "universidad",
    pisoNombre: "Piso Universidad",
    pisoDireccion: m["pisos/universidad"].direccion,
    ciudad: "Valencia",
    plantilla: "habitacion",
    habitacion: "2",
    plazas: 1,
    renta: "290",
    fianza: "",
    fechaInicio: "2026-09-01",
    fechaFin: "2027-07-31",
    fechaEntrega: "",
    luz: { opcion: "D", tope: "180" },
    agua: { opcion: "incluida" },
    wifi: { opcion: "incluida" },
    estado: "abierta",
    creada: ts(2),
    creadaPor: "demo"
  };
  m["invitaciones/demoInvitacion1/respuestas/r1"] = {
    tratamiento: "D\xF1a.",
    nombre: "Luc\xEDa Ejemplo Prueba",
    tipoDoc: "DNI",
    numDoc: "12345678Z",
    domicilio: "Calle del Sol, 5, 30001 Murcia",
    telefono: "600 000 000",
    email: "lucia@ejemplo.com",
    avales: [
      { tratamiento: "D\xF1a.", nombre: "Ana Prueba Ejemplo", tipoDoc: "DNI", numDoc: "00000002W", parentesco: "Madre" },
      { tratamiento: "D.", nombre: "Luis Ejemplo Ejemplo", tipoDoc: "DNI", numDoc: "00000003A", parentesco: "Padre" }
    ],
    consentimiento: true,
    enviada: ts(1)
  };
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

// js/contratos.js
var MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];
var ORDINALES = [
  "PRIMERA",
  "SEGUNDA",
  "TERCERA",
  "CUARTA",
  "QUINTA",
  "SEXTA",
  "S\xC9PTIMA",
  "OCTAVA",
  "NOVENA",
  "D\xC9CIMA",
  "UND\xC9CIMA",
  "DUOD\xC9CIMA",
  "DECIMOTERCERA",
  "DECIMOCUARTA"
];
var LAU = "Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos";
var HUECO = "______________";
function fechaLarga(iso) {
  if (!iso) return "____ de __________ de ____";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}
function euros(valor) {
  const n = typeof valor === "number" ? valor : parseFloat(String(valor).replace(",", "."));
  if (!isFinite(n)) return "_______ \u20AC";
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}
function num(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return isFinite(n) ? n : 0;
}
function sinPunto(s) {
  return (s || "").trim().replace(/[.;,]\s*$/, "");
}
function documento(p2) {
  const n = (p2.numDoc || "").trim() || HUECO;
  switch (p2.tipoDoc) {
    case "NIE":
      return `con N.I.E. ${n}`;
    case "Pasaporte":
      return `con pasaporte n.\xBA ${n}`;
    case "Otro":
      return `con documento de identidad n.\xBA ${n}`;
    default:
      return `con D.N.I. ${n}`;
  }
}
function trato(p2) {
  return p2.tratamiento === "D\xF1a." ? "D\xF1a." : "D.";
}
function unir(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join("; ") + "; y de otra, " + items[items.length - 1];
}
function esTemporada(pl) {
  return String(pl || "").startsWith("temporada");
}
function porHabitacion(pl) {
  return pl === "habitacion" || pl === "temporada_habitacion";
}
function generarContrato(datos) {
  const bloques = datos.plantilla === "larga_duracion" ? contratoLargaDuracion(datos) : esTemporada(datos.plantilla) ? contratoTemporada(datos) : contratoEstudiantes(datos);
  return datos.cambiosModelo?.length ? aplicarCambios(bloques, datos.cambiosModelo) : bloques;
}
var RE_CLAUSULA = new RegExp(`^(${ORDINALES.join("|")}|NUEVA)\\.\\s*`);
function renumerar(bloques) {
  let n = 0;
  return bloques.map((b) => b.type === "subheading" && RE_CLAUSULA.test(b.text) ? { ...b, text: b.text.replace(RE_CLAUSULA, `${ORDINALES[n++] || "CL\xC1USULA " + n}. `) } : b);
}
function aplicarCambios(bloques, cambios) {
  let out = bloques.map((b) => ({ ...b }));
  for (const c of cambios || []) {
    const sinNum = (t) => String(t || "").replace(RE_CLAUSULA, "");
    const buscado = sinNum(c.original ?? c.despuesDe);
    const i = out.findIndex((b) => typeof b.text === "string" && sinNum(b.text) === buscado);
    if (i < 0) continue;
    if (c.tipo === "reemplazar") out[i] = { type: c.bloque || out[i].type, text: c.nuevo };
    else if (c.tipo === "quitar") out.splice(i, 1);
    else if (c.tipo === "a\xF1adir") out.splice(i + 1, 0, { type: c.bloque || "p", text: c.nuevo });
  }
  return renumerar(out);
}
function condiciones(datos) {
  const c = datos.condiciones || {};
  const dia = parseInt(c.diaPago, 10);
  return {
    diaPago: dia >= 1 && dia <= 28 ? dia : 7,
    garantia: Math.min(2, Math.max(0, parseInt(c.garantiaMeses, 10) || 0)),
    ccaa: (c.ccaa || "").trim(),
    extra: (c.clausulasExtra || "").trim(),
    limpieza: c.clausulaLimpieza !== false
  };
}
var NUM_TXT = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "diecis\xE9is",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintid\xF3s",
  "veintitr\xE9s",
  "veinticuatro",
  "veinticinco",
  "veintis\xE9is",
  "veintisiete",
  "veintiocho"
];
function plazoPago(datos) {
  const d = condiciones(datos).diaPago;
  return d === 1 ? "el primer d\xEDa de cada mes" : `dentro de los ${NUM_TXT[d]} primeros d\xEDas de cada mes`;
}
function bloquesGarantiaYDeposito(add, datos, ARR, v, renta) {
  const k = condiciones(datos);
  if (k.garantia > 0) {
    add("p", `Adicionalmente, y conforme al art\xEDculo 36.5 de la LAU, ${ARR} ${v("entrega", "entregan")} a EL ARRENDADOR la cantidad de ${euros(renta * k.garantia)}, equivalente a ${k.garantia === 1 ? "una mensualidad" : "dos mensualidades"} de renta, en concepto de garant\xEDa adicional del cumplimiento de sus obligaciones, que se devolver\xE1 en las mismas condiciones que la fianza.`);
  }
  if (k.ccaa) {
    add("p", `EL ARRENDADOR depositar\xE1 la fianza en el organismo competente de ${k.ccaa}, conforme a la normativa auton\xF3mica aplicable.`);
  }
}
function bloqueClausulasExtra(add, datos, c) {
  const extra = condiciones(datos).extra;
  if (!extra) return;
  add("subheading", c.siguiente("Otras estipulaciones."));
  extra.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).forEach((t) => add("p", t.replace(/\s*\n\s*/g, " ")));
}
function contexto(datos) {
  const inquilinos = datos.inquilinos || [];
  const varios = inquilinos.length > 1;
  const avales = [];
  inquilinos.forEach((inq) => (inq.avales || []).forEach((av) => avales.push({ ...av, inquilino: inq })));
  const ARR = varios ? "LOS ARRENDATARIOS" : "EL ARRENDATARIO";
  const FIA = avales.length > 1 ? "LOS FIADORES" : "EL FIADOR";
  const v = (sing, plur) => varios ? plur : sing;
  let n = 0;
  const siguiente = (titulo) => `${ORDINALES[n++]}. ${titulo}`;
  return { inquilinos, varios, avales, ARR, FIA, v, siguiente };
}
function bloquesReunidos(datos, add, c, { conDomicilioTitulo }) {
  const props = datos.propietarios;
  const descProps = props.map((p2) => `${trato(p2)} ${p2.nombre}, mayor de edad, ${documento(p2)}`);
  add("p", `DE UNA PARTE, ${descProps.length > 1 ? descProps.slice(0, -1).join(", ") + ", y " + descProps[descProps.length - 1] : descProps[0]}, ${props.length === 2 ? "ambos" : props.length > 2 ? "todos" : ""} con domicilio a efectos de notificaciones en ${sinPunto(datos.domicilioPropietarios)}, en adelante "EL ARRENDADOR".`.replace(",  con", ", con"));
  const descInq = c.inquilinos.map((i) => `${trato(i)} ${i.nombre || HUECO}, mayor de edad, ${documento(i)}, con domicilio ${conDomicilioTitulo} en ${sinPunto(i.domicilio) || HUECO}`);
  add("p", `DE OTRA PARTE, ${unir(descInq)}; en adelante, ${c.varios ? "conjuntamente, " : ""}"${c.ARR}".`);
  if (c.avales.length) {
    const descAv = c.avales.map((av) => `${trato(av)} ${av.nombre || HUECO}, mayor de edad, ${documento(av)}`);
    add("p", `Y DE OTRA PARTE, en concepto de fiador${c.avales.length > 1 ? "es" : ""} solidario${c.avales.length > 1 ? "s" : ""}: ${unir(descAv)}; en adelante, "${c.FIA}".`);
  }
  add("p", "Las partes se reconocen mutuamente la capacidad legal necesaria para suscribir el presente contrato y, a tal efecto,");
}
function textoActualizacion(c) {
  return `La renta podr\xE1 actualizarse anualmente, en la fecha en que se cumpla cada a\xF1o de vigencia del contrato, conforme a lo dispuesto en el art\xEDculo 18 de la LAU, aplicando la variaci\xF3n anual del \xEDndice de referencia que resulte legalmente aplicable en cada momento (a la fecha de firma, el \xCDndice de Referencia para la Actualizaci\xF3n Anual de los Contratos de Arrendamiento de Vivienda, IRAV, publicado por el Instituto Nacional de Estad\xEDstica) y con sujeci\xF3n, en todo caso, a los l\xEDmites que establezca la normativa vigente. La actualizaci\xF3n deber\xE1 notificarse por escrito a ${c.ARR} con, al menos, un mes de antelaci\xF3n a la fecha en que haya de aplicarse.`;
}
function bloqueFiadores(add, c, objetoRef, esHabitacion) {
  c.avales.forEach((av) => {
    const par = (av.parentesco || "").trim();
    const calidad = par && par.toLowerCase() !== "aval" && par.toLowerCase() !== "avalista" ? `en su calidad de ${par.toLowerCase()} y avalista de ${trato(av.inquilino)} ${av.inquilino.nombre}` : `en calidad de avalista de ${trato(av.inquilino)} ${av.inquilino.nombre}`;
    add("p", `${trato(av)} ${av.nombre}, ${documento(av)}, ${calidad}, interviene en el presente contrato en concepto de fiador solidario y, como tal, queda ${av.tratamiento === "D\xF1a." ? "obligada" : "obligado"} solidariamente con ${c.varios ? "el arrendatario al que avala" : c.ARR}, con renuncia expresa a los beneficios de orden, divisi\xF3n y excusi\xF3n que pudieran corresponderle conforme a los art\xEDculos 1822 y siguientes del C\xF3digo Civil, al cumplimiento de todas las obligaciones derivadas del presente contrato y, en especial, al pago de la renta, suministros y dem\xE1s cantidades debidas, hasta la completa restituci\xF3n de ${objetoRef} y liquidaci\xF3n de cuantas obligaciones se deriven de este contrato.`);
  });
}
function bloqueFirmas(add, datos, c) {
  add("p", `Y en prueba de conformidad con cuanto antecede, las partes firman el presente contrato por ${c.avales.length ? "triplicado" : "duplicado"} y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.`);
  const f = firmantesDe(datos);
  const de = (rol) => f.filter((x) => x.rol === rol);
  add("signatures", { propietarios: de("arrendador"), inquilinos: de("arrendatario"), avales: de("fiador") });
}
function firmantesDe(datos) {
  const out = [];
  (datos.propietarios || []).forEach((p2, i) => out.push({ fid: `arr${i}`, rol: "arrendador", nombre: p2.nombre, tipoDoc: p2.tipoDoc, numDoc: p2.numDoc }));
  let k = 0;
  (datos.inquilinos || []).forEach((p2, i) => out.push({ fid: `inq${i}`, rol: "arrendatario", nombre: p2.nombre, tipoDoc: p2.tipoDoc, numDoc: p2.numDoc }));
  (datos.inquilinos || []).forEach((p2) => (p2.avales || []).forEach((a) => out.push({ fid: `fia${k++}`, rol: "fiador", nombre: a.nombre, tipoDoc: a.tipoDoc, numDoc: a.numDoc, avalaA: p2.nombre })));
  return out;
}
var NOMBRE_SUM = { luz: "energ\xEDa el\xE9ctrica", agua: "agua", wifi: "conexi\xF3n a internet (wifi)" };
function suministros(datos) {
  const l = datos.luz || { opcion: "D" };
  const luz = { opcion: { A: "titularidad", B: "cuota", C: "regularizacion", D: "incluida" }[l.opcion] || "incluida", cuota: l.cuota, tope: l.tope };
  const agua = { opcion: datos.plantilla === "larga_duracion" ? "cuota" : "incluida", ...datos.agua || {} };
  const wifi = { opcion: datos.plantilla === "larga_duracion" ? "titularidad" : "incluida", ...datos.wifi || {} };
  return { luz, agua, wifi };
}
function cuotasFijas(s) {
  return Object.entries(s).filter(([, x]) => (x.opcion === "cuota" || x.opcion === "regularizacion") && num(x.cuota) > 0).map(([k, x]) => [k, num(x.cuota)]);
}
function listaY(xs) {
  return xs.length > 1 ? xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1] : xs.join("");
}
function textoRenta(renta, cuotas, { concepto, ARR, v, solid, plazo }) {
  if (!cuotas.length) return `La renta mensual ${concepto} se fija en ${euros(renta)} mensuales, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado ${plazo}.`;
  const total = renta + cuotas.reduce((a, [, n]) => a + n, 0);
  const desglose = cuotas.map(([k, n]) => `${euros(n)} en concepto de cuota fija por el suministro de ${NOMBRE_SUM[k]}`);
  return `La cantidad mensual total a abonar por ${ARR} asciende a ${euros(total)}, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado ${plazo}, y que se desglosa en ${listaY([`${euros(renta)} en concepto de renta ${concepto}`, ...desglose])}, conforme a lo pactado sobre suministros en este contrato.`;
}
function textoSuministros(datos, c, esHab) {
  const { ARR, v } = c;
  const s = suministros(datos);
  const out = [];
  const de = (op) => Object.keys(s).filter((k) => s[k].opcion === op);
  const incl = de("incluida");
  const topeLuz = s.luz.opcion === "incluida" ? num(s.luz.tope) : 0;
  if (incl.length) {
    const base = `La renta pactada incluye ${incl.length > 1 ? "los suministros" : "el suministro"} de ${listaY(incl.map((k) => NOMBRE_SUM[k]))} de la vivienda`;
    if (topeLuz > 0) {
      out.push(esHab ? `${base}; en cuanto a la energ\xEDa el\xE9ctrica, siempre que el importe mensual de la factura de electricidad del conjunto de la vivienda no supere los ${euros(topeLuz)}. En caso de superarse dicho l\xEDmite, el exceso ser\xE1 de cuenta de los arrendatarios de la vivienda, repercuti\xE9ndose a partes iguales entre las habitaciones arrendadas, debiendo ${ARR} abonar a EL ARRENDADOR la parte que le corresponda conforme a las facturas que le sean facilitadas.` : `${base}; en cuanto a la energ\xEDa el\xE9ctrica, siempre que el importe mensual de la factura de electricidad no supere los ${euros(topeLuz)}. En caso de superarse dicho l\xEDmite, el exceso ser\xE1 de cuenta de ${ARR}, que ${v("deber\xE1", "deber\xE1n")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.`);
    } else {
      out.push(`${base}${incl.length === 3 ? `, sin que ${ARR} ${v("deba", "deban")} realizar pago adicional alguno por dichos conceptos` : ""}.`);
    }
  }
  const tit = de("titularidad");
  if (tit.length) {
    out.push(`${tit.length > 1 ? "Ser\xE1n" : "Ser\xE1"} de cuenta de ${ARR} ${tit.length > 1 ? "los suministros" : "el suministro"} de ${listaY(tit.map((k) => NOMBRE_SUM[k]))}. A tal efecto, ${ARR} ${v("deber\xE1", "deber\xE1n")}, en el plazo m\xE1s breve posible desde la entrada en vigor del presente contrato, tramitar a su nombre y con cargo a su cuenta bancaria el cambio de titularidad o, en su caso, la contrataci\xF3n de ${tit.length > 1 ? "dichos suministros" : "dicho suministro"}, haci\xE9ndose cargo a partir de entonces de su alta y abono${c.varios || esHab ? " en la proporci\xF3n que corresponda" : ""}.`);
  }
  for (const k of de("cuota")) {
    const x = s[k];
    const tope = num(x.tope);
    out.push(`En cuanto al suministro de ${NOMBRE_SUM[k]}, ${ARR} ${v("abonar\xE1", "abonar\xE1n")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${euros(x.cuota)} mensuales. ${tope > 0 ? `Dicha cantidad cubre el consumo hasta un m\xE1ximo de ${euros(tope)} mensuales; el eventual exceso sobre dicho importe ser\xE1 de cuenta de ${ARR}, que ${v("deber\xE1", "deber\xE1n")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.` : "Dicha cantidad tiene el car\xE1cter de tanto alzado y no ser\xE1 objeto de regularizaci\xF3n."}`);
  }
  if (s.luz.opcion === "regularizacion") {
    const finTxt = datos.fechaFin ? `el d\xEDa ${fechaLarga(datos.fechaFin).replace(/ de \d{4}$/, "")}` : "a la finalizaci\xF3n del contrato";
    out.push(esHab ? `En cuanto al suministro de energ\xEDa el\xE9ctrica, ${ARR} abonar\xE1 a EL ARRENDADOR, junto con la renta, una cantidad fija de ${euros(s.luz.cuota)} mensuales en concepto de consumo el\xE9ctrico. A la finalizaci\xF3n del contrato, ${finTxt}, se proceder\xE1 a una regularizaci\xF3n final: el importe real de las facturas de electricidad de la vivienda correspondientes al periodo del contrato se dividir\xE1 a partes iguales entre el n\xFAmero de habitaciones arrendadas durante dicho periodo, resultando as\xED la parte proporcional que corresponde a la habitaci\xF3n objeto de este contrato. Si la cantidad abonada por ${ARR} resultase superior a dicha parte proporcional, EL ARRENDADOR le devolver\xE1 el exceso; si, por el contrario, resultase inferior, ${ARR} deber\xE1 abonar a EL ARRENDADOR la diferencia.` : `En cuanto al suministro de energ\xEDa el\xE9ctrica, ${ARR} ${v("abonar\xE1", "abonar\xE1n")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${euros(s.luz.cuota)} mensuales en concepto de consumo el\xE9ctrico. A la finalizaci\xF3n del contrato, ${finTxt}, se proceder\xE1 a una regularizaci\xF3n final, comparando el total abonado por este concepto con el importe real de las facturas de electricidad del periodo del contrato: si lo abonado resultase superior, EL ARRENDADOR devolver\xE1 el exceso a ${ARR}; si resultase inferior, ${ARR} ${v("deber\xE1", "deber\xE1n")} abonar la diferencia.${c.varios ? " Dicha diferencia, a favor o en contra, se distribuir\xE1 a partes iguales entre todos los arrendatarios firmantes." : ""}`);
  }
  return out;
}
function textoGastosInmueble(datos, c, art20) {
  const { ARR, v } = c;
  const gastos = datos.gastos || {};
  const NOMBRES_G = { comunidad: "los gastos de la comunidad de propietarios", ibi: "el Impuesto sobre Bienes Inmuebles", basura: "la tasa de recogida de basuras" };
  const delInquilino = Object.keys(NOMBRES_G).filter((k) => gastos[k]?.quien === "arrendatario");
  const delPropietario = Object.keys(NOMBRES_G).filter((k) => !delInquilino.includes(k));
  const lista = (ks) => listaY(ks.map((k) => NOMBRES_G[k]));
  const out = [];
  if (delPropietario.length === 3) out.push("Ser\xE1n de cuenta de EL ARRENDADOR los gastos de la comunidad de propietarios, el Impuesto sobre Bienes Inmuebles, la tasa de recogida de basuras y dem\xE1s tributos que graven la propiedad.");
  else if (delPropietario.length) out.push(`Ser\xE1n de cuenta de EL ARRENDADOR ${delPropietario.map((k) => NOMBRES_G[k]).join(", ")} y dem\xE1s tributos que graven la propiedad.`);
  if (delInquilino.length) {
    out.push(`${art20 ? "De conformidad con el art\xEDculo 20.1 de la LAU, las" : "Las"} partes pactan que ser\xE1n de cuenta de ${ARR} ${lista(delInquilino)}, cuyo importe anual a la fecha de este contrato asciende a: ${delInquilino.map((k) => `${NOMBRES_G[k].replace(/^(los|el|la) /, "")}, ${euros(gastos[k].importe)}`).join("; ")}. ${ARR} ${v("abonar\xE1", "abonar\xE1n")} dichas cantidades a EL ARRENDADOR junto con la renta, en la proporci\xF3n mensual correspondiente, previa justificaci\xF3n de su importe.`);
  }
  return out;
}
function contratoEstudiantes(datos) {
  const esHab = datos.plantilla === "habitacion";
  const c = contexto(datos);
  const { ARR, v } = c;
  const L = [];
  const add = (type, text) => L.push({ type, text });
  const objetoRef = esHab ? "la habitaci\xF3n arrendada" : "la vivienda arrendada";
  const dir = sinPunto(datos.piso.direccion);
  const renta = num(datos.renta);
  const fianza = datos.fianza != null && datos.fianza !== "" ? num(datos.fianza) : renta;
  const cuotas = cuotasFijas(suministros(datos));
  add("title", "CONTRATO DE ARRENDAMIENTO DE VIVIENDA PARA USO DE VIVIENDA HABITUAL Y PERMANENTE");
  if (esHab) add("subtitle", "(arrendamiento de habitaci\xF3n en vivienda compartida)");
  add("p", `En ${datos.ciudadFirma || HUECO}, a ${fechaLarga(datos.fechaFirma)}.`);
  add("heading", "REUNIDOS");
  bloquesReunidos(datos, add, c, { conDomicilioTitulo: "a efectos de notificaciones" });
  add("heading", "EXPONEN");
  const nH = parseInt(datos.piso.numHabitaciones, 10) || 0;
  const descr = sinPunto(datos.piso.descripcion || "") || (nH ? `compuesta por ${nH} ${nH === 1 ? "dormitorio" : "dormitorios"}` : "");
  add("p", `I. Que EL ARRENDADOR es propietario de la vivienda sita en ${dir}${descr ? `, ${descr}` : ""}.`);
  add("p", `II. Que EL ARRENDADOR est\xE1 interesado en ceder en arrendamiento ${esHab ? "una habitaci\xF3n" : "la totalidad"} de dicha vivienda, con destino a vivienda habitual y permanente de ${ARR}, de conformidad con el art\xEDculo 2 de la ${LAU} (en adelante, "LAU").`);
  add("p", `III. Que ${ARR} ${v("est\xE1 interesado", "est\xE1n interesados")} en concertar dicho arrendamiento en los t\xE9rminos y condiciones que se especifican a continuaci\xF3n.`);
  add("p", "En su virtud, las partes formalizan el presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA, que se regir\xE1 por la LAU y, en lo no previsto en ella, por el C\xF3digo Civil, y en particular por las siguientes");
  add("heading", "CL\xC1USULAS");
  add("subheading", c.siguiente("Objeto."));
  if (esHab) {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que lo recibe de conformidad, la habitaci\xF3n identificada como \xAB${datos.habitacion || HUECO}\xBB dentro de la vivienda sita en ${dir}, junto con el derecho de uso compartido, en condiciones de igualdad con los restantes ocupantes de la vivienda, de sus zonas comunes (cocina, sal\xF3n, ba\xF1os, terrazas y dem\xE1s estancias no destinadas a uso privativo de un ocupante). El presente arrendamiento se destina exclusivamente a vivienda habitual y permanente de ${ARR}.`);
  } else {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que ${v("lo recibe", "lo reciben")} de conformidad, la totalidad de la vivienda sita en ${dir}, con destino exclusivo a vivienda habitual y permanente de ${ARR}.`);
  }
  add("subheading", c.siguiente("Duraci\xF3n."));
  add("p", `El presente contrato se concierta por un plazo de duraci\xF3n determinada, que comenzar\xE1 el d\xEDa ${fechaLarga(datos.fechaInicio)} y finalizar\xE1 el d\xEDa ${fechaLarga(datos.fechaFin)}.`);
  add("p", "Llegada dicha fecha, el contrato se prorrogar\xE1, en su caso, conforme a lo dispuesto en la LAU, salvo que concurra alguna de las causas legales de extinci\xF3n o resoluci\xF3n previstas en dicha normativa.");
  add("p", `En caso de no producirse pr\xF3rroga legal, ${ARR} ${v("deber\xE1", "deber\xE1n")} dejar libre, vacua, expedita y a disposici\xF3n de EL ARRENDADOR ${objetoRef}, junto con sus llaves y enseres.`);
  add("subheading", c.siguiente("Renta y forma de pago."));
  const solid = esHab ? "" : c.varios ? "solidariamente, " : "";
  add("p", textoRenta(renta, cuotas, { concepto: esHab ? "de la habitaci\xF3n arrendada" : "de la vivienda", ARR, v, solid, plazo: plazoPago(datos) }));
  const concepto = `Alquiler ${datos.piso.nombre} + ${c.inquilinos.map((i) => i.nombre).join(" y ")}`;
  add("p", `El pago se realizar\xE1 mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, debiendo hacerse constar en el concepto de la transferencia: "${concepto}".`);
  textoSuministros(datos, c, esHab).forEach((t) => add("p", t));
  add("p", textoActualizacion(c));
  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el art\xEDculo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta. La fianza ser\xE1 devuelta a ${ARR} a la finalizaci\xF3n del contrato, previa comprobaci\xF3n del buen estado de ${objetoRef} y enseres, y una vez deducidas, en su caso, las cantidades que correspondan en concepto de desperfectos, suministros pendientes u otras cantidades adeudadas.`);
  bloquesGarantiaYDeposito(add, datos, ARR, v, renta);
  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, esHab);
    if (!esHab && c.varios) {
      add("p", `Asimismo, ${ARR} firmantes del presente contrato responden solidariamente entre s\xED frente a EL ARRENDADOR del cumplimiento \xEDntegro de las obligaciones derivadas de este contrato, y en particular del pago de la totalidad de la renta pactada, con independencia de la parte proporcional que individualmente les corresponda satisfacer.`);
    }
    if (esHab) {
      add("p", `La responsabilidad de ${ARR} y de su${c.avales.length > 1 ? "s fiadores" : " fiador"} se circunscribe exclusivamente a las obligaciones derivadas del arrendamiento de su propia habitaci\xF3n, sin extenderse solidariamente a las obligaciones que pudieran corresponder a los restantes ocupantes de la vivienda, quienes mantienen, en su caso, contratos de arrendamiento independientes y aut\xF3nomos con EL ARRENDADOR.`);
    }
  }
  add("subheading", c.siguiente("Conservaci\xF3n, uso y obras."));
  add("p", `${ARR} se ${v("obliga", "obligan")} a conservar ${esHab ? "la habitaci\xF3n y las zonas comunes" : "la vivienda"} en buen estado, destin\xE1ndola exclusivamente a vivienda habitual, sin desarrollar en ella actividades molestas, insalubres, nocivas, peligrosas o il\xEDcitas, ni ceder o subarrendar, total o parcialmente, ${objetoRef} sin consentimiento previo y por escrito de EL ARRENDADOR. Las peque\xF1as reparaciones que exija el desgaste por el uso ordinario ser\xE1n de cuenta de ${ARR}, conforme al art\xEDculo 21.4 de la LAU.`);
  const objLimpieza = esHab ? "la habitaci\xF3n arrendada, as\xED como las zonas comunes de la vivienda (cocina, sal\xF3n, ba\xF1os y dem\xE1s estancias de uso compartido)," : "la vivienda arrendada";
  if (condiciones(datos).limpieza) add("p", `Asimismo, ${ARR} se ${v("obliga", "obligan")} a devolver ${objLimpieza} en unas condiciones generales de limpieza equiparables a las que exist\xEDan al inicio del contrato, sin que sea exigible un estado de limpieza impecable, pero s\xED un estado adecuado y no descuidado. Si al finalizar el contrato no se entregase en dichas condiciones, EL ARRENDADOR podr\xE1 descontar de la fianza el importe correspondiente para restituirlas a un estado adecuado de limpieza.`);
  add("subheading", c.siguiente("Gastos."));
  if (esHab) add("p", "Los gastos generales del inmueble (comunidad de propietarios, Impuesto sobre Bienes Inmuebles y dem\xE1s tributos que graven la propiedad) ser\xE1n de cuenta de EL ARRENDADOR. Los suministros se rigen por lo dispuesto en la cl\xE1usula de renta y forma de pago.");
  else {
    textoGastosInmueble(datos, c, true).forEach((t) => add("p", t));
    add("p", "Los suministros se rigen por lo dispuesto en la cl\xE1usula de renta y forma de pago.");
  }
  add("subheading", c.siguiente("Resoluci\xF3n."));
  add("p", "Ser\xE1n causa de resoluci\xF3n del presente contrato, adem\xE1s de las previstas en el art\xEDculo 27 de la LAU, el impago de la renta o de cualquier cantidad asimilada a la misma, el incumplimiento grave de las obligaciones de conservaci\xF3n y buen uso, y la cesi\xF3n o el subarriendo no consentidos por EL ARRENDADOR.");
  add("subheading", c.siguiente("Notificaciones."));
  add("p", "A los efectos del presente contrato, las partes se\xF1alan como domicilios v\xE1lidos para notificaciones los que constan en el encabezamiento de este documento.");
  add("subheading", c.siguiente("Normativa aplicable."));
  add("p", "En todo lo no previsto expresamente en este contrato, las partes se someten a lo dispuesto en la LAU y, supletoriamente, al C\xF3digo Civil.");
  bloqueClausulasExtra(add, datos, c);
  bloqueFirmas(add, datos, c);
  return L;
}
function contratoTemporada(datos) {
  const esHab = datos.plantilla === "temporada_habitacion";
  const c = contexto(datos);
  const { ARR, v } = c;
  const L = [];
  const add = (type, text) => L.push({ type, text });
  const objetoRef = esHab ? "la habitaci\xF3n arrendada" : "la vivienda arrendada";
  const dir = sinPunto(datos.piso.direccion);
  const renta = num(datos.renta);
  const fianza = datos.fianza != null && datos.fianza !== "" ? num(datos.fianza) : renta * 2;
  const cuotas = cuotasFijas(suministros(datos));
  const motivo = sinPunto(datos.motivoTemporada) || HUECO;
  add("title", "CONTRATO DE ARRENDAMIENTO DE TEMPORADA");
  add("subtitle", esHab ? "(arrendamiento de habitaci\xF3n en vivienda compartida para uso distinto del de vivienda habitual)" : "(arrendamiento para uso distinto del de vivienda habitual)");
  add("p", `En ${datos.ciudadFirma || HUECO}, a ${fechaLarga(datos.fechaFirma)}.`);
  add("heading", "REUNIDOS");
  bloquesReunidos(datos, add, c, { conDomicilioTitulo: "habitual y permanente" });
  add("heading", "EXPONEN");
  const nH = parseInt(datos.piso.numHabitaciones, 10) || 0;
  const descr = sinPunto(datos.piso.descripcion || "") || (nH ? `compuesta por ${nH} ${nH === 1 ? "dormitorio" : "dormitorios"}` : "");
  add("p", `I. Que EL ARRENDADOR es propietario de la vivienda sita en ${dir}${descr ? `, ${descr}` : ""}, debidamente amueblada y en condiciones de habitabilidad.`);
  add("p", `II. Que ${ARR} ${v("necesita", "necesitan")} ocupar temporalmente ${esHab ? "una habitaci\xF3n de dicha vivienda" : "dicha vivienda"} por el siguiente motivo: ${motivo}, manteniendo ${c.varios ? "cada uno de ellos" : ""} su vivienda habitual y permanente en el domicilio indicado en el encabezamiento.`.replace("manteniendo  su", "manteniendo su"));
  add("p", `III. Que, en atenci\xF3n a dicha necesidad temporal, las partes acuerdan celebrar un contrato de arrendamiento de temporada, para uso distinto del de vivienda, conforme al art\xEDculo 3.2 de la ${LAU} (en adelante, "LAU"), que se regir\xE1 por la voluntad de las partes, en su defecto por lo dispuesto en el T\xEDtulo III de la LAU y, supletoriamente, por el C\xF3digo Civil, de acuerdo con el art\xEDculo 4.3 de la LAU, y en particular por las siguientes`);
  add("heading", "CL\xC1USULAS");
  add("subheading", c.siguiente("Objeto y destino."));
  if (esHab) {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que lo recibe de conformidad, la habitaci\xF3n identificada como \xAB${datos.habitacion || HUECO}\xBB dentro de la vivienda sita en ${dir}, amueblada, junto con el derecho de uso compartido, en condiciones de igualdad con los restantes ocupantes de la vivienda, de sus zonas comunes (cocina, sal\xF3n, ba\xF1os, terrazas y dem\xE1s estancias no destinadas a uso privativo de un ocupante).`);
  } else {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que ${v("lo recibe", "lo reciben")} de conformidad, la totalidad de la vivienda sita en ${dir}, junto con el mobiliario y enseres que la integran.`);
  }
  add("p", `El arrendamiento se destina exclusivamente a satisfacer la necesidad temporal descrita en el expositivo II. ${ARR} ${v("declara", "declaran")} que ${objetoRef} no constituir\xE1 su vivienda habitual y permanente. El cambio de dicho destino sin autorizaci\xF3n escrita de EL ARRENDADOR ser\xE1 causa de resoluci\xF3n del contrato.`);
  add("subheading", c.siguiente("Duraci\xF3n."));
  add("p", `El presente contrato tendr\xE1 una duraci\xF3n determinada, desde el d\xEDa ${fechaLarga(datos.fechaInicio)} hasta el d\xEDa ${fechaLarga(datos.fechaFin)}.`);
  add("p", `Llegada la fecha de vencimiento, el contrato quedar\xE1 extinguido de pleno derecho, sin necesidad de requerimiento previo y sin que proceda pr\xF3rroga alguna, excluyendo las partes expresamente la t\xE1cita reconducci\xF3n prevista en el art\xEDculo 1566 del C\xF3digo Civil. En dicha fecha, ${ARR} ${v("deber\xE1", "deber\xE1n")} dejar libre, vacua, expedita y a disposici\xF3n de EL ARRENDADOR ${objetoRef}, junto con sus llaves y enseres. Cualquier ampliaci\xF3n del plazo deber\xE1 pactarse por escrito.`);
  add("subheading", c.siguiente("Renta y forma de pago."));
  add("p", textoRenta(renta, cuotas, { concepto: esHab ? "de la habitaci\xF3n arrendada" : "de la vivienda", ARR, v, solid: !esHab && c.varios ? "solidariamente, " : "", plazo: plazoPago(datos) }));
  add("p", `El pago se realizar\xE1 mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, debiendo hacerse constar en el concepto de la transferencia: "Alquiler ${datos.piso.nombre} + ${c.inquilinos.map((i) => i.nombre).join(" y ")}". El justificante de la transferencia servir\xE1 de recibo, salvo prueba en contrario.`);
  add("p", "Si la duraci\xF3n del contrato fuese superior a un a\xF1o, la renta se actualizar\xE1 en cada anualidad conforme a la variaci\xF3n anual del \xCDndice de Precios de Consumo (IPC) publicado por el Instituto Nacional de Estad\xEDstica, con sujeci\xF3n en todo caso a los l\xEDmites que establezca la normativa vigente.");
  add("subheading", c.siguiente("Suministros."));
  textoSuministros(datos, c, esHab).forEach((t) => add("p", t));
  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR de la cantidad de ${euros(fianza)} en concepto de fianza legal, conforme al art\xEDculo 36.1 de la LAU, que para los arrendamientos para uso distinto del de vivienda la fija en dos mensualidades de renta. La fianza ser\xE1 devuelta a ${ARR} en el plazo de un mes desde la entrega de llaves, previa comprobaci\xF3n del buen estado de ${objetoRef} y enseres, y una vez deducidas, en su caso, las cantidades que correspondan en concepto de desperfectos, suministros pendientes u otras cantidades adeudadas. La fianza no podr\xE1 aplicarse al pago de la \xFAltima mensualidad de renta.`);
  bloquesGarantiaYDeposito(add, datos, ARR, v, renta);
  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, esHab);
  }
  if (!esHab && c.varios) {
    add("p", `${ARR} firmantes del presente contrato responden solidariamente entre s\xED frente a EL ARRENDADOR del cumplimiento \xEDntegro de las obligaciones derivadas de este contrato, y en particular del pago de la totalidad de la renta pactada, con independencia de la parte proporcional que individualmente les corresponda satisfacer.`);
  }
  if (esHab) {
    add("p", `La responsabilidad de ${ARR}${c.avales.length ? ` y de su${c.avales.length > 1 ? "s fiadores" : " fiador"}` : ""} se circunscribe exclusivamente a las obligaciones derivadas del arrendamiento de su propia habitaci\xF3n, sin extenderse a las que pudieran corresponder a los restantes ocupantes de la vivienda, quienes mantienen, en su caso, contratos independientes con EL ARRENDADOR.`);
  }
  add("subheading", c.siguiente("Conservaci\xF3n, uso y obras."));
  add("p", `${ARR} se ${v("obliga", "obligan")} a conservar ${esHab ? "la habitaci\xF3n y las zonas comunes" : "la vivienda"}, su mobiliario y sus instalaciones en buen estado, sin desarrollar en ${esHab ? "ellas" : "ella"} actividades molestas, insalubres, nocivas, peligrosas o il\xEDcitas, ni realizar obras sin consentimiento escrito de EL ARRENDADOR, ni ceder el contrato o subarrendar, total o parcialmente, ${objetoRef}. Las peque\xF1as reparaciones que exija el desgaste por el uso ordinario ser\xE1n de cuenta de ${ARR}.`);
  const objLimpieza = esHab ? "la habitaci\xF3n arrendada, as\xED como las zonas comunes de la vivienda (cocina, sal\xF3n, ba\xF1os y dem\xE1s estancias de uso compartido)," : "la vivienda arrendada";
  if (condiciones(datos).limpieza) add("p", `Asimismo, ${ARR} se ${v("obliga", "obligan")} a devolver ${objLimpieza} en unas condiciones generales de limpieza equiparables a las que exist\xEDan al inicio del contrato, sin que sea exigible un estado de limpieza impecable, pero s\xED un estado adecuado y no descuidado. Si al finalizar el contrato no se entregase en dichas condiciones, EL ARRENDADOR podr\xE1 descontar de la fianza el importe correspondiente para restituirlas a un estado adecuado de limpieza.`);
  if (datos.conFotos) add("p", `Como anexo a este contrato se adjuntan fotograf\xEDas del estado de ${esHab ? "la habitaci\xF3n y la vivienda" : "la vivienda"} a la fecha de entrega.`);
  add("subheading", c.siguiente("Gastos."));
  if (esHab) add("p", "Los gastos generales del inmueble (comunidad de propietarios, Impuesto sobre Bienes Inmuebles y dem\xE1s tributos que graven la propiedad) ser\xE1n de cuenta de EL ARRENDADOR.");
  else textoGastosInmueble(datos, c, false).forEach((t) => add("p", t));
  add("subheading", c.siguiente("Resoluci\xF3n."));
  add("p", "Ser\xE1n causa de resoluci\xF3n del presente contrato, adem\xE1s de las previstas en el art\xEDculo 35 de la LAU y en el art\xEDculo 1124 del C\xF3digo Civil, el impago de la renta o de cualquier cantidad asimilada a la misma, el incumplimiento grave de las obligaciones de conservaci\xF3n y buen uso, el cambio de destino y la cesi\xF3n o el subarriendo no consentidos por EL ARRENDADOR.");
  add("subheading", c.siguiente("Notificaciones."));
  add("p", `Las notificaciones a ${ARR} se practicar\xE1n en el domicilio habitual indicado en el encabezamiento o en ${objetoRef}, y las dirigidas a EL ARRENDADOR, en el domicilio indicado en el encabezamiento. Ser\xE1n igualmente v\xE1lidas las comunicaciones por correo electr\xF3nico o mensajer\xEDa siempre que quede constancia de su recepci\xF3n.`);
  add("subheading", c.siguiente("Normativa aplicable y jurisdicci\xF3n."));
  add("p", "El presente contrato se rige por la voluntad de las partes expresada en sus cl\xE1usulas, en su defecto por el T\xEDtulo III de la LAU y, supletoriamente, por el C\xF3digo Civil. Para cualquier controversia derivada del mismo ser\xE1n competentes los Juzgados y Tribunales del lugar en que radica la vivienda.");
  bloqueClausulasExtra(add, datos, c);
  bloqueFirmas(add, datos, c);
  if (datos.conFotos) add("annex", "ANEXO I. ESTADO ACTUAL DE LA VIVIENDA");
  return L;
}
function contratoLargaDuracion(datos) {
  const c = contexto(datos);
  const { ARR, v } = c;
  const L = [];
  const add = (type, text) => L.push({ type, text });
  const dir = sinPunto(datos.piso.direccion);
  const renta = num(datos.renta);
  const fianza = datos.fianza != null && datos.fianza !== "" ? num(datos.fianza) : renta;
  const cuotas = cuotasFijas(suministros(datos));
  const entrega = datos.fechaEntrega || datos.fechaInicio;
  const objetoRef = "la vivienda arrendada";
  add("title", "CONTRATO DE ARRENDAMIENTO DE VIVIENDA PARA USO DE VIVIENDA HABITUAL");
  add("p", `En ${datos.ciudadFirma || HUECO}, a ${fechaLarga(datos.fechaFirma)}.`);
  add("heading", "REUNIDOS");
  bloquesReunidos(datos, add, c, { conDomicilioTitulo: "actual" });
  add("heading", "EXPONEN");
  add("p", `I. Que EL ARRENDADOR es propietario en pleno dominio de la vivienda sita en ${dir}${datos.piso.descripcion ? `, ${sinPunto(datos.piso.descripcion)}` : ""}, debidamente amueblada y en condiciones de habitabilidad.`);
  add("p", "II. Que la vivienda se encuentra libre de cargas que puedan afectar al presente arrendamiento, y no est\xE1 arrendada ni ocupada a la fecha de firma de este contrato.");
  add("p", `III. Que EL ARRENDADOR hace entrega a ${ARR}, en este acto, de una copia del certificado de eficiencia energ\xE9tica de la vivienda.`);
  add("p", `IV. Que ${ARR} ${v("est\xE1 interesado", "est\xE1n interesados")} en arrendar dicha vivienda para destinarla a su vivienda habitual, por lo que las partes formalizan el presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA, que se regir\xE1 por la ${LAU} (en adelante, "LAU") y, en lo no previsto en ella, por el C\xF3digo Civil, y en particular por las siguientes`);
  add("heading", "CL\xC1USULAS");
  add("subheading", c.siguiente("Objeto y destino."));
  add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que ${v("la recibe", "la reciben")} de conformidad, la vivienda descrita en el expositivo I, junto con el mobiliario y enseres que la integran. La vivienda se destinar\xE1 exclusivamente a vivienda habitual y permanente de ${ARR}, quedando prohibido destinarla, total o parcialmente, a comercio, industria, despacho profesional, oficina, hospedaje o cualquier otra actividad distinta. La variaci\xF3n de dicho destino sin autorizaci\xF3n escrita de EL ARRENDADOR ser\xE1 causa de resoluci\xF3n del contrato.`);
  add("subheading", c.siguiente("Duraci\xF3n."));
  add("p", `El contrato entrar\xE1 en vigor el d\xEDa ${fechaLarga(datos.fechaInicio)} y tendr\xE1 una duraci\xF3n inicial de un a\xF1o a contar desde dicha fecha.`);
  add("p", `Llegado el d\xEDa de vencimiento, el contrato se prorrogar\xE1 obligatoriamente por plazos anuales hasta alcanzar una duraci\xF3n m\xEDnima de cinco a\xF1os, salvo que ${ARR} ${v("manifieste", "manifiesten")} a EL ARRENDADOR, con treinta d\xEDas de antelaci\xF3n como m\xEDnimo a la fecha de terminaci\xF3n del contrato o de cualquiera de sus pr\xF3rrogas, su voluntad de no renovarlo, conforme al art\xEDculo 9 de la LAU.`);
  add("p", `Transcurridos los cinco a\xF1os, si ninguna de las partes hubiese notificado a la otra su voluntad de no renovar el contrato, con al menos cuatro meses de antelaci\xF3n en el caso de EL ARRENDADOR o dos meses en el caso de ${ARR}, el contrato se prorrogar\xE1 obligatoriamente por plazos anuales hasta un m\xE1ximo de tres a\xF1os m\xE1s, salvo que ${ARR} ${v("manifieste", "manifiesten")} con un mes de antelaci\xF3n a la fecha de terminaci\xF3n de cualquiera de dichas anualidades su voluntad de no renovarlo, conforme al art\xEDculo 10 de la LAU.`);
  add("p", `No obstante lo anterior, ${ARR} ${v("podr\xE1", "podr\xE1n")} desistir del contrato una vez transcurridos al menos seis meses desde su entrada en vigor, siempre que lo ${v("comunique", "comuniquen")} a EL ARRENDADOR con una antelaci\xF3n m\xEDnima de treinta d\xEDas, conforme al art\xEDculo 11 de la LAU.`);
  add("subheading", c.siguiente("Renta y forma de pago."));
  add("p", textoRenta(renta, cuotas, { concepto: "de la vivienda", ARR, v, solid: c.varios ? "solidariamente, " : "", plazo: plazoPago(datos) }));
  add("p", `El pago se realizar\xE1 mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, haciendo constar en el concepto: "Alquiler ${datos.piso.nombre} + ${c.inquilinos.map((i) => i.nombre).join(" y ")}". El justificante de la transferencia acreditar\xE1 el pago y servir\xE1 de recibo, salvo prueba en contrario.`);
  add("p", "Las cantidades no satisfechas en plazo devengar\xE1n el inter\xE9s legal del dinero desde la fecha en que debieron abonarse.");
  add("subheading", c.siguiente("Actualizaci\xF3n de la renta."));
  add("p", textoActualizacion(c));
  add("p", "La base sobre la que se efectuar\xE1 cada actualizaci\xF3n ser\xE1 la renta vigente en el mes inmediatamente anterior a la fecha de actualizaci\xF3n. La actualizaci\xF3n no tendr\xE1 efectos retroactivos.");
  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el art\xEDculo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta.`);
  add("p", `La fianza garantiza el cumplimiento de las obligaciones de ${ARR} derivadas de este contrato. A la finalizaci\xF3n del arrendamiento ser\xE1 devuelta a ${ARR} en el plazo de un mes desde la entrega de llaves, una vez deducidas, en su caso, las cantidades que correspondan en concepto de rentas o suministros pendientes y de desperfectos que no se deban al uso ordinario de la vivienda. La fianza no podr\xE1 aplicarse al pago de la \xFAltima mensualidad de renta.`);
  bloquesGarantiaYDeposito(add, datos, ARR, v, renta);
  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, false);
  }
  add("subheading", c.siguiente("Gastos y suministros."));
  textoGastosInmueble(datos, c, true).forEach((t) => add("p", t));
  textoSuministros(datos, c, false).forEach((t) => add("p", t));
  add("p", `Cualquier otro servicio o suministro susceptible de individualizarse mediante contador ser\xE1 igualmente de cuenta de ${ARR}.`);
  add("subheading", c.siguiente("Conservaci\xF3n, obras y subarriendo."));
  add("p", `${ARR} se ${v("obliga", "obligan")} a conservar la vivienda, su mobiliario y sus instalaciones en buen estado. Las peque\xF1as reparaciones que exija el desgaste por el uso ordinario ser\xE1n de cuenta de ${ARR}, conforme al art\xEDculo 21.4 de la LAU; las reparaciones necesarias para conservar la vivienda en condiciones de habitabilidad corresponden a EL ARRENDADOR, conforme al art\xEDculo 21.1 de la LAU.`);
  add("p", `${ARR} no ${v("podr\xE1", "podr\xE1n")}, sin autorizaci\xF3n previa y por escrito de EL ARRENDADOR, realizar obras que modifiquen la configuraci\xF3n de la vivienda o sus instalaciones. Las mejoras que, en su caso, se autoricen quedar\xE1n en beneficio de la vivienda, sin derecho a indemnizaci\xF3n.`);
  add("p", `Queda prohibido ceder el contrato o subarrendar la vivienda, total o parcialmente, sin consentimiento escrito de EL ARRENDADOR.`);
  add("subheading", c.siguiente("Entrega y devoluci\xF3n de la vivienda."));
  add("p", `EL ARRENDADOR entrega la vivienda a ${ARR} en buen estado de conservaci\xF3n, amueblada y con plena habitabilidad, siendo la entrega de llaves el d\xEDa ${fechaLarga(entrega)}.${datos.conFotos ? " Como anexo a este contrato se adjuntan fotograf\xEDas del estado actual de la vivienda." : ""}`);
  add("p", `A la finalizaci\xF3n del contrato, ${ARR} ${v("deber\xE1", "deber\xE1n")} devolver la vivienda en el mismo estado en que la ${v("recibi\xF3", "recibieron")}, salvo el deterioro derivado del uso ordinario, y en unas condiciones de limpieza adecuadas. En caso contrario, EL ARRENDADOR podr\xE1 descontar de la fianza el importe necesario para su reparaci\xF3n o limpieza.`);
  add("subheading", c.siguiente("Resoluci\xF3n."));
  add("p", `Ser\xE1n causa de resoluci\xF3n del presente contrato, adem\xE1s de las previstas en los art\xEDculos 26, 27 y 28 de la LAU, el impago de la renta o de cualquiera de las cantidades cuyo pago haya asumido ${ARR}, el incumplimiento grave de las obligaciones de conservaci\xF3n y buen uso, la realizaci\xF3n de obras no consentidas, el cambio de destino de la vivienda y la cesi\xF3n o el subarriendo no consentidos.`);
  add("subheading", c.siguiente("Notificaciones."));
  add("p", `Las notificaciones a ${ARR} se practicar\xE1n en la vivienda arrendada, y las dirigidas a EL ARRENDADOR, en el domicilio indicado en el encabezamiento. Ser\xE1n igualmente v\xE1lidas las comunicaciones por correo electr\xF3nico o mensajer\xEDa siempre que quede constancia de su recepci\xF3n.`);
  add("subheading", c.siguiente("Normativa aplicable y jurisdicci\xF3n."));
  add("p", "En todo lo no previsto expresamente en este contrato ser\xE1 de aplicaci\xF3n la LAU y, supletoriamente, el C\xF3digo Civil. Para cualquier controversia derivada del presente contrato ser\xE1n competentes los Juzgados y Tribunales del lugar en que radica la vivienda.");
  bloqueClausulasExtra(add, datos, c);
  bloqueFirmas(add, datos, c);
  if (datos.conFotos) add("annex", "ANEXO I. ESTADO ACTUAL DE LA VIVIENDA");
  return L;
}

// js/pdf.js
var W = 210;
var H = 297;
var ML = 25;
var MR = 25;
var MT = 22;
var MB = 22;
var ANCHO = W - ML - MR;
function render(doc2, bloques, firmasHechas = {}) {
  let y = MT;
  const espacio = (mm) => {
    if (y + mm > H - MB) {
      doc2.addPage();
      y = MT;
    }
  };
  const parrafo = (texto, o = {}) => {
    const size = o.size || 10.5;
    doc2.setFont("helvetica", o.style || "normal");
    doc2.setFontSize(size);
    const lineas = doc2.splitTextToSize(texto, ANCHO);
    const alto = size * 0.42;
    lineas.forEach((l, i) => {
      espacio(alto);
      const ultima = i === lineas.length - 1;
      if (o.align === "center") doc2.text(l, W / 2, y, { align: "center" });
      else if (!ultima && o.justify !== false) doc2.text(l, ML, y, { align: "justify", maxWidth: ANCHO });
      else doc2.text(l, ML, y);
      y += alto;
    });
    y += o.after ?? 3.2;
  };
  for (const b of bloques) {
    switch (b.type) {
      case "title":
        parrafo(b.text, { size: 13, style: "bold", align: "center", after: 2 });
        break;
      case "subtitle":
        parrafo(b.text, { size: 10, style: "italic", align: "center", after: 6 });
        break;
      case "heading":
        espacio(12);
        y += 2;
        parrafo(b.text, { size: 11.5, style: "bold", after: 3, justify: false });
        break;
      case "subheading":
        espacio(10);
        y += 1.5;
        parrafo(b.text, { size: 10.5, style: "bold", after: 2, justify: false });
        break;
      case "annex":
        espacio(14);
        y += 8;
        parrafo(b.text, { size: 11.5, style: "bold", justify: false });
        break;
      case "signatures":
        y = firmas(doc2, b.text, y, firmasHechas);
        break;
      default:
        parrafo(b.text);
    }
  }
}
function firmas(doc2, s, y, hechas) {
  const filas = Math.max(s.propietarios.length, s.inquilinos.length);
  const alto = 14 + filas * 18 + (s.avales.length ? 14 + Math.ceil(s.avales.length / 2) * 18 : 0);
  if (y + alto > H - MB) {
    doc2.addPage();
    y = MT;
  }
  y += 8;
  const xI = ML, xD = W / 2 + 5;
  const cab = (t, x) => {
    doc2.setFont("helvetica", "bold");
    doc2.setFontSize(10.5);
    doc2.text(t, x, y);
  };
  const linea = (p2, x, yy) => {
    const f = p2.fid && hechas[p2.fid];
    if (f?.imagen) {
      try {
        doc2.addImage(f.imagen, "PNG", x, yy - 15, 52, 14);
      } catch (e) {
        console.warn("firma", e);
      }
    }
    doc2.setFont("helvetica", "normal");
    doc2.setFontSize(9.5);
    doc2.setDrawColor(120);
    doc2.line(x, yy, x + 62, yy);
    doc2.text(p2.nombre, x, yy + 5);
  };
  cab("EL ARRENDADOR", xI);
  cab(s.inquilinos.length > 1 ? "LOS ARRENDATARIOS" : "EL ARRENDATARIO", xD);
  y += 16;
  let yI = y, yD = y;
  s.propietarios.forEach((p2) => {
    linea(p2, xI, yI);
    yI += 18;
  });
  s.inquilinos.forEach((p2) => {
    linea(p2, xD, yD);
    yD += 18;
  });
  y = Math.max(yI, yD) + 4;
  if (s.avales.length) {
    cab(s.avales.length > 1 ? "LOS FIADORES" : "EL FIADOR", xI);
    y += 16;
    s.avales.forEach((a, i) => {
      const x = i % 2 === 0 ? xI : xD;
      linea(a, x, y);
      if (i % 2 === 1 || i === s.avales.length - 1) y += 18;
    });
  }
  return y;
}
function numerar(doc2, desde, total) {
  for (let i = 1; i <= desde; i++) {
    doc2.setPage(i);
    doc2.setFont("helvetica", "normal");
    doc2.setFontSize(8.5);
    doc2.setTextColor(140);
    doc2.text(`P\xE1gina ${i} de ${total}`, W / 2, H - 10, { align: "center" });
    doc2.setTextColor(0);
  }
}
function paginaRegistro(doc2, r) {
  doc2.addPage();
  let y = MT;
  doc2.setFont("helvetica", "bold");
  doc2.setFontSize(12);
  doc2.text("REGISTRO DE FIRMA ELECTR\xD3NICA", W / 2, y, { align: "center" });
  y += 10;
  doc2.setFont("helvetica", "normal");
  doc2.setFontSize(9.5);
  const intro = doc2.splitTextToSize(`Las partes han firmado este contrato de forma electr\xF3nica mediante firma manuscrita digitalizada, tras declarar haber le\xEDdo y aceptado su contenido. La huella digital (SHA-256) identifica de forma \xFAnica el texto firmado; cualquier modificaci\xF3n posterior del contenido dar\xEDa lugar a una huella distinta.`, ANCHO);
  doc2.text(intro, ML, y);
  y += intro.length * 4.2 + 4;
  doc2.setFont("courier", "normal");
  doc2.setFontSize(8);
  doc2.text(doc2.splitTextToSize(`Huella del contrato: ${r.huella}`, ANCHO), ML, y);
  y += 10;
  r.firmantes.forEach((f) => {
    if (y > H - MB - 26) {
      doc2.addPage();
      y = MT;
    }
    doc2.setDrawColor(210);
    doc2.line(ML, y - 4, W - MR, y - 4);
    doc2.setFont("helvetica", "bold");
    doc2.setFontSize(10);
    doc2.text(`${f.nombre} (${f.rolTexto})`, ML, y);
    doc2.setFont("helvetica", "normal");
    doc2.setFontSize(9);
    doc2.text(`${f.tipoDoc || "Documento"}: ${f.numDoc || "-"}`, ML, y + 5);
    doc2.text(`Firmado el ${f.fecha}`, ML, y + 10);
    if (f.imagen) {
      try {
        doc2.addImage(f.imagen, "PNG", W - MR - 50, y - 3, 48, 13);
      } catch (e) {
      }
    }
    y += 20;
  });
}
async function construirPdf(bloques, fotos, firmasHechas = null, registro = null) {
  const { jsPDF } = window.jspdf;
  const doc2 = new jsPDF({ unit: "mm", format: "a4" });
  render(doc2, bloques, firmasHechas || {});
  if (registro) paginaRegistro(doc2, registro);
  const paginas = doc2.internal.getNumberOfPages();
  numerar(doc2, paginas, paginas);
  const base = doc2.output("arraybuffer");
  if (!fotos) return new Uint8Array(base);
  const { PDFDocument } = window.PDFLib;
  const final = await PDFDocument.create();
  const contrato = await PDFDocument.load(base);
  (await final.copyPages(contrato, contrato.getPageIndices())).forEach((p2) => final.addPage(p2));
  const anexo = await PDFDocument.load(fotos, { ignoreEncryption: true });
  (await final.copyPages(anexo, anexo.getPageIndices())).forEach((p2) => final.addPage(p2));
  return await final.save();
}
function descargar(bytes, nombre) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5e3);
}

// js/drive.js
var SCOPES = {
  propia: "https://www.googleapis.com/auth/drive.file",
  completo: "https://www.googleapis.com/auth/drive"
};
var MODO = "propia";
function configurar(modo2) {
  MODO = modo2 === "completo" && CONFIG.driveCompleto !== false ? "completo" : "propia";
}
function modo() {
  return MODO;
}
var tokens = {};
var token = null;
var caduca = 0;
function esperar(cond, ms = 8e3) {
  return new Promise((ok, ko) => {
    const t0 = Date.now();
    (function mirar() {
      if (cond()) return ok();
      if (Date.now() - t0 > ms) return ko(new Error("No se pudo cargar Google"));
      setTimeout(mirar, 100);
    })();
  });
}
async function obtenerToken() {
  const t0 = tokens[MODO];
  if (t0 && Date.now() < t0.caduca - 6e4) {
    token = t0.token;
    return token;
  }
  await esperar(() => window.google?.accounts?.oauth2);
  return new Promise((ok, ko) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: SCOPES[MODO],
      callback: (r) => {
        if (r.error) return ko(new Error(r.error));
        tokens[MODO] = { token: r.access_token, caduca: Date.now() + r.expires_in * 1e3 };
        token = r.access_token;
        caduca = tokens[MODO].caduca;
        ok(token);
      },
      error_callback: (e) => ko(new Error(e?.message || "Permiso de Drive cancelado"))
    });
    cliente.requestAccessToken({ prompt: "" });
  });
}
async function crearCarpeta(nombre, padre = "root") {
  if (DEMO) return { id: "demo-" + nombre, name: nombre };
  const c = await api2(`https://www.googleapis.com/drive/v3/files?fields=id,name&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombre, mimeType: "application/vnd.google-apps.folder", parents: [padre] })
  });
  return c.json();
}
async function api2(url, opciones = {}) {
  const t = await obtenerToken();
  const r = await fetch(url, { ...opciones, headers: { ...opciones.headers || {}, Authorization: `Bearer ${t}` } });
  if (!r.ok) {
    const e = new Error(`Drive ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r;
}
var COMUNES = "supportsAllDrives=true&includeItemsFromAllDrives=true";
function normalizar(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
async function elegir(tipo = "carpeta") {
  if (DEMO) return tipo === "carpeta" ? { id: "demo-rentas", name: "Rentas (demo)" } : { id: "demo-fotos", name: "Fotos del piso (demo).pdf" };
  await obtenerToken();
  const esCarpeta = tipo === "carpeta";
  return new Promise((ok) => {
    const capa = document.createElement("div");
    capa.style.cssText = "position:fixed;inset:0;z-index:50;background:rgba(43,31,28,.45);display:flex;align-items:flex-end;justify-content:center";
    capa.innerHTML = `<div style="background:var(--fondo);width:100%;max-width:560px;max-height:85vh;border-radius:22px 22px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px">
        <div class="fila"><h2 style="font-size:21px">${esCarpeta ? "Elige la carpeta" : "Elige el PDF de fotos"}</h2>
          <button type="button" class="btn peligro" data-cerrar style="min-height:40px">Cancelar</button></div>
        <label class="campo">Buscar en tu Drive<input data-q value="${esCarpeta ? "Rentas" : ""}" enterkeyhint="search" placeholder="${esCarpeta ? "Nombre de la carpeta" : "Nombre del PDF"}"></label>
        <div data-lista style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;min-height:120px"></div>
      </div>`;
    document.body.appendChild(capa);
    let cerrado = false;
    const cerrar = (r) => {
      if (cerrado) return;
      cerrado = true;
      capa.remove();
      ok(r);
    };
    capa.querySelector("[data-cerrar]").onclick = () => cerrar(null);
    capa.addEventListener("click", (e) => {
      if (e.target === capa) cerrar(null);
    });
    const lista = capa.querySelector("[data-lista]");
    lista.addEventListener("pointerup", (e) => {
      const b = e.target.closest("[data-id]");
      if (b) cerrar({ id: b.dataset.id, name: b.querySelector(".nombre").textContent });
    });
    const input = capa.querySelector("[data-q]");
    let espera;
    const buscar = async () => {
      const texto = input.value.trim().replace(/'/g, "\\'");
      lista.innerHTML = '<p class="ayuda">Buscando\u2026</p>';
      const filtro = esCarpeta ? "mimeType='application/vnd.google-apps.folder'" : "mimeType='application/pdf'";
      const q = encodeURIComponent(`${filtro} and trashed=false${texto ? ` and name contains '${texto}'` : ""}`);
      try {
        const r = await api2(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=30&${COMUNES}`);
        const { files } = await r.json();
        if (!files.length) {
          lista.innerHTML = '<p class="ayuda">No hay resultados con ese nombre.</p>';
          return;
        }
        lista.innerHTML = files.map((f) => `<button type="button" class="tarjeta" data-id="${f.id}" style="border:1px solid var(--borde);text-align:left;font:inherit;color:inherit;cursor:pointer">
            <div class="fila"><div><div class="nombre">${f.name.replace(/</g, "&lt;")}</div>
            <div class="meta">Modificado el ${new Date(f.modifiedTime).toLocaleDateString("es-ES")}</div></div>
            <span class="chip ok">Elegir</span></div></button>`).join("");
        lista.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => cerrar({ id: b.dataset.id, name: b.querySelector(".nombre").textContent }));
        if (document.activeElement === input) input.blur();
      } catch (e) {
        lista.innerHTML = `<p class="ayuda" style="color:#A2321F">No se pudo buscar en Drive (${e.message}).</p>`;
      }
    };
    input.addEventListener("input", () => {
      clearTimeout(espera);
      espera = setTimeout(buscar, 350);
    });
    buscar();
  });
}
async function asegurarCarpeta(nombres, padreId) {
  const lista = Array.isArray(nombres) ? nombres : [nombres];
  if (DEMO) return `${padreId}/${lista[0]}`;
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and '${padreId}' in parents and trashed=false`);
  const r = await api2(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=200&${COMUNES}`);
  const { files } = await r.json();
  const buscados = lista.map(normalizar).filter(Boolean);
  const exacta = files.find((f) => buscados.includes(normalizar(f.name)));
  const parecida = files.find((f) => buscados.some((b) => normalizar(f.name).includes(b) || b.includes(normalizar(f.name))));
  const hallada = exacta || parecida;
  if (hallada) return hallada.id;
  const c = await api2(`https://www.googleapis.com/drive/v3/files?fields=id&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: lista[0], mimeType: "application/vnd.google-apps.folder", parents: [padreId] })
  });
  return (await c.json()).id;
}
async function subirPdf(bytes, nombre, carpetaId, mime = "application/pdf") {
  if (DEMO) return { id: "demo-" + Math.random().toString(36).slice(2), webViewLink: "#", ruta: carpetaId };
  const limite = "-------contratos" + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: nombre, mimeType: mime, parents: [carpetaId] });
  const cuerpo = new Blob([
    `--${limite}\r
Content-Type: application/json; charset=UTF-8\r
\r
${meta}\r
`,
    `--${limite}\r
Content-Type: ${mime}\r
\r
`,
    bytes,
    `\r
--${limite}--`
  ]);
  const r = await api2(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${limite}` },
    body: cuerpo
  });
  return r.json();
}
async function copiar(id, carpetaId, nombre) {
  if (DEMO) return { id: "demo-" + Math.random().toString(36).slice(2), webViewLink: "#" };
  const r = await api2(`https://www.googleapis.com/drive/v3/files/${id}/copy?fields=id,webViewLink&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombre, parents: [carpetaId] })
  });
  return r.json();
}
async function descargarArchivo(id) {
  if (DEMO) throw new Error("Sin fotos en la demo");
  const r = await api2(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&${COMUNES}`);
  return r.arrayBuffer();
}

// js/cuenta.js
var CID = null;
var ADMIN = null;
async function esAdmin() {
  if (DEMO) return false;
  if (ADMIN !== null) return ADMIN;
  try {
    await getDoc(doc(db, "admin", "config"));
    ADMIN = true;
  } catch {
    ADMIN = false;
  }
  return ADMIN;
}
function cuentaActiva(c) {
  if (DEMO) return true;
  if (!c || c.plan !== "activo") return false;
  const hasta = c.activoHasta?.toDate ? c.activoHasta.toDate() : c.activoHasta ? new Date(c.activoHasta) : null;
  return !hasta || hasta > /* @__PURE__ */ new Date();
}
function fijarCuenta(id) {
  CID = id;
}
var D = (...segs) => doc(db, "cuentas", CID, ...segs);
var C = (...segs) => collection(db, "cuentas", CID, ...segs);
var emailDe = (u) => String(u.email || "").toLowerCase();
async function resolverCuenta(u) {
  const ref = doc(db, "usuarios", u.uid);
  const email = emailDe(u);
  const acc = await getDoc(doc(db, "accesos", email)).catch(() => null);
  if (acc?.exists()) {
    const cid2 = acc.data().cuentaId;
    await updateDoc(doc(db, "cuentas", cid2), { miembros: arrayUnion(u.uid), ["correos." + u.uid]: email });
    await setDoc(ref, { cuentaId: cid2, email, desde: serverTimestamp() });
    await deleteDoc(doc(db, "accesos", email)).catch(() => {
    });
    return { cuentaId: cid2, nueva: false };
  }
  const s = await getDoc(ref);
  if (s.exists() && s.data().cuentaId) {
    const cid2 = s.data().cuentaId;
    const c = await getDoc(doc(db, "cuentas", cid2)).catch(() => null);
    if (c?.exists() && (c.data().miembros || []).includes(u.uid)) return { cuentaId: cid2, nueva: false };
  }
  const propia = await getDoc(doc(db, "cuentas", u.uid)).catch(() => null);
  if (propia?.exists()) {
    await setDoc(ref, { cuentaId: u.uid, email, desde: serverTimestamp() });
    return { cuentaId: u.uid, nueva: false };
  }
  const cid = u.uid;
  await setDoc(doc(db, "cuentas", cid), {
    nombre: u.displayName || email,
    propietario: u.uid,
    miembros: [u.uid],
    emailsMiembros: [email],
    correos: { [u.uid]: email },
    creada: serverTimestamp(),
    plan: await esAdmin() ? "activo" : "pendiente"
  });
  await setDoc(ref, { cuentaId: cid, email, desde: serverTimestamp() });
  fijarCuenta(cid);
  const migrados = DEMO ? false : await migrarDatosAntiguos(cid).catch((e) => {
    console.warn("migraci\xF3n", e);
    return false;
  });
  return { cuentaId: cid, nueva: !migrados };
}
var COLECCIONES = ["pisos", "invitaciones", "contratos", "facturas"];
var SUB = { invitaciones: ["respuestas"], contratos: ["firmas", "estados"] };
async function migrarDatosAntiguos(cid) {
  let viejo;
  try {
    viejo = await getDoc(doc(db, "ajustes", "general"));
  } catch {
    return false;
  }
  if (!viejo.exists() || viejo.data().migradoA) return false;
  await setDoc(doc(db, "cuentas", cid, "ajustes", "general"), { ...viejo.data(), modoDrive: "completo" });
  for (const col of COLECCIONES) {
    const s = await getDocs(collection(db, col));
    for (const d of s.docs) {
      await setDoc(doc(db, "cuentas", cid, col, d.id), d.data());
      if (col === "invitaciones") await setDoc(doc(db, "enlaces", d.id), { cuentaId: cid });
      for (const sub of SUB[col] || []) {
        const ss = await getDocs(collection(db, col, d.id, sub));
        for (const x of ss.docs) await setDoc(doc(db, "cuentas", cid, col, d.id, sub, x.id), x.data());
      }
    }
  }
  await updateDoc(doc(db, "ajustes", "general"), { migradoA: cid, migradoEl: serverTimestamp() });
  return true;
}
async function leerCuenta() {
  const s = await getDoc(doc(db, "cuentas", CID));
  return s.exists() ? s.data() : null;
}
async function invitarMiembro(email) {
  email = email.trim().toLowerCase();
  await updateDoc(doc(db, "cuentas", CID), { emailsMiembros: arrayUnion(email) });
  await setDoc(doc(db, "accesos", email), { cuentaId: CID, invitadoEl: serverTimestamp() });
}
async function quitarMiembro(email, cuenta) {
  email = email.trim().toLowerCase();
  const correos = { ...cuenta.correos || {} };
  const uid = Object.keys(correos).find((k) => correos[k] === email);
  if (uid) delete correos[uid];
  await updateDoc(doc(db, "cuentas", CID), {
    emailsMiembros: (cuenta.emailsMiembros || []).filter((e) => e !== email),
    miembros: (cuenta.miembros || []).filter((m) => m !== uid),
    correos
  });
  await deleteDoc(doc(db, "accesos", email)).catch(() => {
  });
}
async function cuentaDeEnlace(token2) {
  const s = await getDoc(doc(db, "enlaces", token2)).catch(() => null);
  return s?.exists() ? s.data().cuentaId : null;
}
async function solicitarAcceso(mensaje) {
  await updateDoc(doc(db, "cuentas", CID), { solicitud: serverTimestamp(), mensajeSolicitud: String(mensaje || "").slice(0, 500) });
}
async function listarCuentas() {
  const s = await getDocs(collection(db, "cuentas"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function activarCuenta(id, meses) {
  const hasta = /* @__PURE__ */ new Date();
  hasta.setMonth(hasta.getMonth() + meses);
  await updateDoc(doc(db, "cuentas", id), { plan: "activo", activoHasta: hasta, activadaEl: serverTimestamp() });
}
async function desactivarCuenta(id) {
  await updateDoc(doc(db, "cuentas", id), { plan: "pendiente" });
}

// js/legal.js
var T = () => ({
  app: CONFIG.nombreApp || "Contratos de alquiler",
  nombre: CONFIG.titular?.nombre || "[NOMBRE O RAZ\xD3N SOCIAL DEL TITULAR]",
  nif: CONFIG.titular?.nif || "[NIF]",
  domicilio: CONFIG.titular?.domicilio || "[DOMICILIO]",
  email: CONFIG.titular?.email || "[EMAIL DE CONTACTO]",
  web: location.origin + location.pathname,
  fecha: CONFIG.titular?.fechaTextos || "octubre de 2026"
});
var h = (t) => `<h2 style="font-size:19px;margin-top:8px">${t}</h2>`;
var p = (t) => `<p style="margin:0;line-height:1.6">${t}</p>`;
var ul = (xs) => `<ul style="margin:0;padding-left:20px;line-height:1.6;display:flex;flex-direction:column;gap:4px">${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
var LEGALES = {
  aviso: "Aviso legal",
  privacidad: "Pol\xEDtica de privacidad",
  terminos: "Condiciones de uso",
  encargo: "Contrato de encargo del tratamiento",
  inquilinos: "Informaci\xF3n para inquilinos y avalistas"
};
function TEXTO_CONSENTIMIENTO(arrendadores) {
  return `He le\xEDdo la <a href="#/legal/inquilinos" target="_blank" rel="noopener">informaci\xF3n sobre protecci\xF3n de datos</a>. Mis datos y los de mis avalistas los trata ${arrendadores || "el arrendador"} para preparar, firmar y gestionar el contrato de alquiler. Declaro que mis avalistas conocen y aceptan que facilito sus datos con esta finalidad.`;
}
function paginaLegal(slug2) {
  const t = T();
  switch (slug2) {
    case "aviso":
      return [
        p(`En cumplimiento del art\xEDculo 10 de la Ley 34/2002, de servicios de la sociedad de la informaci\xF3n y de comercio electr\xF3nico (LSSI-CE), se informa de que el titular de ${t.app}, accesible en ${t.web}, es ${t.nombre}, con NIF ${t.nif} y domicilio en ${t.domicilio}. Contacto: ${t.email}.`),
        h("Objeto"),
        p(`${t.app} es una herramienta para que propietarios de viviendas recojan los datos de sus inquilinos, generen contratos de arrendamiento a partir de modelos, los firmen electr\xF3nicamente y archiven contratos y facturas en su propio Google Drive.`),
        h("Responsabilidad"),
        p(`Los modelos de contrato son plantillas orientativas basadas en la Ley 29/1994 de Arrendamientos Urbanos. No constituyen asesoramiento jur\xEDdico. Cada propietario es responsable de revisar el contenido de sus contratos, adaptarlo a su caso y a la normativa de su comunidad aut\xF3noma, y de los datos que introduce.`),
        h("Propiedad intelectual"),
        p(`El c\xF3digo, el dise\xF1o y los textos de la aplicaci\xF3n pertenecen a su titular o se usan con licencia. Los contratos generados pertenecen a quienes los suscriben.`),
        h("Legislaci\xF3n aplicable"),
        p(`Este aviso se rige por la legislaci\xF3n espa\xF1ola.`)
      ].join("");
    case "privacidad":
      return [
        p(`\xDAltima actualizaci\xF3n: ${t.fecha}.`),
        h("1. Qui\xE9n trata tus datos"),
        p(`Hay dos situaciones distintas:`),
        ul([
          `<b>Si eres usuario de la app (propietario):</b> el responsable de tus datos de cuenta es ${t.nombre} (NIF ${t.nif}, ${t.domicilio}, ${t.email}).`,
          `<b>Si eres inquilino o avalista:</b> el responsable es el propietario que te ha enviado el enlace. ${t.nombre} act\xFAa solo como encargado del tratamiento por cuenta de ese propietario. Consulta la <a href="#/legal/inquilinos">informaci\xF3n para inquilinos</a>.`
        ]),
        h("2. Qu\xE9 datos tratamos"),
        ul([
          `Datos de la cuenta: nombre y email de tu cuenta de Google y los miembros de tu equipo.`,
          `Datos que introduces para los contratos: nombre, documento de identidad, domicilio, IBAN y datos de tus viviendas.`,
          `Datos de inquilinos y avalistas: nombre, tipo y n\xFAmero de documento, domicilio, tel\xE9fono, email, parentesco, firma manuscrita digitalizada, fecha y hora de firma e informaci\xF3n t\xE9cnica del dispositivo con el que se firma.`,
          `Registro de facturas: proveedor, concepto, fecha e importe. Los archivos se guardan en tu Google Drive, no en nuestros servidores.`
        ]),
        h("3. Para qu\xE9 y con qu\xE9 base legal"),
        ul([
          `Prestarte el servicio (art. 6.1.b RGPD: ejecuci\xF3n del contrato de uso de la app).`,
          `Atender tus solicitudes y comunicaciones del servicio (art. 6.1.b RGPD).`,
          `Cumplir obligaciones legales, por ejemplo fiscales si hay facturaci\xF3n (art. 6.1.c RGPD).`,
          `Seguridad e integridad del servicio y prevenci\xF3n del fraude (art. 6.1.f RGPD: inter\xE9s leg\xEDtimo).`
        ]),
        p(`No usamos tus datos ni los de tus inquilinos para publicidad, no elaboramos perfiles y no vendemos datos a terceros.`),
        h("4. D\xF3nde se guardan y qui\xE9n m\xE1s interviene"),
        ul([
          `Google Cloud / Firebase (Google Ireland Ltd.): base de datos e inicio de sesi\xF3n. La base de datos se aloja en la regi\xF3n europe-southwest1 (Madrid).`,
          `Google Drive de cada propietario: los PDF de contratos y las facturas se guardan en el Drive del propio usuario, bajo su control.`,
          `GitHub Pages (GitHub, Inc.): alojamiento de la web. Puede registrar direcciones IP por motivos t\xE9cnicos y de seguridad.`
        ]),
        p(`Algunos de estos proveedores pertenecen a grupos con sede en EE. UU. Las transferencias internacionales que puedan producirse se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en cl\xE1usulas contractuales tipo de la Comisi\xF3n Europea.`),
        h("5. Cu\xE1nto tiempo"),
        p(`Los datos de tu cuenta se conservan mientras la mantengas. Puedes borrar tu cuenta y todos sus datos desde Ajustes. Los datos de inquilinos se conservan el tiempo que decida su propietario. Recomendamos borrarlos al terminar el contrato, una vez pasados los plazos legales de prescripci\xF3n de las acciones derivadas del arrendamiento. Tras borrar una cuenta, las copias de seguridad t\xE9cnicas del proveedor se eliminan en sus plazos ordinarios.`),
        h("6. Tus derechos"),
        p(`Puedes ejercer los derechos de acceso, rectificaci\xF3n, supresi\xF3n, oposici\xF3n, limitaci\xF3n y portabilidad escribiendo a ${t.email}. Desde Ajustes puedes adem\xE1s descargar una copia de tus datos y borrar tu cuenta. Si eres inquilino, dir\xEDgete primero a tu arrendador, que es el responsable. Si consideras que no se han atendido tus derechos, puedes reclamar ante la Agencia Espa\xF1ola de Protecci\xF3n de Datos (www.aepd.es).`),
        h("7. Almacenamiento en el navegador"),
        p(`La app usa almacenamiento t\xE9cnico del navegador (sesi\xF3n de inicio de Google y borradores del formulario del inquilino). Es imprescindible para el funcionamiento y no se usa para anal\xEDtica ni publicidad, por lo que no requiere consentimiento.`),
        h("8. Seguridad"),
        p(`El acceso a los datos de cada cuenta est\xE1 restringido a sus miembros mediante reglas de seguridad de la base de datos. Cada inquilino accede solo a su propio formulario y contrato mediante un enlace \xFAnico. Las comunicaciones van cifradas (HTTPS).`)
      ].join("");
    case "terminos":
      return [
        p(`\xDAltima actualizaci\xF3n: ${t.fecha}. Al crear una cuenta en ${t.app} aceptas estas condiciones.`),
        h("1. El servicio"),
        p(`${t.app} permite gestionar pisos, invitar a inquilinos a rellenar sus datos, generar contratos a partir de modelos, firmarlos electr\xF3nicamente y archivar documentos en tu Google Drive.`),
        h("2. Tu cuenta"),
        p(`Accedes con tu cuenta de Google. Eres responsable de su uso y de los miembros que a\xF1adas a tu equipo, que tendr\xE1n acceso a todos los datos de la cuenta.`),
        h("3. Tus obligaciones"),
        ul([
          `Introducir datos veraces y tener base legal para tratar los datos de tus inquilinos y avalistas: normalmente, la preparaci\xF3n y ejecuci\xF3n del contrato de arrendamiento.`,
          `Informar a tus inquilinos de que usas esta herramienta. La app les muestra la informaci\xF3n b\xE1sica antes de enviar sus datos.`,
          `Revisar cada contrato antes de enviarlo a firmar. Los modelos son orientativos y no sustituyen el asesoramiento jur\xEDdico.`,
          `Cumplir la normativa aplicable a tus arrendamientos, como el dep\xF3sito de la fianza en tu comunidad aut\xF3noma o las obligaciones fiscales.`
        ]),
        h("4. Firma electr\xF3nica"),
        p(`La firma en la app es una firma electr\xF3nica simple (Reglamento (UE) 910/2014, eIDAS). Registra la firma manuscrita digitalizada, la aceptaci\xF3n expresa, la fecha y hora y una huella criptogr\xE1fica del texto firmado. Es v\xE1lida para contratos de arrendamiento, pero su valor como prueba lo decide, en su caso, un juez. Para operaciones que lo requieran, usa firma electr\xF3nica avanzada o cualificada.`),
        h("5. Protecci\xF3n de datos"),
        p(`Respecto a los datos de tus inquilinos, t\xFA eres el responsable del tratamiento y ${t.nombre} act\xFAa como encargado seg\xFAn el <a href="#/legal/encargo">contrato de encargo del tratamiento</a>, que aceptas junto con estas condiciones.`),
        h("6. Precio"),
        p(`Las condiciones econ\xF3micas, si las hay, se informar\xE1n antes de contratar. Durante el periodo de prueba el servicio es gratuito.`),
        h("7. Disponibilidad y responsabilidad"),
        p(`Ponemos los medios razonables para que el servicio funcione, pero no garantizamos que est\xE9 libre de interrupciones. ${t.nombre} no responde del contenido de los contratos que generes ni de su adecuaci\xF3n a tu caso, ni de la p\xE9rdida de archivos guardados en tu Google Drive. Te recomendamos conservar copias.`),
        h("8. Baja"),
        p(`Puedes borrar tu cuenta en cualquier momento desde Ajustes. Podemos suspender cuentas que hagan un uso il\xEDcito del servicio.`),
        h("9. Ley y jurisdicci\xF3n"),
        p(`Se aplica la ley espa\xF1ola. Si eres consumidor, son competentes los tribunales de tu domicilio.`)
      ].join("");
    case "encargo":
      return [
        p(`Contrato de encargo del tratamiento conforme al art\xEDculo 28 del Reglamento (UE) 2016/679 (RGPD), entre el usuario de ${t.app} (el <b>Responsable</b>) y ${t.nombre}, NIF ${t.nif} (el <b>Encargado</b>). Se acepta al crear la cuenta.`),
        h("1. Objeto"),
        p(`El Encargado trata por cuenta del Responsable los datos personales de sus inquilinos, avalistas y dem\xE1s personas que figuren en los contratos, con la \xFAnica finalidad de prestar el servicio de ${t.app}: recogida de datos, generaci\xF3n de contratos, firma electr\xF3nica y archivo.`),
        h("2. Datos y personas afectadas"),
        p(`Identificativos (nombre, documento de identidad, domicilio, tel\xE9fono, email), firma manuscrita digitalizada, datos del contrato (renta, fianza, fechas) y datos t\xE9cnicos de firma. Afecta a inquilinos, avalistas y copropietarios.`),
        h("3. Duraci\xF3n"),
        p(`Mientras el Responsable mantenga su cuenta. Al darse de baja, el Encargado suprimir\xE1 los datos de la base de datos. Los documentos del Google Drive del Responsable quedan bajo su control.`),
        h("4. Obligaciones del Encargado"),
        ul([
          `Tratar los datos solo seg\xFAn las instrucciones documentadas del Responsable, que son las propias del funcionamiento de la app.`,
          `Garantizar la confidencialidad de las personas autorizadas a tratarlos.`,
          `Aplicar medidas de seguridad adecuadas (art. 32 RGPD): control de acceso por cuenta, enlaces \xFAnicos, cifrado en tr\xE1nsito y alojamiento en la UE.`,
          `No subcontratar sin autorizaci\xF3n. El Responsable autoriza a Google (Firebase/Google Cloud) y GitHub (alojamiento web) como subencargados. Cualquier cambio se informar\xE1 con antelaci\xF3n para que pueda oponerse.`,
          `Ayudar al Responsable a atender los derechos de los interesados y a cumplir sus obligaciones de seguridad, notificaci\xF3n de brechas y evaluaciones de impacto.`,
          `Notificar sin dilaci\xF3n indebida, y en todo caso antes de 48 horas, cualquier violaci\xF3n de seguridad de la que tenga conocimiento.`,
          `Suprimir o devolver los datos al terminar el servicio, salvo obligaci\xF3n legal de conservarlos.`,
          `Poner a disposici\xF3n del Responsable la informaci\xF3n necesaria para demostrar el cumplimiento.`
        ]),
        h("5. Obligaciones del Responsable"),
        ul([
          `Disponer de base legal para el tratamiento y facilitar a los interesados la informaci\xF3n del art\xEDculo 13 RGPD (la app la muestra antes de enviar los datos).`,
          `Velar por el cumplimiento del RGPD y supervisar el tratamiento.`
        ])
      ].join("");
    case "inquilinos":
      return [
        p(`Esta informaci\xF3n se te da antes de enviar tus datos a trav\xE9s de ${t.app}, conforme al art\xEDculo 13 del RGPD.`),
        h("Responsable"),
        p(`El propietario (arrendador) que te ha enviado el enlace. Sus datos de identificaci\xF3n y contacto figuran en el contrato. ${t.nombre} (${t.email}) proporciona la herramienta y act\xFAa como encargado del tratamiento.`),
        h("Finalidad y base legal"),
        p(`Preparar, firmar y gestionar tu contrato de arrendamiento y su fianza. La base legal es la aplicaci\xF3n de medidas precontractuales y la ejecuci\xF3n del contrato (art. 6.1.b RGPD). Para los avalistas, el inter\xE9s leg\xEDtimo del arrendador en garantizar el contrato (art. 6.1.f RGPD). Quien facilita los datos de sus avalistas declara haberles informado.`),
        h("Datos"),
        p(`Nombre, documento de identidad, domicilio, tel\xE9fono, email, parentesco de los avalistas, firma manuscrita digitalizada, fecha y hora de firma y datos t\xE9cnicos del dispositivo con el que firmas.`),
        h("Destinatarios"),
        p(`El arrendador y su equipo. Los proveedores t\xE9cnicos del servicio (Google, con alojamiento en la UE). Los organismos p\xFAblicos cuando la ley lo exija, como el registro de fianzas de la comunidad aut\xF3noma o la Administraci\xF3n tributaria.`),
        h("Conservaci\xF3n"),
        p(`Durante la vigencia del contrato y, despu\xE9s, durante los plazos legales de prescripci\xF3n de las acciones derivadas del arrendamiento.`),
        h("Derechos"),
        p(`Puedes pedir al arrendador el acceso, la rectificaci\xF3n, la supresi\xF3n, la oposici\xF3n, la limitaci\xF3n y la portabilidad de tus datos. Tambi\xE9n puedes reclamar ante la Agencia Espa\xF1ola de Protecci\xF3n de Datos (www.aepd.es).`)
      ].join("");
  }
  return p("P\xE1gina no encontrada.");
}

// js/app.js
var app = document.getElementById("app");
var usuario = null;
var authListo = false;
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var $ = (sel, root = document) => root.querySelector(sel);
var $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
var hoyISO = () => (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE");
var cuentaLista = { uid: null, ok: false, nueva: false };
async function prepararCuenta() {
  if (!usuario) return false;
  if (cuentaLista.uid === usuario.uid) return cuentaLista.ok;
  try {
    const r = await resolverCuenta(usuario);
    fijarCuenta(r.cuentaId);
    cuentaLista = { uid: usuario.uid, ok: true, nueva: r.nueva };
  } catch (e) {
    console.error(e);
    cuentaLista = { uid: usuario.uid, ok: false, error: e.message };
  }
  return cuentaLista.ok;
}
function saludoDe(ajustes) {
  const nombres = (ajustes.propietarios || []).map((p2) => (p2.apodo || p2.nombre || "").trim().split(/\s+/)[0]).filter(Boolean);
  if (!nombres.length) return usuario?.displayName?.split(" ")[0] || "";
  return nombres.length === 1 ? nombres[0] : nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}
function aviso(msg, error = false) {
  const el = document.getElementById("aviso");
  el.textContent = msg;
  el.className = "aviso visible" + (error ? " error" : "");
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => el.className = "aviso", error ? 5e3 : 2800);
}
function preguntar(msg) {
  return DEMO ? true : window.confirm(msg);
}
function bajar(bytes, nombre) {
  if (DEMO) return aviso(`En la app real aqu\xED se guardar\xEDa \xAB${nombre}\xBB`);
  descargar(bytes, nombre);
}
function nuevoToken() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(22));
  return [...r].map((b) => abc[b % abc.length]).join("");
}
function slug(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "");
}
function cursoDe(inv) {
  const y = parseInt((inv.fechaInicio || hoyISO()).slice(0, 4), 10);
  return inv.plantilla === "larga_duracion" ? String(y) : `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}
function fechaCorta(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}
var PLANTILLAS = {
  temporada_habitacion: "Temporada \xB7 por habitaciones",
  temporada_piso: "Temporada \xB7 piso entero",
  habitacion: "Vivienda habitual \xB7 por habitaciones",
  larga_duracion: "Vivienda habitual \xB7 piso entero",
  piso_entero: "Piso entero (estudiantes)"
};
var TIPO_DE = {
  temporada_habitacion: ["temporada", "habitacion"],
  temporada_piso: ["temporada", "piso"],
  habitacion: ["habitual", "habitacion"],
  larga_duracion: ["habitual", "piso"],
  piso_entero: ["habitual", "piso"]
};
function plantillaDe(dur, mod) {
  if (dur === "temporada") return mod === "habitacion" ? "temporada_habitacion" : "temporada_piso";
  return mod === "habitacion" ? "habitacion" : "larga_duracion";
}
var INFO_TIPOS = `<div class="tarjeta info-tipos" style="gap:8px;font-size:13.5px;line-height:1.5">
  <div><b>Temporada.</b> Para estancias limitadas con un motivo concreto (estudios, un trabajo temporal, una obra en su casa\u2026), mientras el inquilino mantiene su vivienda habitual en otro sitio. Dura lo que pact\xE9is y termina en la fecha fijada, sin pr\xF3rrogas obligatorias. Fianza de dos mensualidades. El motivo tiene que constar en el contrato.</div>
  <div><b>Vivienda habitual.</b> El inquilino vive ah\xED de forma permanente. Se rige por la Ley de Arrendamientos Urbanos: aunque firm\xE9is un a\xF1o, puede quedarse hasta 5 a\xF1os (7 si el propietario es una empresa) y puede irse a partir de los 6 meses avisando con 30 d\xEDas. Fianza de una mensualidad y subida anual limitada al \xEDndice oficial (IRAV).</div>
  <div><b>Por habitaciones.</b> Un contrato por cada inquilino y su habitaci\xF3n, con uso compartido de cocina, sal\xF3n y ba\xF1os. Cada uno responde solo de lo suyo.</div>
  <div><b>Piso entero.</b> Un \xFAnico contrato con todos los inquilinos, que responden juntos (solidariamente) de toda la renta.</div>
  <div class="ayuda">Si en la pr\xE1ctica el inquilino vive ah\xED todo el a\xF1o, un juez puede considerar que es vivienda habitual aunque el contrato diga temporada.</div>
</div>`;
function selectorTipo(pl) {
  const [dur, mod] = TIPO_DE[pl] || TIPO_DE.habitacion;
  return `<div class="fila-info"><span class="eti-campo" style="margin:0">Tipo de contrato</span>
      <button type="button" class="btn-info" data-info-tipos aria-label="Diferencias entre los tipos de contrato">i</button></div>
    <div data-info-caja style="display:none">${INFO_TIPOS}</div>
    ${segmento("tipoDuracion", [["temporada", "Temporada"], ["habitual", "Vivienda habitual"]], dur)}
    ${segmento("tipoModalidad", [["habitacion", "Por habitaciones"], ["piso", "Piso entero"]], mod)}
    <input type="hidden" name="plantilla" value="${esc(pl)}">
    <button type="button" class="btn secundario" data-modelo-pdf style="min-height:40px;align-self:flex-start">Ver el modelo en PDF</button>`;
}
function activarSelectorTipo(root, datosModelo2) {
  const dur = $("[name=tipoDuracion]", root), mod = $("[name=tipoModalidad]", root), pl = $("[name=plantilla]", root);
  const cambiar = () => {
    pl.value = plantillaDe(dur.value, mod.value);
    pl.dispatchEvent(new Event("change", { bubbles: true }));
  };
  dur.addEventListener("change", cambiar);
  mod.addEventListener("change", cambiar);
  $("[data-info-tipos]", root).onclick = () => {
    const c = $("[data-info-caja]", root);
    c.style.display = c.style.display === "none" ? "" : "none";
  };
  $("[data-modelo-pdf]", root).onclick = async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      const datos = await datosModelo2(pl.value);
      const bytes = await construirPdf(generarContrato(datos), null);
      bajar(bytes, `Modelo_${String(PLANTILLAS[pl.value] || pl.value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_")}.pdf`);
    } catch (err) {
      aviso("No se pudo crear el modelo: " + err.message, true);
    }
    b.disabled = false;
  };
}
async function datosModelo(pl, extra = {}) {
  const a = await leerAjustes();
  const props = (a.propietarios || []).filter((p2) => p2.nombre);
  return {
    plantilla: pl,
    ciudadFirma: extra.ciudad || a.ciudadFirma || "",
    fechaFirma: "",
    condiciones: a.condiciones || {},
    cambiosModelo: a.modelos?.[pl] || [],
    propietarios: props.length ? props : [{ tratamiento: "D.", nombre: "[Nombre del propietario]", tipoDoc: "DNI", numDoc: "" }],
    domicilioPropietarios: a.domicilio || "______________",
    iban: a.iban || "[IBAN]",
    piso: { nombre: extra.nombre || "[Piso]", direccion: extra.direccion || "______________", descripcion: extra.descripcion || "", numHabitaciones: extra.numHabitaciones || 0 },
    habitacion: porHabitacion(pl) ? "1" : "",
    inquilinos: [{
      tratamiento: "D.",
      nombre: "[Nombre del inquilino]",
      tipoDoc: "DNI",
      numDoc: "",
      domicilio: "",
      avales: [{ tratamiento: "D.", nombre: "[Nombre del avalista]", tipoDoc: "DNI", numDoc: "", parentesco: "" }]
    }],
    renta: extra.renta || "",
    fianza: extra.renta ? "" : "_",
    fechaInicio: "",
    fechaFin: "",
    fechaEntrega: "",
    motivoTemporada: extra.motivoTemporada || "",
    luz: extra.luz,
    agua: extra.agua,
    wifi: extra.wifi,
    gastos: extra.gastos || {},
    conFotos: false
  };
}
function resumenSuministros(x) {
  const imp = (s) => `cuota ${euros(s.cuota)}${s.tope ? ` con tope ${euros(s.tope)}` : ""}`;
  const t = (s) => !s || s.opcion === "incluida" ? "incluida" : s.opcion === "titularidad" ? "a nombre del inquilino" : imp(s);
  const l = x.luz || { opcion: "D" };
  const luz = l.opcion === "A" ? "a nombre del inquilino" : l.opcion === "D" ? `incluida${l.tope ? ` (tope ${euros(l.tope)})` : ""}` : imp(l);
  return `Luz ${luz} \xB7 agua ${t(x.agua)} \xB7 wifi ${t(x.wifi)}`;
}
var LUZ = {
  A: { t: "Cambio de titularidad", d: "El inquilino pone la luz a su nombre" },
  B: { t: "Cuota fija con tope", d: "Paga una cuota fija; el exceso del tope aparte" },
  C: { t: "Cuota fija + regularizaci\xF3n", d: "Se ajusta con las facturas reales al final" },
  D: { t: "Incluida en el precio", d: "La luz va en la renta (tope opcional)" }
};
var LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";
function normalizarDoc(n) {
  return String(n || "").toUpperCase().replace(/[\s.\-]/g, "");
}
function validarDoc(tipo, numero) {
  const n = normalizarDoc(numero);
  if (!n) return "Falta el n\xFAmero de documento";
  if (tipo === "DNI") {
    if (!/^\d{8}[A-Z]$/.test(n)) return "El DNI debe tener 8 n\xFAmeros y una letra";
    if (LETRAS[parseInt(n.slice(0, 8), 10) % 23] !== n[8]) return "La letra del DNI no coincide, rev\xEDsalo";
  }
  if (tipo === "NIE") {
    if (!/^[XYZ]\d{7}[A-Z]$/.test(n)) return "El NIE empieza por X, Y o Z, seguido de 7 n\xFAmeros y una letra";
    const base = "XYZ".indexOf(n[0]) + n.slice(1, 8);
    if (LETRAS[parseInt(base, 10) % 23] !== n[8]) return "La letra del NIE no coincide, rev\xEDsalo";
  }
  if ((tipo === "Pasaporte" || tipo === "Otro") && n.length < 5) return "El n\xFAmero parece demasiado corto";
  return "";
}
var ICO = {
  volver: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  mas: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  inicio: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  pisos: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/></svg>',
  contratos: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  ajustes: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  facturas: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  camara: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  enlace: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
};
function barra(activa) {
  const item = (href, k, txt) => `<a href="${href}" class="${activa === k ? "on" : ""}">${ICO[k]}${txt}</a>`;
  return `<div class="barra"><div class="marca-lateral">${esc(CONFIG.nombreApp || "Contratos")}</div><nav>${item("#/", "inicio", "Inicio")}${item("#/pisos", "pisos", "Pisos")}${item("#/contratos", "contratos", "Contratos")}${item("#/facturas", "facturas", "Facturas")}${item("#/ajustes", "ajustes", "Ajustes")}</nav></div>`;
}
function cabVolver(titulo, sub = "", href = "#/") {
  return `<div class="cab-volver"><a class="btn-icono" href="${href}" aria-label="Volver">${ICO.volver}</a>
    <div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}<h1>${esc(titulo)}</h1></div></div>`;
}
function pintar(html, activa) {
  const banda = DEMO ? `<div style="background:#EADFD1;color:#5A4A42;font-size:12px;text-align:center;padding:8px 12px">Demo con datos inventados \xB7 <a href="#/">panel</a> \xB7 <a href="#" id="reiniciar-demo">reiniciar</a> \xB7 <a href="${esc(CONFIG.urlApp || location.pathname)}">salir de la demo</a></div>` : "";
  app.classList.remove("ancho");
  app.innerHTML = banda + html + (activa !== void 0 ? barra(activa) : "");
  if (DEMO) $("#reiniciar-demo").onclick = (e) => {
    e.preventDefault();
    if (preguntar("\xBFBorrar los datos de la demo y empezar de nuevo?")) signOut(auth);
  };
  window.scrollTo(0, 0);
}
async function leerAjustes() {
  const s = await getDoc(D("ajustes", "general"));
  const a = s.exists() ? s.data() : {
    propietarios: [{ tratamiento: "", nombre: usuario?.displayName || "", tipoDoc: "DNI", numDoc: "" }],
    domicilio: "",
    iban: "",
    ciudadFirma: "",
    modoDrive: "propia",
    condiciones: {}
  };
  configurar(a.modoDrive || "propia");
  return a;
}
function ajustesCompletos(a) {
  return !!(a.propietarios?.length && a.propietarios.every((p2) => p2.nombre && p2.numDoc) && a.iban && a.domicilio);
}
async function raizDrive(ajustes) {
  configurar(ajustes.modoDrive || "propia");
  if (ajustes.carpetaDriveId) return ajustes.carpetaDriveId;
  if ((ajustes.modoDrive || "propia") !== "propia") return null;
  const r = await crearCarpeta(CONFIG.carpetaRaiz || "Alquileres");
  ajustes.carpetaDriveId = r.id;
  ajustes.carpetaDriveNombre = r.name;
  await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
  return r.id;
}
async function listar(col, orden = "creada") {
  const s = await getDocs(query(C(col), orderBy(orden, "desc")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function listarPisos() {
  const s = await getDocs(query(C("pisos"), orderBy("nombre")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function respuestasDe(invId) {
  const s = await getDocs(query(C("invitaciones", invId, "respuestas"), orderBy("enviada")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function campo(etq, name, valor = "", extra = "") {
  return `<label class="campo">${esc(etq)}<input name="${name}" value="${esc(valor)}" ${extra}><span class="error" data-error="${name}"></span></label>`;
}
function segmento(name, opciones, valor) {
  return `<div class="segmento" data-segmento="${name}">${opciones.map(([v, t]) => `<button type="button" data-valor="${esc(v)}" class="${v === valor ? "on" : ""}">${esc(t)}</button>`).join("")}</div>
    <input type="hidden" name="${name}" value="${esc(valor)}">`;
}
function selectDoc(name, valor = "DNI") {
  return `<label class="campo">Documento<select name="${name}">${["DNI", "NIE", "Pasaporte", "Otro"].map((t) => `<option ${t === valor ? "selected" : ""}>${t}</option>`).join("")}</select></label>`;
}
function camposPersona(pre, p2 = {}, { contacto = false, domicilio = false, parentesco = false } = {}) {
  return `
    <div class="eti-campo" style="text-transform:none;letter-spacing:0;font-weight:400">Tratamiento en el contrato</div>
    ${segmento(`${pre}tratamiento`, [["D.", "D."], ["D\xF1a.", "D\xF1a."]], p2.tratamiento || "")}
    ${parentesco ? campo("Parentesco (madre, padre, hermano\u2026)", `${pre}parentesco`, p2.parentesco || "") : ""}
    ${campo("Nombre y apellidos", `${pre}nombre`, p2.nombre, 'autocomplete="off" placeholder="Como aparece en el documento"')}
    <div class="rejilla doc">${selectDoc(`${pre}tipoDoc`, p2.tipoDoc)}${campo("N\xFAmero", `${pre}numDoc`, p2.numDoc, 'autocapitalize="characters" placeholder="12345678A"')}</div>
    ${domicilio ? campo("Domicilio habitual", `${pre}domicilio`, p2.domicilio, 'placeholder="Calle, n\xFAmero, piso, c\xF3digo postal y ciudad"') : ""}
    ${contacto ? `<div class="rejilla">${campo("Tel\xE9fono", `${pre}telefono`, p2.telefono, 'type="tel" placeholder="600 000 000"')}${campo("Email", `${pre}email`, p2.email, 'type="email" placeholder="tu@email.com"')}</div>` : ""}`;
}
function leerPersona(root, pre) {
  const v = (n) => (root.querySelector(`[name="${pre}${n}"]`)?.value ?? "").trim();
  return {
    tratamiento: v("tratamiento"),
    nombre: v("nombre"),
    tipoDoc: v("tipoDoc") || "DNI",
    numDoc: normalizarDoc(v("numDoc")),
    domicilio: v("domicilio"),
    telefono: v("telefono"),
    email: v("email"),
    parentesco: v("parentesco")
  };
}
function validarPersona(root, pre, p2, { domicilio = false } = {}) {
  const errores = {};
  if (!p2.tratamiento) errores.tratamiento = "Elige D. o D\xF1a.";
  if (p2.nombre.split(/\s+/).length < 2) errores.nombre = "Escribe nombre y apellidos";
  const e = validarDoc(p2.tipoDoc, p2.numDoc);
  if (e) errores.numDoc = e;
  if (domicilio && p2.domicilio.length < 8) errores.domicilio = "Escribe el domicilio completo";
  $$(`[data-error^="${pre}"]`, root).forEach((el) => el.textContent = "");
  Object.entries(errores).forEach(([k, msg]) => {
    const el = root.querySelector(`[data-error="${pre}${k}"]`);
    if (el) el.textContent = msg;
    else aviso(msg, true);
  });
  return Object.keys(errores).length === 0;
}
function activarSegmentos(root = app) {
  $$("[data-segmento]", root).forEach((seg) => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-valor]");
      if (!b) return;
      $$("button", seg).forEach((x) => x.classList.toggle("on", x === b));
      const input = seg.nextElementSibling;
      input.value = b.dataset.valor;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}
async function vistaPanel() {
  const ajustesPanel = await leerAjustes();
  if (!ajustesCompletos(ajustesPanel)) {
    location.hash = "#/bienvenida";
    return;
  }
  const [pisos, invs, contratos] = await Promise.all([listarPisos(), listar("invitaciones"), listar("contratos")]);
  const abiertas = invs.filter((i) => i.estado === "abierta");
  await Promise.all(abiertas.map(async (i) => {
    i.respuestas = (await respuestasDe(i.id)).length;
  }));
  const firmados = contratos.filter((c) => c.estado === "firmado");
  const enFirma = contratos.filter((c) => c.estado === "firmando");
  const copias = copiasPendientes(contratos);
  await Promise.all(enFirma.map(async (c) => {
    c.nFirmas = Object.keys(await firmasDe(c.id)).length;
  }));
  const hoy = /* @__PURE__ */ new Date();
  const fecha = `${["Domingo", "Lunes", "Martes", "Mi\xE9rcoles", "Jueves", "Viernes", "S\xE1bado"][hoy.getDay()]}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;
  const estadoPiso = (p2) => {
    const ab = abiertas.filter((i) => i.pisoId === p2.id).length;
    const porFirmar = contratos.filter((c) => c.pisoId === p2.id && c.estado !== "firmado").length;
    if (ab) return `<span class="chip espera">${ab} esperando datos</span>`;
    if (porFirmar) return `<span class="chip firma">${porFirmar} por firmar</span>`;
    return `<span class="chip ok">Al d\xEDa</span>`;
  };
  pintar(`
    <div class="cab"><div class="fecha">${fecha}</div><h1>Hola${saludoDe(ajustesPanel) ? ", " + esc(saludoDe(ajustesPanel)) : ""}</h1></div>
    <div class="stats">
      <div class="stat"><b>${pisos.length}</b><span>Pisos</span></div>
      <div class="stat"><b>${abiertas.length}</b><span>Pendientes</span></div>
      <div class="stat"><b>${firmados.length}</b><span>Firmados</span></div>
    </div>
    ${abiertas.length ? `<div class="titulo-seccion"><h2>Esperando datos</h2></div>
      <div class="seccion">${abiertas.map((i) => `
        <a class="tarjeta" href="#/inv/${i.id}"><div class="fila"><div>
          <div class="nombre">${esc(i.pisoNombre)}${i.habitacion ? ` \xB7 Hab. ${esc(i.habitacion)}` : ""}</div>
          <div class="meta">${PLANTILLAS[i.plantilla]} \xB7 creada el ${fechaCorta(i.creada)}</div></div>
          <span class="chip ${i.respuestas ? "ok" : "espera"}">${i.respuestas || 0}${i.plazas ? "/" + i.plazas : ""} recibidos</span></div></a>`).join("")}</div>` : ""}
    ${copias.length ? `<div class="seccion"><div class="tarjeta" style="background:var(--salvia-claro)">
        <div class="nombre" style="color:#3F4D37">Nuevo a\xF1o de renta</div>
        <div class="meta" style="color:#3F4D37">${copias.map((x) => `${esc(x.c.pisoNombre)} \u2192 Renta ${x.faltan.join(", ")}`).join(" \xB7 ")}</div>
        <button class="btn salvia" id="copias">Copiar contratos de larga duraci\xF3n</button></div></div>` : ""}
    ${enFirma.length ? `<div class="titulo-seccion"><h2>En firma</h2></div>
      <div class="seccion">${enFirma.map((c) => `
        <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div>
          <div class="nombre">${esc(c.inquilinos.join(", "))}</div><div class="meta">${esc(c.pisoNombre)} \xB7 ${esc(c.curso)}</div></div>
          <span class="chip ${c.nFirmas === c.firmantes.length ? "ok" : "firma"}">${c.nFirmas === c.firmantes.length ? "Listo para guardar" : `${c.nFirmas}/${c.firmantes.length} firmas`}</span></div></a>`).join("")}</div>` : ""}
    <div class="titulo-seccion"><h2>Tus pisos</h2><a href="#/pisos" style="font-size:13px;text-decoration:none">Ver todos</a></div>
    <div class="seccion">
      ${pisos.length ? pisos.map((p2) => `
        <a class="tarjeta" href="#/piso/${p2.id}"><div class="fila"><div>
          <div class="nombre">${esc(p2.nombre)}</div><div class="meta">${PLANTILLAS[p2.plantilla] || ""} \xB7 ${esc(p2.ciudad || "")}</div></div>
          ${estadoPiso(p2)}</div></a>`).join("") : `<div class="vacio">Todav\xEDa no hay pisos. Empieza por <a href="#/ajustes">tus datos</a> y luego <a href="#/piso/nuevo">a\xF1ade un piso</a>.</div>`}
    </div>
    <div class="acciones"><a class="btn primario ancho" href="#/nuevo">${ICO.mas} Nuevo inquilino</a></div>
  `, "inicio");
  if ($("#copias")) $("#copias").onclick = async (e) => {
    e.target.disabled = true;
    e.target.textContent = "Copiando\u2026";
    try {
      await hacerCopias(copias);
      aviso("Contratos copiados a su a\xF1o de renta");
      vistaPanel();
    } catch (err) {
      aviso("No se pudo copiar: " + err.message, true);
      e.target.disabled = false;
    }
  };
}
async function vistaPisos() {
  const pisos = await listarPisos();
  pintar(`${cabVolver("Pisos")}
    <div class="seccion">${pisos.map((p2) => `
      <a class="tarjeta" href="#/piso/${p2.id}"><div class="nombre">${esc(p2.nombre)}</div>
      <div class="meta">${esc(p2.direccion)}</div></a>`).join("") || '<div class="vacio">Sin pisos todav\xEDa.</div>'}</div>
    <div class="acciones"><a class="btn primario ancho" href="#/piso/nuevo">${ICO.mas} A\xF1adir piso</a></div>`, "pisos");
}
var LUZ_OFRECIDAS = ["A", "B", "D"];
function camposLuz(luz = { opcion: "D" }) {
  const opciones = Object.entries(LUZ).filter(([k]) => LUZ_OFRECIDAS.includes(k) || k === luz.opcion);
  return `<div class="eti-campo">Luz</div>
    <div class="seccion" style="padding:0;gap:8px" id="opciones-luz">
      ${opciones.map(([k, o]) => `<button type="button" class="opcion-luz ${luz.opcion === k ? "on" : ""}" data-luz="${k}"><b>${o.t}</b><span>${o.d}</span></button>`).join("")}
    </div>
    <input type="hidden" name="luzOpcion" value="${esc(luz.opcion)}">
    <div class="rejilla" id="luz-importes">
      ${campo("Cuota fija mensual (\u20AC)", "luzCuota", luz.cuota ?? "", 'inputmode="decimal"')}
      ${campo("Tope mensual (\u20AC)", "luzTope", luz.tope ?? "", 'inputmode="decimal"')}
    </div>`;
}
function activarLuz(root) {
  const ajustar = () => {
    const o = $('[name="luzOpcion"]', root).value;
    const cuota = $('[name="luzCuota"]', root).closest("label");
    const tope = $('[name="luzTope"]', root).closest("label");
    cuota.style.display = o === "B" || o === "C" ? "" : "none";
    tope.style.display = o === "B" || o === "D" ? "" : "none";
    tope.firstChild.textContent = o === "D" ? "Tope de la factura de luz del piso (\u20AC, opcional)" : "Tope mensual cubierto (\u20AC)";
  };
  $("#opciones-luz", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-luz]");
    if (!b) return;
    $$("[data-luz]", root).forEach((x) => x.classList.toggle("on", x === b));
    $('[name="luzOpcion"]', root).value = b.dataset.luz;
    ajustar();
  });
  ajustar();
}
function camposSuministro(clave, titulo, s = { opcion: "incluida" }) {
  const aparte = s.opcion && s.opcion !== "incluida";
  return `<div class="tarjeta" data-suministro="${clave}" style="gap:10px">
    <div class="nombre" style="font-size:14px">${titulo}</div>
    <label class="check"><input type="checkbox" name="${clave}Aparte" ${aparte ? "checked" : ""}> Se paga aparte (no va incluido en el precio)</label>
    <div data-aparte class="seccion" style="padding:0;gap:8px">
      ${segmento(`${clave}Opcion`, [["titularidad", "Cambio de titularidad"], ["cuota", "Cuota fija con tope"]], s.opcion === "cuota" ? "cuota" : "titularidad")}
      <div class="rejilla" data-cuota>
        ${campo("Cuota fija mensual (\u20AC)", `${clave}Cuota`, s.cuota ?? "", 'inputmode="decimal"')}
        ${campo("Tope mensual (\u20AC, opcional)", `${clave}Tope`, s.tope ?? "", 'inputmode="decimal"')}
      </div></div></div>`;
}
function activarSuministros(root) {
  const ajustar = () => $$("[data-suministro]", root).forEach((t) => {
    const k = t.dataset.suministro;
    const ap = $(`[name=${k}Aparte]`, t).checked;
    $("[data-aparte]", t).style.display = ap ? "" : "none";
    $("[data-cuota]", t).style.display = $(`[name=${k}Opcion]`, t).value === "cuota" ? "" : "none";
  });
  root.addEventListener("change", ajustar);
  ajustar();
}
function leerSuministro(root, k) {
  if (!$(`[name=${k}Aparte]`, root)?.checked) return { opcion: "incluida" };
  const v = (n) => ($(`[name="${k}${n}"]`, root)?.value ?? "").trim();
  const opcion = v("Opcion") || "titularidad";
  return opcion === "cuota" ? { opcion, cuota: v("Cuota"), tope: v("Tope") } : { opcion };
}
async function imagenesAPdf(archivos) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let primera = true;
  for (const f of archivos) {
    const url = await new Promise((ok, ko) => {
      const r2 = new FileReader();
      r2.onload = () => ok(r2.result);
      r2.onerror = ko;
      r2.readAsDataURL(f);
    });
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error(`No se puede leer ${f.name}`));
      i.src = url;
    });
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width * k);
    cv.height = Math.round(img.height * k);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    if (!primera) pdf.addPage();
    primera = false;
    const m = 10, r = Math.min((210 - 2 * m) / cv.width, (297 - 2 * m) / cv.height);
    const w = cv.width * r, h2 = cv.height * r;
    pdf.addImage(cv.toDataURL("image/jpeg", 0.8), "JPEG", (210 - w) / 2, (297 - h2) / 2, w, h2);
  }
  return pdf.output("arraybuffer");
}
function camposGasto(clave, titulo, g = {}) {
  return `<div class="tarjeta" data-gasto="${clave}" style="gap:8px">
    <div class="nombre" style="font-size:14px">${titulo}</div>
    ${segmento(`gasto_${clave}`, [["arrendador", "La pago yo"], ["arrendatario", "La paga el inquilino"]], g.quien || "arrendador")}
    <div data-importe>${campo("Importe anual (\u20AC)", `gasto_${clave}_importe`, g.importe || "", 'inputmode="decimal"')}</div></div>`;
}
function leerCondiciones(root) {
  const v = (n) => ($(`[name="${n}"]`, root)?.value ?? "").trim();
  return {
    luz: { opcion: v("luzOpcion") || "D", cuota: v("luzCuota"), tope: v("luzTope") },
    agua: leerSuministro(root, "agua"),
    wifi: leerSuministro(root, "wifi")
  };
}
async function vistaPiso(id) {
  await leerAjustes();
  const nuevo = id === "nuevo";
  const p2 = nuevo ? { plantilla: "habitacion", ciudad: "", luz: { opcion: "D" }, agua: { opcion: "incluida" }, wifi: { opcion: "incluida" } } : (await getDoc(D("pisos", id))).data();
  if (!p2) return pintar(`${cabVolver("Piso no encontrado", "", "#/pisos")}`, "pisos");
  pintar(`${cabVolver(nuevo ? "Nuevo piso" : p2.nombre, "Ficha del piso", "#/pisos")}
    <form class="seccion" id="f">
      ${campo("Nombre corto", "nombre", p2.nombre, 'placeholder="Piso Centro"')}
      ${campo("Direcci\xF3n completa", "direccion", p2.direccion, 'placeholder="Calle, n\xFAmero, piso, CP y ciudad"')}
      ${campo("Ciudad donde se firma", "ciudad", p2.ciudad)}
      ${selectorTipo(p2.plantilla || "habitacion")}
      ${campo("N\xFAmero de habitaciones", "numHabitaciones", p2.numHabitaciones || (p2.habitaciones || []).length || "", 'type="number" min="1" max="20" inputmode="numeric" placeholder="4"')}
      <label class="campo">Descripci\xF3n de la vivienda<textarea name="descripcion" placeholder="Con tres dormitorios, cocina con lavadero, sal\xF3n y ba\xF1o">${esc(p2.descripcion || "")}</textarea></label>
      ${campo("Renta habitual (\u20AC)", "renta", p2.renta ?? "", 'inputmode="decimal"')}
      ${modo() === "completo" ? campo("Nombre de su carpeta de facturas en Drive (si es distinto)", "carpetaFacturas", p2.carpetaFacturas || "", 'placeholder="Facturas piso centro"') : `<input type="hidden" name="carpetaFacturas" value="${esc(p2.carpetaFacturas || "")}">`}
      ${camposLuz(p2.luz || { opcion: p2.plantilla === "larga_duracion" ? "A" : "D" })}
      ${camposSuministro("agua", "Agua", p2.agua || { opcion: p2.plantilla === "larga_duracion" ? "cuota" : "incluida" })}
      ${camposSuministro("wifi", "Internet (wifi)", p2.wifi || { opcion: p2.plantilla === "larga_duracion" ? "titularidad" : "incluida" })}
      <div data-solo-piso class="seccion" style="padding:0">
        <div class="eti-campo">Gastos de la vivienda</div>
        <p class="ayuda">Por ley los paga el propietario, salvo que pact\xE9is que los asuma el inquilino indicando su importe anual (art. 20 LAU).</p>
        ${camposGasto("comunidad", "Comunidad de propietarios", p2.gastos?.comunidad)}
        ${camposGasto("ibi", "IBI (impuesto de bienes inmuebles)", p2.gastos?.ibi)}
        ${camposGasto("basura", "Tasa de basura", p2.gastos?.basura)}
      </div>
      <div class="eti-campo">Fotos del piso</div>
      <div class="tarjeta"><div class="fila"><div><div class="nombre" id="fotos-nombre">${esc(p2.fotosNombre || "Sin fotos")}</div>
        <div class="meta">Fotos (JPG o PNG) o un PDF. Se a\xF1aden al final de cada contrato.</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <label class="btn secundario" style="min-height:40px">Subir<input type="file" accept="application/pdf,image/jpeg,image/png,image/*" multiple id="subir-fotos" hidden></label>
          ${modo() === "completo" ? '<button type="button" class="btn secundario" id="elegir-fotos" style="min-height:40px">Elegir en Drive</button>' : ""}
        </div></div></div>
      <input type="hidden" name="fotosDriveId" value="${esc(p2.fotosDriveId || "")}">
      <input type="hidden" name="fotosNombre" value="${esc(p2.fotosNombre || "")}">
    </form>
    <div class="acciones">
      <button class="btn primario ancho" id="guardar">Guardar</button>
      ${nuevo ? "" : '<button class="btn peligro" id="borrar">Eliminar piso</button>'}
    </div>`, "pisos");
  const f = $("#f");
  activarSegmentos(f);
  activarLuz(f);
  activarSuministros(f);
  activarSelectorTipo(f, (pl) => {
    const v = (n) => (f[n]?.value ?? "").trim();
    const cond = leerCondiciones(f);
    const gastos = {};
    for (const g of ["comunidad", "ibi", "basura"]) gastos[g] = { quien: v(`gasto_${g}`) || "arrendador", importe: v(`gasto_${g}_importe`) };
    return datosModelo(pl, {
      nombre: v("nombre"),
      direccion: v("direccion"),
      ciudad: v("ciudad"),
      descripcion: v("descripcion"),
      numHabitaciones: v("numHabitaciones"),
      renta: v("renta"),
      ...cond,
      gastos: porHabitacion(pl) ? {} : gastos
    });
  });
  const ajustarTipo = () => {
    const t = f.plantilla.value;
    $$("[data-solo-piso]", f).forEach((el) => el.style.display = porHabitacion(t) ? "none" : "");
    $$("[data-gasto]", f).forEach((g) => g.querySelector("[data-importe]").style.display = g.querySelector("input[type=hidden]").value === "arrendatario" ? "" : "none");
  };
  f.addEventListener("change", ajustarTipo);
  f.addEventListener("click", () => setTimeout(ajustarTipo, 0));
  ajustarTipo();
  $("#subir-fotos").onchange = async (e) => {
    const archivos = [...e.target.files];
    if (!archivos.length) return;
    const pdfs = archivos.filter((a) => a.type === "application/pdf" || /\.pdf$/i.test(a.name));
    if (pdfs.length && archivos.length > 1) return aviso("Sube un \xFAnico PDF, o varias fotos", true);
    try {
      aviso(pdfs.length ? "Subiendo fotos\u2026" : `Preparando ${archivos.length} foto${archivos.length > 1 ? "s" : ""}\u2026`);
      const bytes = pdfs.length ? await archivos[0].arrayBuffer() : await imagenesAPdf(archivos);
      const nombre = pdfs.length ? archivos[0].name : `Fotos_${slug(f.nombre.value || "piso")}.pdf`;
      const ajustes = await leerAjustes();
      const raiz = await raizDrive(ajustes);
      if (!raiz) return aviso("Configura Google Drive en Ajustes", true);
      const carpeta = await asegurarCarpeta(["Fotos de los pisos"], raiz);
      const r = await subirPdf(bytes, nombre, carpeta);
      f.fotosDriveId.value = r.id;
      f.fotosNombre.value = pdfs.length ? nombre : `${archivos.length} foto${archivos.length > 1 ? "s" : ""} (${nombre})`;
      $("#fotos-nombre").textContent = f.fotosNombre.value;
      aviso("Fotos subidas. Pulsa Guardar.");
    } catch (err) {
      aviso("No se pudo subir: " + err.message, true);
    }
  };
  if ($("#elegir-fotos")) $("#elegir-fotos").onclick = async () => {
    try {
      const r = await elegir("pdf");
      if (!r) return;
      f.fotosDriveId.value = r.id;
      f.fotosNombre.value = r.name;
      $("#fotos-nombre").textContent = r.name;
    } catch (e) {
      aviso("Drive: " + e.message, true);
    }
  };
  $("#guardar").onclick = async () => {
    const v = (n2) => f[n2].value.trim();
    if (!v("nombre") || !v("direccion")) return aviso("Faltan el nombre y la direcci\xF3n", true);
    const tipo = v("plantilla");
    const n = Math.min(20, Math.max(0, parseInt(v("numHabitaciones"), 10) || 0));
    if (porHabitacion(tipo) && !n) return aviso("Indica el n\xFAmero de habitaciones", true);
    const cond = leerCondiciones(f);
    if ((cond.luz.opcion === "B" || cond.luz.opcion === "C") && !cond.luz.cuota) return aviso("Falta la cuota fija de la luz", true);
    if (cond.agua.opcion === "cuota" && !cond.agua.cuota) return aviso("Falta la cuota fija del agua", true);
    if (cond.wifi.opcion === "cuota" && !cond.wifi.cuota) return aviso("Falta la cuota fija del wifi", true);
    const gastos = {};
    for (const g of ["comunidad", "ibi", "basura"]) gastos[g] = { quien: v(`gasto_${g}`) || "arrendador", importe: v(`gasto_${g}_importe`) };
    if (!porHabitacion(tipo) && Object.values(gastos).some((g) => g.quien === "arrendatario" && !g.importe))
      return aviso("Indica el importe anual de los gastos que paga el inquilino", true);
    const datos = {
      nombre: v("nombre"),
      direccion: v("direccion"),
      ciudad: v("ciudad"),
      plantilla: tipo,
      numHabitaciones: n,
      habitaciones: Array.from({ length: n }, (_, i) => String(i + 1)),
      gastos: porHabitacion(tipo) ? {} : gastos,
      descripcion: v("descripcion"),
      renta: v("renta"),
      carpetaFacturas: v("carpetaFacturas"),
      ...cond,
      fotosDriveId: v("fotosDriveId"),
      fotosNombre: v("fotosNombre"),
      actualizado: serverTimestamp()
    };
    if (nuevo) await addDoc(C("pisos"), datos);
    else await setDoc(D("pisos", id), datos, { merge: true });
    aviso("Piso guardado");
    location.hash = "#/pisos";
  };
  if ($("#borrar")) $("#borrar").onclick = async () => {
    if (!preguntar("\xBFEliminar este piso? Los contratos ya generados se mantienen.")) return;
    await deleteDoc(D("pisos", id));
    location.hash = "#/pisos";
  };
}
function fechasPorDefecto(plantilla) {
  const hoy = /* @__PURE__ */ new Date();
  if (plantilla === "larga_duracion") return { inicio: hoyISO(), fin: "" };
  const y = hoy.getMonth() >= 10 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  return { inicio: `${y}-09-01`, fin: `${y + 1}-07-31` };
}
async function vistaNueva() {
  const [pisos, ajustesNueva] = await Promise.all([listarPisos(), leerAjustes()]);
  if (!pisos.length) return pintar(`${cabVolver("Nuevo inquilino")}<div class="vacio">Primero <a href="#/piso/nuevo">a\xF1ade un piso</a>.</div>`, "inicio");
  let piso = pisos[0];
  const formulario = () => {
    const pl = $("[name=plantilla]")?.value || piso.plantilla || "habitacion";
    const f0 = fechasPorDefecto(pl);
    const curso = `${f0.inicio.slice(0, 4)}-${f0.fin ? f0.fin.slice(0, 4) : ""}`;
    return `
      ${selectorTipo(pl)}
      ${porHabitacion(pl) ? `<div class="rejilla">
          <label class="campo">Habitaci\xF3n<select name="habitacion">${(piso.habitaciones?.length ? piso.habitaciones : ["1", "2", "3", "4"]).map((h2) => `<option>${esc(h2)}</option>`).join("")}</select></label>
          ${campo("Renta mensual (\u20AC)", "renta", piso.renta ?? "", 'inputmode="decimal"')}</div>` : `<div class="rejilla">${campo("Renta mensual (\u20AC)", "renta", piso.renta ?? "", 'inputmode="decimal"')}
          ${campo("N\xBA de inquilinos", "plazas", pl === "larga_duracion" ? 1 : Math.max(1, parseInt(piso.numHabitaciones, 10) || 1), 'inputmode="numeric"')}</div>`}
      ${campo(`Fianza (\u20AC) \u2014 vac\xEDo = ${esTemporada(pl) ? "dos mensualidades" : "una mensualidad"}`, "fianza", "", 'inputmode="decimal"')}
      <div class="rejilla">${campo("Desde", "fechaInicio", f0.inicio, 'type="date"')}
        ${pl === "larga_duracion" ? campo("Entrega de llaves", "fechaEntrega", f0.inicio, 'type="date"') : campo("Hasta", "fechaFin", f0.fin, 'type="date"')}</div>
      ${esTemporada(pl) ? `${campo("Motivo de la temporada (aparece en el contrato)", "motivoTemporada", `la realizaci\xF3n de estudios durante el curso ${curso}`)}
        <p class="ayuda">Por ejemplo: \xABun contrato de trabajo temporal en la ciudad\xBB, \xABla realizaci\xF3n de obras en su vivienda habitual\xBB.</p>` : ""}
      <div class="tarjeta"><div class="eti-campo" style="margin:0">Suministros</div>
        <div class="meta">${esc(resumenSuministros(piso))}</div>
        <div class="meta"><a href="#/piso/${piso.id}">Cambiar en la ficha del piso</a></div></div>`;
  };
  pintar(`${cabVolver("Nuevo inquilino")}
    <div class="seccion">
      <div class="eti-campo">Piso</div>
      <div class="pildoras" id="pisos">${pisos.map((p2, i) => `<button type="button" data-id="${p2.id}" class="${i === 0 ? "on" : ""}">${esc(p2.nombre)}</button>`).join("")}</div>
      <form id="f" class="seccion" style="padding:0">${formulario()}</form>
      <div id="resultado"></div>
    </div>
    <div class="acciones"><button class="btn primario ancho" id="crear">Crear enlace</button></div>`, "inicio");
  const f = $("#f");
  const repintar = () => {
    f.innerHTML = formulario();
    activarSegmentos(f);
    activarSelectorTipo(f, (pl) => datosModelo(pl, {
      nombre: piso.nombre,
      direccion: piso.direccion,
      ciudad: piso.ciudad,
      descripcion: piso.descripcion,
      numHabitaciones: piso.numHabitaciones,
      renta: f.renta?.value || piso.renta,
      motivoTemporada: f.motivoTemporada?.value || "",
      luz: piso.luz,
      agua: piso.agua,
      wifi: piso.wifi,
      gastos: porHabitacion(pl) ? {} : piso.gastos
    }));
  };
  repintar();
  f.addEventListener("change", (e) => {
    if (e.target.name === "plantilla") repintar();
  });
  $("#pisos").onclick = (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    $$("#pisos button").forEach((x) => x.classList.toggle("on", x === b));
    piso = pisos.find((p2) => p2.id === b.dataset.id);
    $("[name=plantilla]", f).value = piso.plantilla || "habitacion";
    repintar();
  };
  $("#crear").onclick = async () => {
    const v = (n) => (f[n]?.value ?? "").trim();
    const pl = v("plantilla");
    if (!v("renta")) return aviso("Falta la renta", true);
    if (!v("fechaInicio")) return aviso("Falta la fecha de inicio", true);
    if (pl !== "larga_duracion" && !v("fechaFin")) return aviso("Falta la fecha de fin", true);
    if (esTemporada(pl) && !v("motivoTemporada")) return aviso("Indica el motivo de la temporada", true);
    const token2 = nuevoToken();
    const inv = {
      pisoId: piso.id,
      pisoNombre: piso.nombre,
      pisoDireccion: piso.direccion,
      ciudad: piso.ciudad || "",
      plantilla: pl,
      habitacion: porHabitacion(pl) ? v("habitacion") : "",
      plazas: porHabitacion(pl) ? 1 : parseInt(v("plazas") || "1", 10),
      renta: v("renta"),
      fianza: v("fianza"),
      fechaInicio: v("fechaInicio"),
      fechaFin: pl === "larga_duracion" ? "" : v("fechaFin"),
      fechaEntrega: pl === "larga_duracion" ? v("fechaEntrega") : "",
      motivoTemporada: esTemporada(pl) ? v("motivoTemporada") : "",
      luz: piso.luz || { opcion: pl === "larga_duracion" ? "A" : "D" },
      agua: piso.agua || { opcion: pl === "larga_duracion" ? "cuota" : "incluida" },
      wifi: piso.wifi || { opcion: pl === "larga_duracion" ? "titularidad" : "incluida" },
      estado: "abierta",
      respuestas: 0,
      creada: serverTimestamp(),
      creadaPor: usuario.email,
      arrendadores: (ajustesNueva.propietarios || []).map((p2) => p2.nombre).filter(Boolean).join(" y ")
    };
    $("#crear").disabled = true;
    try {
      await setDoc(D("invitaciones", token2), inv);
      await setDoc(doc(db, "enlaces", token2), { cuentaId: CID });
      location.hash = `#/inv/${token2}`;
    } catch (e) {
      aviso("No se pudo crear: " + e.message, true);
      $("#crear").disabled = false;
    }
  };
}
async function compartir(titulo, url) {
  try {
    await navigator.clipboard.writeText(url);
    aviso("Enlace copiado");
    return;
  } catch {
  }
  try {
    if (navigator.share) {
      await navigator.share({ title: titulo, url });
      return;
    }
  } catch {
  }
  aviso("Copia el enlace a mano: " + url);
}
function enlaceInquilino(token2) {
  return `${location.origin}${location.pathname}#/i/${token2}`;
}
function cajaEnlace(inv, token2) {
  const url = enlaceInquilino(token2);
  const demo = DEMO ? `<a class="btn secundario" href="#/i/${token2}">Abrir como inquilino (demo)</a>` : "";
  const texto = `Hola, para preparar tu contrato de ${inv.pisoNombre} rellena tus datos aqu\xED: ${url}`;
  return `<div class="caja-enlace">
    <div style="display:flex;gap:8px;align-items:center;font-weight:600">${ICO.enlace} Enlace para el inquilino</div>
    <code>${esc(url)}</code>
    <div class="dos">
      <a class="btn salvia" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">WhatsApp</a>
      <button class="btn secundario" type="button" id="copiar" data-url="${esc(url)}">Copiar</button>
    </div>${demo}</div>`;
}
function resumenPersona(p2) {
  return `${esc(p2.tratamiento)} ${esc(p2.nombre)} \xB7 ${esc(p2.tipoDoc)} ${esc(p2.numDoc)}`;
}
async function vistaInvitacion(id) {
  const snap = await getDoc(D("invitaciones", id));
  if (!snap.exists()) return pintar(`${cabVolver("Invitaci\xF3n no encontrada")}`, "inicio");
  const inv = snap.data();
  const [resps, contratos, ajustes] = await Promise.all([
    respuestasDe(id),
    getDocs(query(C("contratos"), where("invitacionId", "==", id))).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    leerAjustes()
  ]);
  const condiciones2 = [
    PLANTILLAS[inv.plantilla] + (inv.habitacion ? ` \xB7 habitaci\xF3n ${inv.habitacion}` : ""),
    `Renta ${euros(inv.renta)}${inv.fianza ? ` \xB7 fianza ${euros(inv.fianza)}` : ""}`,
    inv.plantilla === "larga_duracion" ? `Desde el ${fechaLarga(inv.fechaInicio)}` : `Del ${fechaLarga(inv.fechaInicio)} al ${fechaLarga(inv.fechaFin)}`,
    resumenSuministros(inv),
    ...inv.motivoTemporada ? [`Motivo: ${inv.motivoTemporada}`] : []
  ];
  pintar(`${cabVolver(inv.pisoNombre, "Invitaci\xF3n", "#/")}
    <div class="seccion">
      <div class="tarjeta">${condiciones2.map((c) => `<div class="meta" style="font-size:13px">${esc(c)}</div>`).join("")}</div>
      ${inv.estado === "abierta" ? cajaEnlace(inv, id) : '<span class="chip gris" style="align-self:flex-start">Enlace cerrado</span>'}
      <div class="eti-campo">Inquilinos (${resps.length}${inv.plazas ? " de " + inv.plazas : ""})</div>
      ${resps.map((r, i) => `<div class="tarjeta">
          <div class="fila"><div><div class="nombre">${esc(r.nombre)}</div><div class="meta">${esc(r.tipoDoc)} ${esc(r.numDoc)} \xB7 ${esc(r.telefono || "")}</div></div>
          <button class="btn secundario" data-editar="${r.id}" style="min-height:40px">Editar</button></div>
          <div class="meta">${esc(r.domicilio)}</div>
          ${(r.avales || []).map((a) => `<div class="meta">Avalista${a.parentesco ? " (" + esc(a.parentesco) + ")" : ""}: ${resumenPersona(a)}</div>`).join("")}
          <div id="editor-${r.id}"></div></div>`).join("") || '<div class="vacio">Todav\xEDa nadie ha rellenado sus datos.</div>'}
      <button class="btn fantasma" id="manual">+ A\xF1adir inquilino a mano</button>
      <div id="editor-nuevo"></div>
      ${contratos.length ? `<div class="eti-campo">Contratos</div>${contratos.map((c) => `
        <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div><div class="nombre">Contrato de ${esc(c.inquilinos.join(", "))}</div>
        <div class="meta">Generado el ${fechaCorta(c.creada)} \xB7 toca para firmar</div></div>
        <span class="chip ${c.estado === "firmado" ? "ok" : c.estado === "firmando" ? "espera" : "firma"}">${{ firmado: "Firmado", firmando: "En firma" }[c.estado] || "Por enviar"}</span></div></a>`).join("")}` : ""}
      ${resps.length ? `<div class="rejilla">${campo("Fecha de firma", "fechaFirma", hoyISO(), 'type="date" id="fecha-firma"')}</div>` : ""}
    </div>
    <div class="acciones">
      ${contratos.length === 1 ? `<a class="btn primario ancho" href="#/contrato/${contratos[0].id}">${contratos[0].estado === "firmado" ? "Ver contrato firmado" : "Ir a firmar el contrato"}</a>` : ""}
      ${resps.length ? `<button class="btn ${contratos.length ? "secundario" : "primario"} ancho" id="generar">${contratos.length ? "Volver a generar" : "Generar contrato"}</button>` : ""}
      <button class="btn secundario" id="estado">${inv.estado === "abierta" ? "Cerrar enlace" : "Reabrir enlace"}</button>
      <button class="btn peligro" id="borrar">Eliminar invitaci\xF3n</button>
    </div>`, "inicio");
  if ($("#copiar")) $("#copiar").onclick = async (e) => {
    const url = e.currentTarget.dataset.url;
    await compartir("Datos para el contrato", url);
  };
  const abrirEditor = (r, contenedor) => {
    contenedor.innerHTML = `<form class="seccion" style="padding:8px 0 0">
        ${camposPersona("p_", r, { contacto: true, domicilio: true })}
        <div class="eti-campo">Avalistas</div>
        <div data-avales>${(r.avales || []).map((a, j) => `<div class="tarjeta" style="background:#fff" data-aval>${camposPersona(`a${j}_`, a, { parentesco: true })}</div>`).join("")}</div>
        <button type="button" class="btn fantasma" data-mas-aval>+ A\xF1adir avalista</button>
        <div class="dos"><button type="button" class="btn secundario" data-cancelar>Cancelar</button><button type="button" class="btn primario" data-guardar>Guardar</button></div>
        ${r.id ? '<button type="button" class="btn peligro" data-quitar>Quitar inquilino</button>' : ""}
      </form>`;
    const f = $("form", contenedor);
    activarSegmentos(f);
    $("[data-mas-aval]", f).onclick = () => {
      const j = $$("[data-aval]", f).length;
      const div = document.createElement("div");
      div.className = "tarjeta";
      div.style.background = "#fff";
      div.dataset.aval = "";
      div.innerHTML = camposPersona(`a${j}_`, {}, { parentesco: true });
      $("[data-avales]", f).appendChild(div);
      activarSegmentos(div);
    };
    $("[data-cancelar]", f).onclick = () => contenedor.innerHTML = "";
    $("[data-guardar]", f).onclick = async () => {
      const p2 = leerPersona(f, "p_");
      let ok = validarPersona(f, "p_", p2, { domicilio: true });
      const avales = $$("[data-aval]", f).map((_, j) => leerPersona(f, `a${j}_`)).filter((a) => a.nombre || a.numDoc);
      avales.forEach((a, j) => {
        ok = validarPersona(f, `a${j}_`, a) && ok;
      });
      if (!ok) return;
      const datos = { ...p2, avales: avales.map(({ domicilio, telefono, email, ...a }) => a) };
      if (r.id) await updateDoc(D("invitaciones", id, "respuestas", r.id), datos);
      else {
        await addDoc(C("invitaciones", id, "respuestas"), { ...datos, consentimiento: true, manual: true, enviada: serverTimestamp() });
      }
      aviso("Datos guardados");
      vistaInvitacion(id);
    };
    if ($("[data-quitar]", f)) $("[data-quitar]", f).onclick = async () => {
      if (!preguntar("\xBFQuitar a este inquilino de la invitaci\xF3n?")) return;
      await deleteDoc(D("invitaciones", id, "respuestas", r.id));
      vistaInvitacion(id);
    };
  };
  $$("[data-editar]").forEach((b) => b.onclick = () => {
    const r = resps.find((x) => x.id === b.dataset.editar);
    abrirEditor(r, $(`#editor-${r.id}`));
  });
  $("#manual").onclick = () => abrirEditor({ avales: [] }, $("#editor-nuevo"));
  $("#estado").onclick = async () => {
    await updateDoc(D("invitaciones", id), { estado: inv.estado === "abierta" ? "cerrada" : "abierta" });
    vistaInvitacion(id);
  };
  $("#borrar").onclick = async () => {
    if (!preguntar("\xBFEliminar la invitaci\xF3n y los datos recibidos? Los contratos ya generados se mantienen.")) return;
    for (const r of resps) await deleteDoc(D("invitaciones", id, "respuestas", r.id));
    await deleteDoc(D("invitaciones", id));
    await deleteDoc(doc(db, "enlaces", id)).catch(() => {
    });
    location.hash = "#/";
  };
  if ($("#generar")) $("#generar").onclick = async () => {
    const boton = $("#generar");
    if (!ajustes.iban || ajustes.propietarios.some((p2) => !p2.numDoc)) {
      aviso("Completa primero vuestros DNIs e IBAN en Ajustes", true);
      return;
    }
    if (inv.plazas && resps.length < inv.plazas && !porHabitacion(inv.plantilla) && !preguntar(`Solo han rellenado ${resps.length} de ${inv.plazas}. \xBFGenerar el contrato igualmente?`)) return;
    boton.disabled = true;
    boton.textContent = "Generando\u2026";
    try {
      const grupos = porHabitacion(inv.plantilla) ? resps.map((r) => [r]) : [resps];
      const ids = [];
      for (const grupo of grupos) ids.push(await generarYGuardar(id, inv, grupo, ajustes, $("#fecha-firma").value));
      await updateDoc(D("invitaciones", id), { estado: "cerrada" });
      aviso(grupos.length > 1 ? `${grupos.length} contratos generados` : "Contrato generado: rev\xEDsalo y env\xEDalo a firmar");
      if (ids.length === 1) location.hash = `#/contrato/${ids[0]}`;
      else vistaInvitacion(id);
    } catch (e) {
      console.error(e);
      aviso("Error al generar: " + e.message, true);
      boton.disabled = false;
      boton.textContent = contratos.length ? "Volver a generar" : "Generar contrato";
    }
  };
}
function datosContrato(inv, grupo, ajustes, fechaFirma, piso, conFotos) {
  return {
    plantilla: inv.plantilla,
    ciudadFirma: inv.ciudad || ajustes.ciudadFirma || "",
    condiciones: ajustes.condiciones || {},
    cambiosModelo: ajustes.modelos?.[inv.plantilla] || [],
    gastos: piso?.gastos || {},
    fechaFirma,
    propietarios: ajustes.propietarios,
    domicilioPropietarios: ajustes.domicilio,
    iban: ajustes.iban,
    piso: { nombre: inv.pisoNombre, direccion: inv.pisoDireccion, descripcion: piso?.descripcion || "", numHabitaciones: piso?.numHabitaciones || 0 },
    habitacion: inv.habitacion,
    inquilinos: grupo.map((r) => ({
      tratamiento: r.tratamiento,
      nombre: r.nombre,
      tipoDoc: r.tipoDoc,
      numDoc: r.numDoc,
      domicilio: r.domicilio,
      avales: (r.avales || []).map((a) => ({ tratamiento: a.tratamiento, nombre: a.nombre, tipoDoc: a.tipoDoc, numDoc: a.numDoc, parentesco: a.parentesco }))
    })),
    renta: inv.renta,
    fianza: inv.fianza,
    fechaInicio: inv.fechaInicio,
    fechaFin: inv.fechaFin,
    fechaEntrega: inv.fechaEntrega,
    luz: inv.luz,
    agua: inv.agua,
    wifi: inv.wifi,
    motivoTemporada: inv.motivoTemporada || "",
    conFotos
  };
}
async function fotosDelPiso(piso) {
  if (!piso?.fotosDriveId || DEMO) return null;
  try {
    return await descargarArchivo(piso.fotosDriveId);
  } catch (e) {
    if (!preguntar("No puedo abrir el PDF de fotos del piso con esta cuenta (el\xEDgelo otra vez en la ficha del piso). \xBFGenerar el contrato sin fotos?")) throw new Error("Cancelado");
    return null;
  }
}
function a\u00F1osFiscales(inv) {
  const ini = inv.fechaInicio || hoyISO();
  let fin = inv.fechaFin;
  if (!fin) {
    const d = /* @__PURE__ */ new Date(ini + "T12:00:00");
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    fin = d.toLocaleDateString("sv-SE");
  }
  const a = parseInt(ini.slice(0, 4), 10);
  let b = parseInt(fin.slice(0, 4), 10);
  if (inv.plantilla === "larga_duracion" && !inv.finalizado) b = Math.max(b, (/* @__PURE__ */ new Date()).getFullYear());
  if (inv.plantilla === "larga_duracion" && inv.finalizado) b = Math.min(Math.max(b, a), parseInt(inv.finalizado.slice(0, 4), 10));
  const a\u00F1os = [];
  for (let y = a; y <= Math.max(a, b); y++) a\u00F1os.push(y);
  return a\u00F1os;
}
async function carpetaContratos(ajustes, a\u00F1o, pisoNombre) {
  const renta = await asegurarCarpeta([`Renta ${a\u00F1o}`, `renta${a\u00F1o}`], ajustes.carpetaDriveId);
  const contratos = await asegurarCarpeta(["Contratos", "Contratos alquiler"], renta);
  return asegurarCarpeta([pisoNombre], contratos);
}
async function carpetasDestino(ajustes, inv, soloA\u00F1os = null) {
  if (!await raizDrive(ajustes)) return [];
  const ids = [];
  for (const a\u00F1o of soloA\u00F1os || a\u00F1osFiscales(inv)) ids.push({ a\u00F1o, id: await carpetaContratos(ajustes, a\u00F1o, inv.pisoNombre) });
  return ids;
}
function copiasPendientes(contratos) {
  return contratos.filter((c) => c.plantilla === "larga_duracion" && !c.finalizado && (c.enDrive || []).length).map((c) => {
    const tiene = new Set((c.estado === "firmado" && c.firmado?.length ? c.firmado : c.enDrive).map((d) => d.a\u00F1o));
    const faltan = a\u00F1osFiscales({ ...c.datos, plantilla: c.plantilla }).filter((a) => !tiene.has(a));
    return { c, faltan };
  }).filter((x) => x.faltan.length);
}
async function hacerCopias(pendientes) {
  const ajustes = await leerAjustes();
  for (const { c, faltan } of pendientes) {
    const firmado = c.estado === "firmado" && c.firmado?.length;
    const lista = firmado ? c.firmado : c.enDrive;
    const origen = lista[lista.length - 1];
    const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + (firmado ? "_firmado.pdf" : ".pdf");
    const nuevas = [];
    for (const a\u00F1o of faltan) {
      const carpetaId = await carpetaContratos(ajustes, a\u00F1o, c.pisoNombre);
      const r = await copiar(origen.id, carpetaId, nombre);
      nuevas.push({ a\u00F1o, carpetaId, id: r.id, link: r.webViewLink });
    }
    await updateDoc(D("contratos", c.id), firmado ? { firmado: [...c.firmado, ...nuevas] } : { enDrive: [...c.enDrive, ...nuevas] });
  }
}
async function subirATodas(bytes, nombre, carpetas, mime) {
  const res = [];
  for (const c of carpetas) {
    const r = await subirPdf(bytes, nombre, c.id, mime);
    res.push({ a\u00F1o: c.a\u00F1o, carpetaId: c.id, id: r.id, link: r.webViewLink });
  }
  return res;
}
async function generarYGuardar(invId, inv, grupo, ajustes, fechaFirma) {
  const piso = inv.pisoId ? (await getDoc(D("pisos", inv.pisoId))).data() : null;
  const fotos = await fotosDelPiso(piso);
  const datos = datosContrato(inv, grupo, ajustes, fechaFirma || hoyISO(), piso, !!fotos);
  const bytes = await construirPdf(generarContrato(datos), fotos);
  const quien = grupo.length > 1 ? "Completo" : slug(grupo[0].nombre);
  const nombreArchivo = `Contrato_${slug(inv.pisoNombre)}${inv.habitacion ? "_Hab" + slug(inv.habitacion) : ""}_${quien}_${cursoDe(inv)}.pdf`;
  let enDrive = [];
  try {
    enDrive = await subirATodas(bytes, nombreArchivo, await carpetasDestino(ajustes, inv));
  } catch (e) {
    console.error(e);
    aviso("No se pudo subir a Drive; se descarga en el dispositivo", true);
  }
  if (!enDrive.length) bajar(bytes, nombreArchivo);
  const nuevo = await addDoc(C("contratos"), {
    invitacionId: invId,
    pisoId: inv.pisoId,
    pisoNombre: inv.pisoNombre,
    plantilla: inv.plantilla,
    curso: cursoDe(inv),
    a\u00F1os: a\u00F1osFiscales(inv),
    inquilinos: grupo.map((r) => r.nombre),
    nombreArchivo,
    datos,
    enDrive,
    estado: "generado",
    creada: serverTimestamp(),
    creadaPor: usuario.email
  });
  return nuevo.id;
}
async function vistaContratos() {
  const cs = await listar("contratos");
  pintar(`${cabVolver("Contratos")}
    <div class="seccion">${cs.map((c) => `
      <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div>
        <div class="nombre">${esc(c.inquilinos?.join(", "))}</div>
        <div class="meta">${esc(c.pisoNombre)} \xB7 ${esc(c.curso)}</div></div>
        <span class="chip ${c.estado === "firmado" ? "ok" : c.estado === "firmando" ? "espera" : "firma"}">${{ firmado: "Firmado", firmando: "En firma" }[c.estado] || "Por enviar"}</span></div></a>`).join("") || '<div class="vacio">A\xFAn no hay contratos.</div>'}</div>`, "contratos");
}
var TIPOS_EDITABLES = ["title", "subtitle", "heading", "subheading", "p"];
async function vistaEditar(id) {
  const s = await getDoc(D("contratos", id));
  if (!s.exists()) return pintar(cabVolver("Contrato no encontrado", "", "#/contratos"), "contratos");
  const c = s.data();
  if (c.estado !== "generado") {
    location.hash = `#/contrato/${id}`;
    return;
  }
  const original = generarContrato(c.datos);
  let items = (c.bloques?.length ? c.bloques : original).map((b, i) => ({ ...b, orig: c.bloques?.length ? b.orig ?? null : i }));
  const fijos = items.filter((b) => !TIPOS_EDITABLES.includes(b.type));
  items = items.filter((b) => TIPOS_EDITABLES.includes(b.type));
  const NOMBRE = { title: "T\xEDtulo", subtitle: "Subt\xEDtulo", heading: "Apartado", subheading: "Cl\xE1usula", p: "P\xE1rrafo" };
  const pintarEditor = () => {
    pintar(`${cabVolver("Editar el contrato", c.inquilinos?.join(", ") || "", `#/contrato/${id}`)}
      <div class="seccion">
        <p class="ayuda">Cambia cualquier texto, quita p\xE1rrafos o a\xF1ade nuevos. Las cl\xE1usulas se vuelven a numerar solas. Los cambios se ven en el PDF y en lo que firma el inquilino.</p>
        ${items.map((b, i) => `<div class="tarjeta" style="gap:8px;${b.orig === null ? "border:1.5px dashed var(--terracota)" : ""}">
            <div class="fila"><span class="eti-campo">${NOMBRE[b.type]}${b.orig === null ? " \xB7 nuevo" : ""}</span>
              <button type="button" class="btn peligro" data-quitar="${i}" style="min-height:32px;font-size:13px">Quitar</button></div>
            <textarea data-i="${i}" rows="${Math.min(14, Math.max(2, Math.ceil(b.text.length / 42)))}" style="font-family:var(--sans);font-size:15px;line-height:1.5;border:1px solid var(--borde);border-radius:12px;padding:10px 12px;width:100%;${b.type !== "p" ? "font-weight:600;" : ""}">${esc(b.text)}</textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="p" style="min-height:36px;flex:1">+ P\xE1rrafo debajo</button>
              <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="subheading" style="min-height:36px;flex:1">+ Cl\xE1usula debajo</button>
            </div></div>`).join("")}
        <label class="check"><input type="checkbox" id="al-modelo">
          <span>Guardar tambi\xE9n estos cambios en mi modelo de \xAB${esc(PLANTILLAS[c.plantilla] || "")}\xBB para los pr\xF3ximos contratos. Solo se aplican a los p\xE1rrafos fijos; los que llevan nombres, importes o fechas se cambian solo en este contrato.</span></label>
      </div>
      <div class="acciones">
        <button class="btn primario ancho" id="guardar">Guardar cambios</button>
        <div class="dos"><a class="btn secundario" href="#/contrato/${id}">Cancelar</a>
          <button class="btn secundario" id="restaurar">Volver al texto original</button></div>
      </div>`, "contratos");
    $$("textarea[data-i]").forEach((t) => t.addEventListener("input", () => {
      items[+t.dataset.i].text = t.value;
    }));
    $$("[data-quitar]").forEach((b) => b.onclick = () => {
      items.splice(+b.dataset.quitar, 1);
      pintarEditor();
    });
    $$("[data-mas]").forEach((b) => b.onclick = () => {
      const i = +b.dataset.mas;
      const nuevo = b.dataset.tipo === "subheading" ? { type: "subheading", text: "NUEVA. T\xEDtulo de la cl\xE1usula.", orig: null } : { type: "p", text: "", orig: null };
      items.splice(i + 1, 0, nuevo);
      if (b.dataset.tipo === "subheading") items.splice(i + 2, 0, { type: "p", text: "", orig: null });
      pintarEditor();
      const t = $(`textarea[data-i="${i + 1}"]`);
      if (t) {
        t.focus();
        t.select();
      }
    });
    $("#restaurar").onclick = async () => {
      if (!preguntar("\xBFDescartar todos los cambios de este contrato?")) return;
      await updateDoc(D("contratos", id), { bloques: [] });
      aviso("Texto original restaurado");
      location.hash = `#/contrato/${id}`;
    };
    $("#guardar").onclick = async () => {
      const limpios = items.map((b) => ({ ...b, text: b.text.trim() })).filter((b) => b.text);
      const firmasBloque = fijos.find((b) => b.type === "signatures");
      const anexo = fijos.find((b) => b.type === "annex");
      let final = renumerar(limpios.map(({ type, text, orig }) => ({ type, text, orig })));
      if (firmasBloque) final.push(firmasBloque);
      if (anexo) final.push(anexo);
      await updateDoc(D("contratos", id), { bloques: final, editadoEl: serverTimestamp(), editadoPor: usuario.email });
      if ($("#al-modelo").checked) {
        const cambios = cambiosRespectoAlModelo(original, limpios, c.datos);
        if (cambios.length) {
          const a = await leerAjustes();
          const modelos = { ...a.modelos || {} };
          modelos[c.plantilla] = [...modelos[c.plantilla] || [], ...cambios];
          await setDoc(D("ajustes", "general"), { modelos }, { merge: true });
        }
        aviso(cambios.length ? `Guardado. ${cambios.length} cambio(s) a\xF1adidos a tu modelo` : "Guardado en este contrato");
      } else aviso("Cambios guardados");
      location.hash = `#/contrato/${id}`;
    };
  };
  pintarEditor();
}
function datosAlternos(d) {
  const x = JSON.parse(JSON.stringify(d));
  const cambia = (o, k) => {
    if (o && o[k]) o[k] = String(o[k]) + " \u03A9";
  };
  const mas1 = (o, k) => {
    if (o && o[k] !== void 0 && o[k] !== "") o[k] = String((parseFloat(String(o[k]).replace(",", ".")) || 0) + 1);
  };
  const a\u00F1o = (o, k) => {
    if (o?.[k]) o[k] = String(parseInt(o[k].slice(0, 4), 10) + 3) + o[k].slice(4);
  };
  (x.inquilinos || []).forEach((i) => {
    ["nombre", "numDoc", "domicilio"].forEach((k) => cambia(i, k));
    (i.avales || []).forEach((a) => ["nombre", "numDoc", "parentesco"].forEach((k) => cambia(a, k)));
  });
  (x.propietarios || []).forEach((o) => ["nombre", "numDoc"].forEach((k) => cambia(o, k)));
  ["nombre", "direccion", "descripcion"].forEach((k) => cambia(x.piso, k));
  ["habitacion", "iban", "domicilioPropietarios", "ciudadFirma", "motivoTemporada"].forEach((k) => cambia(x, k));
  ["renta", "fianza"].forEach((k) => mas1(x, k));
  for (const s of [x.luz, x.agua, x.wifi]) {
    mas1(s, "cuota");
    mas1(s, "tope");
  }
  Object.values(x.gastos || {}).forEach((g) => mas1(g, "importe"));
  ["fechaInicio", "fechaFin", "fechaFirma", "fechaEntrega"].forEach((k) => a\u00F1o(x, k));
  return x;
}
function cambiosRespectoAlModelo(original, items, datos) {
  const sinNum = (t) => String(t || "").replace(/^[A-ZÁÉÍÓÚ]+\.\s*/, "");
  const alternos = new Set(generarContrato(datosAlternos(datos)).map((b) => sinNum(b.text)));
  const fijo = (texto) => alternos.has(sinNum(texto));
  const cambios = [];
  const presentes = new Set(items.filter((b) => b.orig !== null).map((b) => b.orig));
  original.forEach((b, i) => {
    if (TIPOS_EDITABLES.includes(b.type) && !presentes.has(i) && fijo(b.text)) cambios.push({ tipo: "quitar", original: b.text });
  });
  let anterior = null;
  for (const b of items) {
    if (b.orig !== null) {
      const o = original[b.orig];
      if (o && fijo(o.text)) {
        if (o.text !== b.text) cambios.push({ tipo: "reemplazar", original: o.text, nuevo: b.text, bloque: b.type });
        anterior = b.text;
      }
    } else if (anterior !== null) {
      cambios.push({ tipo: "a\xF1adir", despuesDe: anterior, nuevo: b.text, bloque: b.type });
      anterior = b.text;
    }
  }
  return cambios;
}
var MODELOS_EDITABLES = ["temporada_habitacion", "temporada_piso", "habitacion", "larga_duracion"];
async function datosEjemploModelo(pl) {
  const f0 = fechasPorDefecto(pl);
  const d = await datosModelo(pl, {
    nombre: "Piso",
    direccion: "Calle Ejemplo, 1",
    ciudad: "Ciudad",
    renta: "300",
    numHabitaciones: 3,
    motivoTemporada: "la realizaci\xF3n de estudios durante el curso",
    luz: { opcion: "D" },
    agua: { opcion: "incluida" },
    wifi: { opcion: "incluida" }
  });
  d.cambiosModelo = [];
  d.fechaFirma = f0.inicio;
  d.fechaInicio = f0.inicio;
  d.fechaFin = f0.fin;
  d.fechaEntrega = f0.inicio;
  d.fianza = "";
  d.iban = d.iban || "ES00";
  d.domicilioPropietarios = d.domicilioPropietarios || "Calle Ejemplo, 2";
  d.inquilinos[0].numDoc = "00000000T";
  d.inquilinos[0].domicilio = "Calle Ejemplo, 3";
  d.inquilinos[0].avales[0].numDoc = "00000001R";
  return d;
}
async function vistaModelo(pl) {
  if (!PLANTILLAS[pl]) {
    location.hash = "#/ajustes";
    return;
  }
  const a = await leerAjustes();
  const datos = await datosEjemploModelo(pl);
  const base = generarContrato(datos);
  const sinNum = (t) => String(t || "").replace(/^[A-ZÁÉÍÓÚ]+\.\s*/, "");
  const alternos = new Set(generarContrato(datosAlternos(datos)).map((b) => sinNum(b.text)));
  const fijo = (b) => typeof b.text === "string" && alternos.has(sinNum(b.text));
  let items = base.map((b, i) => ({ ...b, orig: i })).filter((b) => TIPOS_EDITABLES.includes(b.type));
  for (const c of a.modelos?.[pl] || []) {
    const buscado = sinNum(c.original ?? c.despuesDe);
    const i = items.findIndex((b) => sinNum(b.text) === buscado);
    if (i < 0) continue;
    if (c.tipo === "reemplazar") items[i] = { ...items[i], type: c.bloque || items[i].type, text: c.nuevo };
    else if (c.tipo === "quitar") items.splice(i, 1);
    else if (c.tipo === "a\xF1adir") items.splice(i + 1, 0, { type: c.bloque || "p", text: c.nuevo, orig: null });
  }
  const NOMBRE = { title: "T\xEDtulo", subtitle: "Subt\xEDtulo", heading: "Apartado", subheading: "Cl\xE1usula", p: "P\xE1rrafo" };
  const esFijo = (b) => b.orig === null || fijo(base[b.orig]);
  const pintarEditor = () => {
    pintar(`${cabVolver("Editar modelo", PLANTILLAS[pl], "#/ajustes")}
      <div class="seccion">
        <p class="ayuda">Cambia, quita o a\xF1ade p\xE1rrafos y cl\xE1usulas. Se aplicar\xE1 a todos los contratos nuevos de este tipo; los ya generados no cambian. Las cl\xE1usulas se numeran solas.</p>
        <p class="ayuda">Los p\xE1rrafos en gris llevan datos de cada contrato (nombres, importes, fechas\u2026) y no se pueden cambiar aqu\xED: se editan en cada contrato.</p>
        ${items.map((b, i) => esFijo(b) ? `<div class="tarjeta" style="gap:8px;${b.orig === null ? "border:1.5px dashed var(--terracota)" : ""}">
            <div class="fila"><span class="eti-campo">${NOMBRE[b.type]}${b.orig === null ? " \xB7 nuevo" : ""}</span>
              <button type="button" class="btn peligro" data-quitar="${i}" style="min-height:32px;font-size:13px">Quitar</button></div>
            <textarea data-i="${i}" rows="${Math.min(14, Math.max(2, Math.ceil(b.text.length / 34)))}" style="font-family:var(--sans);font-size:15px;line-height:1.5;border:1px solid var(--borde);border-radius:12px;padding:10px 12px;width:100%;${b.type !== "p" ? "font-weight:600;" : ""}">${esc(b.text)}</textarea>
            ${botonesMas(i)}</div>` : `<div class="tarjeta" style="gap:6px;opacity:.6;background:transparent">
            <span class="eti-campo">${NOMBRE[b.type]} \xB7 con datos de cada contrato</span>
            <div style="font-size:14px;line-height:1.5;${b.type !== "p" ? "font-weight:600;" : ""}">${esc(b.text)}</div>
            ${botonesMas(i)}</div>`).join("")}
      </div>
      <div class="acciones">
        <button class="btn primario ancho" id="guardar">Guardar modelo</button>
        <div class="dos"><a class="btn secundario" href="#/ajustes">Cancelar</a>
          <button class="btn secundario" id="pdf">Ver en PDF</button></div>
        <button class="btn fantasma" id="restaurar">Volver al modelo original</button>
      </div>`, "ajustes");
    $$("textarea[data-i]").forEach((t) => t.addEventListener("input", () => {
      items[+t.dataset.i].text = t.value;
    }));
    $$("[data-quitar]").forEach((b) => b.onclick = () => {
      items.splice(+b.dataset.quitar, 1);
      pintarEditor();
    });
    $$("[data-mas]").forEach((b) => b.onclick = () => {
      const i = +b.dataset.mas;
      const nuevo = b.dataset.tipo === "subheading" ? { type: "subheading", text: "NUEVA. T\xEDtulo de la cl\xE1usula.", orig: null } : { type: "p", text: "", orig: null };
      items.splice(i + 1, 0, nuevo);
      if (b.dataset.tipo === "subheading") items.splice(i + 2, 0, { type: "p", text: "", orig: null });
      pintarEditor();
      const t = $(`textarea[data-i="${i + 1}"]`);
      if (t) {
        t.focus();
        t.select();
      }
    });
    const cambios = () => cambiosRespectoAlModelo(base, items.map((b) => ({ ...b, text: b.text.trim() })).filter((b) => b.text), datos);
    $("#pdf").onclick = async () => {
      const d = await datosModelo(pl);
      d.cambiosModelo = cambios();
      bajar(await construirPdf(generarContrato(d), null), `Modelo_${String(PLANTILLAS[pl]).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_")}.pdf`);
    };
    $("#restaurar").onclick = async () => {
      if (!preguntar("\xBFVolver al modelo original? Se pierden tus cambios en este modelo.")) return;
      await setDoc(D("ajustes", "general"), { modelos: { ...a.modelos || {}, [pl]: [] } }, { merge: true });
      aviso("Modelo original restaurado");
      location.hash = "#/ajustes";
    };
    $("#guardar").onclick = async () => {
      const lista = cambios();
      await setDoc(D("ajustes", "general"), { modelos: { ...a.modelos || {}, [pl]: lista } }, { merge: true });
      aviso(lista.length ? `Modelo guardado (${lista.length} cambio${lista.length > 1 ? "s" : ""})` : "Modelo guardado sin cambios");
      location.hash = "#/ajustes";
    };
  };
  const botonesMas = (i) => `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="p" style="min-height:36px;flex:1">+ P\xE1rrafo debajo</button>
      <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="subheading" style="min-height:36px;flex:1">+ Cl\xE1usula debajo</button></div>`;
  pintarEditor();
}
var ROL_TEXTO = { arrendador: "Arrendador", arrendatario: "Arrendatario", fiador: "Fiador" };
function bloquesDe(c) {
  return c.bloques?.length ? c.bloques : generarContrato(c.datos);
}
async function huellaDe(c) {
  const texto = JSON.stringify(c.bloques?.length ? c.bloques : generarContrato({ ...c.datos, conFotos: !!c.datos.conFotos }));
  const h2 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(h2)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function estadosDe(cid) {
  const s = await getDocs(C("contratos", cid, "estados"));
  const m = {};
  s.docs.forEach((d) => m[d.id] = d.data());
  return m;
}
async function firmasDe(cid) {
  const s = await getDocs(C("contratos", cid, "firmas"));
  const m = {};
  s.docs.forEach((d) => m[d.id] = d.data());
  return m;
}
function fechaHora(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
  return d.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" });
}
function contratoHtml(c) {
  return bloquesDe(c).map((b) => {
    switch (b.type) {
      case "title":
        return `<h2 style="font-size:19px;text-align:center;color:var(--burdeos)">${esc(b.text)}</h2>`;
      case "subtitle":
        return `<p style="text-align:center;font-style:italic;margin:0">${esc(b.text)}</p>`;
      case "heading":
        return `<h3 style="font-size:16px;margin-top:10px">${esc(b.text)}</h3>`;
      case "subheading":
        return `<p style="font-weight:600;margin:6px 0 0">${esc(b.text)}</p>`;
      case "signatures":
      case "annex":
        return "";
      default:
        return `<p style="margin:0;line-height:1.55;text-align:justify">${esc(b.text)}</p>`;
    }
  }).join("");
}
function crearPad(canvas) {
  const ctx = canvas.getContext("2d");
  const escala = window.devicePixelRatio || 1;
  const ajustar = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * escala;
    canvas.height = r.height * escala;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1d1a3a";
  };
  ajustar();
  let pintando = false, trazos = 0, ultimo = null;
  const punto = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  canvas.addEventListener("pointerdown", (e) => {
    pintando = true;
    ultimo = punto(e);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pintando) return;
    const p2 = punto(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.x, ultimo.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ultimo = p2;
    trazos++;
  });
  const fin = () => {
    pintando = false;
  };
  canvas.addEventListener("pointerup", fin);
  canvas.addEventListener("pointercancel", fin);
  return {
    vacio: () => trazos < 8,
    limpiar: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      trazos = 0;
    },
    imagen: () => {
      const out = document.createElement("canvas");
      out.width = 600;
      out.height = 180;
      out.getContext("2d").drawImage(canvas, 0, 0, 600, 180);
      return out.toDataURL("image/png");
    }
  };
}
function bloqueFirmantes(cid, c, firmas2, puedeFirmar, alFirmar, { soloEstos = null, etiquetaEspera = () => "Pendiente" } = {}) {
  const lista = soloEstos ? c.firmantes.filter(soloEstos) : c.firmantes;
  const filas = lista.map((f) => {
    const hecha = firmas2[f.fid];
    return `<div class="tarjeta" style="background:#fff" data-firmante="${f.fid}">
      <div class="fila"><div><div class="nombre">${esc(f.nombre)}</div>
        <div class="meta">${ROL_TEXTO[f.rol]}${f.avalaA ? " de " + esc(f.avalaA) : ""}</div></div>
        ${hecha ? `<span class="chip ok">Firmado</span>` : puedeFirmar(f) ? `<button class="btn primario" style="min-height:42px;font-size:14px" data-firmar="${f.fid}">Firmar</button>` : `<span class="chip gris">${etiquetaEspera(f)}</span>`}
      </div>
      ${hecha ? `<div class="meta">${fechaHora(hecha.firmadoEl)}</div>` : ""}
      <div data-zona="${f.fid}"></div></div>`;
  }).join("");
  const html = `<div class="seccion" style="padding:0;gap:10px" id="firmantes">${filas}</div>`;
  const montar = (root) => {
    $$("[data-firmar]", root).forEach((b) => b.onclick = () => {
      const f = c.firmantes.find((x) => x.fid === b.dataset.firmar);
      const zona = $(`[data-zona="${f.fid}"]`, root);
      $$("[data-zona]", root).forEach((z) => z !== zona && (z.innerHTML = ""));
      zona.innerHTML = `<div class="seccion" style="padding:6px 0 0;gap:10px">
          <label class="check"><input type="checkbox" data-acepto>
            <span>Yo, <b>${esc(f.nombre)}</b>, con ${esc(f.tipoDoc || "documento")} ${esc(f.numDoc || "")}, declaro haber le\xEDdo el contrato y lo acepto en calidad de ${ROL_TEXTO[f.rol].toLowerCase()}.</span></label>
          <div class="eti-campo" style="text-transform:none;letter-spacing:0;font-weight:400">Firma con el dedo dentro del recuadro</div>
          <canvas style="width:100%;height:150px;background:#FFFDF9;border:1.5px dashed #C9A894;border-radius:14px;touch-action:none"></canvas>
          <div class="dos"><button type="button" class="btn secundario" data-borrar>Borrar</button><button type="button" class="btn primario" data-confirmar>Firmar</button></div>
        </div>`;
      const pad = crearPad($("canvas", zona));
      $("[data-borrar]", zona).onclick = () => pad.limpiar();
      $("[data-confirmar]", zona).onclick = async (e) => {
        if (!$("[data-acepto]", zona).checked) return aviso("Marca la casilla de aceptaci\xF3n", true);
        if (pad.vacio()) return aviso("Dibuja tu firma en el recuadro", true);
        e.target.disabled = true;
        try {
          await setDoc(D("contratos", cid, "firmas", f.fid), {
            nombre: f.nombre,
            numDoc: f.numDoc || "",
            rol: f.rol,
            imagen: pad.imagen(),
            huella: c.huella,
            aceptado: true,
            firmadoEl: serverTimestamp(),
            dispositivo: navigator.userAgent.slice(0, 200)
          });
          await setDoc(D("contratos", cid, "estados", f.fid), { nombre: f.nombre, rol: f.rol, firmadoEl: serverTimestamp() });
          aviso("Firma guardada");
          alFirmar();
        } catch (err) {
          console.error(err);
          aviso("No se pudo guardar la firma. \xBFYa estaba firmado?", true);
          e.target.disabled = false;
        }
      };
    });
  };
  return { html, montar };
}
async function archivarFirmado(cid, c) {
  const firmas2 = await firmasDe(cid);
  const ajustes = await leerAjustes();
  const piso = c.pisoId ? (await getDoc(D("pisos", c.pisoId))).data() : null;
  const fotos = c.datos.conFotos ? await fotosDelPiso(piso) : null;
  const registro = {
    huella: c.huella,
    firmantes: c.firmantes.map((f) => ({
      nombre: f.nombre,
      rolTexto: ROL_TEXTO[f.rol] + (f.avalaA ? " de " + f.avalaA : ""),
      tipoDoc: f.tipoDoc,
      numDoc: f.numDoc,
      fecha: fechaHora(firmas2[f.fid]?.firmadoEl),
      imagen: firmas2[f.fid]?.imagen
    }))
  };
  const bytes = await construirPdf(bloquesDe(c), fotos, firmas2, registro);
  const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado.pdf";
  const inv = { pisoNombre: c.pisoNombre, plantilla: c.plantilla, fechaInicio: c.datos.fechaInicio, fechaFin: c.datos.fechaFin };
  let firmado = [];
  try {
    let carpetas = (c.enDrive || []).map((d) => ({ a\u00F1o: d.a\u00F1o, id: d.carpetaId }));
    if (!carpetas.length) carpetas = await carpetasDestino(ajustes, inv);
    try {
      firmado = await subirATodas(bytes, nombre, carpetas);
    } catch (err) {
      if (err.status !== 404 && err.status !== 403) throw err;
      firmado = await subirATodas(bytes, nombre, await carpetasDestino(ajustes, inv));
    }
  } catch (e) {
    console.error(e);
    aviso("No se pudo subir a Drive; se descarga en el dispositivo", true);
  }
  if (!firmado.length) bajar(bytes, nombre);
  await updateDoc(D("contratos", cid), { estado: "firmado", firmado, firmadoEl: serverTimestamp(), firmaElectronica: true });
}
async function enviarAFirmar(cid, c) {
  const firmantes = firmantesDe(c.datos);
  const huella = await huellaDe(c);
  await updateDoc(D("contratos", cid), {
    estado: "firmando",
    firmantes,
    firmantesIds: firmantes.map((f) => f.fid),
    huella,
    enviadoAFirmar: serverTimestamp()
  });
  if (c.invitacionId) await updateDoc(D("invitaciones", c.invitacionId), { contratos: arrayUnion(cid) });
}
async function vistaContrato(id) {
  const s = await getDoc(D("contratos", id));
  if (!s.exists()) return pintar(cabVolver("Contrato no encontrado", "", "#/contratos"), "contratos");
  const c = s.data();
  const firmas2 = c.estado === "generado" ? {} : await firmasDe(id);
  const total = (c.firmantes || []).length;
  const hechas = (c.firmantes || []).filter((f) => firmas2[f.fid]).length;
  const completo = total > 0 && hechas === total;
  const ladoInquilino = (c.firmantes || []).filter((f) => f.rol !== "arrendador");
  const ladoInquilinoListo = ladoInquilino.length > 0 && ladoInquilino.every((f) => firmas2[f.fid]);
  const paso = (t, sub, hecho) => `<div class="paso ${hecho ? "hecho" : ""}"><i>${hecho ? ICO.ok : ""}</i><div><b>${t}</b><small>${sub}</small></div></div>`;
  const firm = c.estado === "firmando" ? bloqueFirmantes(
    id,
    c,
    firmas2,
    (f) => f.rol !== "arrendador" || ladoInquilinoListo,
    () => vistaContrato(id),
    { etiquetaEspera: (f) => f.rol === "arrendador" ? "Firma al final" : "Pendiente" }
  ) : null;
  pintar(`${cabVolver(`Contrato ${c.curso}`, `${c.pisoNombre}${c.datos?.habitacion ? " \xB7 Habitaci\xF3n " + c.datos.habitacion : ""}`, "#/contratos")}
    <div class="seccion">
      <div class="tarjeta"><div class="nombre" style="word-break:break-all">${esc(c.nombreArchivo)}</div>
        <div class="meta">${esc(c.inquilinos?.join(", "))}</div>
        ${(c.enDrive || []).map((d) => `<a class="meta" style="color:var(--salvia-osc);font-weight:600" href="${esc(d.link)}" target="_blank" rel="noopener">\u2713 Renta ${d.a\u00F1o} / Contratos / ${esc(c.pisoNombre)}</a>`).join("") || '<div class="meta">No est\xE1 en Drive (se descarg\xF3 en el dispositivo)</div>'}</div>
      <details class="tarjeta"><summary style="font-weight:600;cursor:pointer;min-height:28px">Leer el contrato</summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(c)}</div></details>
      <div class="tarjeta"><div class="eti-campo">Estado</div><div class="pasos">
        ${paso("Contrato generado", fechaCorta(c.creada), true)}
        ${paso("Enviado a firmar", c.estado === "generado" ? "Cuando lo revises, env\xEDalo a firmar" : fechaCorta(c.enviadoAFirmar), c.estado !== "generado")}
        ${paso(`Firmas (${hechas} de ${total || "\u2014"})`, completo ? "Han firmado todos" : "Cada persona firma su parte", completo || c.estado === "firmado")}
        ${paso("Guardado firmado en Drive", c.estado === "firmado" ? fechaCorta(c.firmadoEl) : "Se guarda al completar las firmas", c.estado === "firmado")}
      </div></div>
      ${c.estado === "firmando" && c.invitacionId ? cajaEnlace({ pisoNombre: c.pisoNombre }, c.invitacionId).replace("Enlace para el inquilino", "Enlace para que firmen") : ""}
      ${firm ? `<div class="eti-campo">Firmantes</div>${firm.html}<p class="ayuda">${ladoInquilinoListo ? "Ya han firmado el inquilino y sus avalistas: ahora os toca a vosotros." : "Primero firman el inquilino y sus avalistas (desde su enlace o aqu\xED mismo si est\xE1n con vosotros). Vosotros firm\xE1is al final."}</p>` : ""}
      ${c.estado === "firmado" && c.firmaElectronica ? `<div class="tarjeta"><div class="eti-campo">Copia del inquilino</div>
        ${c.copiaHabilitada ? `<div class="meta">El inquilino ya puede descargar su copia firmada desde su enlace.</div>
             ${c.invitacionId ? `<a class="btn salvia" href="https://wa.me/?text=${encodeURIComponent(`Ya est\xE1 firmado el contrato de ${c.pisoNombre}. Puedes descargar tu copia aqu\xED: ${enlaceInquilino(c.invitacionId)}`)}" target="_blank" rel="noopener">Avisar por WhatsApp</a>` : ""}` : `<div class="meta">Todav\xEDa no puede descargarla. Habil\xEDtala cuando lo hayas revisado todo.</div>
             <button class="btn primario" id="habilitar-copia">Habilitar copia para el inquilino</button>`}</div>` : ""}
      ${c.plantilla === "larga_duracion" ? `<div class="tarjeta"><div class="eti-campo">Vigencia</div>
        ${c.finalizado ? `<div class="meta">Finalizado el ${fechaLarga(c.finalizado)}. Ya no se copia a nuevos a\xF1os de renta.</div>` : `<div class="meta">Vigente: se copia autom\xE1ticamente a cada nueva carpeta de Renta.</div>
             <div class="rejilla">${campo("Fecha de fin", "finalizado", hoyISO(), 'type="date" id="fin-fecha"')}<button class="btn secundario" id="finalizar" style="align-self:end">Marcar como finalizado</button></div>`}</div>` : ""}
      ${c.firmado?.length ? c.firmado.map((d) => `<a class="tarjeta" href="${esc(d.link)}" target="_blank" rel="noopener"><div class="nombre">Ver contrato firmado</div><div class="meta">Renta ${d.a\u00F1o}</div></a>`).join("") : ""}
    </div>
    <div class="acciones">
      ${c.estado === "generado" ? `<a class="btn secundario ancho" href="#/editar/${id}">${c.bloques?.length ? "Seguir editando el texto" : "Editar el texto del contrato"}</a>
        <button class="btn primario ancho" id="enviar">Enviar a firmar</button>` : ""}
      ${c.estado === "firmando" && hechas === 0 ? '<button class="btn secundario ancho" id="volver-editar">Cancelar el env\xEDo y editar el texto</button>' : ""}
      ${c.estado === "firmando" && completo ? '<button class="btn primario ancho" id="archivar">Guardar contrato firmado en Drive</button>' : ""}
      <div class="dos">
        <button class="btn secundario" id="descargar">Descargar PDF</button>
        <label class="btn secundario">Subir firmado en papel<input type="file" accept="application/pdf,image/*" id="firmado" hidden></label>
      </div>
    </div>`, "contratos");
  if (firm) firm.montar(app);
  if ($("#copiar")) $("#copiar").onclick = async (e) => {
    const url = e.currentTarget.dataset.url;
    await compartir("Firma de tu contrato", url);
  };
  if ($("#volver-editar")) $("#volver-editar").onclick = async () => {
    if (!preguntar("El enlace de firma dejar\xE1 de funcionar hasta que lo env\xEDes de nuevo. \xBFContinuar?")) return;
    await updateDoc(D("contratos", id), { estado: "generado", huella: "" });
    location.hash = `#/editar/${id}`;
  };
  if ($("#habilitar-copia")) $("#habilitar-copia").onclick = async () => {
    await updateDoc(D("contratos", id), { copiaHabilitada: true, copiaHabilitadaEl: serverTimestamp() });
    aviso("Copia habilitada: ya puede descargarla");
    vistaContrato(id);
  };
  if ($("#finalizar")) $("#finalizar").onclick = async () => {
    await updateDoc(D("contratos", id), { finalizado: $("#fin-fecha").value });
    aviso("Contrato marcado como finalizado");
    vistaContrato(id);
  };
  if ($("#enviar")) $("#enviar").onclick = async () => {
    await enviarAFirmar(id, c);
    aviso("Listo: ya pueden firmar desde su enlace");
    vistaContrato(id);
  };
  if ($("#archivar")) $("#archivar").onclick = async (e) => {
    e.target.disabled = true;
    e.target.textContent = "Guardando\u2026";
    try {
      await archivarFirmado(id, c);
      aviso("Contrato firmado guardado");
      vistaContrato(id);
    } catch (err) {
      aviso("Error: " + err.message, true);
      e.target.disabled = false;
    }
  };
  $("#descargar").onclick = async () => {
    const piso = c.pisoId ? (await getDoc(D("pisos", c.pisoId))).data() : null;
    const fotos = c.datos.conFotos ? await fotosDelPiso(piso).catch(() => null) : null;
    bajar(await construirPdf(bloquesDe(c), fotos, firmas2), c.nombreArchivo);
  };
  $("#firmado").onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      const ajustes = await leerAjustes();
      const inv = { pisoNombre: c.pisoNombre, plantilla: c.plantilla, fechaInicio: c.datos.fechaInicio, fechaFin: c.datos.fechaFin };
      let carpetas = (c.enDrive || []).map((d) => ({ a\u00F1o: d.a\u00F1o, id: d.carpetaId }));
      if (!carpetas.length) carpetas = await carpetasDestino(ajustes, inv);
      if (!carpetas.length) return aviso("Configura Google Drive en Ajustes", true);
      const ext = archivo.type === "application/pdf" ? "pdf" : archivo.name.split(".").pop() || "jpg";
      const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado." + ext;
      const bytes = await archivo.arrayBuffer();
      aviso("Subiendo\u2026");
      let firmado;
      try {
        firmado = await subirATodas(bytes, nombre, carpetas, archivo.type || "application/pdf");
      } catch (err) {
        if (err.status !== 404 && err.status !== 403) throw err;
        firmado = await subirATodas(bytes, nombre, await carpetasDestino(ajustes, inv), archivo.type || "application/pdf");
      }
      await updateDoc(D("contratos", id), { estado: "firmado", firmado, firmadoEl: serverTimestamp() });
      aviso("Contrato firmado guardado");
      vistaContrato(id);
    } catch (err) {
      aviso("No se pudo subir: " + err.message, true);
    }
  };
}
async function vistaFirmaInquilino(token2, inv, contratos) {
  const bloques = [];
  for (const { id, c } of contratos) {
    const estados = await estadosDe(id);
    const intacto = await huellaDe(c) === c.huella;
    const suyos = c.firmantes.filter((f) => f.rol !== "arrendador");
    const pendientes = suyos.filter((f) => !estados[f.fid]).length;
    const copia = c.estado === "firmado" && c.copiaHabilitada;
    const firm = bloqueFirmantes(
      id,
      c,
      estados,
      (f) => f.rol !== "arrendador" && c.estado === "firmando" && intacto,
      () => vistaInquilino(token2),
      { soloEstos: (f) => f.rol !== "arrendador" }
    );
    bloques.push({ id, c, firm, pendientes, intacto, copia });
  }
  const todasCopias = bloques.every((b) => b.copia);
  const sub = `${inv.pisoNombre}${inv.habitacion ? " \xB7 Habitaci\xF3n " + inv.habitacion : ""}`;
  const estadoTexto = (b) => {
    if (b.copia) return "";
    if (b.pendientes > 0) return "";
    if (b.c.estado === "firmado") return '<p class="ayuda">El contrato est\xE1 firmado por todas las partes. Tu arrendador te avisar\xE1 cuando puedas descargar tu copia.</p>';
    return '<p class="ayuda">\xA1Gracias! Ya hab\xE9is firmado todos. Ahora firmar\xE1n los arrendadores y te avisar\xE1n cuando tengas tu copia.</p>';
  };
  pintar(`<div class="hero"><div class="eti">${esc(sub)}</div>
      <h1>${todasCopias ? "Contrato firmado" : "Firma tu contrato"}</h1>
      <p>${todasCopias ? "Ya est\xE1 firmado por todas las partes. Aqu\xED tienes tu copia." : "L\xE9elo o desc\xE1rgalo con calma. Despu\xE9s, cada persona firma su parte: t\xFA como arrendatario y cada avalista como fiador."}</p></div>
    ${bloques.map((b) => `<div class="seccion">
      ${bloques.length > 1 ? `<div class="eti-campo">Contrato de ${esc(b.c.inquilinos.join(", "))}</div>` : ""}
      ${!b.intacto ? '<div class="tarjeta" style="color:#A2321F">Este contrato se ha modificado despu\xE9s de enviarse. Pide a tu arrendador que lo env\xEDe de nuevo.</div>' : ""}
      ${b.copia ? `<button class="btn primario" data-copia="${b.id}">Descargar mi copia firmada</button>` : `<details class="tarjeta"><summary style="font-weight:600;cursor:pointer;min-height:28px">Leer el contrato completo</summary>
             <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(b.c)}</div></details>
           <button class="btn secundario" data-borrador="${b.id}">Descargar el contrato en PDF (sin firmas)</button>`}
      ${b.firm.html}
      <div class="tarjeta" style="background:transparent;border:1px dashed var(--borde)"><div class="meta">Los arrendadores firman al final, cuando hay\xE1is firmado todos.</div></div>
      ${estadoTexto(b)}
    </div>`).join("")}`);
  bloques.forEach((b) => b.firm.montar(app));
  $$("[data-borrador]").forEach((btn) => btn.onclick = async () => {
    const b = bloques.find((x) => x.id === btn.dataset.borrador);
    bajar(await construirPdf(bloquesDe(b.c).filter((x) => x.type !== "annex")), b.c.nombreArchivo);
  });
  $$("[data-copia]").forEach((btn) => btn.onclick = async () => {
    const b = bloques.find((x) => x.id === btn.dataset.copia);
    const firmas2 = await firmasDe(b.id);
    bajar(await construirPdf(bloquesDe(b.c).filter((x) => x.type !== "annex"), null, firmas2), b.c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado.pdf");
  });
}
async function vistaInquilino(token2) {
  const noValido = () => pintar(`<div class="gracias"><h1>Enlace no v\xE1lido</h1><p class="ayuda">Pide a tu arrendador un enlace nuevo.</p></div>`);
  const cid = await cuentaDeEnlace(token2);
  if (!cid) return noValido();
  fijarCuenta(cid);
  const s = await getDoc(D("invitaciones", token2)).catch(() => null);
  if (!s || !s.exists()) return noValido();
  const inv = s.data();
  if (inv.contratos?.length) {
    const cs = [];
    for (const cid2 of inv.contratos) {
      const cs1 = await getDoc(D("contratos", cid2)).catch(() => null);
      if (cs1?.exists() && ["firmando", "firmado"].includes(cs1.data().estado)) cs.push({ id: cid2, c: cs1.data() });
    }
    if (cs.length) return vistaFirmaInquilino(token2, inv, cs);
  }
  if (inv.estado !== "abierta") return pintar(`<div class="gracias"><h1>Este enlace ya est\xE1 cerrado</h1><p class="ayuda">Si necesitas cambiar alg\xFAn dato, escribe directamente a tu arrendador.</p></div>`);
  const clave = "borrador-" + token2;
  let borrador = {};
  try {
    borrador = JSON.parse(localStorage.getItem(clave) || "{}");
  } catch {
  }
  const guardarBorrador = () => {
    try {
      localStorage.setItem(clave, JSON.stringify(borrador));
    } catch {
    }
  };
  const esEstudiante = inv.plantilla !== "larga_duracion";
  if (!borrador.avales) borrador.avales = esEstudiante ? [{ parentesco: "Madre" }, { parentesco: "Padre" }] : [];
  let paso = 1;
  const sub = `${inv.pisoNombre}${inv.habitacion ? " \xB7 Habitaci\xF3n " + inv.habitacion : !porHabitacion(inv.plantilla) && inv.plantilla !== "larga_duracion" ? " \xB7 Piso entero" : ""}`;
  const hero = (titulo, texto) => `<div class="hero"><div class="eti">${esc(sub)}</div><h1>${titulo}</h1><p>${texto}</p>
    <div class="progreso">${[1, 2, 3].map((n) => `<span class="${n <= paso ? "on" : ""}"></span>`).join("")}</div>
    <p style="font-size:12px">Paso ${paso} de 3</p></div>`;
  const mostrar = () => {
    if (paso === 1) {
      pintar(`${hero("Tus datos para el contrato", (inv.plazas || 1) > 1 ? "Cada compa\xF1ero rellena sus propios datos con este mismo enlace." : "Solo te llevar\xE1 un par de minutos.")}
        <form class="seccion" id="f">${camposPersona("p_", borrador, { contacto: true, domicilio: true })}</form>
        <div class="acciones"><button class="btn primario ancho" id="sig">Siguiente</button></div>`);
      const f = $("#f");
      activarSegmentos(f);
      f.addEventListener("input", () => {
        Object.assign(borrador, leerPersona(f, "p_"));
        guardarBorrador();
      });
      f.addEventListener("change", () => {
        Object.assign(borrador, leerPersona(f, "p_"));
        guardarBorrador();
      });
      $("#sig").onclick = () => {
        const p2 = leerPersona(f, "p_");
        if (!validarPersona(f, "p_", p2, { domicilio: true })) return;
        if (!p2.telefono && !p2.email) return aviso("Deja al menos un tel\xE9fono o un email", true);
        Object.assign(borrador, p2);
        guardarBorrador();
        paso = 2;
        mostrar();
      };
    } else if (paso === 2) {
      pintar(`${hero(esEstudiante ? "\xBFQui\xE9n te avala?" : "Avalistas", esEstudiante ? "Normalmente tu padre y tu madre. Si es otra persona, cambia el parentesco." : "Solo si te lo han pedido. Si no, pulsa Siguiente.")}
        <form class="seccion" id="f"><div data-avales>${borrador.avales.map((a, j) => tarjetaAval(a, j)).join("")}</div>
          <button type="button" class="btn fantasma" id="mas">+ A\xF1adir otro avalista</button></form>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atr\xE1s</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      const f = $("#f");
      activarSegmentos(f);
      const leer = () => $$("[data-aval]", f).map((el) => leerPersona(f, `a${el.dataset.aval}_`));
      $("#mas").onclick = () => {
        borrador.avales = [...leer(), {}];
        mostrar();
      };
      f.addEventListener("click", (e) => {
        const q = e.target.closest("[data-quitar]");
        if (!q) return;
        const lista = leer();
        lista.splice(+q.dataset.quitar, 1);
        borrador.avales = lista;
        guardarBorrador();
        mostrar();
      });
      $("#atras").onclick = () => {
        borrador.avales = leer();
        guardarBorrador();
        paso = 1;
        mostrar();
      };
      $("#sig").onclick = () => {
        const lista = leer().filter((a) => a.nombre || a.numDoc);
        let ok = true;
        $$("[data-aval]", f).forEach((el) => {
          const j = el.dataset.aval;
          const a = leerPersona(f, `a${j}_`);
          if (a.nombre || a.numDoc) ok = validarPersona(f, `a${j}_`, a) && ok;
        });
        if (!ok) return;
        if (esEstudiante && !lista.length) return aviso("Hace falta al menos un avalista", true);
        borrador.avales = lista;
        guardarBorrador();
        paso = 3;
        mostrar();
      };
    } else {
      const fila = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
      pintar(`${hero("Revisa y env\xEDa", "Comprueba que todo est\xE1 bien escrito: as\xED aparecer\xE1 en el contrato.")}
        <div class="seccion revision">
          <div class="tarjeta"><dl>${fila("Nombre", `${borrador.tratamiento} ${borrador.nombre}`)}${fila(borrador.tipoDoc, borrador.numDoc)}${fila("Domicilio", borrador.domicilio)}${fila("Tel\xE9fono", borrador.telefono)}${fila("Email", borrador.email)}</dl></div>
          ${borrador.avales.map((a) => `<div class="tarjeta"><div class="eti-campo">Avalista${a.parentesco ? " \xB7 " + esc(a.parentesco) : ""}</div><dl>${fila("Nombre", `${a.tratamiento} ${a.nombre}`)}${fila(a.tipoDoc, a.numDoc)}</dl></div>`).join("")}
          <label class="check"><input type="checkbox" id="acepto">
            <span>${TEXTO_CONSENTIMIENTO(inv.arrendadores)}</span></label>
        </div>
        <div class="acciones"><button class="btn primario ancho" id="enviar">Enviar datos</button><button class="btn secundario" id="atras">Atr\xE1s</button></div>`);
      $("#atras").onclick = () => {
        paso = 2;
        mostrar();
      };
      $("#enviar").onclick = async () => {
        if (!$("#acepto").checked) return aviso("Marca la casilla de consentimiento", true);
        $("#enviar").disabled = true;
        const limpio = (p2) => ({ tratamiento: p2.tratamiento, nombre: p2.nombre, tipoDoc: p2.tipoDoc, numDoc: p2.numDoc, parentesco: p2.parentesco || "" });
        try {
          await addDoc(C("invitaciones", token2, "respuestas"), {
            tratamiento: borrador.tratamiento,
            nombre: borrador.nombre,
            tipoDoc: borrador.tipoDoc,
            numDoc: borrador.numDoc,
            domicilio: borrador.domicilio,
            telefono: borrador.telefono || "",
            email: borrador.email || "",
            avales: borrador.avales.map(limpio),
            consentimiento: true,
            enviada: serverTimestamp()
          });
          try {
            localStorage.removeItem(clave);
          } catch {
          }
          pintar(`<div class="gracias"><div class="circulo">${ICO.ok.replace(/14/g, "34")}</div>
            <h1>\xA1Gracias, ${esc(borrador.nombre.split(" ")[0])}!</h1>
            <p class="ayuda">Hemos recibido tus datos. Te enviaremos el contrato para firmar en cuanto est\xE9 listo.</p></div>`);
        } catch (e) {
          aviso("No se pudo enviar. Int\xE9ntalo de nuevo en un momento.", true);
          $("#enviar").disabled = false;
        }
      };
    }
  };
  const tarjetaAval = (a, j) => `<div class="tarjeta" data-aval="${j}">
      <div class="fila"><div class="nombre">Avalista ${j + 1}</div><button type="button" class="btn peligro" data-quitar="${j}" style="min-height:36px">Quitar</button></div>
      ${camposPersona(`a${j}_`, a, { parentesco: true })}</div>`;
  mostrar();
}
function nombreFactura(proveedor, concepto, fecha, ext) {
  const limpio = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return `${limpio(proveedor) || "Factura"}_${limpio(concepto) || "Gasto"}_${fecha}.${ext}`;
}
async function carpetaFacturas(ajustes, a\u00F1o, piso) {
  const renta = await asegurarCarpeta([`Renta ${a\u00F1o}`, `renta${a\u00F1o}`], ajustes.carpetaDriveId);
  const facturas = await asegurarCarpeta(["Pisos facturas", "Facturas"], renta);
  return asegurarCarpeta([piso.carpetaFacturas, piso.nombre].filter(Boolean), facturas);
}
async function vistaFacturas() {
  const [pisos, facturas] = await Promise.all([listarPisos(), listar("facturas")]);
  if (!pisos.length) return pintar(`${cabVolver("Facturas")}<div class="vacio">Primero <a href="#/piso/nuevo">a\xF1ade un piso</a>.</div>`, "facturas");
  let piso = pisos[0];
  let archivo = null;
  pintar(`${cabVolver("Facturas", "Gastos de los pisos para la renta")}
    <div class="seccion">
      <div class="eti-campo">Piso</div>
      <div class="pildoras" id="pisos">${pisos.map((p2, i) => `<button type="button" data-id="${p2.id}" class="${i === 0 ? "on" : ""}">${esc(p2.nombre)}</button>`).join("")}</div>
      <div class="dos">
        <label class="btn primario">${ICO.camara} Hacer foto<input type="file" accept="image/*" capture="environment" id="foto" hidden></label>
        <label class="btn secundario" style="min-height:52px">Subir archivo<input type="file" accept="image/*,application/pdf" id="archivo" hidden></label>
      </div>
      <div class="tarjeta" id="elegido" style="display:none"><div class="fila"><div class="nombre" id="elegido-nombre"></div><span class="chip ok">Listo</span></div>
        <img id="vista" alt="" style="max-width:100%;border-radius:12px;display:none"></div>
      <form id="f" class="seccion" style="padding:0">
        <div class="rejilla">${campo("Proveedor", "proveedor", "", 'placeholder="JYSK, Ikea, Endesa\u2026"')}${campo("Concepto", "concepto", "", 'placeholder="Escritorio"')}</div>
        <div class="rejilla">${campo("Fecha de la factura", "fecha", hoyISO(), 'type="date"')}${campo("Importe (\u20AC, opcional)", "importe", "", 'inputmode="decimal"')}</div>
      </form>
      <p class="ayuda" id="destino"></p>
    </div>
    <div class="acciones"><button class="btn primario ancho" id="guardar">Guardar factura</button></div>
    ${facturas.length ? `<div class="titulo-seccion"><h2>\xDAltimas facturas</h2></div>
      <div class="seccion">${facturas.slice(0, 20).map((x) => `
        <a class="tarjeta" href="${esc(x.link || "#")}" target="_blank" rel="noopener"><div class="fila"><div>
          <div class="nombre">${esc(x.proveedor || "Factura")} \xB7 ${esc(x.concepto || "")}</div>
          <div class="meta">${esc(x.pisoNombre)} \xB7 ${fechaLarga(x.fecha)}</div></div>
          ${x.importe ? `<span class="chip gris">${euros(x.importe)}</span>` : ""}</div></a>`).join("")}</div>` : ""}`, "facturas");
  const f = $("#f");
  const destino = () => {
    const a\u00F1o = (f.fecha.value || hoyISO()).slice(0, 4);
    $("#destino").textContent = `Se guardar\xE1 en Rentas / Renta ${a\u00F1o} / Pisos facturas / ${piso.carpetaFacturas || piso.nombre}`;
  };
  destino();
  f.fecha.addEventListener("change", destino);
  $("#pisos").onclick = (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    $$("#pisos button").forEach((x) => x.classList.toggle("on", x === b));
    piso = pisos.find((p2) => p2.id === b.dataset.id);
    destino();
  };
  const elegir2 = (e) => {
    archivo = e.target.files[0];
    if (!archivo) return;
    $("#elegido").style.display = "";
    $("#elegido-nombre").textContent = archivo.name;
    const img = $("#vista");
    if (archivo.type.startsWith("image/")) {
      img.src = URL.createObjectURL(archivo);
      img.style.display = "";
    } else img.style.display = "none";
  };
  $("#foto").onchange = elegir2;
  $("#archivo").onchange = elegir2;
  $("#guardar").onclick = async (e) => {
    if (!archivo) return aviso("Haz una foto o elige el archivo de la factura", true);
    const ajustes = await leerAjustes();
    if (!await raizDrive(ajustes)) return aviso("Configura Google Drive en Ajustes", true);
    const fecha = f.fecha.value || hoyISO();
    const ext = archivo.type === "application/pdf" ? "pdf" : (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const nombre = nombreFactura(f.proveedor.value, f.concepto.value, fecha, ext);
    e.target.disabled = true;
    e.target.textContent = "Subiendo\u2026";
    try {
      const carpeta = await carpetaFacturas(ajustes, fecha.slice(0, 4), piso);
      const r = await subirPdf(await archivo.arrayBuffer(), nombre, carpeta, archivo.type || "image/jpeg");
      await addDoc(C("facturas"), {
        pisoId: piso.id,
        pisoNombre: piso.nombre,
        proveedor: f.proveedor.value.trim(),
        concepto: f.concepto.value.trim(),
        fecha,
        importe: f.importe.value.trim(),
        nombre,
        driveId: r.id,
        link: r.webViewLink,
        creada: serverTimestamp(),
        creadaPor: usuario.email
      });
      aviso(`Guardada: ${nombre}`);
      vistaFacturas();
    } catch (err) {
      aviso("No se pudo subir: " + err.message, true);
      e.target.disabled = false;
      e.target.textContent = "Guardar factura";
    }
  };
}
var CCAA = [
  "Andaluc\xEDa",
  "Arag\xF3n",
  "Principado de Asturias",
  "Illes Balears",
  "Canarias",
  "Cantabria",
  "Castilla-La Mancha",
  "Castilla y Le\xF3n",
  "Catalu\xF1a",
  "Comunitat Valenciana",
  "Extremadura",
  "Galicia",
  "Comunidad de Madrid",
  "Regi\xF3n de Murcia",
  "Comunidad Foral de Navarra",
  "Pa\xEDs Vasco",
  "La Rioja",
  "Ceuta",
  "Melilla"
];
function enlacesLegales() {
  return `<p class="ayuda" style="text-align:center;font-size:12px">
    <a href="#/legal/privacidad">Privacidad</a> \xB7 <a href="#/legal/terminos">Condiciones</a> \xB7 <a href="#/legal/aviso">Aviso legal</a></p>`;
}
async function vistaLogin() {
  const demo = esc((CONFIG.urlApp || location.pathname) + "?demo#/");
  const nombre = esc(CONFIG.nombreApp || "Contratos de alquiler");
  const precio = CONFIG.pago?.precio;
  const IC_C = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:6px"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>`, IC_D = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:6px"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/></svg>`;
  const firma = `<svg viewBox="0 0 160 44" width="120" height="33" aria-hidden="true"><path d="M6 32c10-18 18-22 22-14s-6 18 2 16 12-22 20-20-4 20 6 18 14-16 22-14 2 12 10 12 18-10 28-12 16 4 30 2" fill="none" stroke="#2B2350" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  pintar(`<div class="portada">
    <header class="p-top">
      <div class="p-marca">${nombre}</div>
      <button class="btn secundario p-entrar" data-entrar>Entrar</button>
    </header>

    <section class="p-hero">
      <div class="p-hero-texto">
        <div class="p-eti">Para propietarios que alquilan pisos y habitaciones</div>
        <h1>Del primer mensaje al contrato firmado, sin papeles.</h1>
        <p class="p-sub">Mandas un enlace a tu inquilino. \xC9l rellena sus datos y los de sus avalistas desde el m\xF3vil, el contrato se genera solo y lo firma cada uno con el dedo. El PDF firmado acaba ordenado en tu Google Drive, junto a las facturas de cada piso, listo para la declaraci\xF3n de la renta.</p>
        <div class="p-ctas">
          <button class="btn primario" data-entrar>Solicitar acceso</button>
          <a class="btn secundario" href="${demo}">Ver la demo</a>
        </div>
        <p class="p-nota">Beta privada \xB7 gratis durante la beta \xB7 la demo no necesita registro</p>
      </div>
      <div class="p-movil" aria-hidden="true">
        <div class="p-pantalla">
          <div class="p-m-cab"><small>MARTES, 3 DE SEPTIEMBRE</small><b>Hola, Carmen</b></div>
          <div class="p-m-stats"><span><b>3</b>Pisos</span><span><b>1</b>Pendiente</span><span><b>5</b>Firmados</span></div>
          <div class="p-m-card"><div><b>Piso Centro \xB7 Hab. 2</b><small>Habitaci\xF3n \xB7 Valencia</small></div><i class="chip ok">Datos recibidos</i></div>
          <div class="p-m-card"><div><b>\xC1tico Jardines</b><small>Piso entero \xB7 3 inquilinos</small></div><i class="chip espera">2/5 firmas</i></div>
          <div class="p-m-card"><div><b>Casa del R\xEDo</b><small>Larga duraci\xF3n</small></div><i class="chip ok">Firmado</i></div>
          <div class="p-m-btn">+ Nuevo inquilino</div>
        </div>
      </div>
    </section>

    <section class="p-bloque">
      <h2>C\xF3mo funciona</h2>
      <ol class="p-pasos">
        <li><b>Creas un enlace</b><span>Eliges el piso, la habitaci\xF3n, la renta y c\xF3mo se paga la luz. Lo mandas por WhatsApp.</span></li>
        <li><b>El inquilino rellena sus datos</b><span>Nombre, DNI (se comprueba la letra), domicilio y sus avalistas. Sin instalar nada.</span></li>
        <li><b>Se genera el contrato</b><span>A partir de modelos basados en la Ley de Arrendamientos Urbanos. Puedes cambiar cualquier p\xE1rrafo antes de enviarlo.</span></li>
        <li><b>Firman todos desde el m\xF3vil</b><span>Inquilino, avalistas y propietarios, cada uno su parte. El PDF firmado se guarda en tu Drive.</span></li>
      </ol>
    </section>

    <section class="p-bloque p-dos">
      <div class="p-muestra">
        <div class="p-eti">As\xED firma tu inquilino</div>
        <div class="p-tarjeta">
          <div class="fila"><div><b>Luc\xEDa Mart\xEDn</b><small>Arrendataria</small></div><i class="chip ok">Firmado</i></div>
          <div class="p-firma">${firma}</div>
          <small>3 de septiembre de 2026, 18:42 \xB7 huella del documento registrada</small>
        </div>
        <div class="p-tarjeta"><div class="fila"><div><b>Ana Mart\xEDn</b><small>Fiadora de Luc\xEDa Mart\xEDn</small></div><i class="chip gris">Pendiente</i></div></div>
      </div>
      <div class="p-muestra">
        <div class="p-eti">Y as\xED queda en tu Drive</div>
        <div class="p-tarjeta p-arbol">
          <div>${IC_C}Alquileres</div>
          <div class="n1">${IC_C}Renta 2026</div>
          <div class="n2">${IC_C}Contratos</div>
          <div class="n3">${IC_C}Piso Centro</div>
          <div class="n4">${IC_D}Contrato_PisoCentro_Hab2_LuciaMartin_firmado.pdf</div>
          <div class="n2">${IC_C}Pisos facturas</div>
          <div class="n3">${IC_C}Piso Centro</div>
          <div class="n4">${IC_D}Ikea_Escritorio_2026-08-20.jpg</div>
        </div>
        <small class="p-pie">Los contratos de curso (septiembre a julio) se guardan en los dos a\xF1os de la renta.</small>
      </div>
    </section>

    <section class="p-bloque">
      <h2>Todo lo que necesitas para alquilar</h2>
      <div class="p-rejilla">
        <div><b>Habitaciones, piso entero o larga duraci\xF3n</b><span>Un modelo para cada caso, con fianza, avalistas y pr\xF3rrogas seg\xFAn la ley.</span></div>
        <div><b>Luz y agua a tu manera</b><span>Incluidas, cuota fija, cuota con regularizaci\xF3n o cambio de titularidad.</span></div>
        <div><b>Contratos editables</b><span>Cambia, quita o a\xF1ade cl\xE1usulas. Gu\xE1rdalas en tu modelo para los siguientes.</span></div>
        <div><b>Facturas para la renta</b><span>Haz una foto al ticket y se guarda en la carpeta del piso y del a\xF1o.</span></div>
        <div><b>Para copropietarios</b><span>Invita a tu pareja o socio: los dos veis y firm\xE1is lo mismo.</span></div>
        <div><b>Tus datos, en tu Drive</b><span>Los documentos son tuyos. Puedes descargar o borrar tu cuenta cuando quieras.</span></div>
      </div>
    </section>

    <section class="p-bloque p-precio">
      <div class="p-tarjeta p-plan">
        <div class="p-eti">Beta privada</div>
        <div class="p-cifra">Gratis</div>
        <p>Mientras dure la beta. ${precio ? `Despu\xE9s, ${esc(precio)} \u20AC al a\xF1o, sin renovaci\xF3n autom\xE1tica.` : "Te avisaremos antes de que termine, sin compromiso."}</p>
        <button class="btn primario" data-entrar>Solicitar acceso</button>
        <a class="btn secundario" href="${demo}">Ver la demo</a>
      </div>
    </section>

    <section class="p-bloque">
      <h2>Preguntas frecuentes</h2>
      <details class="p-faq"><summary>\xBFTiene validez la firma desde el m\xF3vil?</summary><p>Es una firma electr\xF3nica simple seg\xFAn el reglamento europeo eIDAS, v\xE1lida para contratos de alquiler. Se registran la firma, la aceptaci\xF3n expresa, la fecha y hora y una huella del texto firmado.</p></details>
      <details class="p-faq"><summary>\xBFEl inquilino tiene que instalar algo o registrarse?</summary><p>No. Abre el enlace que le mandas, rellena sus datos y firma. Nada m\xE1s.</p></details>
      <details class="p-faq"><summary>\xBFD\xF3nde se guardan los datos?</summary><p>Los datos de los contratos, en servidores de Google en la Uni\xF3n Europea (Madrid). Los PDF y las facturas, en tu propio Google Drive.</p></details>
      <details class="p-faq"><summary>\xBFLos modelos sustituyen a un abogado?</summary><p>No. Son modelos orientativos basados en la normativa vigente. Revisa cada contrato y ad\xE1ptalo a tu caso antes de enviarlo.</p></details>
    </section>

    <footer class="p-pie-final">
      ${usuario ? `<p class="ayuda">Has entrado como ${esc(usuario.email)} \xB7 <a href="#" id="salir">usar otra cuenta</a></p>` : ""}
      <p class="ayuda">Al entrar aceptas las <a href="#/legal/terminos">condiciones de uso</a> y la <a href="#/legal/privacidad">pol\xEDtica de privacidad</a>.</p>
      ${enlacesLegales()}
    </footer>
  </div>`);
  app.classList.add("ancho");
  $$("[data-entrar]").forEach((b) => b.onclick = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      aviso("No se pudo iniciar sesi\xF3n: " + e.message, true);
    }
  });
  if ($("#salir")) $("#salir").onclick = (e) => {
    e.preventDefault();
    signOut(auth);
  };
}
function vistaLegal(slug2) {
  const titulo = LEGALES[slug2] || "Informaci\xF3n legal";
  pintar(`${cabVolver(titulo, CONFIG.nombreApp || "", usuario ? "#/ajustes" : "#/")}
    <div class="seccion" style="gap:12px;font-size:14px">${paginaLegal(slug2)}</div>
    <div class="acciones">${enlacesLegales()}</div>`);
}
function editorPropietarios(cont, lista) {
  const pintarLista = () => {
    cont.innerHTML = lista.map((p2, i) => `<div class="tarjeta" data-prop="${i}">
        <div class="fila"><div class="eti-campo">Propietario ${i + 1}</div>
        ${lista.length > 1 ? `<button type="button" class="btn peligro" data-quitar-prop="${i}" style="min-height:36px">Quitar</button>` : ""}</div>
        ${camposPersona(`o${i}_`, p2)}</div>`).join("") + (lista.length < 4 ? `<button type="button" class="btn fantasma" data-mas-prop>+ A\xF1adir copropietario</button>` : "");
    activarSegmentos(cont);
    const mas = cont.querySelector("[data-mas-prop]");
    if (mas) mas.onclick = () => {
      leer();
      lista.push({ tipoDoc: "DNI" });
      pintarLista();
    };
    cont.querySelectorAll("[data-quitar-prop]").forEach((b) => b.onclick = () => {
      leer();
      lista.splice(+b.dataset.quitarProp, 1);
      pintarLista();
    });
  };
  const leer = () => lista.forEach((_, i) => lista[i] = leerPersona(cont, `o${i}_`));
  pintarLista();
  return {
    leer: () => {
      leer();
      return lista.map(({ tratamiento, nombre, tipoDoc, numDoc }) => ({ tratamiento, nombre, tipoDoc, numDoc }));
    },
    validar: () => {
      leer();
      let ok = true;
      lista.forEach((p2, i) => {
        ok = validarPersona(cont, `o${i}_`, p2) && ok;
      });
      return ok;
    }
  };
}
function normalizarIban(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}
var ibanValido = (iban) => /^ES\d{2}( \d{4}){5}$/.test(iban);
function selectCcaa(valor) {
  return `<label class="campo">Comunidad aut\xF3noma de tus pisos<select name="ccaa"><option value="">Sin indicar</option>
    ${CCAA.map((c) => `<option ${c === valor ? "selected" : ""}>${c}</option>`).join("")}</select></label>`;
}
async function vistaBienvenida() {
  const a = await leerAjustes();
  let paso = 1;
  const props = JSON.parse(JSON.stringify(a.propietarios?.length ? a.propietarios : [{ nombre: usuario.displayName || "", tipoDoc: "DNI" }]));
  const datos = { domicilio: a.domicilio || "", iban: a.iban || "", ciudadFirma: a.ciudadFirma || "", ccaa: a.condiciones?.ccaa || "", modoDrive: a.modoDrive || "propia" };
  let editor;
  const cab = (t, sub) => `<div class="hero"><div class="eti">Bienvenida \xB7 ${paso} de 4</div><h1>${t}</h1><p>${sub}</p>
    <div class="progreso" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map((n) => `<span class="${n <= paso ? "on" : ""}"></span>`).join("")}</div></div>`;
  const guardar = async (extra = {}) => setDoc(D("ajustes", "general"), {
    propietarios: props,
    domicilio: datos.domicilio,
    iban: datos.iban,
    ciudadFirma: datos.ciudadFirma,
    modoDrive: datos.modoDrive,
    condiciones: { ...a.condiciones || {}, ccaa: datos.ccaa },
    ...extra
  }, { merge: true });
  const mostrar = () => {
    if (paso === 1) {
      pintar(`${cab("\xBFQui\xE9n alquila?", "Tus datos tal y como aparecer\xE1n en los contratos. Si el piso es de varias personas, a\xF1\xE1delas.")}
        <div class="seccion" id="props"></div>
        <div class="acciones"><button class="btn primario ancho" id="sig">Siguiente</button></div>`);
      editor = editorPropietarios($("#props"), props);
      $("#sig").onclick = () => {
        if (!editor.validar()) return;
        props.splice(0, props.length, ...editor.leer());
        paso = 2;
        mostrar();
      };
    } else if (paso === 2) {
      pintar(`${cab("Cobro y notificaciones", "D\xF3nde te llegan las notificaciones y d\xF3nde te pagan la renta.")}
        <form class="seccion" id="f">
          ${campo("Domicilio para notificaciones", "domicilio", datos.domicilio, 'placeholder="Calle, n\xFAmero, piso, CP y ciudad"')}
          ${campo("IBAN para el pago de la renta", "iban", datos.iban, 'autocapitalize="characters" placeholder="ES00 0000 0000 0000 0000 0000"')}
          ${campo("Ciudad donde sueles firmar", "ciudadFirma", datos.ciudadFirma)}
          ${selectCcaa(datos.ccaa)}
          <p class="ayuda">La comunidad aut\xF3noma se usa para la cl\xE1usula del dep\xF3sito de la fianza, que es obligatorio y cambia seg\xFAn la regi\xF3n.</p>
        </form>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atr\xE1s</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      const f = $("#f");
      $("#atras").onclick = () => {
        paso = 1;
        mostrar();
      };
      $("#sig").onclick = () => {
        datos.domicilio = f.domicilio.value.trim();
        datos.iban = normalizarIban(f.iban.value);
        datos.ciudadFirma = f.ciudadFirma.value.trim();
        datos.ccaa = f.ccaa.value;
        if (datos.domicilio.length < 8) return aviso("Escribe el domicilio completo", true);
        if (!ibanValido(datos.iban)) return aviso("El IBAN debe ser espa\xF1ol: ES + 22 n\xFAmeros", true);
        paso = 3;
        mostrar();
      };
    } else if (paso === 3) {
      pintar(`${cab("Tu Google Drive", "Aqu\xED se guardar\xE1n los contratos firmados y las facturas, ordenados por a\xF1o de la renta y por piso.")}
        <div class="seccion">
          <button type="button" class="opcion-luz ${datos.modoDrive === "propia" ? "on" : ""}" data-modo="propia"><b>Crear una carpeta \xAB${esc(CONFIG.carpetaRaiz || "Alquileres")}\xBB (recomendado)</b>
            <span>La app solo accede a esa carpeta. Dentro crea Renta AAAA / Contratos / Piso y Renta AAAA / Pisos facturas / Piso.</span></button>
          ${CONFIG.driveCompleto === false ? "" : `<button type="button" class="opcion-luz ${datos.modoDrive === "completo" ? "on" : ""}" data-modo="completo"><b>Usar carpetas que ya tengo</b>
            <span>Por ejemplo, una carpeta \xABRentas\xBB con tus Renta 2025, Renta 2026\u2026 Requiere permiso para ver tu Drive.</span></button>`}
          <button class="btn salvia" id="conectar">Conectar Google Drive</button>
          <p class="ayuda" id="estado-drive">${a.carpetaDriveNombre ? "Conectado: " + esc(a.carpetaDriveNombre) : "Puedes hacerlo ahora o m\xE1s tarde desde Ajustes."}</p>
        </div>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atr\xE1s</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      $$("[data-modo]").forEach((b) => b.onclick = () => {
        datos.modoDrive = b.dataset.modo;
        $$("[data-modo]").forEach((x) => x.classList.toggle("on", x === b));
      });
      $("#conectar").onclick = async () => {
        try {
          await guardar();
          const aj = await leerAjustes();
          if (datos.modoDrive === "completo") {
            const r = await elegir("carpeta");
            if (!r) return;
            await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
            a.carpetaDriveNombre = r.name;
          } else {
            if (aj.modoDrive !== "propia" || !aj.carpetaDriveId) {
              aj.carpetaDriveId = "";
              await raizDrive(aj);
            }
            a.carpetaDriveNombre = aj.carpetaDriveNombre;
          }
          $("#estado-drive").textContent = "Conectado: " + a.carpetaDriveNombre;
          aviso("Google Drive conectado");
        } catch (e) {
          aviso("Drive: " + e.message, true);
        }
      };
      $("#atras").onclick = () => {
        paso = 2;
        mostrar();
      };
      $("#sig").onclick = () => {
        paso = 4;
        mostrar();
      };
    } else {
      pintar(`${cab("\xDAltimo paso", "Lee y acepta las condiciones para empezar.")}
        <div class="seccion">
          <label class="check"><input type="checkbox" id="acepto">
            <span>Acepto las <a href="#/legal/terminos" target="_blank" rel="noopener">condiciones de uso</a>, el <a href="#/legal/encargo" target="_blank" rel="noopener">contrato de encargo del tratamiento</a> de los datos de mis inquilinos y he le\xEDdo la <a href="#/legal/privacidad" target="_blank" rel="noopener">pol\xEDtica de privacidad</a>.</span></label>
          <p class="ayuda">Los modelos de contrato son orientativos: rev\xEDsalos antes de enviarlos a firmar y ad\xE1ptalos en Ajustes \u2192 Contratos.</p>
        </div>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atr\xE1s</button><button class="btn primario" id="fin">Empezar</button></div></div>`);
      $("#atras").onclick = () => {
        paso = 3;
        mostrar();
      };
      $("#fin").onclick = async () => {
        if (!$("#acepto").checked) return aviso("Marca la casilla para continuar", true);
        await guardar({ terminosAceptados: serverTimestamp(), versionTerminos: CONFIG.versionTextos || "1" });
        aviso("\xA1Listo! Ahora a\xF1ade tu primer piso");
        location.hash = "#/piso/nuevo";
      };
    }
  };
  mostrar();
}
async function vistaAjustes() {
  const [a, cuenta] = await Promise.all([leerAjustes(), leerCuenta()]);
  const props = JSON.parse(JSON.stringify(a.propietarios || []));
  const k = a.condiciones || {};
  const esTitular = cuenta?.propietario === usuario.uid;
  const yo = String(usuario.email || "").toLowerCase();
  pintar(`${cabVolver("Ajustes")}
    <form class="seccion" id="f">
      <div class="eti-campo">Propietarios</div>
      <div class="seccion" style="padding:0" id="props"></div>

      <div class="eti-campo">Cobro y notificaciones</div>
      ${campo("Domicilio para notificaciones", "domicilio", a.domicilio)}
      ${campo("IBAN para el pago de la renta", "iban", a.iban, 'autocapitalize="characters" placeholder="ES00 0000 0000 0000 0000 0000"')}
      ${campo("Ciudad de firma por defecto", "ciudadFirma", a.ciudadFirma)}
      ${selectCcaa(k.ccaa || "")}

      <div class="eti-campo">Contratos</div>
      <div class="rejilla">
        ${campo("D\xEDa l\xEDmite de pago (1-28)", "diaPago", k.diaPago || 7, 'type="number" min="1" max="28" inputmode="numeric"')}
        <label class="campo">Garant\xEDa adicional<select name="garantiaMeses">
          ${[0, 1, 2].map((n) => `<option value="${n}" ${String(k.garantiaMeses || 0) === String(n) ? "selected" : ""}>${n === 0 ? "Ninguna" : n === 1 ? "1 mensualidad" : "2 mensualidades"}</option>`).join("")}</select></label>
      </div>
      <label class="check"><input type="checkbox" name="clausulaLimpieza" ${k.clausulaLimpieza === false ? "" : "checked"}>
        <span>Incluir la cl\xE1usula de limpieza al devolver el piso (contratos de estudiantes)</span></label>
      <label class="campo">Cl\xE1usulas adicionales (se a\xF1aden a todos tus contratos; separa cada una con una l\xEDnea en blanco)
        <textarea name="clausulasExtra" rows="5" placeholder="Por ejemplo: No se permiten mascotas sin autorizaci\xF3n escrita del arrendador.">${esc(k.clausulasExtra || "")}</textarea></label>

      <div class="eti-campo">Modelos de contrato</div>
      <p class="ayuda">Edita el texto base de cada tipo de contrato: cambia cl\xE1usulas, quita las que no uses o a\xF1ade las tuyas.</p>
      ${[...MODELOS_EDITABLES, ...Object.keys(a.modelos || {}).filter((pl) => !MODELOS_EDITABLES.includes(pl) && a.modelos[pl]?.length)].map((pl) => {
    const n = (a.modelos?.[pl] || []).length;
    return `<div class="tarjeta"><div class="fila"><div>
          <div class="nombre" style="font-size:14px">${esc(PLANTILLAS[pl] || pl)}</div>
          <div class="meta">${n ? `${n} cambio${n > 1 ? "s" : ""} sobre el modelo original` : "Modelo original"}</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
            ${MODELOS_EDITABLES.includes(pl) ? `<a class="btn secundario" href="#/modelo/${pl}" style="min-height:36px">Editar</a>` : ""}
            ${n ? `<button type="button" class="btn peligro" data-borrar-modelo="${pl}" style="min-height:36px">Restaurar</button>` : ""}</div></div></div>`;
  }).join("")}

      <div class="eti-campo">Google Drive</div>
      ${CONFIG.driveCompleto === false ? '<input type="hidden" name="modoDrive" value="propia">' : segmento("modoDrive", [["propia", "Carpeta propia de la app"], ["completo", "Mis carpetas"]], a.modoDrive || "propia")}
      <div class="tarjeta"><div class="fila"><div><div class="nombre" id="carpeta-nombre">${esc(a.carpetaDriveNombre || "Sin conectar")}</div>
        <div class="meta">Contratos en Renta AAAA / Contratos / Piso y facturas en Renta AAAA / Pisos facturas / Piso</div></div>
        <button type="button" class="btn secundario" id="elegir">${(a.modoDrive || "propia") === "completo" ? "Elegir" : "Conectar"}</button></div></div>
      <input type="hidden" name="carpetaDriveId" value="${esc(a.carpetaDriveId || "")}">
      <input type="hidden" name="carpetaDriveNombre" value="${esc(a.carpetaDriveNombre || "")}">
    </form>
    <div class="acciones"><button class="btn primario ancho" id="guardar">Guardar</button></div>

    <div class="titulo-seccion"><h2>Equipo</h2></div>
    <div class="seccion">
      <p class="ayuda">Las personas de tu equipo ven y gestionan todos los pisos, inquilinos y contratos de esta cuenta. Entran con su cuenta de Google.</p>
      ${(cuenta?.emailsMiembros || []).map((e) => {
    const activo = Object.values(cuenta.correos || {}).includes(e);
    return `<div class="tarjeta"><div class="fila"><div><div class="nombre" style="font-size:14px">${esc(e)}</div>
          <div class="meta">${e === yo ? "T\xFA" : activo ? "Miembro" : "Invitaci\xF3n pendiente: que entre con este email"}</div></div>
          ${e !== yo && esTitular ? `<button class="btn peligro" data-quitar-miembro="${esc(e)}" style="min-height:36px">Quitar</button>` : ""}</div></div>`;
  }).join("")}
      <div class="rejilla" style="grid-template-columns:1fr auto">
        ${campo("Email de Google de la otra persona", "nuevoMiembro", "", 'type="email" id="nuevo-miembro" placeholder="nombre@gmail.com"')}
        <button class="btn secundario" id="invitar" style="align-self:end">A\xF1adir</button>
      </div>
    </div>

    <div class="titulo-seccion"><h2>Privacidad y datos</h2></div>
    <div class="seccion">
      <div class="tarjeta" style="gap:6px">
        ${Object.entries(LEGALES).map(([k2, t]) => `<a href="#/legal/${k2}" style="font-size:14px">${t}</a>`).join("")}
      </div>
      ${DEMO ? "" : '<button class="btn secundario" id="exportar">Descargar una copia de mis datos</button>'}
      ${esTitular ? `<button class="btn peligro" id="borrar-cuenta">Borrar mi cuenta y todos sus datos</button><div id="confirmar-borrado"></div>` : `<button class="btn peligro" id="salir-equipo">Salir de este equipo</button>`}
    </div>

    ${await esAdmin() ? '<div class="seccion"><a class="btn salvia" href="#/admin">Panel de administraci\xF3n (beta)</a></div>' : ""}
    <div class="acciones">
      <p class="ayuda" style="text-align:center">Sesi\xF3n: ${esc(usuario.email)}</p>
      <button class="btn secundario" id="salir">Cerrar sesi\xF3n</button>
      ${enlacesLegales()}
    </div>`, "ajustes");
  const f = $("#f");
  activarSegmentos(f);
  const editor = editorPropietarios($("#props"), props);
  f.addEventListener("change", (e) => {
    if (e.target.name === "modoDrive") {
      $("#elegir").textContent = e.target.value === "completo" ? "Elegir" : "Conectar";
      aviso("Pulsa Guardar y despu\xE9s " + (e.target.value === "completo" ? "Elegir" : "Conectar"));
    }
  });
  $("#elegir").onclick = async () => {
    try {
      const modo2 = f.modoDrive.value;
      if (modo2 !== (a.modoDrive || "propia")) return aviso("Guarda primero el cambio de modo", true);
      if (modo2 === "completo") {
        const r = await elegir("carpeta");
        if (!r) return;
        f.carpetaDriveId.value = r.id;
        f.carpetaDriveNombre.value = r.name;
        $("#carpeta-nombre").textContent = r.name;
        await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
        aviso(`Carpeta \xAB${r.name}\xBB guardada`);
      } else {
        const aj = await leerAjustes();
        await raizDrive(aj);
        $("#carpeta-nombre").textContent = aj.carpetaDriveNombre;
        aviso("Google Drive conectado");
      }
    } catch (e) {
      aviso("Drive: " + e.message, true);
    }
  };
  $("#guardar").onclick = async () => {
    if (!editor.validar()) return;
    const iban = normalizarIban(f.iban.value);
    if (!ibanValido(iban)) return aviso("El IBAN debe ser espa\xF1ol: ES + 22 n\xFAmeros", true);
    const modo2 = f.modoDrive.value;
    const cambiaModo = modo2 !== (a.modoDrive || "propia");
    await setDoc(D("ajustes", "general"), {
      propietarios: editor.leer(),
      domicilio: f.domicilio.value.trim(),
      iban,
      ciudadFirma: f.ciudadFirma.value.trim(),
      modoDrive: modo2,
      carpetaDriveId: cambiaModo ? "" : f.carpetaDriveId.value,
      carpetaDriveNombre: cambiaModo ? "" : f.carpetaDriveNombre.value,
      condiciones: {
        ccaa: f.ccaa.value,
        diaPago: Math.min(28, Math.max(1, parseInt(f.diaPago.value, 10) || 7)),
        garantiaMeses: parseInt(f.garantiaMeses.value, 10) || 0,
        clausulaLimpieza: f.clausulaLimpieza.checked,
        clausulasExtra: f.clausulasExtra.value.trim()
      }
    }, { merge: true });
    aviso(cambiaModo ? "Guardado. Ahora conecta tu Drive" : "Ajustes guardados");
    if (cambiaModo) vistaAjustes();
  };
  $$("[data-borrar-modelo]").forEach((b) => b.onclick = async () => {
    if (!preguntar("\xBFVolver al modelo original? Los contratos ya generados no cambian.")) return;
    await setDoc(D("ajustes", "general"), { modelos: { ...a.modelos || {}, [b.dataset.borrarModelo]: [] } }, { merge: true });
    aviso("Modelo restaurado");
    vistaAjustes();
  });
  $("#invitar").onclick = async () => {
    const email = $("#nuevo-miembro").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return aviso("Escribe un email v\xE1lido", true);
    try {
      await invitarMiembro(email);
      aviso(`Listo: ${email} ya puede entrar con su cuenta de Google`);
      vistaAjustes();
    } catch (e) {
      aviso("No se pudo a\xF1adir: " + e.message, true);
    }
  };
  $$("[data-quitar-miembro]").forEach((b) => b.onclick = async () => {
    if (!preguntar(`\xBFQuitar a ${b.dataset.quitarMiembro} del equipo?`)) return;
    await quitarMiembro(b.dataset.quitarMiembro, cuenta);
    aviso("Quitado del equipo");
    vistaAjustes();
  });
  if ($("#exportar")) $("#exportar").onclick = async () => {
    aviso("Preparando la copia\u2026");
    const copia = await exportarCuenta();
    const url = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" }));
    const enl = Object.assign(document.createElement("a"), { href: url, download: `mis-datos-${hoyISO()}.json` });
    document.body.appendChild(enl);
    enl.click();
    enl.remove();
  };
  if ($("#borrar-cuenta")) $("#borrar-cuenta").onclick = () => {
    $("#confirmar-borrado").innerHTML = `<div class="tarjeta" style="gap:10px">
      <div class="meta" style="color:#A2321F">Se borrar\xE1n para siempre tus pisos, inquilinos, contratos, firmas y facturas de la app, y los enlaces dejar\xE1n de funcionar. Los archivos de tu Google Drive no se tocan.</div>
      ${campo("Escribe BORRAR para confirmar", "conf", "", 'id="conf-borrar" autocapitalize="characters"')}
      <button class="btn peligro" id="borrar-ya" style="border:1px solid #A2321F">Borrar definitivamente</button></div>`;
    $("#borrar-ya").onclick = async (e) => {
      if ($("#conf-borrar").value.trim().toUpperCase() !== "BORRAR") return aviso("Escribe BORRAR para confirmar", true);
      e.target.disabled = true;
      e.target.textContent = "Borrando\u2026";
      try {
        await borrarCuenta();
        aviso("Cuenta borrada");
        await signOut(auth);
        location.hash = "#/";
      } catch (err) {
        aviso("No se pudo borrar: " + err.message, true);
        e.target.disabled = false;
      }
    };
  };
  if ($("#salir-equipo")) $("#salir-equipo").onclick = async () => {
    if (!preguntar("\xBFSalir de este equipo? Dejar\xE1s de ver sus pisos y contratos.")) return;
    await quitarMiembro(yo, cuenta);
    await deleteDoc(doc(db, "usuarios", usuario.uid)).catch(() => {
    });
    cuentaLista = { uid: null, ok: false };
    location.hash = "#/";
    enrutar();
  };
  $("#salir").onclick = () => signOut(auth);
}
var COLS = ["ajustes", "pisos", "invitaciones", "contratos", "facturas"];
var SUBS = { invitaciones: ["respuestas"], contratos: ["firmas", "estados"] };
async function recorrerCuenta(fn) {
  for (const col of COLS) {
    const s = await getDocs(C(col));
    for (const d of s.docs) {
      for (const sub of SUBS[col] || []) {
        const ss = await getDocs(C(col, d.id, sub));
        for (const x of ss.docs) await fn([col, d.id, sub, x.id], x);
      }
      await fn([col, d.id], d);
    }
  }
}
async function exportarCuenta() {
  const out = { exportado: (/* @__PURE__ */ new Date()).toISOString(), cuenta: await leerCuenta(), datos: {} };
  await recorrerCuenta(async (ruta, d) => {
    out.datos[ruta.join("/")] = d.data();
  });
  return out;
}
async function borrarCuenta() {
  await recorrerCuenta(async (ruta) => {
    if (ruta.length === 2 && ruta[0] === "invitaciones") await deleteDoc(doc(db, "enlaces", ruta[1])).catch(() => {
    });
    await deleteDoc(D(...ruta));
  });
  const cuenta = await leerCuenta();
  for (const e of cuenta?.emailsMiembros || []) await deleteDoc(doc(db, "accesos", e)).catch(() => {
  });
  await deleteDoc(doc(db, "cuentas", CID));
  await deleteDoc(doc(db, "usuarios", usuario.uid)).catch(() => {
  });
  cuentaLista = { uid: null, ok: false };
}
async function vistaEspera(cuenta) {
  const pago = CONFIG.pago || {};
  const enviada = cuenta?.solicitud;
  pintar(`<div class="hero"><div class="eti">Beta privada</div><h1>Tu cuenta est\xE1 casi lista</h1>
      <p>Estamos dando acceso poco a poco. En cuanto se active, entrar\xE1s directamente al asistente de configuraci\xF3n.</p></div>
    <div class="seccion">
      ${pago.precio && pago.bizum ? `<div class="tarjeta"><div class="nombre">Activa tu cuenta</div>
          <div class="meta" style="font-size:14px;line-height:1.5">Haz un Bizum de <b>${esc(pago.precio)} \u20AC</b> al <b>${esc(pago.bizum)}</b> con el concepto <b>${esc(usuario.email)}</b>. La activamos en menos de 24 horas${pago.duracion ? ` y tendr\xE1s acceso durante ${esc(pago.duracion)}` : ""}.</div></div>` : ""}
      ${enviada ? `<div class="tarjeta" style="background:var(--salvia-claro)"><div class="nombre" style="color:#3F4D37">Solicitud enviada</div>
            <div class="meta" style="color:#3F4D37">El ${fechaCorta(enviada)}. Te avisaremos en ${esc(usuario.email)}.</div></div>` : `<label class="campo">Cu\xE9ntanos cu\xE1ntos pisos alquilas y c\xF3mo (opcional)<textarea id="mensaje" rows="3" placeholder="Por ejemplo: 3 pisos de estudiantes en Valencia"></textarea></label>
           <button class="btn primario" id="solicitar">Solicitar acceso</button>`}
      <a class="btn secundario" href="${esc((CONFIG.urlApp || location.pathname) + "?demo#/")}">Mientras tanto, ver la demo</a>
    </div>
    <div class="acciones"><p class="ayuda" style="text-align:center">Sesi\xF3n: ${esc(usuario.email)}</p>
      <button class="btn peligro" id="salir">Cerrar sesi\xF3n</button>${enlacesLegales()}</div>`);
  if ($("#solicitar")) $("#solicitar").onclick = async (e) => {
    e.target.disabled = true;
    try {
      await solicitarAcceso($("#mensaje").value);
      aviso("Solicitud enviada");
      enrutar();
    } catch (err) {
      aviso("No se pudo enviar: " + err.message, true);
      e.target.disabled = false;
    }
  };
  $("#salir").onclick = () => signOut(auth);
}
async function vistaAdmin() {
  const cuentas = (await listarCuentas()).sort((a, b) => {
    const t = (x) => x.solicitud?.toDate ? x.solicitud.toDate().getTime() : x.creada?.toDate ? x.creada.toDate().getTime() : 0;
    return t(b) - t(a);
  });
  const estado = (c) => cuentaActiva(c) ? `<span class="chip ok">Activa${c.activoHasta ? " hasta " + fechaCorta(c.activoHasta) + " " + (c.activoHasta.toDate ? c.activoHasta.toDate() : new Date(c.activoHasta)).getFullYear() : ""}</span>` : c.solicitud ? '<span class="chip espera">Solicita acceso</span>' : '<span class="chip gris">Pendiente</span>';
  pintar(`${cabVolver("Administraci\xF3n", `${cuentas.length} cuentas`, "#/ajustes")}
    <div class="seccion">
      ${cuentas.map((c) => `<div class="tarjeta">
          <div class="fila"><div><div class="nombre">${esc(c.nombre || "")}</div>
            <div class="meta">${esc((c.emailsMiembros || []).join(", "))}</div></div>${estado(c)}</div>
          ${c.mensajeSolicitud ? `<div class="meta" style="font-style:italic">\xAB${esc(c.mensajeSolicitud)}\xBB</div>` : ""}
          <div class="meta">Creada el ${fechaCorta(c.creada)}${c.solicitud ? " \xB7 solicitud el " + fechaCorta(c.solicitud) : ""}</div>
          ${c.id === CID ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn secundario" data-activar="${c.id}" data-meses="12" style="min-height:40px">Activar 1 a\xF1o</button>
            <button class="btn secundario" data-activar="${c.id}" data-meses="1" style="min-height:40px">Prueba 1 mes</button>
            ${cuentaActiva(c) ? `<button class="btn peligro" data-desactivar="${c.id}" style="min-height:40px">Desactivar</button>` : ""}</div>`}
        </div>`).join("") || '<div class="vacio">Todav\xEDa no hay cuentas.</div>'}
    </div>`, "ajustes");
  $$("[data-activar]").forEach((b) => b.onclick = async () => {
    await activarCuenta(b.dataset.activar, +b.dataset.meses);
    aviso("Cuenta activada");
    vistaAdmin();
  });
  $$("[data-desactivar]").forEach((b) => b.onclick = async () => {
    if (!preguntar("\xBFDesactivar esta cuenta? Dejar\xE1 de poder crear o editar nada.")) return;
    await desactivarCuenta(b.dataset.desactivar);
    aviso("Cuenta desactivada");
    vistaAdmin();
  });
}
async function enrutar() {
  const partes = (location.hash.replace(/^#\/?/, "") || "").split("/");
  const [ruta, arg] = partes;
  try {
    if (ruta === "i") return await vistaInquilino(arg);
    if (ruta === "legal") return vistaLegal(arg);
    if (ruta === "portada") return await vistaLogin();
    if (!authListo) return;
    if (!usuario) return await vistaLogin();
    if (!await prepararCuenta()) {
      pintar(`<div class="gracias"><h1>No se pudo abrir tu cuenta</h1><p class="ayuda">${esc(cuentaLista.error || "")}</p>
        <button class="btn secundario" id="reintentar">Reintentar</button></div>`);
      $("#reintentar").onclick = () => {
        cuentaLista = { uid: null };
        enrutar();
      };
      return;
    }
    const cuentaActual = await leerCuenta();
    const admin = await esAdmin();
    if (admin && !cuentaActiva(cuentaActual)) await activarCuenta(CID, 1200);
    if (ruta === "admin" && admin) return await vistaAdmin();
    if (!admin && !cuentaActiva(cuentaActual)) return await vistaEspera(cuentaActual);
    switch (ruta) {
      case "bienvenida":
        return await vistaBienvenida();
      case "":
        return await vistaPanel();
      case "pisos":
        return await vistaPisos();
      case "piso":
        return await vistaPiso(arg);
      case "nuevo":
        return await vistaNueva();
      case "inv":
        return await vistaInvitacion(arg);
      case "contratos":
        return await vistaContratos();
      case "contrato":
        return await vistaContrato(arg);
      case "editar":
        return await vistaEditar(arg);
      case "modelo":
        return await vistaModelo(arg);
      case "ajustes":
        return await vistaAjustes();
      case "facturas":
        return await vistaFacturas();
      default:
        location.hash = "#/";
    }
  } catch (e) {
    console.error(e);
    pintar(`<div class="gracias"><h1>Algo ha fallado</h1><p class="ayuda">${esc(e.message)}</p><a class="btn secundario" href="#/">Volver al inicio</a></div>`);
  }
}
window.addEventListener("hashchange", enrutar);
onAuthStateChanged(auth, (u) => {
  usuario = u;
  authListo = true;
  if (!u) cuentaLista = { uid: null, ok: false };
  if (!location.hash.startsWith("#/i/") && !location.hash.startsWith("#/legal/")) enrutar();
});
if (location.hash.startsWith("#/i/") || location.hash.startsWith("#/legal/")) enrutar();
