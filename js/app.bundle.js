// js/firebase-config.js
var CONFIG = {
  firebase: {
    apiKey: "AIzaSyA_Py8ZCWaEZZdnGS2ZHuQTnW-EefjROmA",
    authDomain: "contratos-pisos.firebaseapp.com",
    projectId: "contratos-pisos",
    storageBucket: "contratos-pisos.firebasestorage.app",
    messagingSenderId: "221718655510",
    appId: "1:221718655510:web:386338d202aa7327aefb37"
  },
  // ID de cliente OAuth "Web client (auto created by Google Service)"
  // de Google Cloud → APIs y servicios → Credenciales.
  googleClientId: "221718655510-vncb0h6rbu7fpe4k1grva7j07f9v5oir.apps.googleusercontent.com",
  // Número del proyecto (Configuración del proyecto en Firebase → General).
  googleProjectNumber: "221718655510",
  // Nombre con el que os saluda el panel.
  saludo: "Blanca y Manu"
};

// js/datos.js
var DEMO = String(CONFIG.firebase.apiKey).startsWith("PEGAR") || new URLSearchParams(location.search).has("demo");
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
  const CLAVE = "contratos-demo-v3";
  let memoria = null;
  const cargar = () => {
    if (memoria) return memoria;
    try {
      memoria = JSON.parse(localStorage.getItem(CLAVE) || "null");
    } catch {
      memoria = null;
    }
    if (!memoria) memoria = semilla();
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
      let docs = Object.keys(m).filter((p) => p.startsWith(q.path + "/") && p.split("/").length === prof).map(snap);
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
    domicilio: "Calle Ejemplo, 1, 14000 C\xF3rdoba",
    iban: "ES00 0000 0000 0000 0000 0000",
    ciudadFirma: "C\xF3rdoba",
    carpetaDriveId: "demo-rentas",
    carpetaDriveNombre: "Rentas (demo)"
  };
  m["pisos/lope"] = {
    nombre: "Lope de Sosa",
    direccion: "Calle Ejemplo, 2, 14000 C\xF3rdoba",
    ciudad: "C\xF3rdoba",
    plantilla: "habitacion",
    habitaciones: ["1", "2", "3", "4"],
    renta: "262",
    luz: { opcion: "C", cuota: "22.5", tope: "" },
    agua: { opcion: "incluida" }
  };
  m["pisos/priego"] = {
    nombre: "Maestro Priego",
    direccion: "Calle Ejemplo, 3, 14000 C\xF3rdoba",
    ciudad: "C\xF3rdoba",
    plantilla: "habitacion",
    habitaciones: ["1", "2", "3", "4"],
    renta: "300",
    luz: { opcion: "D", cuota: "", tope: "200" },
    agua: { opcion: "incluida" }
  };
  m["pisos/alderetes"] = {
    nombre: "Alderetes",
    direccion: "Calle Ejemplo, 4, 14000 C\xF3rdoba",
    ciudad: "C\xF3rdoba",
    plantilla: "piso_entero",
    habitaciones: [],
    renta: "750",
    luz: { opcion: "A" },
    agua: { opcion: "incluida" }
  };
  m["pisos/ciudadreal"] = {
    nombre: "Ciudad Real",
    direccion: "Calle Ejemplo, 5, 13000 Ciudad Real",
    ciudad: "Ciudad Real",
    plantilla: "larga_duracion",
    habitaciones: [],
    renta: "550",
    descripcion: "con tres dormitorios, cocina con lavadero, sal\xF3n y ba\xF1o",
    luz: { opcion: "A" },
    agua: { opcion: "cuota", cuota: "8" },
    carpetaFacturas: "Piso ciudad real"
  };
  m["invitaciones/demoPriego2"] = {
    pisoId: "priego",
    pisoNombre: "Maestro Priego",
    pisoDireccion: m["pisos/priego"].direccion,
    ciudad: "C\xF3rdoba",
    plantilla: "habitacion",
    habitacion: "2",
    plazas: 1,
    renta: "300",
    fianza: "",
    fechaInicio: "2026-09-01",
    fechaFin: "2027-07-31",
    fechaEntrega: "",
    luz: { opcion: "D", tope: "200" },
    agua: { opcion: "incluida" },
    estado: "abierta",
    creada: ts(2),
    creadaPor: "demo"
  };
  m["invitaciones/demoPriego2/respuestas/r1"] = {
    tratamiento: "D\xF1a.",
    nombre: "Luc\xEDa Ejemplo Prueba",
    tipoDoc: "DNI",
    numDoc: "12345678Z",
    domicilio: "Calle Mayor, 1, 23001 Ja\xE9n",
    telefono: "600 000 000",
    email: "lucia@ejemplo.com",
    avales: [
      { tratamiento: "D\xF1a.", nombre: "Ana Prueba Ejemplo", tipoDoc: "DNI", numDoc: "00000002W", parentesco: "Madre" },
      { tratamiento: "D.", nombre: "Luis Ejemplo Ejemplo", tipoDoc: "DNI", numDoc: "00000003A", parentesco: "Padre" }
    ],
    consentimiento: true,
    enviada: ts(1)
  };
  return m;
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
function documento(p) {
  const n = (p.numDoc || "").trim() || HUECO;
  switch (p.tipoDoc) {
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
function trato(p) {
  return p.tratamiento === "D\xF1a." ? "D\xF1a." : "D.";
}
function unir(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join("; ") + "; y de otra, " + items[items.length - 1];
}
function generarContrato(datos) {
  if (datos.plantilla === "larga_duracion") return contratoLargaDuracion(datos);
  return contratoEstudiantes(datos);
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
  const descProps = props.map((p) => `${trato(p)} ${p.nombre}, mayor de edad, ${documento(p)}`);
  add("p", `DE UNA PARTE, ${descProps.join(", y ")}, ${props.length > 1 ? "ambos" : ""} con domicilio a efectos de notificaciones en ${sinPunto(datos.domicilioPropietarios)}, en adelante "EL ARRENDADOR".`.replace(",  con", ", con"));
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
  (datos.propietarios || []).forEach((p, i) => out.push({ fid: `arr${i}`, rol: "arrendador", nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc }));
  let k = 0;
  (datos.inquilinos || []).forEach((p, i) => out.push({ fid: `inq${i}`, rol: "arrendatario", nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc }));
  (datos.inquilinos || []).forEach((p) => (p.avales || []).forEach((a) => out.push({ fid: `fia${k++}`, rol: "fiador", nombre: a.nombre, tipoDoc: a.tipoDoc, numDoc: a.numDoc, avalaA: p.nombre })));
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
  const luz = datos.luz || { opcion: "D" };
  const cuotaLuz = num(luz.cuota);
  const conCuota = (luz.opcion === "B" || luz.opcion === "C") && cuotaLuz > 0;
  add("title", "CONTRATO DE ARRENDAMIENTO DE VIVIENDA PARA USO DE VIVIENDA HABITUAL Y PERMANENTE");
  if (esHab) add("subtitle", "(arrendamiento de habitaci\xF3n en vivienda compartida)");
  add("p", `En ${datos.ciudadFirma || "C\xF3rdoba"}, a ${fechaLarga(datos.fechaFirma)}.`);
  add("heading", "REUNIDOS");
  bloquesReunidos(datos, add, c, { conDomicilioTitulo: "a efectos de notificaciones" });
  add("heading", "EXPONEN");
  add("p", `I. Que EL ARRENDADOR es propietario de la vivienda sita en ${dir}.`);
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
  const conceptoRenta = esHab ? "renta por la habitaci\xF3n arrendada" : "renta por la vivienda arrendada";
  const solid = esHab ? "" : c.varios ? "solidariamente, " : "";
  if (conCuota) {
    add("p", `La renta mensual total a abonar por ${ARR} asciende a ${euros(renta + cuotaLuz)} mensuales, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado dentro de los siete primeros d\xEDas de cada mes, y que se desglosa en ${euros(renta)} en concepto de ${conceptoRenta} y ${euros(cuotaLuz)} en concepto de cuota fija por el suministro el\xE9ctrico, conforme a lo dispuesto en el p\xE1rrafo siguiente.`);
  } else {
    add("p", `La renta mensual ${esHab ? "de la habitaci\xF3n arrendada" : "de la vivienda"} se fija en ${euros(renta)} mensuales, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado dentro de los siete primeros d\xEDas de cada mes.`);
  }
  const concepto = `Alquiler ${datos.piso.nombre} + ${c.inquilinos.map((i) => i.nombre).join(" y ")}`;
  add("p", `El pago se realizar\xE1 mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, debiendo hacerse constar en el concepto de la transferencia: "${concepto}".`);
  add("p", textoLuzEstudiantes(luz, c, esHab, datos.fechaFin));
  add("p", textoActualizacion(c));
  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el art\xEDculo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta. La fianza ser\xE1 devuelta a ${ARR} a la finalizaci\xF3n del contrato, previa comprobaci\xF3n del buen estado de ${objetoRef} y enseres, y una vez deducidas, en su caso, las cantidades que correspondan en concepto de desperfectos, suministros pendientes u otras cantidades adeudadas.`);
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
  add("p", `Asimismo, ${ARR} se ${v("obliga", "obligan")} a devolver ${objLimpieza} en unas condiciones generales de limpieza equiparables a las que exist\xEDan al inicio del contrato, sin que sea exigible un estado de limpieza impecable, pero s\xED un estado adecuado y no descuidado. Si al finalizar el contrato no se entregase en dichas condiciones, EL ARRENDADOR podr\xE1 descontar de la fianza el importe correspondiente para restituirlas a un estado adecuado de limpieza.`);
  add("subheading", c.siguiente("Gastos."));
  add("p", "Los gastos generales del inmueble (comunidad de propietarios, Impuesto sobre Bienes Inmuebles y dem\xE1s tributos que graven la propiedad) ser\xE1n de cuenta de EL ARRENDADOR. Los gastos por suministros se regir\xE1n por lo dispuesto en la cl\xE1usula tercera.");
  add("subheading", c.siguiente("Resoluci\xF3n."));
  add("p", "Ser\xE1n causa de resoluci\xF3n del presente contrato, adem\xE1s de las previstas en el art\xEDculo 27 de la LAU, el impago de la renta o de cualquier cantidad asimilada a la misma, el incumplimiento grave de las obligaciones de conservaci\xF3n y buen uso, y la cesi\xF3n o el subarriendo no consentidos por EL ARRENDADOR.");
  add("subheading", c.siguiente("Notificaciones."));
  add("p", "A los efectos del presente contrato, las partes se\xF1alan como domicilios v\xE1lidos para notificaciones los que constan en el encabezamiento de este documento.");
  add("subheading", c.siguiente("Normativa aplicable."));
  add("p", "En todo lo no previsto expresamente en este contrato, las partes se someten a lo dispuesto en la LAU y, supletoriamente, al C\xF3digo Civil.");
  bloqueFirmas(add, datos, c);
  return L;
}
function textoLuzEstudiantes(luz, c, esHab, fechaFin) {
  const { ARR, v } = c;
  const cuota = euros(luz.cuota);
  const finTxt = fechaFin ? `el d\xEDa ${fechaLarga(fechaFin).replace(/ de \d{4}$/, "")}` : "a la finalizaci\xF3n del contrato";
  switch (luz.opcion) {
    case "A":
      return `La renta pactada incluye los suministros de agua y conexi\xF3n a internet (wifi) de la vivienda. El suministro de energ\xEDa el\xE9ctrica se encuentra actualmente contratado a nombre de EL ARRENDADOR. ${ARR} ${v("deber\xE1", "deber\xE1n")}, en el plazo m\xE1s breve posible desde la entrada en vigor del presente contrato, tramitar el cambio de titularidad de dicho suministro a su nombre y con cargo a su cuenta bancaria, haci\xE9ndose cargo a partir de entonces de su contrataci\xF3n, alta y abono${c.varios ? " en la proporci\xF3n que corresponda" : ""}.`;
    case "B":
      return `La renta pactada incluye los suministros de agua y conexi\xF3n a internet (wifi) de la vivienda. En cuanto al suministro de energ\xEDa el\xE9ctrica, ${ARR} ${v("abonar\xE1", "abonar\xE1n")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo el\xE9ctrico. Dicha cantidad cubre el consumo hasta un m\xE1ximo de ${euros(luz.tope)} mensuales; el eventual exceso sobre dicho importe ser\xE1 de cuenta de ${ARR}, que ${v("deber\xE1", "deber\xE1n")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.`;
    case "C":
      if (esHab) {
        return `La renta pactada incluye los suministros de agua y conexi\xF3n a internet (wifi) de la vivienda. En cuanto al suministro de energ\xEDa el\xE9ctrica, ${ARR} abonar\xE1 a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo el\xE9ctrico. A la finalizaci\xF3n del contrato, ${finTxt}, se proceder\xE1 a una regularizaci\xF3n final: el importe real de las facturas de electricidad de la vivienda correspondientes al periodo del contrato se dividir\xE1 a partes iguales entre el n\xFAmero de habitaciones arrendadas durante dicho periodo, resultando as\xED la parte proporcional que corresponde a la habitaci\xF3n objeto de este contrato. Si la cantidad abonada por ${ARR} resultase superior a dicha parte proporcional, EL ARRENDADOR le devolver\xE1 el exceso; si, por el contrario, resultase inferior, ${ARR} deber\xE1 abonar a EL ARRENDADOR la diferencia.`;
      }
      return `La renta pactada incluye los suministros de agua y conexi\xF3n a internet (wifi) de la vivienda. En cuanto al suministro de energ\xEDa el\xE9ctrica, ${ARR} ${v("abonar\xE1", "abonar\xE1n")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo el\xE9ctrico. A la finalizaci\xF3n del contrato, ${finTxt}, se proceder\xE1 a una regularizaci\xF3n final, comparando el total abonado por este concepto con el importe real de las facturas de electricidad del periodo del contrato: si lo abonado resultase superior, EL ARRENDADOR devolver\xE1 el exceso a ${ARR}; si resultase inferior, ${ARR} ${v("deber\xE1", "deber\xE1n")} abonar la diferencia.${c.varios ? " Dicha diferencia, a favor o en contra, se distribuir\xE1 a partes iguales entre todos los arrendatarios firmantes." : ""}`;
    default:
      if (num(luz.tope) > 0) {
        return esHab ? `La renta pactada incluye los suministros de agua, conexi\xF3n a internet (wifi) y energ\xEDa el\xE9ctrica de la vivienda, siempre que el importe mensual de la factura de electricidad del conjunto de la vivienda no supere los ${euros(luz.tope)}. En caso de superarse dicho l\xEDmite, el exceso ser\xE1 de cuenta de los arrendatarios de la vivienda, repercuti\xE9ndose a partes iguales entre las habitaciones arrendadas, debiendo ${ARR} abonar a EL ARRENDADOR la parte que le corresponda conforme a las facturas que le sean facilitadas.` : `La renta pactada incluye los suministros de agua, conexi\xF3n a internet (wifi) y energ\xEDa el\xE9ctrica de la vivienda, siempre que el importe mensual de la factura de electricidad no supere los ${euros(luz.tope)}. En caso de superarse dicho l\xEDmite, el exceso ser\xE1 de cuenta de ${ARR}, que ${v("deber\xE1", "deber\xE1n")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.`;
      }
      return `La renta pactada incluye los suministros de agua, conexi\xF3n a internet (wifi) y energ\xEDa el\xE9ctrica de la vivienda, sin que ${ARR} ${v("deba", "deban")} realizar pago adicional alguno por dichos conceptos.`;
  }
}
function contratoLargaDuracion(datos) {
  const c = contexto(datos);
  const { ARR, v } = c;
  const L = [];
  const add = (type, text) => L.push({ type, text });
  const dir = sinPunto(datos.piso.direccion);
  const renta = num(datos.renta);
  const fianza = datos.fianza != null && datos.fianza !== "" ? num(datos.fianza) : renta;
  const agua = datos.agua || { opcion: "cuota", cuota: 0 };
  const cuotaAgua = agua.opcion === "cuota" ? num(agua.cuota) : 0;
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
  if (cuotaAgua > 0) {
    add("p", `La renta mensual se fija en ${euros(renta)}, a la que se a\xF1ade una cantidad fija de ${euros(cuotaAgua)} mensuales en concepto de suministro de agua, conforme a la cl\xE1usula de gastos, lo que hace un total de ${euros(renta + cuotaAgua)} mensuales.`);
  } else {
    add("p", `La renta mensual se fija en ${euros(renta)}.`);
  }
  add("p", `${ARR} se ${v("obliga", "obligan")} a abonar dicha cantidad ${c.varios ? "solidariamente, " : ""}por adelantado dentro de los siete primeros d\xEDas de cada mes, mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, haciendo constar en el concepto: "Alquiler ${datos.piso.nombre} + ${c.inquilinos.map((i) => i.nombre).join(" y ")}". El justificante de la transferencia acreditar\xE1 el pago y servir\xE1 de recibo, salvo prueba en contrario.`);
  add("p", "Las cantidades no satisfechas en plazo devengar\xE1n el inter\xE9s legal del dinero desde la fecha en que debieron abonarse.");
  add("subheading", c.siguiente("Actualizaci\xF3n de la renta."));
  add("p", textoActualizacion(c));
  add("p", "La base sobre la que se efectuar\xE1 cada actualizaci\xF3n ser\xE1 la renta vigente en el mes inmediatamente anterior a la fecha de actualizaci\xF3n. La actualizaci\xF3n no tendr\xE1 efectos retroactivos.");
  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el art\xEDculo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta.`);
  add("p", `La fianza garantiza el cumplimiento de las obligaciones de ${ARR} derivadas de este contrato. A la finalizaci\xF3n del arrendamiento ser\xE1 devuelta a ${ARR} en el plazo de un mes desde la entrega de llaves, una vez deducidas, en su caso, las cantidades que correspondan en concepto de rentas o suministros pendientes y de desperfectos que no se deban al uso ordinario de la vivienda. La fianza no podr\xE1 aplicarse al pago de la \xFAltima mensualidad de renta.`);
  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, false);
  }
  add("subheading", c.siguiente("Gastos y suministros."));
  add("p", "Ser\xE1n de cuenta de EL ARRENDADOR los gastos de la comunidad de propietarios, el Impuesto sobre Bienes Inmuebles, la tasa de recogida de basuras y dem\xE1s tributos que graven la propiedad.");
  add("p", `Ser\xE1n de cuenta de ${ARR} los gastos por consumo de energ\xEDa el\xE9ctrica. A tal efecto, ${ARR} ${v("deber\xE1", "deber\xE1n")}, en el plazo m\xE1s breve posible desde la entrada en vigor del presente contrato, tramitar el cambio de titularidad de dicho suministro a su nombre y con cargo a su cuenta bancaria.`);
  if (cuotaAgua > 0) {
    add("p", `En cuanto al suministro de agua, ${ARR} ${v("abonar\xE1", "abonar\xE1n")} a EL ARRENDADOR la cantidad fija de ${euros(cuotaAgua)} mensuales indicada en la cl\xE1usula de renta.`);
  } else {
    add("p", "El suministro de agua est\xE1 incluido en la renta pactada.");
  }
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
  const linea = (p, x, yy) => {
    const f = p.fid && hechas[p.fid];
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
    doc2.text(p.nombre, x, yy + 5);
  };
  cab("EL ARRENDADOR", xI);
  cab(s.inquilinos.length > 1 ? "LOS ARRENDATARIOS" : "EL ARRENDATARIO", xD);
  y += 16;
  let yI = y, yD = y;
  s.propietarios.forEach((p) => {
    linea(p, xI, yI);
    yI += 18;
  });
  s.inquilinos.forEach((p) => {
    linea(p, xD, yD);
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
  (await final.copyPages(contrato, contrato.getPageIndices())).forEach((p) => final.addPage(p));
  const anexo = await PDFDocument.load(fotos, { ignoreEncryption: true });
  (await final.copyPages(anexo, anexo.getPageIndices())).forEach((p) => final.addPage(p));
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
var SCOPE = "https://www.googleapis.com/auth/drive";
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
  if (token && Date.now() < caduca - 6e4) return token;
  await esperar(() => window.google?.accounts?.oauth2);
  return new Promise((ok, ko) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) return ko(new Error(r.error));
        token = r.access_token;
        caduca = Date.now() + r.expires_in * 1e3;
        ok(token);
      },
      error_callback: (e) => ko(new Error(e?.message || "Permiso de Drive cancelado"))
    });
    cliente.requestAccessToken({ prompt: "" });
  });
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
        <label class="campo">Buscar en tu Drive<input data-q value="${esCarpeta ? "Rentas" : ""}" placeholder="${esCarpeta ? "Nombre de la carpeta" : "Nombre del PDF"}"></label>
        <div data-lista style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;min-height:120px"></div>
      </div>`;
    document.body.appendChild(capa);
    const cerrar = (r) => {
      capa.remove();
      ok(r);
    };
    capa.querySelector("[data-cerrar]").onclick = () => cerrar(null);
    capa.addEventListener("click", (e) => {
      if (e.target === capa) cerrar(null);
    });
    const lista = capa.querySelector("[data-lista]");
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
            <div class="nombre">${f.name.replace(/</g, "&lt;")}</div>
            <div class="meta">Modificado el ${new Date(f.modifiedTime).toLocaleDateString("es-ES")}</div></button>`).join("");
        lista.querySelectorAll("[data-id]").forEach((b) => b.onclick = () => cerrar({ id: b.dataset.id, name: b.querySelector(".nombre").textContent }));
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

// js/app.js
var app = document.getElementById("app");
var usuario = null;
var authListo = false;
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var $ = (sel, root = document) => root.querySelector(sel);
var $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
var hoyISO = () => (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE");
var accesoComprobado = { uid: null, ok: false };
async function comprobarPropietario() {
  if (!usuario) return false;
  if (accesoComprobado.uid === usuario.uid) return accesoComprobado.ok;
  let ok = false;
  try {
    await getDoc(doc(db, "ajustes", "general"));
    ok = true;
  } catch (e) {
    ok = false;
  }
  accesoComprobado = { uid: usuario.uid, ok };
  return ok;
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
  habitacion: "Habitaci\xF3n",
  piso_entero: "Piso entero",
  larga_duracion: "Larga duraci\xF3n"
};
var LUZ = {
  A: { t: "Cambio de titularidad", d: "El inquilino pone la luz a su nombre" },
  B: { t: "Cuota fija con tope", d: "Paga una cuota fija; el exceso del tope aparte" },
  C: { t: "Cuota fija + regularizaci\xF3n", d: "Se ajusta con las facturas reales al final" },
  D: { t: "Todo incluido", d: "Agua, wifi y luz en la renta (tope opcional)" }
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
  return `<div class="barra"><nav>${item("#/", "inicio", "Inicio")}${item("#/pisos", "pisos", "Pisos")}${item("#/contratos", "contratos", "Contratos")}${item("#/facturas", "facturas", "Facturas")}${item("#/ajustes", "ajustes", "Ajustes")}</nav></div>`;
}
function cabVolver(titulo, sub = "", href = "#/") {
  return `<div class="cab-volver"><a class="btn-icono" href="${href}" aria-label="Volver">${ICO.volver}</a>
    <div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}<h1>${esc(titulo)}</h1></div></div>`;
}
function pintar(html, activa) {
  const banda = DEMO ? `<div style="background:#EADFD1;color:#5A4A42;font-size:12px;text-align:center;padding:8px 12px">Modo demostraci\xF3n \xB7 los datos se guardan solo en este navegador \xB7 <a href="#/">panel</a> \xB7 <a href="#" id="reiniciar-demo">reiniciar</a></div>` : "";
  app.innerHTML = banda + html + (activa !== void 0 ? barra(activa) : "");
  if (DEMO) $("#reiniciar-demo").onclick = (e) => {
    e.preventDefault();
    if (preguntar("\xBFBorrar los datos de la demo y empezar de nuevo?")) signOut(auth);
  };
  window.scrollTo(0, 0);
}
async function leerAjustes() {
  const s = await getDoc(doc(db, "ajustes", "general"));
  return s.exists() ? s.data() : {
    propietarios: [
      { tratamiento: "D.", nombre: "", tipoDoc: "DNI", numDoc: "" },
      { tratamiento: "D\xF1a.", nombre: "", tipoDoc: "DNI", numDoc: "" }
    ],
    domicilio: "",
    iban: "",
    ciudadFirma: "C\xF3rdoba"
  };
}
async function listar(col, orden = "creada") {
  const s = await getDocs(query(collection(db, col), orderBy(orden, "desc")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function listarPisos() {
  const s = await getDocs(query(collection(db, "pisos"), orderBy("nombre")));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function respuestasDe(invId) {
  const s = await getDocs(query(collection(db, "invitaciones", invId, "respuestas"), orderBy("enviada")));
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
function camposPersona(pre, p = {}, { contacto = false, domicilio = false, parentesco = false } = {}) {
  return `
    <div class="eti-campo" style="text-transform:none;letter-spacing:0;font-weight:400">Tratamiento en el contrato</div>
    ${segmento(`${pre}tratamiento`, [["D.", "D."], ["D\xF1a.", "D\xF1a."]], p.tratamiento || "")}
    ${parentesco ? campo("Parentesco (madre, padre, hermano\u2026)", `${pre}parentesco`, p.parentesco || "") : ""}
    ${campo("Nombre y apellidos", `${pre}nombre`, p.nombre, 'autocomplete="off" placeholder="Como aparece en el documento"')}
    <div class="rejilla doc">${selectDoc(`${pre}tipoDoc`, p.tipoDoc)}${campo("N\xFAmero", `${pre}numDoc`, p.numDoc, 'autocapitalize="characters" placeholder="12345678A"')}</div>
    ${domicilio ? campo("Domicilio habitual", `${pre}domicilio`, p.domicilio, 'placeholder="Calle, n\xFAmero, piso, c\xF3digo postal y ciudad"') : ""}
    ${contacto ? `<div class="rejilla">${campo("Tel\xE9fono", `${pre}telefono`, p.telefono, 'type="tel" placeholder="600 000 000"')}${campo("Email", `${pre}email`, p.email, 'type="email" placeholder="tu@email.com"')}</div>` : ""}`;
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
function validarPersona(root, pre, p, { domicilio = false } = {}) {
  const errores = {};
  if (!p.tratamiento) errores.tratamiento = "Elige D. o D\xF1a.";
  if (p.nombre.split(/\s+/).length < 2) errores.nombre = "Escribe nombre y apellidos";
  const e = validarDoc(p.tipoDoc, p.numDoc);
  if (e) errores.numDoc = e;
  if (domicilio && p.domicilio.length < 8) errores.domicilio = "Escribe el domicilio completo";
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
async function vistaLogin() {
  pintar(`<div class="login">
    <h1>Contratos</h1>
    <p class="ayuda">Entra con tu cuenta de Google para gestionar los pisos y los contratos.</p>
    ${usuario ? `<p class="ayuda" style="color:#A2321F">La cuenta ${esc(usuario.email)} no tiene acceso.</p>` : ""}
    <button class="btn primario" id="entrar">Entrar con Google</button>
    ${usuario ? '<button class="btn peligro" id="salir">Usar otra cuenta</button>' : ""}
  </div>`);
  $("#entrar").onclick = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      aviso("No se pudo iniciar sesi\xF3n: " + e.message, true);
    }
  };
  if ($("#salir")) $("#salir").onclick = () => signOut(auth);
}
async function vistaPanel() {
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
  const estadoPiso = (p) => {
    const ab = abiertas.filter((i) => i.pisoId === p.id).length;
    const porFirmar = contratos.filter((c) => c.pisoId === p.id && c.estado !== "firmado").length;
    if (ab) return `<span class="chip espera">${ab} esperando datos</span>`;
    if (porFirmar) return `<span class="chip firma">${porFirmar} por firmar</span>`;
    return `<span class="chip ok">Al d\xEDa</span>`;
  };
  pintar(`
    <div class="cab"><div class="fecha">${fecha}</div><h1>Hola, ${esc(CONFIG.saludo)}</h1></div>
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
      ${pisos.length ? pisos.map((p) => `
        <a class="tarjeta" href="#/piso/${p.id}"><div class="fila"><div>
          <div class="nombre">${esc(p.nombre)}</div><div class="meta">${PLANTILLAS[p.plantilla] || ""} \xB7 ${esc(p.ciudad || "")}</div></div>
          ${estadoPiso(p)}</div></a>`).join("") : `<div class="vacio">Todav\xEDa no hay pisos. Empieza por <a href="#/ajustes">tus datos</a> y luego <a href="#/piso/nuevo">a\xF1ade un piso</a>.</div>`}
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
    <div class="seccion">${pisos.map((p) => `
      <a class="tarjeta" href="#/piso/${p.id}"><div class="nombre">${esc(p.nombre)}</div>
      <div class="meta">${esc(p.direccion)}</div></a>`).join("") || '<div class="vacio">Sin pisos todav\xEDa.</div>'}</div>
    <div class="acciones"><a class="btn primario ancho" href="#/piso/nuevo">${ICO.mas} A\xF1adir piso</a></div>`, "pisos");
}
function camposLuz(luz = { opcion: "D" }) {
  return `<div class="eti-campo">Luz</div>
    <div class="seccion" style="padding:0;gap:8px" id="opciones-luz">
      ${Object.entries(LUZ).map(([k, o]) => `<button type="button" class="opcion-luz ${luz.opcion === k ? "on" : ""}" data-luz="${k}"><b>${o.t}</b><span>${o.d}</span></button>`).join("")}
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
function camposAgua(agua = { opcion: "cuota", cuota: "" }) {
  return `<div class="eti-campo">Agua</div>
    ${segmento("aguaOpcion", [["cuota", "Cuota fija"], ["incluida", "Incluida"]], agua.opcion)}
    ${campo("Cuota mensual de agua (\u20AC)", "aguaCuota", agua.cuota ?? "", 'inputmode="decimal"')}`;
}
function leerCondiciones(root) {
  const v = (n) => ($(`[name="${n}"]`, root)?.value ?? "").trim();
  return {
    luz: { opcion: v("luzOpcion") || "D", cuota: v("luzCuota"), tope: v("luzTope") },
    agua: { opcion: v("aguaOpcion") || "cuota", cuota: v("aguaCuota") }
  };
}
async function vistaPiso(id) {
  const nuevo = id === "nuevo";
  const p = nuevo ? { plantilla: "habitacion", ciudad: "C\xF3rdoba", luz: { opcion: "C" }, agua: { opcion: "cuota" } } : (await getDoc(doc(db, "pisos", id))).data();
  if (!p) return pintar(`${cabVolver("Piso no encontrado", "", "#/pisos")}`, "pisos");
  pintar(`${cabVolver(nuevo ? "Nuevo piso" : p.nombre, "Ficha del piso", "#/pisos")}
    <form class="seccion" id="f">
      ${campo("Nombre corto", "nombre", p.nombre, 'placeholder="Lope de Sosa"')}
      ${campo("Direcci\xF3n completa", "direccion", p.direccion, 'placeholder="Calle, n\xFAmero, piso, CP y ciudad"')}
      ${campo("Ciudad donde se firma", "ciudad", p.ciudad)}
      <div class="eti-campo">Tipo de contrato habitual</div>
      ${segmento("plantilla", Object.entries(PLANTILLAS), p.plantilla)}
      ${campo("Habitaciones (separadas por comas)", "habitaciones", (p.habitaciones || []).join(", "), 'placeholder="1, 2, 3, 4"')}
      <label class="campo">Descripci\xF3n (larga duraci\xF3n)<textarea name="descripcion" placeholder="Piso de tres dormitorios, cocina con lavadero, sal\xF3n y ba\xF1o">${esc(p.descripcion || "")}</textarea></label>
      ${campo("Renta habitual (\u20AC)", "renta", p.renta ?? "", 'inputmode="decimal"')}
      ${campo("Nombre de su carpeta de facturas en Drive (si es distinto)", "carpetaFacturas", p.carpetaFacturas || "", 'placeholder="Piso ciudad real"')}
      ${camposLuz(p.luz)}
      ${camposAgua(p.agua)}
      <div class="eti-campo">Fotos del piso</div>
      <div class="tarjeta"><div class="fila"><div><div class="nombre" id="fotos-nombre">${esc(p.fotosNombre || "Sin PDF de fotos")}</div>
        <div class="meta">Se a\xF1ade al final de cada contrato</div></div>
        <button type="button" class="btn secundario" id="elegir-fotos">Elegir en Drive</button></div></div>
      <input type="hidden" name="fotosDriveId" value="${esc(p.fotosDriveId || "")}">
      <input type="hidden" name="fotosNombre" value="${esc(p.fotosNombre || "")}">
    </form>
    <div class="acciones">
      <button class="btn primario ancho" id="guardar">Guardar</button>
      ${nuevo ? "" : '<button class="btn peligro" id="borrar">Eliminar piso</button>'}
    </div>`, "pisos");
  const f = $("#f");
  activarSegmentos(f);
  activarLuz(f);
  $("#elegir-fotos").onclick = async () => {
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
    const v = (n) => f[n].value.trim();
    if (!v("nombre") || !v("direccion")) return aviso("Faltan el nombre y la direcci\xF3n", true);
    const datos = {
      nombre: v("nombre"),
      direccion: v("direccion"),
      ciudad: v("ciudad"),
      plantilla: v("plantilla"),
      habitaciones: v("habitaciones").split(",").map((s) => s.trim()).filter(Boolean),
      descripcion: v("descripcion"),
      renta: v("renta"),
      carpetaFacturas: v("carpetaFacturas"),
      ...leerCondiciones(f),
      fotosDriveId: v("fotosDriveId"),
      fotosNombre: v("fotosNombre"),
      actualizado: serverTimestamp()
    };
    if (nuevo) await addDoc(collection(db, "pisos"), datos);
    else await setDoc(doc(db, "pisos", id), datos, { merge: true });
    aviso("Piso guardado");
    location.hash = "#/pisos";
  };
  if ($("#borrar")) $("#borrar").onclick = async () => {
    if (!preguntar("\xBFEliminar este piso? Los contratos ya generados se mantienen.")) return;
    await deleteDoc(doc(db, "pisos", id));
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
  const pisos = await listarPisos();
  if (!pisos.length) return pintar(`${cabVolver("Nuevo inquilino")}<div class="vacio">Primero <a href="#/piso/nuevo">a\xF1ade un piso</a>.</div>`, "inicio");
  let piso = pisos[0];
  const formulario = () => {
    const pl = $("[name=plantilla]")?.value || piso.plantilla || "habitacion";
    const f0 = fechasPorDefecto(pl);
    return `
      <div class="eti-campo">Modalidad</div>
      ${segmento("plantilla", Object.entries(PLANTILLAS), pl)}
      ${pl === "habitacion" ? `<div class="rejilla">
          <label class="campo">Habitaci\xF3n<select name="habitacion">${(piso.habitaciones?.length ? piso.habitaciones : ["1", "2", "3", "4"]).map((h) => `<option>${esc(h)}</option>`).join("")}</select></label>
          ${campo("Renta mensual (\u20AC)", "renta", piso.renta ?? "", 'inputmode="decimal"')}</div>` : `<div class="rejilla">${campo("Renta mensual (\u20AC)", "renta", piso.renta ?? "", 'inputmode="decimal"')}
          ${campo("N\xBA de inquilinos", "plazas", pl === "piso_entero" ? 3 : 1, 'inputmode="numeric"')}</div>`}
      ${campo("Fianza (\u20AC) \u2014 vac\xEDo = una mensualidad", "fianza", "", 'inputmode="decimal"')}
      <div class="rejilla">${campo("Desde", "fechaInicio", f0.inicio, 'type="date"')}
        ${pl === "larga_duracion" ? campo("Entrega de llaves", "fechaEntrega", f0.inicio, 'type="date"') : campo("Hasta", "fechaFin", f0.fin, 'type="date"')}</div>
      ${pl === "larga_duracion" ? camposAgua(piso.agua) : camposLuz(piso.luz)}`;
  };
  pintar(`${cabVolver("Nuevo inquilino")}
    <div class="seccion">
      <div class="eti-campo">Piso</div>
      <div class="pildoras" id="pisos">${pisos.map((p, i) => `<button type="button" data-id="${p.id}" class="${i === 0 ? "on" : ""}">${esc(p.nombre)}</button>`).join("")}</div>
      <form id="f" class="seccion" style="padding:0">${formulario()}</form>
      <div id="resultado"></div>
    </div>
    <div class="acciones"><button class="btn primario ancho" id="crear">Crear enlace</button></div>`, "inicio");
  const f = $("#f");
  const repintar = () => {
    f.innerHTML = formulario();
    activarSegmentos(f);
    if ($("#opciones-luz", f)) activarLuz(f);
  };
  repintar();
  f.addEventListener("change", (e) => {
    if (e.target.name === "plantilla") repintar();
  });
  $("#pisos").onclick = (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    $$("#pisos button").forEach((x) => x.classList.toggle("on", x === b));
    piso = pisos.find((p) => p.id === b.dataset.id);
    $("[name=plantilla]", f).value = piso.plantilla || "habitacion";
    repintar();
  };
  $("#crear").onclick = async () => {
    const v = (n) => (f[n]?.value ?? "").trim();
    const pl = v("plantilla");
    if (!v("renta")) return aviso("Falta la renta", true);
    if (!v("fechaInicio")) return aviso("Falta la fecha de inicio", true);
    const { luz, agua } = leerCondiciones(f);
    if (pl !== "larga_duracion" && (luz.opcion === "B" || luz.opcion === "C") && !luz.cuota) return aviso("Falta la cuota de luz", true);
    const token2 = nuevoToken();
    const inv = {
      pisoId: piso.id,
      pisoNombre: piso.nombre,
      pisoDireccion: piso.direccion,
      ciudad: piso.ciudad || "",
      plantilla: pl,
      habitacion: pl === "habitacion" ? v("habitacion") : "",
      plazas: pl === "habitacion" ? 1 : parseInt(v("plazas") || "1", 10),
      renta: v("renta"),
      fianza: v("fianza"),
      fechaInicio: v("fechaInicio"),
      fechaFin: pl === "larga_duracion" ? "" : v("fechaFin"),
      fechaEntrega: pl === "larga_duracion" ? v("fechaEntrega") : "",
      luz: pl === "larga_duracion" ? { opcion: "A" } : luz,
      agua: pl === "larga_duracion" ? agua : { opcion: "incluida" },
      estado: "abierta",
      respuestas: 0,
      creada: serverTimestamp(),
      creadaPor: usuario.email
    };
    $("#crear").disabled = true;
    try {
      await setDoc(doc(db, "invitaciones", token2), inv);
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
function resumenPersona(p) {
  return `${esc(p.tratamiento)} ${esc(p.nombre)} \xB7 ${esc(p.tipoDoc)} ${esc(p.numDoc)}`;
}
async function vistaInvitacion(id) {
  const snap = await getDoc(doc(db, "invitaciones", id));
  if (!snap.exists()) return pintar(`${cabVolver("Invitaci\xF3n no encontrada")}`, "inicio");
  const inv = snap.data();
  const [resps, contratos, ajustes] = await Promise.all([
    respuestasDe(id),
    getDocs(query(collection(db, "contratos"), where("invitacionId", "==", id))).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    leerAjustes()
  ]);
  const condiciones = [
    PLANTILLAS[inv.plantilla] + (inv.habitacion ? ` \xB7 habitaci\xF3n ${inv.habitacion}` : ""),
    `Renta ${euros(inv.renta)}${inv.fianza ? ` \xB7 fianza ${euros(inv.fianza)}` : ""}`,
    inv.plantilla === "larga_duracion" ? `Desde el ${fechaLarga(inv.fechaInicio)} \xB7 agua ${inv.agua?.opcion === "cuota" ? euros(inv.agua.cuota) + "/mes" : "incluida"}` : `Del ${fechaLarga(inv.fechaInicio)} al ${fechaLarga(inv.fechaFin)} \xB7 luz: ${LUZ[inv.luz?.opcion]?.t || ""}${inv.luz?.cuota ? " " + euros(inv.luz.cuota) : ""}`
  ];
  pintar(`${cabVolver(inv.pisoNombre, "Invitaci\xF3n", "#/")}
    <div class="seccion">
      <div class="tarjeta">${condiciones.map((c) => `<div class="meta" style="font-size:13px">${esc(c)}</div>`).join("")}</div>
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
      const p = leerPersona(f, "p_");
      let ok = validarPersona(f, "p_", p, { domicilio: true });
      const avales = $$("[data-aval]", f).map((_, j) => leerPersona(f, `a${j}_`)).filter((a) => a.nombre || a.numDoc);
      avales.forEach((a, j) => {
        ok = validarPersona(f, `a${j}_`, a) && ok;
      });
      if (!ok) return;
      const datos = { ...p, avales: avales.map(({ domicilio, telefono, email, ...a }) => a) };
      if (r.id) await updateDoc(doc(db, "invitaciones", id, "respuestas", r.id), datos);
      else {
        await addDoc(collection(db, "invitaciones", id, "respuestas"), { ...datos, consentimiento: true, manual: true, enviada: serverTimestamp() });
      }
      aviso("Datos guardados");
      vistaInvitacion(id);
    };
    if ($("[data-quitar]", f)) $("[data-quitar]", f).onclick = async () => {
      if (!preguntar("\xBFQuitar a este inquilino de la invitaci\xF3n?")) return;
      await deleteDoc(doc(db, "invitaciones", id, "respuestas", r.id));
      vistaInvitacion(id);
    };
  };
  $$("[data-editar]").forEach((b) => b.onclick = () => {
    const r = resps.find((x) => x.id === b.dataset.editar);
    abrirEditor(r, $(`#editor-${r.id}`));
  });
  $("#manual").onclick = () => abrirEditor({ avales: [] }, $("#editor-nuevo"));
  $("#estado").onclick = async () => {
    await updateDoc(doc(db, "invitaciones", id), { estado: inv.estado === "abierta" ? "cerrada" : "abierta" });
    vistaInvitacion(id);
  };
  $("#borrar").onclick = async () => {
    if (!preguntar("\xBFEliminar la invitaci\xF3n y los datos recibidos? Los contratos ya generados se mantienen.")) return;
    for (const r of resps) await deleteDoc(doc(db, "invitaciones", id, "respuestas", r.id));
    await deleteDoc(doc(db, "invitaciones", id));
    location.hash = "#/";
  };
  if ($("#generar")) $("#generar").onclick = async () => {
    const boton = $("#generar");
    if (!ajustes.iban || ajustes.propietarios.some((p) => !p.numDoc)) {
      aviso("Completa primero vuestros DNIs e IBAN en Ajustes", true);
      return;
    }
    if (inv.plazas && resps.length < inv.plazas && inv.plantilla !== "habitacion" && !preguntar(`Solo han rellenado ${resps.length} de ${inv.plazas}. \xBFGenerar el contrato igualmente?`)) return;
    boton.disabled = true;
    boton.textContent = "Generando\u2026";
    try {
      const grupos = inv.plantilla === "habitacion" ? resps.map((r) => [r]) : [resps];
      const ids = [];
      for (const grupo of grupos) ids.push(await generarYGuardar(id, inv, grupo, ajustes, $("#fecha-firma").value));
      await updateDoc(doc(db, "invitaciones", id), { estado: "cerrada" });
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
    ciudadFirma: inv.ciudad || ajustes.ciudadFirma || "C\xF3rdoba",
    fechaFirma,
    propietarios: ajustes.propietarios,
    domicilioPropietarios: ajustes.domicilio,
    iban: ajustes.iban,
    piso: { nombre: inv.pisoNombre, direccion: inv.pisoDireccion, descripcion: piso?.descripcion || "" },
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
  if (!ajustes.carpetaDriveId) return [];
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
    await updateDoc(doc(db, "contratos", c.id), firmado ? { firmado: [...c.firmado, ...nuevas] } : { enDrive: [...c.enDrive, ...nuevas] });
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
  const piso = inv.pisoId ? (await getDoc(doc(db, "pisos", inv.pisoId))).data() : null;
  const fotos = await fotosDelPiso(piso);
  const datos = datosContrato(inv, grupo, ajustes, fechaFirma || hoyISO(), piso, !!fotos);
  const bytes = await construirPdf(generarContrato(datos), fotos);
  const quien = inv.plantilla === "habitacion" ? slug(grupo[0].nombre) : inv.plantilla === "piso_entero" ? "Completo" : slug(grupo[0].nombre);
  const nombreArchivo = `Contrato_${slug(inv.pisoNombre)}${inv.habitacion ? "_Hab" + slug(inv.habitacion) : ""}_${quien}_${cursoDe(inv)}.pdf`;
  let enDrive = [];
  try {
    enDrive = await subirATodas(bytes, nombreArchivo, await carpetasDestino(ajustes, inv));
  } catch (e) {
    console.error(e);
    aviso("No se pudo subir a Drive; se descarga en el dispositivo", true);
  }
  if (!enDrive.length) bajar(bytes, nombreArchivo);
  const nuevo = await addDoc(collection(db, "contratos"), {
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
var ROL_TEXTO = { arrendador: "Arrendador", arrendatario: "Arrendatario", fiador: "Fiador" };
async function huellaDe(datos) {
  const texto = JSON.stringify(generarContrato({ ...datos, conFotos: !!datos.conFotos }));
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function estadosDe(cid) {
  const s = await getDocs(collection(db, "contratos", cid, "estados"));
  const m = {};
  s.docs.forEach((d) => m[d.id] = d.data());
  return m;
}
async function firmasDe(cid) {
  const s = await getDocs(collection(db, "contratos", cid, "firmas"));
  const m = {};
  s.docs.forEach((d) => m[d.id] = d.data());
  return m;
}
function fechaHora(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
  return d.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" });
}
function contratoHtml(datos) {
  return generarContrato(datos).map((b) => {
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
    const p = punto(e);
    ctx.beginPath();
    ctx.moveTo(ultimo.x, ultimo.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimo = p;
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
          await setDoc(doc(db, "contratos", cid, "firmas", f.fid), {
            nombre: f.nombre,
            numDoc: f.numDoc || "",
            rol: f.rol,
            imagen: pad.imagen(),
            huella: c.huella,
            aceptado: true,
            firmadoEl: serverTimestamp(),
            dispositivo: navigator.userAgent.slice(0, 200)
          });
          await setDoc(doc(db, "contratos", cid, "estados", f.fid), { nombre: f.nombre, rol: f.rol, firmadoEl: serverTimestamp() });
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
  const piso = c.pisoId ? (await getDoc(doc(db, "pisos", c.pisoId))).data() : null;
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
  const bytes = await construirPdf(generarContrato(c.datos), fotos, firmas2, registro);
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
  await updateDoc(doc(db, "contratos", cid), { estado: "firmado", firmado, firmadoEl: serverTimestamp(), firmaElectronica: true });
}
async function enviarAFirmar(cid, c) {
  const firmantes = firmantesDe(c.datos);
  const huella = await huellaDe(c.datos);
  await updateDoc(doc(db, "contratos", cid), {
    estado: "firmando",
    firmantes,
    firmantesIds: firmantes.map((f) => f.fid),
    huella,
    enviadoAFirmar: serverTimestamp()
  });
  if (c.invitacionId) await updateDoc(doc(db, "invitaciones", c.invitacionId), { contratos: arrayUnion(cid) });
}
async function vistaContrato(id) {
  const s = await getDoc(doc(db, "contratos", id));
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
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(c.datos)}</div></details>
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
      ${c.estado === "generado" ? '<button class="btn primario ancho" id="enviar">Enviar a firmar</button>' : ""}
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
  if ($("#habilitar-copia")) $("#habilitar-copia").onclick = async () => {
    await updateDoc(doc(db, "contratos", id), { copiaHabilitada: true, copiaHabilitadaEl: serverTimestamp() });
    aviso("Copia habilitada: ya puede descargarla");
    vistaContrato(id);
  };
  if ($("#finalizar")) $("#finalizar").onclick = async () => {
    await updateDoc(doc(db, "contratos", id), { finalizado: $("#fin-fecha").value });
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
    const piso = c.pisoId ? (await getDoc(doc(db, "pisos", c.pisoId))).data() : null;
    const fotos = c.datos.conFotos ? await fotosDelPiso(piso).catch(() => null) : null;
    bajar(await construirPdf(generarContrato(c.datos), fotos, firmas2), c.nombreArchivo);
  };
  $("#firmado").onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      const ajustes = await leerAjustes();
      const inv = { pisoNombre: c.pisoNombre, plantilla: c.plantilla, fechaInicio: c.datos.fechaInicio, fechaFin: c.datos.fechaFin };
      let carpetas = (c.enDrive || []).map((d) => ({ a\u00F1o: d.a\u00F1o, id: d.carpetaId }));
      if (!carpetas.length) carpetas = await carpetasDestino(ajustes, inv);
      if (!carpetas.length) return aviso("Elige primero la carpeta \xABRentas\xBB en Ajustes", true);
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
      await updateDoc(doc(db, "contratos", id), { estado: "firmado", firmado, firmadoEl: serverTimestamp() });
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
    const intacto = await huellaDe(c.datos) === c.huella;
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
    if (b.c.estado === "firmado") return '<p class="ayuda">El contrato est\xE1 firmado por todas las partes. Tus caseros te avisar\xE1n cuando puedas descargar tu copia.</p>';
    return '<p class="ayuda">\xA1Gracias! Ya hab\xE9is firmado todos. Ahora firmar\xE1n los arrendadores y te avisar\xE1n cuando tengas tu copia.</p>';
  };
  pintar(`<div class="hero"><div class="eti">${esc(sub)}</div>
      <h1>${todasCopias ? "Contrato firmado" : "Firma tu contrato"}</h1>
      <p>${todasCopias ? "Ya est\xE1 firmado por todas las partes. Aqu\xED tienes tu copia." : "L\xE9elo o desc\xE1rgalo con calma. Despu\xE9s, cada persona firma su parte: t\xFA como arrendatario y cada avalista como fiador."}</p></div>
    ${bloques.map((b) => `<div class="seccion">
      ${bloques.length > 1 ? `<div class="eti-campo">Contrato de ${esc(b.c.inquilinos.join(", "))}</div>` : ""}
      ${!b.intacto ? '<div class="tarjeta" style="color:#A2321F">Este contrato se ha modificado despu\xE9s de enviarse. Pide a tus caseros que lo env\xEDen de nuevo.</div>' : ""}
      ${b.copia ? `<button class="btn primario" data-copia="${b.id}">Descargar mi copia firmada</button>` : `<details class="tarjeta"><summary style="font-weight:600;cursor:pointer;min-height:28px">Leer el contrato completo</summary>
             <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(b.c.datos)}</div></details>
           <button class="btn secundario" data-borrador="${b.id}">Descargar el contrato en PDF (sin firmas)</button>`}
      ${b.firm.html}
      <div class="tarjeta" style="background:transparent;border:1px dashed var(--borde)"><div class="meta">Los arrendadores firman al final, cuando hay\xE1is firmado todos.</div></div>
      ${estadoTexto(b)}
    </div>`).join("")}`);
  bloques.forEach((b) => b.firm.montar(app));
  $$("[data-borrador]").forEach((btn) => btn.onclick = async () => {
    const b = bloques.find((x) => x.id === btn.dataset.borrador);
    bajar(await construirPdf(generarContrato({ ...b.c.datos, conFotos: false })), b.c.nombreArchivo);
  });
  $$("[data-copia]").forEach((btn) => btn.onclick = async () => {
    const b = bloques.find((x) => x.id === btn.dataset.copia);
    const firmas2 = await firmasDe(b.id);
    bajar(await construirPdf(generarContrato({ ...b.c.datos, conFotos: false }), null, firmas2), b.c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado.pdf");
  });
}
async function vistaAjustes() {
  const a = await leerAjustes();
  const props = a.propietarios || [];
  pintar(`${cabVolver("Ajustes")}
    <form class="seccion" id="f">
      ${props.map((p, i) => `<div class="tarjeta"><div class="eti-campo">Propietario ${i + 1}</div>${camposPersona(`o${i}_`, p)}</div>`).join("")}
      ${campo("Domicilio para notificaciones", "domicilio", a.domicilio)}
      ${campo("IBAN para el pago de la renta", "iban", a.iban, 'autocapitalize="characters" placeholder="ES00 0000 0000 0000 0000 0000"')}
      ${campo("Ciudad de firma por defecto", "ciudadFirma", a.ciudadFirma)}
      <div class="eti-campo">Carpeta \xABRentas\xBB de Google Drive</div>
      <div class="tarjeta"><div class="fila"><div><div class="nombre" id="carpeta-nombre">${esc(a.carpetaDriveNombre || "Sin elegir")}</div>
        <div class="meta">Cada contrato se guarda en Renta AAAA / Piso, en todos los a\xF1os que abarca</div></div>
        <button type="button" class="btn secundario" id="elegir">Elegir</button></div></div>
      <input type="hidden" name="carpetaDriveId" value="${esc(a.carpetaDriveId || "")}">
      <input type="hidden" name="carpetaDriveNombre" value="${esc(a.carpetaDriveNombre || "")}">
    </form>
    <div class="acciones">
      <button class="btn primario ancho" id="guardar">Guardar</button>
      <p class="ayuda" style="text-align:center">Sesi\xF3n: ${esc(usuario.email)}</p>
      <button class="btn peligro" id="salir">Cerrar sesi\xF3n</button>
    </div>`, "ajustes");
  const f = $("#f");
  activarSegmentos(f);
  $("#elegir").onclick = async () => {
    try {
      const r = await elegir("carpeta");
      if (!r) return;
      f.carpetaDriveId.value = r.id;
      f.carpetaDriveNombre.value = r.name;
      $("#carpeta-nombre").textContent = r.name;
    } catch (e) {
      aviso("Drive: " + e.message, true);
    }
  };
  $("#guardar").onclick = async () => {
    const propietarios = props.map((_, i) => leerPersona(f, `o${i}_`));
    let ok = true;
    propietarios.forEach((p, i) => {
      ok = validarPersona(f, `o${i}_`, p) && ok;
    });
    if (!ok) return;
    const iban = f.iban.value.toUpperCase().replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
    if (!/^ES\d{2}( \d{4}){5}$/.test(iban)) return aviso("El IBAN debe ser espa\xF1ol: ES + 22 n\xFAmeros", true);
    await setDoc(doc(db, "ajustes", "general"), {
      propietarios: propietarios.map(({ tratamiento, nombre, tipoDoc, numDoc }) => ({ tratamiento, nombre, tipoDoc, numDoc })),
      domicilio: f.domicilio.value.trim(),
      iban,
      ciudadFirma: f.ciudadFirma.value.trim(),
      carpetaDriveId: f.carpetaDriveId.value,
      carpetaDriveNombre: f.carpetaDriveNombre.value
    });
    aviso("Ajustes guardados");
  };
  $("#salir").onclick = () => signOut(auth);
}
async function vistaInquilino(token2) {
  const s = await getDoc(doc(db, "invitaciones", token2)).catch(() => null);
  if (!s || !s.exists()) return pintar(`<div class="gracias"><h1>Enlace no v\xE1lido</h1><p class="ayuda">Pide a tu casera un enlace nuevo.</p></div>`);
  const inv = s.data();
  if (inv.contratos?.length) {
    const cs = [];
    for (const cid of inv.contratos) {
      const cs1 = await getDoc(doc(db, "contratos", cid)).catch(() => null);
      if (cs1?.exists() && ["firmando", "firmado"].includes(cs1.data().estado)) cs.push({ id: cid, c: cs1.data() });
    }
    if (cs.length) return vistaFirmaInquilino(token2, inv, cs);
  }
  if (inv.estado !== "abierta") return pintar(`<div class="gracias"><h1>Este enlace ya est\xE1 cerrado</h1><p class="ayuda">Si necesitas cambiar alg\xFAn dato, escribe directamente a tus caseros.</p></div>`);
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
  const sub = `${inv.pisoNombre}${inv.habitacion ? " \xB7 Habitaci\xF3n " + inv.habitacion : inv.plantilla === "piso_entero" ? " \xB7 Piso entero" : ""}`;
  const hero = (titulo, texto) => `<div class="hero"><div class="eti">${esc(sub)}</div><h1>${titulo}</h1><p>${texto}</p>
    <div class="progreso">${[1, 2, 3].map((n) => `<span class="${n <= paso ? "on" : ""}"></span>`).join("")}</div>
    <p style="font-size:12px">Paso ${paso} de 3</p></div>`;
  const mostrar = () => {
    if (paso === 1) {
      pintar(`${hero("Tus datos para el contrato", inv.plantilla === "piso_entero" ? "Cada compa\xF1ero rellena sus propios datos con este mismo enlace." : "Solo te llevar\xE1 un par de minutos.")}
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
        const p = leerPersona(f, "p_");
        if (!validarPersona(f, "p_", p, { domicilio: true })) return;
        if (!p.telefono && !p.email) return aviso("Deja al menos un tel\xE9fono o un email", true);
        Object.assign(borrador, p);
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
            <span>Acepto que mis datos y los de mis avalistas se usen \xFAnicamente para redactar y gestionar el contrato de alquiler. Puedo pedir su rectificaci\xF3n o supresi\xF3n escribiendo a los arrendadores.</span></label>
        </div>
        <div class="acciones"><button class="btn primario ancho" id="enviar">Enviar datos</button><button class="btn secundario" id="atras">Atr\xE1s</button></div>`);
      $("#atras").onclick = () => {
        paso = 2;
        mostrar();
      };
      $("#enviar").onclick = async () => {
        if (!$("#acepto").checked) return aviso("Marca la casilla de consentimiento", true);
        $("#enviar").disabled = true;
        const limpio = (p) => ({ tratamiento: p.tratamiento, nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc, parentesco: p.parentesco || "" });
        try {
          await addDoc(collection(db, "invitaciones", token2, "respuestas"), {
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
      <div class="pildoras" id="pisos">${pisos.map((p, i) => `<button type="button" data-id="${p.id}" class="${i === 0 ? "on" : ""}">${esc(p.nombre)}</button>`).join("")}</div>
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
    piso = pisos.find((p) => p.id === b.dataset.id);
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
    if (!ajustes.carpetaDriveId) return aviso("Elige primero la carpeta \xABRentas\xBB en Ajustes", true);
    const fecha = f.fecha.value || hoyISO();
    const ext = archivo.type === "application/pdf" ? "pdf" : (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const nombre = nombreFactura(f.proveedor.value, f.concepto.value, fecha, ext);
    e.target.disabled = true;
    e.target.textContent = "Subiendo\u2026";
    try {
      const carpeta = await carpetaFacturas(ajustes, fecha.slice(0, 4), piso);
      const r = await subirPdf(await archivo.arrayBuffer(), nombre, carpeta, archivo.type || "image/jpeg");
      await addDoc(collection(db, "facturas"), {
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
async function enrutar() {
  const partes = (location.hash.replace(/^#\/?/, "") || "").split("/");
  const [ruta, arg] = partes;
  try {
    if (ruta === "i") return await vistaInquilino(arg);
    if (!authListo) return;
    if (!await comprobarPropietario()) return await vistaLogin();
    switch (ruta) {
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
  if (!location.hash.startsWith("#/i/")) enrutar();
});
if (location.hash.startsWith("#/i/")) enrutar();
