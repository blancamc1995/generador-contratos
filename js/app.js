import { CONFIG } from "./firebase-config.js";
import { DEMO, auth, db, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, where,
  serverTimestamp, arrayUnion } from "./datos.js";
import { generarContrato, firmantesDe, fechaLarga, euros, MESES, renumerar } from "./contratos.js";
import { construirPdf, descargar } from "./pdf.js";
import * as drive from "./drive.js";
import { D, C, CID, fijarCuenta, resolverCuenta, leerCuenta, invitarMiembro, quitarMiembro, cuentaDeEnlace, esAdmin, cuentaActiva, solicitarAcceso, listarCuentas, activarCuenta, desactivarCuenta } from "./cuenta.js";
import { paginaLegal, TEXTO_CONSENTIMIENTO, LEGALES } from "./legal.js";

const app = document.getElementById("app");

let usuario = null;
let authListo = false;

// ============ utilidades ============

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const hoyISO = () => new Date().toLocaleDateString("sv-SE");
// Cada usuario que entra con Google tiene su cuenta (o la de su equipo).
let cuentaLista = { uid: null, ok: false, nueva: false };
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

/** Nombre con el que saluda el panel: los nombres de pila de los propietarios. */
function saludoDe(ajustes) {
  const nombres = (ajustes.propietarios || []).map(p => (p.apodo || p.nombre || "").trim().split(/\s+/)[0]).filter(Boolean);
  if (!nombres.length) return usuario?.displayName?.split(" ")[0] || "";
  return nombres.length === 1 ? nombres[0] : nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}

function aviso(msg, error = false) {
  const el = document.getElementById("aviso");
  el.textContent = msg;
  el.className = "aviso visible" + (error ? " error" : "");
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => (el.className = "aviso"), error ? 5000 : 2800);
}

// En la demo publicada los diálogos del navegador no aparecen: se da por aceptado.
function preguntar(msg) { return DEMO ? true : window.confirm(msg); }

/** Descarga un PDF; en la demo solo se avisa (allí no se pueden descargar archivos). */
function bajar(bytes, nombre) {
  if (DEMO) return aviso(`En la app real aquí se guardaría «${nombre}»`);
  descargar(bytes, nombre);
}

function nuevoToken() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(22));
  return [...r].map(b => abc[b % abc.length]).join("");
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

const PLANTILLAS = {
  habitacion: "Habitación",
  piso_entero: "Piso entero",
  larga_duracion: "Larga duración",
};

const LUZ = {
  A: { t: "Cambio de titularidad", d: "El inquilino pone la luz a su nombre" },
  B: { t: "Cuota fija con tope", d: "Paga una cuota fija; el exceso del tope aparte" },
  C: { t: "Cuota fija + regularización", d: "Se ajusta con las facturas reales al final" },
  D: { t: "Todo incluido", d: "Agua, wifi y luz en la renta (tope opcional)" },
};

// --- validación de documentos ---
const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";
function normalizarDoc(n) { return String(n || "").toUpperCase().replace(/[\s.\-]/g, ""); }
function validarDoc(tipo, numero) {
  const n = normalizarDoc(numero);
  if (!n) return "Falta el número de documento";
  if (tipo === "DNI") {
    if (!/^\d{8}[A-Z]$/.test(n)) return "El DNI debe tener 8 números y una letra";
    if (LETRAS[parseInt(n.slice(0, 8), 10) % 23] !== n[8]) return "La letra del DNI no coincide, revísalo";
  }
  if (tipo === "NIE") {
    if (!/^[XYZ]\d{7}[A-Z]$/.test(n)) return "El NIE empieza por X, Y o Z, seguido de 7 números y una letra";
    const base = "XYZ".indexOf(n[0]) + n.slice(1, 8);
    if (LETRAS[parseInt(base, 10) % 23] !== n[8]) return "La letra del NIE no coincide, revísalo";
  }
  if ((tipo === "Pasaporte" || tipo === "Otro") && n.length < 5) return "El número parece demasiado corto";
  return "";
}

// --- iconos ---
const ICO = {
  volver: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  mas: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  inicio: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  pisos: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/></svg>',
  contratos: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  ajustes: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  facturas: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  camara: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  enlace: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
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
  const banda = DEMO ? `<div style="background:#EADFD1;color:#5A4A42;font-size:12px;text-align:center;padding:8px 12px">Demo con datos inventados · <a href="#/">panel</a> · <a href="#" id="reiniciar-demo">reiniciar</a> · <a href="${esc(CONFIG.urlApp || location.pathname)}">salir de la demo</a></div>` : "";
  app.innerHTML = banda + html + (activa !== undefined ? barra(activa) : "");
  if (DEMO) $("#reiniciar-demo").onclick = (e) => { e.preventDefault(); if (preguntar("¿Borrar los datos de la demo y empezar de nuevo?")) signOut(auth); };
  window.scrollTo(0, 0);
}

// ============ datos ============

async function leerAjustes() {
  const s = await getDoc(D("ajustes", "general"));
  const a = s.exists() ? s.data() : {
    propietarios: [{ tratamiento: "", nombre: usuario?.displayName || "", tipoDoc: "DNI", numDoc: "" }],
    domicilio: "", iban: "", ciudadFirma: "", modoDrive: "propia", condiciones: {},
  };
  drive.configurar(a.modoDrive || "propia");
  return a;
}

/** Ajustes mínimos para poder generar contratos. */
function ajustesCompletos(a) {
  return !!(a.propietarios?.length && a.propietarios.every(p => p.nombre && p.numDoc) && a.iban && a.domicilio);
}

/** Carpeta raíz en Drive. En modo «carpeta propia» la crea la primera vez. */
async function raizDrive(ajustes) {
  drive.configurar(ajustes.modoDrive || "propia");
  if (ajustes.carpetaDriveId) return ajustes.carpetaDriveId;
  if ((ajustes.modoDrive || "propia") !== "propia") return null;
  const r = await drive.crearCarpeta(CONFIG.carpetaRaiz || "Alquileres");
  ajustes.carpetaDriveId = r.id; ajustes.carpetaDriveNombre = r.name;
  await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
  return r.id;
}

async function listar(col, orden = "creada") {
  const s = await getDocs(query(C(col), orderBy(orden, "desc")));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function listarPisos() {
  const s = await getDocs(query(C("pisos"), orderBy("nombre")));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function respuestasDe(invId) {
  const s = await getDocs(query(C("invitaciones", invId, "respuestas"), orderBy("enviada")));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============ componentes de formulario ============

function campo(etq, name, valor = "", extra = "") {
  return `<label class="campo">${esc(etq)}<input name="${name}" value="${esc(valor)}" ${extra}><span class="error" data-error="${name}"></span></label>`;
}

function segmento(name, opciones, valor) {
  return `<div class="segmento" data-segmento="${name}">${opciones.map(([v, t]) =>
    `<button type="button" data-valor="${esc(v)}" class="${v === valor ? "on" : ""}">${esc(t)}</button>`).join("")}</div>
    <input type="hidden" name="${name}" value="${esc(valor)}">`;
}

function selectDoc(name, valor = "DNI") {
  return `<label class="campo">Documento<select name="${name}">${["DNI", "NIE", "Pasaporte", "Otro"].map(t =>
    `<option ${t === valor ? "selected" : ""}>${t}</option>`).join("")}</select></label>`;
}

/** Campos de una persona (inquilino o avalista). pre = prefijo de los nombres. */
function camposPersona(pre, p = {}, { contacto = false, domicilio = false, parentesco = false } = {}) {
  return `
    <div class="eti-campo" style="text-transform:none;letter-spacing:0;font-weight:400">Tratamiento en el contrato</div>
    ${segmento(`${pre}tratamiento`, [["D.", "D."], ["Dña.", "Dña."]], p.tratamiento || "")}
    ${parentesco ? campo("Parentesco (madre, padre, hermano…)", `${pre}parentesco`, p.parentesco || "") : ""}
    ${campo("Nombre y apellidos", `${pre}nombre`, p.nombre, 'autocomplete="off" placeholder="Como aparece en el documento"')}
    <div class="rejilla doc">${selectDoc(`${pre}tipoDoc`, p.tipoDoc)}${campo("Número", `${pre}numDoc`, p.numDoc, 'autocapitalize="characters" placeholder="12345678A"')}</div>
    ${domicilio ? campo("Domicilio habitual", `${pre}domicilio`, p.domicilio, 'placeholder="Calle, número, piso, código postal y ciudad"') : ""}
    ${contacto ? `<div class="rejilla">${campo("Teléfono", `${pre}telefono`, p.telefono, 'type="tel" placeholder="600 000 000"')}${campo("Email", `${pre}email`, p.email, 'type="email" placeholder="tu@email.com"')}</div>` : ""}`;
}

function leerPersona(root, pre) {
  const v = (n) => (root.querySelector(`[name="${pre}${n}"]`)?.value ?? "").trim();
  return {
    tratamiento: v("tratamiento"), nombre: v("nombre"), tipoDoc: v("tipoDoc") || "DNI",
    numDoc: normalizarDoc(v("numDoc")), domicilio: v("domicilio"), telefono: v("telefono"),
    email: v("email"), parentesco: v("parentesco"),
  };
}

/** Marca errores en pantalla. Devuelve true si todo está bien. */
function validarPersona(root, pre, p, { domicilio = false } = {}) {
  const errores = {};
  if (!p.tratamiento) errores.tratamiento = "Elige D. o Dña.";
  if (p.nombre.split(/\s+/).length < 2) errores.nombre = "Escribe nombre y apellidos";
  const e = validarDoc(p.tipoDoc, p.numDoc);
  if (e) errores.numDoc = e;
  if (domicilio && p.domicilio.length < 8) errores.domicilio = "Escribe el domicilio completo";
  $$(`[data-error^="${pre}"]`, root).forEach(el => (el.textContent = ""));
  Object.entries(errores).forEach(([k, msg]) => {
    const el = root.querySelector(`[data-error="${pre}${k}"]`);
    if (el) el.textContent = msg;
    else aviso(msg, true);
  });
  return Object.keys(errores).length === 0;
}

function activarSegmentos(root = app) {
  $$("[data-segmento]", root).forEach(seg => {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-valor]");
      if (!b) return;
      $$("button", seg).forEach(x => x.classList.toggle("on", x === b));
      const input = seg.nextElementSibling;
      input.value = b.dataset.valor;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

// ============ vistas del propietario ============

async function vistaPanel() {
  const ajustesPanel = await leerAjustes();
  if (!ajustesCompletos(ajustesPanel)) { location.hash = "#/bienvenida"; return; }
  const [pisos, invs, contratos] = await Promise.all([listarPisos(), listar("invitaciones"), listar("contratos")]);
  const abiertas = invs.filter(i => i.estado === "abierta");
  await Promise.all(abiertas.map(async i => { i.respuestas = (await respuestasDe(i.id)).length; }));
  const firmados = contratos.filter(c => c.estado === "firmado");
  const enFirma = contratos.filter(c => c.estado === "firmando");
  const copias = copiasPendientes(contratos);
  await Promise.all(enFirma.map(async c => { c.nFirmas = Object.keys(await firmasDe(c.id)).length; }));
  const hoy = new Date();
  const fecha = `${["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][hoy.getDay()]}, ${hoy.getDate()} de ${MESES[hoy.getMonth()]}`;

  const estadoPiso = (p) => {
    const ab = abiertas.filter(i => i.pisoId === p.id).length;
    const porFirmar = contratos.filter(c => c.pisoId === p.id && c.estado !== "firmado").length;
    if (ab) return `<span class="chip espera">${ab} esperando datos</span>`;
    if (porFirmar) return `<span class="chip firma">${porFirmar} por firmar</span>`;
    return `<span class="chip ok">Al día</span>`;
  };

  pintar(`
    <div class="cab"><div class="fecha">${fecha}</div><h1>Hola${saludoDe(ajustesPanel) ? ", " + esc(saludoDe(ajustesPanel)) : ""}</h1></div>
    <div class="stats">
      <div class="stat"><b>${pisos.length}</b><span>Pisos</span></div>
      <div class="stat"><b>${abiertas.length}</b><span>Pendientes</span></div>
      <div class="stat"><b>${firmados.length}</b><span>Firmados</span></div>
    </div>
    ${abiertas.length ? `<div class="titulo-seccion"><h2>Esperando datos</h2></div>
      <div class="seccion">${abiertas.map(i => `
        <a class="tarjeta" href="#/inv/${i.id}"><div class="fila"><div>
          <div class="nombre">${esc(i.pisoNombre)}${i.habitacion ? ` · Hab. ${esc(i.habitacion)}` : ""}</div>
          <div class="meta">${PLANTILLAS[i.plantilla]} · creada el ${fechaCorta(i.creada)}</div></div>
          <span class="chip ${i.respuestas ? "ok" : "espera"}">${i.respuestas || 0}${i.plazas ? "/" + i.plazas : ""} recibidos</span></div></a>`).join("")}</div>` : ""}
    ${copias.length ? `<div class="seccion"><div class="tarjeta" style="background:var(--salvia-claro)">
        <div class="nombre" style="color:#3F4D37">Nuevo año de renta</div>
        <div class="meta" style="color:#3F4D37">${copias.map(x => `${esc(x.c.pisoNombre)} → Renta ${x.faltan.join(", ")}`).join(" · ")}</div>
        <button class="btn salvia" id="copias">Copiar contratos de larga duración</button></div></div>` : ""}
    ${enFirma.length ? `<div class="titulo-seccion"><h2>En firma</h2></div>
      <div class="seccion">${enFirma.map(c => `
        <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div>
          <div class="nombre">${esc(c.inquilinos.join(", "))}</div><div class="meta">${esc(c.pisoNombre)} · ${esc(c.curso)}</div></div>
          <span class="chip ${c.nFirmas === c.firmantes.length ? "ok" : "firma"}">${c.nFirmas === c.firmantes.length ? "Listo para guardar" : `${c.nFirmas}/${c.firmantes.length} firmas`}</span></div></a>`).join("")}</div>` : ""}
    <div class="titulo-seccion"><h2>Tus pisos</h2><a href="#/pisos" style="font-size:13px;text-decoration:none">Ver todos</a></div>
    <div class="seccion">
      ${pisos.length ? pisos.map(p => `
        <a class="tarjeta" href="#/piso/${p.id}"><div class="fila"><div>
          <div class="nombre">${esc(p.nombre)}</div><div class="meta">${PLANTILLAS[p.plantilla] || ""} · ${esc(p.ciudad || "")}</div></div>
          ${estadoPiso(p)}</div></a>`).join("")
      : `<div class="vacio">Todavía no hay pisos. Empieza por <a href="#/ajustes">tus datos</a> y luego <a href="#/piso/nuevo">añade un piso</a>.</div>`}
    </div>
    <div class="acciones"><a class="btn primario ancho" href="#/nuevo">${ICO.mas} Nuevo inquilino</a></div>
  `, "inicio");
  if ($("#copias")) $("#copias").onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = "Copiando…";
    try { await hacerCopias(copias); aviso("Contratos copiados a su año de renta"); vistaPanel(); }
    catch (err) { aviso("No se pudo copiar: " + err.message, true); e.target.disabled = false; }
  };
}

async function vistaPisos() {
  const pisos = await listarPisos();
  pintar(`${cabVolver("Pisos")}
    <div class="seccion">${pisos.map(p => `
      <a class="tarjeta" href="#/piso/${p.id}"><div class="nombre">${esc(p.nombre)}</div>
      <div class="meta">${esc(p.direccion)}</div></a>`).join("") || '<div class="vacio">Sin pisos todavía.</div>'}</div>
    <div class="acciones"><a class="btn primario ancho" href="#/piso/nuevo">${ICO.mas} Añadir piso</a></div>`, "pisos");
}

function camposLuz(luz = { opcion: "D" }) {
  return `<div class="eti-campo">Luz</div>
    <div class="seccion" style="padding:0;gap:8px" id="opciones-luz">
      ${Object.entries(LUZ).map(([k, o]) => `<button type="button" class="opcion-luz ${luz.opcion === k ? "on" : ""}" data-luz="${k}"><b>${o.t}</b><span>${o.d}</span></button>`).join("")}
    </div>
    <input type="hidden" name="luzOpcion" value="${esc(luz.opcion)}">
    <div class="rejilla" id="luz-importes">
      ${campo("Cuota fija mensual (€)", "luzCuota", luz.cuota ?? "", 'inputmode="decimal"')}
      ${campo("Tope mensual (€)", "luzTope", luz.tope ?? "", 'inputmode="decimal"')}
    </div>`;
}

function activarLuz(root) {
  const ajustar = () => {
    const o = $('[name="luzOpcion"]', root).value;
    const cuota = $('[name="luzCuota"]', root).closest("label");
    const tope = $('[name="luzTope"]', root).closest("label");
    cuota.style.display = o === "B" || o === "C" ? "" : "none";
    tope.style.display = o === "B" || o === "D" ? "" : "none";
    tope.firstChild.textContent = o === "D" ? "Tope de la factura de luz del piso (€, opcional)" : "Tope mensual cubierto (€)";
  };
  $("#opciones-luz", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-luz]");
    if (!b) return;
    $$("[data-luz]", root).forEach(x => x.classList.toggle("on", x === b));
    $('[name="luzOpcion"]', root).value = b.dataset.luz;
    ajustar();
  });
  ajustar();
}

function camposAgua(agua = { opcion: "cuota", cuota: "" }) {
  return `<div class="eti-campo">Agua</div>
    ${segmento("aguaOpcion", [["cuota", "Cuota fija"], ["incluida", "Incluida"]], agua.opcion)}
    ${campo("Cuota mensual de agua (€)", "aguaCuota", agua.cuota ?? "", 'inputmode="decimal"')}`;
}

function leerCondiciones(root) {
  const v = (n) => ($(`[name="${n}"]`, root)?.value ?? "").trim();
  return {
    luz: { opcion: v("luzOpcion") || "D", cuota: v("luzCuota"), tope: v("luzTope") },
    agua: { opcion: v("aguaOpcion") || "cuota", cuota: v("aguaCuota") },
  };
}

async function vistaPiso(id) {
  await leerAjustes();
  const nuevo = id === "nuevo";
  const p = nuevo ? { plantilla: "habitacion", ciudad: "", luz: { opcion: "C" }, agua: { opcion: "cuota" } }
    : (await getDoc(D("pisos", id))).data();
  if (!p) return pintar(`${cabVolver("Piso no encontrado", "", "#/pisos")}`, "pisos");

  pintar(`${cabVolver(nuevo ? "Nuevo piso" : p.nombre, "Ficha del piso", "#/pisos")}
    <form class="seccion" id="f">
      ${campo("Nombre corto", "nombre", p.nombre, 'placeholder="Lope de Sosa"')}
      ${campo("Dirección completa", "direccion", p.direccion, 'placeholder="Calle, número, piso, CP y ciudad"')}
      ${campo("Ciudad donde se firma", "ciudad", p.ciudad)}
      <div class="eti-campo">Tipo de contrato habitual</div>
      ${segmento("plantilla", Object.entries(PLANTILLAS), p.plantilla)}
      ${campo("Habitaciones (separadas por comas)", "habitaciones", (p.habitaciones || []).join(", "), 'placeholder="1, 2, 3, 4"')}
      <label class="campo">Descripción (larga duración)<textarea name="descripcion" placeholder="Piso de tres dormitorios, cocina con lavadero, salón y baño">${esc(p.descripcion || "")}</textarea></label>
      ${campo("Renta habitual (€)", "renta", p.renta ?? "", 'inputmode="decimal"')}
      ${drive.modo() === "completo" ? campo("Nombre de su carpeta de facturas en Drive (si es distinto)", "carpetaFacturas", p.carpetaFacturas || "", 'placeholder="Piso ciudad real"') : `<input type="hidden" name="carpetaFacturas" value="${esc(p.carpetaFacturas || "")}">`}
      ${camposLuz(p.luz)}
      ${camposAgua(p.agua)}
      <div class="eti-campo">Fotos del piso</div>
      <div class="tarjeta"><div class="fila"><div><div class="nombre" id="fotos-nombre">${esc(p.fotosNombre || "Sin PDF de fotos")}</div>
        <div class="meta">Se añade al final de cada contrato</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <label class="btn secundario" style="min-height:40px">Subir PDF<input type="file" accept="application/pdf" id="subir-fotos" hidden></label>
          ${drive.modo() === "completo" ? '<button type="button" class="btn secundario" id="elegir-fotos" style="min-height:40px">Elegir en Drive</button>' : ""}
        </div></div></div>
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

  $("#subir-fotos").onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      aviso("Subiendo fotos…");
      const ajustes = await leerAjustes();
      const raiz = await raizDrive(ajustes);
      if (!raiz) return aviso("Configura Google Drive en Ajustes", true);
      const carpeta = await drive.asegurarCarpeta(["Fotos de los pisos"], raiz);
      const r = await drive.subirPdf(await archivo.arrayBuffer(), archivo.name, carpeta);
      f.fotosDriveId.value = r.id; f.fotosNombre.value = archivo.name;
      $("#fotos-nombre").textContent = archivo.name;
      aviso("Fotos subidas. Pulsa Guardar.");
    } catch (err) { aviso("No se pudo subir: " + err.message, true); }
  };
  if ($("#elegir-fotos")) $("#elegir-fotos").onclick = async () => {
    try {
      const r = await drive.elegir("pdf");
      if (!r) return;
      f.fotosDriveId.value = r.id; f.fotosNombre.value = r.name;
      $("#fotos-nombre").textContent = r.name;
    } catch (e) { aviso("Drive: " + e.message, true); }
  };
  $("#guardar").onclick = async () => {
    const v = (n) => f[n].value.trim();
    if (!v("nombre") || !v("direccion")) return aviso("Faltan el nombre y la dirección", true);
    const datos = {
      nombre: v("nombre"), direccion: v("direccion"), ciudad: v("ciudad"), plantilla: v("plantilla"),
      habitaciones: v("habitaciones").split(",").map(s => s.trim()).filter(Boolean),
      descripcion: v("descripcion"), renta: v("renta"), carpetaFacturas: v("carpetaFacturas"), ...leerCondiciones(f),
      fotosDriveId: v("fotosDriveId"), fotosNombre: v("fotosNombre"), actualizado: serverTimestamp(),
    };
    if (nuevo) await addDoc(C("pisos"), datos);
    else await setDoc(D("pisos", id), datos, { merge: true });
    aviso("Piso guardado");
    location.hash = "#/pisos";
  };
  if ($("#borrar")) $("#borrar").onclick = async () => {
    if (!preguntar("¿Eliminar este piso? Los contratos ya generados se mantienen.")) return;
    await deleteDoc(D("pisos", id));
    location.hash = "#/pisos";
  };
}

function fechasPorDefecto(plantilla) {
  const hoy = new Date();
  if (plantilla === "larga_duracion") return { inicio: hoyISO(), fin: "" };
  // Hasta octubre se propone el curso que empieza este septiembre; desde noviembre, el siguiente.
  const y = hoy.getMonth() >= 10 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  return { inicio: `${y}-09-01`, fin: `${y + 1}-07-31` };
}

async function vistaNueva() {
  const [pisos, ajustesNueva] = await Promise.all([listarPisos(), leerAjustes()]);
  if (!pisos.length) return pintar(`${cabVolver("Nuevo inquilino")}<div class="vacio">Primero <a href="#/piso/nuevo">añade un piso</a>.</div>`, "inicio");
  let piso = pisos[0];

  const formulario = () => {
    const pl = $("[name=plantilla]")?.value || piso.plantilla || "habitacion";
    const f0 = fechasPorDefecto(pl);
    return `
      <div class="eti-campo">Modalidad</div>
      ${segmento("plantilla", Object.entries(PLANTILLAS), pl)}
      ${pl === "habitacion" ? `<div class="rejilla">
          <label class="campo">Habitación<select name="habitacion">${(piso.habitaciones?.length ? piso.habitaciones : ["1", "2", "3", "4"]).map(h => `<option>${esc(h)}</option>`).join("")}</select></label>
          ${campo("Renta mensual (€)", "renta", piso.renta ?? "", 'inputmode="decimal"')}</div>`
        : `<div class="rejilla">${campo("Renta mensual (€)", "renta", piso.renta ?? "", 'inputmode="decimal"')}
          ${campo("Nº de inquilinos", "plazas", pl === "piso_entero" ? 3 : 1, 'inputmode="numeric"')}</div>`}
      ${campo("Fianza (€) — vacío = una mensualidad", "fianza", "", 'inputmode="decimal"')}
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
  f.addEventListener("change", (e) => { if (e.target.name === "plantilla") repintar(); });
  $("#pisos").onclick = (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    $$("#pisos button").forEach(x => x.classList.toggle("on", x === b));
    piso = pisos.find(p => p.id === b.dataset.id);
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
    const token = nuevoToken();
    const inv = {
      pisoId: piso.id, pisoNombre: piso.nombre, pisoDireccion: piso.direccion, ciudad: piso.ciudad || "",
      plantilla: pl, habitacion: pl === "habitacion" ? v("habitacion") : "",
      plazas: pl === "habitacion" ? 1 : parseInt(v("plazas") || "1", 10),
      renta: v("renta"), fianza: v("fianza"), fechaInicio: v("fechaInicio"),
      fechaFin: pl === "larga_duracion" ? "" : v("fechaFin"),
      fechaEntrega: pl === "larga_duracion" ? v("fechaEntrega") : "",
      luz: pl === "larga_duracion" ? { opcion: "A" } : luz,
      agua: pl === "larga_duracion" ? agua : { opcion: "incluida" },
      estado: "abierta", respuestas: 0, creada: serverTimestamp(), creadaPor: usuario.email,
      arrendadores: (ajustesNueva.propietarios || []).map(p => p.nombre).filter(Boolean).join(" y "),
    };
    $("#crear").disabled = true;
    try {
      await setDoc(D("invitaciones", token), inv);
      await setDoc(doc(db, "enlaces", token), { cuentaId: CID });
      location.hash = `#/inv/${token}`;
    } catch (e) {
      aviso("No se pudo crear: " + e.message, true);
      $("#crear").disabled = false;
    }
  };
}

async function compartir(titulo, url) {
  try { await navigator.clipboard.writeText(url); aviso("Enlace copiado"); return; } catch { /* sin portapapeles */ }
  try { if (navigator.share) { await navigator.share({ title: titulo, url }); return; } } catch { /* cancelado */ }
  aviso("Copia el enlace a mano: " + url);
}

function enlaceInquilino(token) {
  return `${location.origin}${location.pathname}#/i/${token}`;
}

function cajaEnlace(inv, token) {
  const url = enlaceInquilino(token);
  const demo = DEMO ? `<a class="btn secundario" href="#/i/${token}">Abrir como inquilino (demo)</a>` : "";
  const texto = `Hola, para preparar tu contrato de ${inv.pisoNombre} rellena tus datos aquí: ${url}`;
  return `<div class="caja-enlace">
    <div style="display:flex;gap:8px;align-items:center;font-weight:600">${ICO.enlace} Enlace para el inquilino</div>
    <code>${esc(url)}</code>
    <div class="dos">
      <a class="btn salvia" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">WhatsApp</a>
      <button class="btn secundario" type="button" id="copiar" data-url="${esc(url)}">Copiar</button>
    </div>${demo}</div>`;
}

function resumenPersona(p) {
  return `${esc(p.tratamiento)} ${esc(p.nombre)} · ${esc(p.tipoDoc)} ${esc(p.numDoc)}`;
}

async function vistaInvitacion(id) {
  const snap = await getDoc(D("invitaciones", id));
  if (!snap.exists()) return pintar(`${cabVolver("Invitación no encontrada")}`, "inicio");
  const inv = snap.data();
  const [resps, contratos, ajustes] = await Promise.all([
    respuestasDe(id),
    getDocs(query(C("contratos"), where("invitacionId", "==", id))).then(s => s.docs.map(d => ({ id: d.id, ...d.data() }))),
    leerAjustes(),
  ]);

  const condiciones = [
    PLANTILLAS[inv.plantilla] + (inv.habitacion ? ` · habitación ${inv.habitacion}` : ""),
    `Renta ${euros(inv.renta)}${inv.fianza ? ` · fianza ${euros(inv.fianza)}` : ""}`,
    inv.plantilla === "larga_duracion"
      ? `Desde el ${fechaLarga(inv.fechaInicio)} · agua ${inv.agua?.opcion === "cuota" ? euros(inv.agua.cuota) + "/mes" : "incluida"}`
      : `Del ${fechaLarga(inv.fechaInicio)} al ${fechaLarga(inv.fechaFin)} · luz: ${LUZ[inv.luz?.opcion]?.t || ""}${inv.luz?.cuota ? " " + euros(inv.luz.cuota) : ""}`,
  ];

  pintar(`${cabVolver(inv.pisoNombre, "Invitación", "#/")}
    <div class="seccion">
      <div class="tarjeta">${condiciones.map(c => `<div class="meta" style="font-size:13px">${esc(c)}</div>`).join("")}</div>
      ${inv.estado === "abierta" ? cajaEnlace(inv, id) : '<span class="chip gris" style="align-self:flex-start">Enlace cerrado</span>'}
      <div class="eti-campo">Inquilinos (${resps.length}${inv.plazas ? " de " + inv.plazas : ""})</div>
      ${resps.map((r, i) => `<div class="tarjeta">
          <div class="fila"><div><div class="nombre">${esc(r.nombre)}</div><div class="meta">${esc(r.tipoDoc)} ${esc(r.numDoc)} · ${esc(r.telefono || "")}</div></div>
          <button class="btn secundario" data-editar="${r.id}" style="min-height:40px">Editar</button></div>
          <div class="meta">${esc(r.domicilio)}</div>
          ${(r.avales || []).map(a => `<div class="meta">Avalista${a.parentesco ? " (" + esc(a.parentesco) + ")" : ""}: ${resumenPersona(a)}</div>`).join("")}
          <div id="editor-${r.id}"></div></div>`).join("") || '<div class="vacio">Todavía nadie ha rellenado sus datos.</div>'}
      <button class="btn fantasma" id="manual">+ Añadir inquilino a mano</button>
      <div id="editor-nuevo"></div>
      ${contratos.length ? `<div class="eti-campo">Contratos</div>${contratos.map(c => `
        <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div><div class="nombre">Contrato de ${esc(c.inquilinos.join(", "))}</div>
        <div class="meta">Generado el ${fechaCorta(c.creada)} · toca para firmar</div></div>
        <span class="chip ${c.estado === "firmado" ? "ok" : c.estado === "firmando" ? "espera" : "firma"}">${{ firmado: "Firmado", firmando: "En firma" }[c.estado] || "Por enviar"}</span></div></a>`).join("")}` : ""}
      ${resps.length ? `<div class="rejilla">${campo("Fecha de firma", "fechaFirma", hoyISO(), 'type="date" id="fecha-firma"')}</div>` : ""}
    </div>
    <div class="acciones">
      ${contratos.length === 1 ? `<a class="btn primario ancho" href="#/contrato/${contratos[0].id}">${contratos[0].estado === "firmado" ? "Ver contrato firmado" : "Ir a firmar el contrato"}</a>` : ""}
      ${resps.length ? `<button class="btn ${contratos.length ? "secundario" : "primario"} ancho" id="generar">${contratos.length ? "Volver a generar" : "Generar contrato"}</button>` : ""}
      <button class="btn secundario" id="estado">${inv.estado === "abierta" ? "Cerrar enlace" : "Reabrir enlace"}</button>
      <button class="btn peligro" id="borrar">Eliminar invitación</button>
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
        <button type="button" class="btn fantasma" data-mas-aval>+ Añadir avalista</button>
        <div class="dos"><button type="button" class="btn secundario" data-cancelar>Cancelar</button><button type="button" class="btn primario" data-guardar>Guardar</button></div>
        ${r.id ? '<button type="button" class="btn peligro" data-quitar>Quitar inquilino</button>' : ""}
      </form>`;
    const f = $("form", contenedor);
    activarSegmentos(f);
    $("[data-mas-aval]", f).onclick = () => {
      const j = $$("[data-aval]", f).length;
      const div = document.createElement("div");
      div.className = "tarjeta"; div.style.background = "#fff"; div.dataset.aval = "";
      div.innerHTML = camposPersona(`a${j}_`, {}, { parentesco: true });
      $("[data-avales]", f).appendChild(div);
      activarSegmentos(div);
    };
    $("[data-cancelar]", f).onclick = () => (contenedor.innerHTML = "");
    $("[data-guardar]", f).onclick = async () => {
      const p = leerPersona(f, "p_");
      let ok = validarPersona(f, "p_", p, { domicilio: true });
      const avales = $$("[data-aval]", f).map((_, j) => leerPersona(f, `a${j}_`)).filter(a => a.nombre || a.numDoc);
      avales.forEach((a, j) => { ok = validarPersona(f, `a${j}_`, a) && ok; });
      if (!ok) return;
      const datos = { ...p, avales: avales.map(({ domicilio, telefono, email, ...a }) => a) };
      if (r.id) await updateDoc(D("invitaciones", id, "respuestas", r.id), datos);
      else {
        await addDoc(C("invitaciones", id, "respuestas"), { ...datos, consentimiento: true, manual: true, enviada: serverTimestamp() });
      }
      aviso("Datos guardados");
      vistaInvitacion(id);
    };
    if ($("[data-quitar]", f)) $("[data-quitar]", f).onclick = async () => {
      if (!preguntar("¿Quitar a este inquilino de la invitación?")) return;
      await deleteDoc(D("invitaciones", id, "respuestas", r.id));
      vistaInvitacion(id);
    };
  };
  $$("[data-editar]").forEach(b => (b.onclick = () => {
    const r = resps.find(x => x.id === b.dataset.editar);
    abrirEditor(r, $(`#editor-${r.id}`));
  }));
  $("#manual").onclick = () => abrirEditor({ avales: [] }, $("#editor-nuevo"));

  $("#estado").onclick = async () => {
    await updateDoc(D("invitaciones", id), { estado: inv.estado === "abierta" ? "cerrada" : "abierta" });
    vistaInvitacion(id);
  };
  $("#borrar").onclick = async () => {
    if (!preguntar("¿Eliminar la invitación y los datos recibidos? Los contratos ya generados se mantienen.")) return;
    for (const r of resps) await deleteDoc(D("invitaciones", id, "respuestas", r.id));
    await deleteDoc(D("invitaciones", id));
    await deleteDoc(doc(db, "enlaces", id)).catch(() => {});
    location.hash = "#/";
  };

  if ($("#generar")) $("#generar").onclick = async () => {
    const boton = $("#generar");
    if (!ajustes.iban || ajustes.propietarios.some(p => !p.numDoc)) {
      aviso("Completa primero vuestros DNIs e IBAN en Ajustes", true);
      return;
    }
    if (inv.plazas && resps.length < inv.plazas && inv.plantilla !== "habitacion"
      && !preguntar(`Solo han rellenado ${resps.length} de ${inv.plazas}. ¿Generar el contrato igualmente?`)) return;
    boton.disabled = true; boton.textContent = "Generando…";
    try {
      const grupos = inv.plantilla === "habitacion" ? resps.map(r => [r]) : [resps];
      const ids = [];
      for (const grupo of grupos) ids.push(await generarYGuardar(id, inv, grupo, ajustes, $("#fecha-firma").value));
      await updateDoc(D("invitaciones", id), { estado: "cerrada" });
      aviso(grupos.length > 1 ? `${grupos.length} contratos generados` : "Contrato generado: revísalo y envíalo a firmar");
      if (ids.length === 1) location.hash = `#/contrato/${ids[0]}`;
      else vistaInvitacion(id);
    } catch (e) {
      console.error(e);
      aviso("Error al generar: " + e.message, true);
      boton.disabled = false; boton.textContent = contratos.length ? "Volver a generar" : "Generar contrato";
    }
  };
}

function datosContrato(inv, grupo, ajustes, fechaFirma, piso, conFotos) {
  return {
    plantilla: inv.plantilla,
    ciudadFirma: inv.ciudad || ajustes.ciudadFirma || "",
    condiciones: ajustes.condiciones || {},
    cambiosModelo: ajustes.modelos?.[inv.plantilla] || [],
    fechaFirma,
    propietarios: ajustes.propietarios,
    domicilioPropietarios: ajustes.domicilio,
    iban: ajustes.iban,
    piso: { nombre: inv.pisoNombre, direccion: inv.pisoDireccion, descripcion: piso?.descripcion || "" },
    habitacion: inv.habitacion,
    inquilinos: grupo.map(r => ({
      tratamiento: r.tratamiento, nombre: r.nombre, tipoDoc: r.tipoDoc, numDoc: r.numDoc, domicilio: r.domicilio,
      avales: (r.avales || []).map(a => ({ tratamiento: a.tratamiento, nombre: a.nombre, tipoDoc: a.tipoDoc, numDoc: a.numDoc, parentesco: a.parentesco })),
    })),
    renta: inv.renta, fianza: inv.fianza,
    fechaInicio: inv.fechaInicio, fechaFin: inv.fechaFin, fechaEntrega: inv.fechaEntrega,
    luz: inv.luz, agua: inv.agua, conFotos,
  };
}

async function fotosDelPiso(piso) {
  if (!piso?.fotosDriveId || DEMO) return null;
  try { return await drive.descargarArchivo(piso.fotosDriveId); }
  catch (e) {
    if (!preguntar("No puedo abrir el PDF de fotos del piso con esta cuenta (elígelo otra vez en la ficha del piso). ¿Generar el contrato sin fotos?")) throw new Error("Cancelado");
    return null;
  }
}

/**
 * Años fiscales (declaración de la renta) que abarca el contrato.
 * Estudiantes: del año de inicio al año de fin (sept 2026–jul 2027 → 2026 y 2027).
 * Larga duración: los años que cubre su primera anualidad.
 */
function añosFiscales(inv) {
  const ini = inv.fechaInicio || hoyISO();
  let fin = inv.fechaFin;
  if (!fin) {
    const d = new Date(ini + "T12:00:00");
    d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1);
    fin = d.toLocaleDateString("sv-SE");
  }
  const a = parseInt(ini.slice(0, 4), 10);
  let b = parseInt(fin.slice(0, 4), 10);
  // Larga duración: mientras siga vigente, también cada año hasta el actual.
  if (inv.plantilla === "larga_duracion" && !inv.finalizado) b = Math.max(b, new Date().getFullYear());
  if (inv.plantilla === "larga_duracion" && inv.finalizado) b = Math.min(Math.max(b, a), parseInt(inv.finalizado.slice(0, 4), 10));
  const años = [];
  for (let y = a; y <= Math.max(a, b); y++) años.push(y);
  return años;
}

/** Rentas / Renta AAAA / Contratos / <Piso>, una carpeta por cada año fiscal. */
async function carpetaContratos(ajustes, año, pisoNombre) {
  const renta = await drive.asegurarCarpeta([`Renta ${año}`, `renta${año}`], ajustes.carpetaDriveId);
  const contratos = await drive.asegurarCarpeta(["Contratos", "Contratos alquiler"], renta);
  return drive.asegurarCarpeta([pisoNombre], contratos);
}

async function carpetasDestino(ajustes, inv, soloAños = null) {
  if (!(await raizDrive(ajustes))) return [];
  const ids = [];
  for (const año of soloAños || añosFiscales(inv)) ids.push({ año, id: await carpetaContratos(ajustes, año, inv.pisoNombre) });
  return ids;
}

/** Contratos de larga duración vigentes a los que les falta copia en algún año. */
function copiasPendientes(contratos) {
  return contratos.filter(c => c.plantilla === "larga_duracion" && !c.finalizado && (c.enDrive || []).length).map(c => {
    const tiene = new Set((c.estado === "firmado" && c.firmado?.length ? c.firmado : c.enDrive).map(d => d.año));
    const faltan = añosFiscales({ ...c.datos, plantilla: c.plantilla }).filter(a => !tiene.has(a));
    return { c, faltan };
  }).filter(x => x.faltan.length);
}

async function hacerCopias(pendientes) {
  const ajustes = await leerAjustes();
  for (const { c, faltan } of pendientes) {
    const firmado = c.estado === "firmado" && c.firmado?.length;
    const lista = firmado ? c.firmado : c.enDrive;
    const origen = lista[lista.length - 1];
    const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + (firmado ? "_firmado.pdf" : ".pdf");
    const nuevas = [];
    for (const año of faltan) {
      const carpetaId = await carpetaContratos(ajustes, año, c.pisoNombre);
      const r = await drive.copiar(origen.id, carpetaId, nombre);
      nuevas.push({ año, carpetaId, id: r.id, link: r.webViewLink });
    }
    await updateDoc(D("contratos", c.id), firmado ? { firmado: [...c.firmado, ...nuevas] } : { enDrive: [...c.enDrive, ...nuevas] });
  }
}

/** Sube el mismo PDF a todas las carpetas. Devuelve [{año, carpetaId, id, link}]. */
async function subirATodas(bytes, nombre, carpetas, mime) {
  const res = [];
  for (const c of carpetas) {
    const r = await drive.subirPdf(bytes, nombre, c.id, mime);
    res.push({ año: c.año, carpetaId: c.id, id: r.id, link: r.webViewLink });
  }
  return res;
}

async function generarYGuardar(invId, inv, grupo, ajustes, fechaFirma) {
  const piso = inv.pisoId ? (await getDoc(D("pisos", inv.pisoId))).data() : null;
  const fotos = await fotosDelPiso(piso);
  const datos = datosContrato(inv, grupo, ajustes, fechaFirma || hoyISO(), piso, !!fotos);
  const bytes = await construirPdf(generarContrato(datos), fotos);
  const quien = inv.plantilla === "habitacion" ? slug(grupo[0].nombre) : (inv.plantilla === "piso_entero" ? "Completo" : slug(grupo[0].nombre));
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
    invitacionId: invId, pisoId: inv.pisoId, pisoNombre: inv.pisoNombre, plantilla: inv.plantilla,
    curso: cursoDe(inv), años: añosFiscales(inv), inquilinos: grupo.map(r => r.nombre), nombreArchivo,
    datos, enDrive, estado: "generado",
    creada: serverTimestamp(), creadaPor: usuario.email,
  });
  return nuevo.id;
}

async function vistaContratos() {
  const cs = await listar("contratos");
  pintar(`${cabVolver("Contratos")}
    <div class="seccion">${cs.map(c => `
      <a class="tarjeta" href="#/contrato/${c.id}"><div class="fila"><div>
        <div class="nombre">${esc(c.inquilinos?.join(", "))}</div>
        <div class="meta">${esc(c.pisoNombre)} · ${esc(c.curso)}</div></div>
        <span class="chip ${c.estado === "firmado" ? "ok" : c.estado === "firmando" ? "espera" : "firma"}">${{ firmado: "Firmado", firmando: "En firma" }[c.estado] || "Por enviar"}</span></div></a>`).join("")
      || '<div class="vacio">Aún no hay contratos.</div>'}</div>`, "contratos");
}


// ============ editar el texto de un contrato ============

const TIPOS_EDITABLES = ["title", "subtitle", "heading", "subheading", "p"];

async function vistaEditar(id) {
  const s = await getDoc(D("contratos", id));
  if (!s.exists()) return pintar(cabVolver("Contrato no encontrado", "", "#/contratos"), "contratos");
  const c = s.data();
  if (c.estado !== "generado") { location.hash = `#/contrato/${id}`; return; }
  const original = generarContrato(c.datos);
  // Cada elemento recuerda de qué párrafo del modelo viene (o null si es nuevo).
  let items = (c.bloques?.length ? c.bloques : original).map((b, i) => ({ ...b, orig: c.bloques?.length ? (b.orig ?? null) : i }));
  const fijos = items.filter(b => !TIPOS_EDITABLES.includes(b.type));
  items = items.filter(b => TIPOS_EDITABLES.includes(b.type));
  const NOMBRE = { title: "Título", subtitle: "Subtítulo", heading: "Apartado", subheading: "Cláusula", p: "Párrafo" };

  const pintarEditor = () => {
    pintar(`${cabVolver("Editar el contrato", c.inquilinos?.join(", ") || "", `#/contrato/${id}`)}
      <div class="seccion">
        <p class="ayuda">Cambia cualquier texto, quita párrafos o añade nuevos. Las cláusulas se vuelven a numerar solas. Los cambios se ven en el PDF y en lo que firma el inquilino.</p>
        ${items.map((b, i) => `<div class="tarjeta" style="gap:8px;${b.orig === null ? "border:1.5px dashed var(--terracota)" : ""}">
            <div class="fila"><span class="eti-campo">${NOMBRE[b.type]}${b.orig === null ? " · nuevo" : ""}</span>
              <button type="button" class="btn peligro" data-quitar="${i}" style="min-height:32px;font-size:13px">Quitar</button></div>
            <textarea data-i="${i}" rows="${Math.min(14, Math.max(2, Math.ceil(b.text.length / 42)))}" style="font-family:var(--sans);font-size:15px;line-height:1.5;border:1px solid var(--borde);border-radius:12px;padding:10px 12px;width:100%;${b.type !== "p" ? "font-weight:600;" : ""}">${esc(b.text)}</textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="p" style="min-height:36px;flex:1">+ Párrafo debajo</button>
              <button type="button" class="btn fantasma" data-mas="${i}" data-tipo="subheading" style="min-height:36px;flex:1">+ Cláusula debajo</button>
            </div></div>`).join("")}
        <label class="check"><input type="checkbox" id="al-modelo">
          <span>Guardar también estos cambios en mi modelo de «${esc(PLANTILLAS[c.plantilla] || "")}» para los próximos contratos. Solo se aplican a los párrafos fijos; los que llevan nombres, importes o fechas se cambian solo en este contrato.</span></label>
      </div>
      <div class="acciones">
        <button class="btn primario ancho" id="guardar">Guardar cambios</button>
        <div class="dos"><a class="btn secundario" href="#/contrato/${id}">Cancelar</a>
          <button class="btn secundario" id="restaurar">Volver al texto original</button></div>
      </div>`, "contratos");
    $$("textarea[data-i]").forEach(t => t.addEventListener("input", () => { items[+t.dataset.i].text = t.value; }));
    $$("[data-quitar]").forEach(b => (b.onclick = () => { items.splice(+b.dataset.quitar, 1); pintarEditor(); }));
    $$("[data-mas]").forEach(b => (b.onclick = () => {
      const i = +b.dataset.mas;
      const nuevo = b.dataset.tipo === "subheading" ? { type: "subheading", text: "NUEVA. Título de la cláusula.", orig: null } : { type: "p", text: "", orig: null };
      items.splice(i + 1, 0, nuevo);
      if (b.dataset.tipo === "subheading") items.splice(i + 2, 0, { type: "p", text: "", orig: null });
      pintarEditor();
      const t = $(`textarea[data-i="${i + 1}"]`); if (t) { t.focus(); t.select(); }
    }));
    $("#restaurar").onclick = async () => {
      if (!preguntar("¿Descartar todos los cambios de este contrato?")) return;
      await updateDoc(D("contratos", id), { bloques: [] });
      aviso("Texto original restaurado");
      location.hash = `#/contrato/${id}`;
    };
    $("#guardar").onclick = async () => {
      const limpios = items.map(b => ({ ...b, text: b.text.trim() })).filter(b => b.text);
      // Reconstruir el contrato completo: textos editados + firmas y anexo al final, en su sitio.
      const firmasBloque = fijos.find(b => b.type === "signatures");
      const anexo = fijos.find(b => b.type === "annex");
      let final = renumerar(limpios.map(({ type, text, orig }) => ({ type, text, orig })));
      if (firmasBloque) final.push(firmasBloque);
      if (anexo) final.push(anexo);
      await updateDoc(D("contratos", id), { bloques: final, editadoEl: serverTimestamp(), editadoPor: usuario.email });
      if ($("#al-modelo").checked) {
        const cambios = cambiosRespectoAlModelo(original, limpios, c.datos);
        if (cambios.length) {
          const a = await leerAjustes();
          const modelos = { ...(a.modelos || {}) };
          modelos[c.plantilla] = [...(modelos[c.plantilla] || []), ...cambios];
          await setDoc(D("ajustes", "general"), { modelos }, { merge: true });
        }
        aviso(cambios.length ? `Guardado. ${cambios.length} cambio(s) añadidos a tu modelo` : "Guardado en este contrato");
      } else aviso("Cambios guardados");
      location.hash = `#/contrato/${id}`;
    };
  };
  pintarEditor();
}

/** Los mismos datos con nombres, importes y fechas distintos, para saber qué párrafos son fijos. */
function datosAlternos(d) {
  const x = JSON.parse(JSON.stringify(d));
  const cambia = (o, k) => { if (o && o[k]) o[k] = String(o[k]) + " Ω"; };
  const mas1 = (o, k) => { if (o && o[k] !== undefined && o[k] !== "") o[k] = String((parseFloat(String(o[k]).replace(",", ".")) || 0) + 1); };
  const año = (o, k) => { if (o?.[k]) o[k] = String(parseInt(o[k].slice(0, 4), 10) + 3) + o[k].slice(4); };
  (x.inquilinos || []).forEach(i => { ["nombre", "numDoc", "domicilio"].forEach(k => cambia(i, k)); (i.avales || []).forEach(a => ["nombre", "numDoc", "parentesco"].forEach(k => cambia(a, k))); });
  (x.propietarios || []).forEach(o => ["nombre", "numDoc"].forEach(k => cambia(o, k)));
  ["nombre", "direccion", "descripcion"].forEach(k => cambia(x.piso, k));
  ["habitacion", "iban", "domicilioPropietarios", "ciudadFirma"].forEach(k => cambia(x, k));
  ["renta", "fianza"].forEach(k => mas1(x, k)); mas1(x.luz, "cuota"); mas1(x.luz, "tope"); mas1(x.agua, "cuota");
  ["fechaInicio", "fechaFin", "fechaFirma", "fechaEntrega"].forEach(k => año(x, k));
  return x;
}

/** Traduce las ediciones de un contrato en cambios reutilizables del modelo. */
function cambiosRespectoAlModelo(original, items, datos) {
  const sinNum = (t) => String(t || "").replace(/^[A-ZÁÉÍÓÚ]+\.\s*/, "");
  const alternos = new Set(generarContrato(datosAlternos(datos)).map(b => sinNum(b.text)));
  const fijo = (texto) => alternos.has(sinNum(texto));
  const cambios = [];
  const presentes = new Set(items.filter(b => b.orig !== null).map(b => b.orig));
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
      cambios.push({ tipo: "añadir", despuesDe: anterior, nuevo: b.text, bloque: b.type });
      anterior = b.text;
    }
  }
  // Las cláusulas se renumeran al aplicarse: guardar los títulos sin número.
  return cambios;
}

// ============ firma en la app ============

const ROL_TEXTO = { arrendador: "Arrendador", arrendatario: "Arrendatario", fiador: "Fiador" };

/** Texto final de un contrato: el editado a mano o el del modelo. */
function bloquesDe(c) {
  return c.bloques?.length ? c.bloques : generarContrato(c.datos);
}

async function huellaDe(c) {
  const texto = JSON.stringify(c.bloques?.length ? c.bloques : generarContrato({ ...c.datos, conFotos: !!c.datos.conFotos }));
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Estado público de cada firma (quién ha firmado y cuándo), sin la imagen. */
async function estadosDe(cid) {
  const s = await getDocs(C("contratos", cid, "estados"));
  const m = {};
  s.docs.forEach(d => (m[d.id] = d.data()));
  return m;
}

async function firmasDe(cid) {
  const s = await getDocs(C("contratos", cid, "firmas"));
  const m = {};
  s.docs.forEach(d => (m[d.id] = d.data()));
  return m;
}

function fechaHora(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts || Date.now());
  return d.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" });
}

/** El contrato en pantalla (mismo texto que el PDF). */
function contratoHtml(c) {
  return bloquesDe(c).map(b => {
    switch (b.type) {
      case "title": return `<h2 style="font-size:19px;text-align:center;color:var(--burdeos)">${esc(b.text)}</h2>`;
      case "subtitle": return `<p style="text-align:center;font-style:italic;margin:0">${esc(b.text)}</p>`;
      case "heading": return `<h3 style="font-size:16px;margin-top:10px">${esc(b.text)}</h3>`;
      case "subheading": return `<p style="font-weight:600;margin:6px 0 0">${esc(b.text)}</p>`;
      case "signatures": case "annex": return "";
      default: return `<p style="margin:0;line-height:1.55;text-align:justify">${esc(b.text)}</p>`;
    }
  }).join("");
}

/** Recuadro para firmar con el dedo. */
function crearPad(canvas) {
  const ctx = canvas.getContext("2d");
  const escala = window.devicePixelRatio || 1;
  const ajustar = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * escala; canvas.height = r.height * escala;
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1d1a3a";
  };
  ajustar();
  let pintando = false, trazos = 0, ultimo = null;
  const punto = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener("pointerdown", (e) => { pintando = true; ultimo = punto(e); canvas.setPointerCapture(e.pointerId); e.preventDefault(); });
  canvas.addEventListener("pointermove", (e) => {
    if (!pintando) return;
    const p = punto(e);
    ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ultimo = p; trazos++;
  });
  const fin = () => { pintando = false; };
  canvas.addEventListener("pointerup", fin); canvas.addEventListener("pointercancel", fin);
  return {
    vacio: () => trazos < 8,
    limpiar: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); trazos = 0; },
    imagen: () => {
      // Se reduce a 600×180 px en PNG para que ocupe poco (~10-30 KB).
      const out = document.createElement("canvas"); out.width = 600; out.height = 180;
      out.getContext("2d").drawImage(canvas, 0, 0, 600, 180);
      return out.toDataURL("image/png");
    },
  };
}

/**
 * Lista de firmantes con su estado y botón de firmar.
 * puedeFirmar(f) decide quién puede firmar desde esta pantalla.
 */
function bloqueFirmantes(cid, c, firmas, puedeFirmar, alFirmar, { soloEstos = null, etiquetaEspera = () => "Pendiente" } = {}) {
  const lista = soloEstos ? c.firmantes.filter(soloEstos) : c.firmantes;
  const filas = lista.map(f => {
    const hecha = firmas[f.fid];
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
    $$("[data-firmar]", root).forEach(b => (b.onclick = () => {
      const f = c.firmantes.find(x => x.fid === b.dataset.firmar);
      const zona = $(`[data-zona="${f.fid}"]`, root);
      $$("[data-zona]", root).forEach(z => z !== zona && (z.innerHTML = ""));
      zona.innerHTML = `<div class="seccion" style="padding:6px 0 0;gap:10px">
          <label class="check"><input type="checkbox" data-acepto>
            <span>Yo, <b>${esc(f.nombre)}</b>, con ${esc(f.tipoDoc || "documento")} ${esc(f.numDoc || "")}, declaro haber leído el contrato y lo acepto en calidad de ${ROL_TEXTO[f.rol].toLowerCase()}.</span></label>
          <div class="eti-campo" style="text-transform:none;letter-spacing:0;font-weight:400">Firma con el dedo dentro del recuadro</div>
          <canvas style="width:100%;height:150px;background:#FFFDF9;border:1.5px dashed #C9A894;border-radius:14px;touch-action:none"></canvas>
          <div class="dos"><button type="button" class="btn secundario" data-borrar>Borrar</button><button type="button" class="btn primario" data-confirmar>Firmar</button></div>
        </div>`;
      const pad = crearPad($("canvas", zona));
      $("[data-borrar]", zona).onclick = () => pad.limpiar();
      $("[data-confirmar]", zona).onclick = async (e) => {
        if (!$("[data-acepto]", zona).checked) return aviso("Marca la casilla de aceptación", true);
        if (pad.vacio()) return aviso("Dibuja tu firma en el recuadro", true);
        e.target.disabled = true;
        try {
          await setDoc(D("contratos", cid, "firmas", f.fid), {
            nombre: f.nombre, numDoc: f.numDoc || "", rol: f.rol, imagen: pad.imagen(),
            huella: c.huella, aceptado: true, firmadoEl: serverTimestamp(),
            dispositivo: navigator.userAgent.slice(0, 200),
          });
          await setDoc(D("contratos", cid, "estados", f.fid), { nombre: f.nombre, rol: f.rol, firmadoEl: serverTimestamp() });
          aviso("Firma guardada");
          alFirmar();
        } catch (err) {
          console.error(err);
          aviso("No se pudo guardar la firma. ¿Ya estaba firmado?", true);
          e.target.disabled = false;
        }
      };
    }));
  };
  return { html, montar };
}

/** PDF final con firmas y registro, subido a todas las carpetas de Drive. */
async function archivarFirmado(cid, c) {
  const firmas = await firmasDe(cid);
  const ajustes = await leerAjustes();
  const piso = c.pisoId ? (await getDoc(D("pisos", c.pisoId))).data() : null;
  const fotos = c.datos.conFotos ? await fotosDelPiso(piso) : null;
  const registro = {
    huella: c.huella,
    firmantes: c.firmantes.map(f => ({
      nombre: f.nombre, rolTexto: ROL_TEXTO[f.rol] + (f.avalaA ? " de " + f.avalaA : ""), tipoDoc: f.tipoDoc, numDoc: f.numDoc,
      fecha: fechaHora(firmas[f.fid]?.firmadoEl), imagen: firmas[f.fid]?.imagen,
    })),
  };
  const bytes = await construirPdf(bloquesDe(c), fotos, firmas, registro);
  const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado.pdf";
  const inv = { pisoNombre: c.pisoNombre, plantilla: c.plantilla, fechaInicio: c.datos.fechaInicio, fechaFin: c.datos.fechaFin };
  let firmado = [];
  try {
    let carpetas = (c.enDrive || []).map(d => ({ año: d.año, id: d.carpetaId }));
    if (!carpetas.length) carpetas = await carpetasDestino(ajustes, inv);
    try { firmado = await subirATodas(bytes, nombre, carpetas); }
    catch (err) {
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
    estado: "firmando", firmantes, firmantesIds: firmantes.map(f => f.fid), huella, enviadoAFirmar: serverTimestamp(),
  });
  if (c.invitacionId) await updateDoc(D("invitaciones", c.invitacionId), { contratos: arrayUnion(cid) });
}

async function vistaContrato(id) {
  const s = await getDoc(D("contratos", id));
  if (!s.exists()) return pintar(cabVolver("Contrato no encontrado", "", "#/contratos"), "contratos");
  const c = s.data();
  const firmas = c.estado === "generado" ? {} : await firmasDe(id);
  const total = (c.firmantes || []).length;
  const hechas = (c.firmantes || []).filter(f => firmas[f.fid]).length;
  const completo = total > 0 && hechas === total;
  // Vosotros firmáis los últimos: solo cuando el inquilino y sus avalistas ya han firmado.
  const ladoInquilino = (c.firmantes || []).filter(f => f.rol !== "arrendador");
  const ladoInquilinoListo = ladoInquilino.length > 0 && ladoInquilino.every(f => firmas[f.fid]);
  const paso = (t, sub, hecho) => `<div class="paso ${hecho ? "hecho" : ""}"><i>${hecho ? ICO.ok : ""}</i><div><b>${t}</b><small>${sub}</small></div></div>`;
  const firm = c.estado === "firmando" ? bloqueFirmantes(id, c, firmas,
    (f) => f.rol !== "arrendador" || ladoInquilinoListo, () => vistaContrato(id),
    { etiquetaEspera: (f) => (f.rol === "arrendador" ? "Firma al final" : "Pendiente") }) : null;

  pintar(`${cabVolver(`Contrato ${c.curso}`, `${c.pisoNombre}${c.datos?.habitacion ? " · Habitación " + c.datos.habitacion : ""}`, "#/contratos")}
    <div class="seccion">
      <div class="tarjeta"><div class="nombre" style="word-break:break-all">${esc(c.nombreArchivo)}</div>
        <div class="meta">${esc(c.inquilinos?.join(", "))}</div>
        ${(c.enDrive || []).map(d => `<a class="meta" style="color:var(--salvia-osc);font-weight:600" href="${esc(d.link)}" target="_blank" rel="noopener">✓ Renta ${d.año} / Contratos / ${esc(c.pisoNombre)}</a>`).join("")
          || '<div class="meta">No está en Drive (se descargó en el dispositivo)</div>'}</div>
      <details class="tarjeta"><summary style="font-weight:600;cursor:pointer;min-height:28px">Leer el contrato</summary>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(c)}</div></details>
      <div class="tarjeta"><div class="eti-campo">Estado</div><div class="pasos">
        ${paso("Contrato generado", fechaCorta(c.creada), true)}
        ${paso("Enviado a firmar", c.estado === "generado" ? "Cuando lo revises, envíalo a firmar" : fechaCorta(c.enviadoAFirmar), c.estado !== "generado")}
        ${paso(`Firmas (${hechas} de ${total || "—"})`, completo ? "Han firmado todos" : "Cada persona firma su parte", completo || c.estado === "firmado")}
        ${paso("Guardado firmado en Drive", c.estado === "firmado" ? fechaCorta(c.firmadoEl) : "Se guarda al completar las firmas", c.estado === "firmado")}
      </div></div>
      ${c.estado === "firmando" && c.invitacionId ? cajaEnlace({ pisoNombre: c.pisoNombre }, c.invitacionId).replace("Enlace para el inquilino", "Enlace para que firmen") : ""}
      ${firm ? `<div class="eti-campo">Firmantes</div>${firm.html}<p class="ayuda">${ladoInquilinoListo ? "Ya han firmado el inquilino y sus avalistas: ahora os toca a vosotros." : "Primero firman el inquilino y sus avalistas (desde su enlace o aquí mismo si están con vosotros). Vosotros firmáis al final."}</p>` : ""}
      ${c.estado === "firmado" && c.firmaElectronica ? `<div class="tarjeta"><div class="eti-campo">Copia del inquilino</div>
        ${c.copiaHabilitada
          ? `<div class="meta">El inquilino ya puede descargar su copia firmada desde su enlace.</div>
             ${c.invitacionId ? `<a class="btn salvia" href="https://wa.me/?text=${encodeURIComponent(`Ya está firmado el contrato de ${c.pisoNombre}. Puedes descargar tu copia aquí: ${enlaceInquilino(c.invitacionId)}`)}" target="_blank" rel="noopener">Avisar por WhatsApp</a>` : ""}`
          : `<div class="meta">Todavía no puede descargarla. Habilítala cuando lo hayas revisado todo.</div>
             <button class="btn primario" id="habilitar-copia">Habilitar copia para el inquilino</button>`}</div>` : ""}
      ${c.plantilla === "larga_duracion" ? `<div class="tarjeta"><div class="eti-campo">Vigencia</div>
        ${c.finalizado ? `<div class="meta">Finalizado el ${fechaLarga(c.finalizado)}. Ya no se copia a nuevos años de renta.</div>`
          : `<div class="meta">Vigente: se copia automáticamente a cada nueva carpeta de Renta.</div>
             <div class="rejilla">${campo("Fecha de fin", "finalizado", hoyISO(), 'type="date" id="fin-fecha"')}<button class="btn secundario" id="finalizar" style="align-self:end">Marcar como finalizado</button></div>`}</div>` : ""}
      ${c.firmado?.length ? c.firmado.map(d => `<a class="tarjeta" href="${esc(d.link)}" target="_blank" rel="noopener"><div class="nombre">Ver contrato firmado</div><div class="meta">Renta ${d.año}</div></a>`).join("") : ""}
    </div>
    <div class="acciones">
      ${c.estado === "generado" ? `<a class="btn secundario ancho" href="#/editar/${id}">${c.bloques?.length ? "Seguir editando el texto" : "Editar el texto del contrato"}</a>
        <button class="btn primario ancho" id="enviar">Enviar a firmar</button>` : ""}
      ${c.estado === "firmando" && hechas === 0 ? '<button class="btn secundario ancho" id="volver-editar">Cancelar el envío y editar el texto</button>' : ""}
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
    if (!preguntar("El enlace de firma dejará de funcionar hasta que lo envíes de nuevo. ¿Continuar?")) return;
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
    e.target.disabled = true; e.target.textContent = "Guardando…";
    try { await archivarFirmado(id, c); aviso("Contrato firmado guardado"); vistaContrato(id); }
    catch (err) { aviso("Error: " + err.message, true); e.target.disabled = false; }
  };

  $("#descargar").onclick = async () => {
    const piso = c.pisoId ? (await getDoc(D("pisos", c.pisoId))).data() : null;
    const fotos = c.datos.conFotos ? await fotosDelPiso(piso).catch(() => null) : null;
    bajar(await construirPdf(bloquesDe(c), fotos, firmas), c.nombreArchivo);
  };

  $("#firmado").onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      const ajustes = await leerAjustes();
      const inv = { pisoNombre: c.pisoNombre, plantilla: c.plantilla, fechaInicio: c.datos.fechaInicio, fechaFin: c.datos.fechaFin };
      let carpetas = (c.enDrive || []).map(d => ({ año: d.año, id: d.carpetaId }));
      if (!carpetas.length) carpetas = await carpetasDestino(ajustes, inv);
      if (!carpetas.length) return aviso("Configura Google Drive en Ajustes", true);
      const ext = archivo.type === "application/pdf" ? "pdf" : (archivo.name.split(".").pop() || "jpg");
      const nombre = c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado." + ext;
      const bytes = await archivo.arrayBuffer();
      aviso("Subiendo…");
      let firmado;
      try { firmado = await subirATodas(bytes, nombre, carpetas, archivo.type || "application/pdf"); }
      catch (err) {
        if (err.status !== 404 && err.status !== 403) throw err;
        firmado = await subirATodas(bytes, nombre, await carpetasDestino(ajustes, inv), archivo.type || "application/pdf");
      }
      await updateDoc(D("contratos", id), { estado: "firmado", firmado, firmadoEl: serverTimestamp() });
      aviso("Contrato firmado guardado");
      vistaContrato(id);
    } catch (err) { aviso("No se pudo subir: " + err.message, true); }
  };
}

/** Pantalla del inquilino cuando ya hay contrato para firmar. */
async function vistaFirmaInquilino(token, inv, contratos) {
  const bloques = [];
  for (const { id, c } of contratos) {
    const estados = await estadosDe(id);
    const intacto = (await huellaDe(c)) === c.huella;
    const suyos = c.firmantes.filter(f => f.rol !== "arrendador");
    const pendientes = suyos.filter(f => !estados[f.fid]).length;
    const copia = c.estado === "firmado" && c.copiaHabilitada;
    const firm = bloqueFirmantes(id, c, estados,
      (f) => f.rol !== "arrendador" && c.estado === "firmando" && intacto, () => vistaInquilino(token),
      { soloEstos: (f) => f.rol !== "arrendador" });
    bloques.push({ id, c, firm, pendientes, intacto, copia });
  }
  const todasCopias = bloques.every(b => b.copia);
  const sub = `${inv.pisoNombre}${inv.habitacion ? " · Habitación " + inv.habitacion : ""}`;
  const estadoTexto = (b) => {
    if (b.copia) return "";
    if (b.pendientes > 0) return "";
    if (b.c.estado === "firmado") return '<p class="ayuda">El contrato está firmado por todas las partes. Tu arrendador te avisará cuando puedas descargar tu copia.</p>';
    return '<p class="ayuda">¡Gracias! Ya habéis firmado todos. Ahora firmarán los arrendadores y te avisarán cuando tengas tu copia.</p>';
  };

  pintar(`<div class="hero"><div class="eti">${esc(sub)}</div>
      <h1>${todasCopias ? "Contrato firmado" : "Firma tu contrato"}</h1>
      <p>${todasCopias ? "Ya está firmado por todas las partes. Aquí tienes tu copia." : "Léelo o descárgalo con calma. Después, cada persona firma su parte: tú como arrendatario y cada avalista como fiador."}</p></div>
    ${bloques.map(b => `<div class="seccion">
      ${bloques.length > 1 ? `<div class="eti-campo">Contrato de ${esc(b.c.inquilinos.join(", "))}</div>` : ""}
      ${!b.intacto ? '<div class="tarjeta" style="color:#A2321F">Este contrato se ha modificado después de enviarse. Pide a tu arrendador que lo envíe de nuevo.</div>' : ""}
      ${b.copia
        ? `<button class="btn primario" data-copia="${b.id}">Descargar mi copia firmada</button>`
        : `<details class="tarjeta"><summary style="font-weight:600;cursor:pointer;min-height:28px">Leer el contrato completo</summary>
             <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px">${contratoHtml(b.c)}</div></details>
           <button class="btn secundario" data-borrador="${b.id}">Descargar el contrato en PDF (sin firmas)</button>`}
      ${b.firm.html}
      <div class="tarjeta" style="background:transparent;border:1px dashed var(--borde)"><div class="meta">Los arrendadores firman al final, cuando hayáis firmado todos.</div></div>
      ${estadoTexto(b)}
    </div>`).join("")}`);

  bloques.forEach(b => b.firm.montar(app));
  $$("[data-borrador]").forEach(btn => (btn.onclick = async () => {
    const b = bloques.find(x => x.id === btn.dataset.borrador);
    bajar(await construirPdf(bloquesDe(b.c).filter(x => x.type !== "annex")), b.c.nombreArchivo);
  }));
  $$("[data-copia]").forEach(btn => (btn.onclick = async () => {
    const b = bloques.find(x => x.id === btn.dataset.copia);
    const firmas = await firmasDe(b.id);
    bajar(await construirPdf(bloquesDe(b.c).filter(x => x.type !== "annex"), null, firmas), b.c.nombreArchivo.replace(/\.pdf$/i, "") + "_firmado.pdf");
  }));
}

// ============ formulario del inquilino ============

async function vistaInquilino(token) {
  const noValido = () => pintar(`<div class="gracias"><h1>Enlace no válido</h1><p class="ayuda">Pide a tu arrendador un enlace nuevo.</p></div>`);
  const cid = await cuentaDeEnlace(token);
  if (!cid) return noValido();
  fijarCuenta(cid);
  const s = await getDoc(D("invitaciones", token)).catch(() => null);
  if (!s || !s.exists()) return noValido();
  const inv = s.data();
  if (inv.contratos?.length) {
    const cs = [];
    for (const cid of inv.contratos) {
      const cs1 = await getDoc(D("contratos", cid)).catch(() => null);
      if (cs1?.exists() && ["firmando", "firmado"].includes(cs1.data().estado)) cs.push({ id: cid, c: cs1.data() });
    }
    if (cs.length) return vistaFirmaInquilino(token, inv, cs);
  }
  if (inv.estado !== "abierta") return pintar(`<div class="gracias"><h1>Este enlace ya está cerrado</h1><p class="ayuda">Si necesitas cambiar algún dato, escribe directamente a tu arrendador.</p></div>`);

  const clave = "borrador-" + token;
  let borrador = {};
  try { borrador = JSON.parse(localStorage.getItem(clave) || "{}"); } catch { /* sin almacenamiento */ }
  const guardarBorrador = () => { try { localStorage.setItem(clave, JSON.stringify(borrador)); } catch { /* nada */ } };
  const esEstudiante = inv.plantilla !== "larga_duracion";
  if (!borrador.avales) borrador.avales = esEstudiante ? [{ parentesco: "Madre" }, { parentesco: "Padre" }] : [];
  let paso = 1;

  const sub = `${inv.pisoNombre}${inv.habitacion ? " · Habitación " + inv.habitacion : inv.plantilla === "piso_entero" ? " · Piso entero" : ""}`;
  const hero = (titulo, texto) => `<div class="hero"><div class="eti">${esc(sub)}</div><h1>${titulo}</h1><p>${texto}</p>
    <div class="progreso">${[1, 2, 3].map(n => `<span class="${n <= paso ? "on" : ""}"></span>`).join("")}</div>
    <p style="font-size:12px">Paso ${paso} de 3</p></div>`;

  const mostrar = () => {
    if (paso === 1) {
      pintar(`${hero("Tus datos para el contrato", inv.plantilla === "piso_entero" ? "Cada compañero rellena sus propios datos con este mismo enlace." : "Solo te llevará un par de minutos.")}
        <form class="seccion" id="f">${camposPersona("p_", borrador, { contacto: true, domicilio: true })}</form>
        <div class="acciones"><button class="btn primario ancho" id="sig">Siguiente</button></div>`);
      const f = $("#f");
      activarSegmentos(f);
      f.addEventListener("input", () => { Object.assign(borrador, leerPersona(f, "p_")); guardarBorrador(); });
      f.addEventListener("change", () => { Object.assign(borrador, leerPersona(f, "p_")); guardarBorrador(); });
      $("#sig").onclick = () => {
        const p = leerPersona(f, "p_");
        if (!validarPersona(f, "p_", p, { domicilio: true })) return;
        if (!p.telefono && !p.email) return aviso("Deja al menos un teléfono o un email", true);
        Object.assign(borrador, p); guardarBorrador();
        paso = 2; mostrar();
      };
    } else if (paso === 2) {
      pintar(`${hero(esEstudiante ? "¿Quién te avala?" : "Avalistas", esEstudiante ? "Normalmente tu padre y tu madre. Si es otra persona, cambia el parentesco." : "Solo si te lo han pedido. Si no, pulsa Siguiente.")}
        <form class="seccion" id="f"><div data-avales>${borrador.avales.map((a, j) => tarjetaAval(a, j)).join("")}</div>
          <button type="button" class="btn fantasma" id="mas">+ Añadir otro avalista</button></form>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atrás</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      const f = $("#f");
      activarSegmentos(f);
      const leer = () => $$("[data-aval]", f).map(el => leerPersona(f, `a${el.dataset.aval}_`));
      $("#mas").onclick = () => { borrador.avales = [...leer(), {}]; mostrar(); };
      f.addEventListener("click", (e) => {
        const q = e.target.closest("[data-quitar]");
        if (!q) return;
        const lista = leer(); lista.splice(+q.dataset.quitar, 1);
        borrador.avales = lista; guardarBorrador(); mostrar();
      });
      $("#atras").onclick = () => { borrador.avales = leer(); guardarBorrador(); paso = 1; mostrar(); };
      $("#sig").onclick = () => {
        const lista = leer().filter(a => a.nombre || a.numDoc);
        let ok = true;
        $$("[data-aval]", f).forEach(el => {
          const j = el.dataset.aval; const a = leerPersona(f, `a${j}_`);
          if (a.nombre || a.numDoc) ok = validarPersona(f, `a${j}_`, a) && ok;
        });
        if (!ok) return;
        if (esEstudiante && !lista.length) return aviso("Hace falta al menos un avalista", true);
        borrador.avales = lista; guardarBorrador();
        paso = 3; mostrar();
      };
    } else {
      const fila = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : "";
      pintar(`${hero("Revisa y envía", "Comprueba que todo está bien escrito: así aparecerá en el contrato.")}
        <div class="seccion revision">
          <div class="tarjeta"><dl>${fila("Nombre", `${borrador.tratamiento} ${borrador.nombre}`)}${fila(borrador.tipoDoc, borrador.numDoc)}${fila("Domicilio", borrador.domicilio)}${fila("Teléfono", borrador.telefono)}${fila("Email", borrador.email)}</dl></div>
          ${borrador.avales.map(a => `<div class="tarjeta"><div class="eti-campo">Avalista${a.parentesco ? " · " + esc(a.parentesco) : ""}</div><dl>${fila("Nombre", `${a.tratamiento} ${a.nombre}`)}${fila(a.tipoDoc, a.numDoc)}</dl></div>`).join("")}
          <label class="check"><input type="checkbox" id="acepto">
            <span>${TEXTO_CONSENTIMIENTO(inv.arrendadores)}</span></label>
        </div>
        <div class="acciones"><button class="btn primario ancho" id="enviar">Enviar datos</button><button class="btn secundario" id="atras">Atrás</button></div>`);
      $("#atras").onclick = () => { paso = 2; mostrar(); };
      $("#enviar").onclick = async () => {
        if (!$("#acepto").checked) return aviso("Marca la casilla de consentimiento", true);
        $("#enviar").disabled = true;
        const limpio = (p) => ({ tratamiento: p.tratamiento, nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc, parentesco: p.parentesco || "" });
        try {
          await addDoc(C("invitaciones", token, "respuestas"), {
            tratamiento: borrador.tratamiento, nombre: borrador.nombre, tipoDoc: borrador.tipoDoc, numDoc: borrador.numDoc,
            domicilio: borrador.domicilio, telefono: borrador.telefono || "", email: borrador.email || "",
            avales: borrador.avales.map(limpio), consentimiento: true, enviada: serverTimestamp(),
          });
          try { localStorage.removeItem(clave); } catch { /* nada */ }
          pintar(`<div class="gracias"><div class="circulo">${ICO.ok.replace(/14/g, "34")}</div>
            <h1>¡Gracias, ${esc(borrador.nombre.split(" ")[0])}!</h1>
            <p class="ayuda">Hemos recibido tus datos. Te enviaremos el contrato para firmar en cuanto esté listo.</p></div>`);
        } catch (e) {
          aviso("No se pudo enviar. Inténtalo de nuevo en un momento.", true);
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

// ============ facturas ============

function nombreFactura(proveedor, concepto, fecha, ext) {
  const limpio = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^A-Za-z0-9]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join("");
  return `${limpio(proveedor) || "Factura"}_${limpio(concepto) || "Gasto"}_${fecha}.${ext}`;
}

/** Rentas / Renta AAAA / Pisos facturas / <Piso> */
async function carpetaFacturas(ajustes, año, piso) {
  const renta = await drive.asegurarCarpeta([`Renta ${año}`, `renta${año}`], ajustes.carpetaDriveId);
  const facturas = await drive.asegurarCarpeta(["Pisos facturas", "Facturas"], renta);
  return drive.asegurarCarpeta([piso.carpetaFacturas, piso.nombre].filter(Boolean), facturas);
}

async function vistaFacturas() {
  const [pisos, facturas] = await Promise.all([listarPisos(), listar("facturas")]);
  if (!pisos.length) return pintar(`${cabVolver("Facturas")}<div class="vacio">Primero <a href="#/piso/nuevo">añade un piso</a>.</div>`, "facturas");
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
        <div class="rejilla">${campo("Proveedor", "proveedor", "", 'placeholder="JYSK, Ikea, Endesa…"')}${campo("Concepto", "concepto", "", 'placeholder="Escritorio"')}</div>
        <div class="rejilla">${campo("Fecha de la factura", "fecha", hoyISO(), 'type="date"')}${campo("Importe (€, opcional)", "importe", "", 'inputmode="decimal"')}</div>
      </form>
      <p class="ayuda" id="destino"></p>
    </div>
    <div class="acciones"><button class="btn primario ancho" id="guardar">Guardar factura</button></div>
    ${facturas.length ? `<div class="titulo-seccion"><h2>Últimas facturas</h2></div>
      <div class="seccion">${facturas.slice(0, 20).map(x => `
        <a class="tarjeta" href="${esc(x.link || "#")}" target="_blank" rel="noopener"><div class="fila"><div>
          <div class="nombre">${esc(x.proveedor || "Factura")} · ${esc(x.concepto || "")}</div>
          <div class="meta">${esc(x.pisoNombre)} · ${fechaLarga(x.fecha)}</div></div>
          ${x.importe ? `<span class="chip gris">${euros(x.importe)}</span>` : ""}</div></a>`).join("")}</div>` : ""}`, "facturas");

  const f = $("#f");
  const destino = () => {
    const año = (f.fecha.value || hoyISO()).slice(0, 4);
    $("#destino").textContent = `Se guardará en Rentas / Renta ${año} / Pisos facturas / ${piso.carpetaFacturas || piso.nombre}`;
  };
  destino();
  f.fecha.addEventListener("change", destino);
  $("#pisos").onclick = (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    $$("#pisos button").forEach(x => x.classList.toggle("on", x === b));
    piso = pisos.find(p => p.id === b.dataset.id);
    destino();
  };
  const elegir = (e) => {
    archivo = e.target.files[0];
    if (!archivo) return;
    $("#elegido").style.display = "";
    $("#elegido-nombre").textContent = archivo.name;
    const img = $("#vista");
    if (archivo.type.startsWith("image/")) { img.src = URL.createObjectURL(archivo); img.style.display = ""; }
    else img.style.display = "none";
  };
  $("#foto").onchange = elegir;
  $("#archivo").onchange = elegir;

  $("#guardar").onclick = async (e) => {
    if (!archivo) return aviso("Haz una foto o elige el archivo de la factura", true);
    const ajustes = await leerAjustes();
    if (!(await raizDrive(ajustes))) return aviso("Configura Google Drive en Ajustes", true);
    const fecha = f.fecha.value || hoyISO();
    const ext = archivo.type === "application/pdf" ? "pdf" : (archivo.name.split(".").pop() || "jpg").toLowerCase();
    const nombre = nombreFactura(f.proveedor.value, f.concepto.value, fecha, ext);
    e.target.disabled = true; e.target.textContent = "Subiendo…";
    try {
      const carpeta = await carpetaFacturas(ajustes, fecha.slice(0, 4), piso);
      const r = await drive.subirPdf(await archivo.arrayBuffer(), nombre, carpeta, archivo.type || "image/jpeg");
      await addDoc(C("facturas"), {
        pisoId: piso.id, pisoNombre: piso.nombre, proveedor: f.proveedor.value.trim(), concepto: f.concepto.value.trim(),
        fecha, importe: f.importe.value.trim(), nombre, driveId: r.id, link: r.webViewLink, creada: serverTimestamp(), creadaPor: usuario.email,
      });
      aviso(`Guardada: ${nombre}`);
      vistaFacturas();
    } catch (err) {
      aviso("No se pudo subir: " + err.message, true);
      e.target.disabled = false; e.target.textContent = "Guardar factura";
    }
  };
}

// ============ cuenta: portada, asistente, ajustes, equipo, legal ============

const CCAA = ["Andalucía", "Aragón", "Principado de Asturias", "Illes Balears", "Canarias", "Cantabria", "Castilla-La Mancha",
  "Castilla y León", "Cataluña", "Comunitat Valenciana", "Extremadura", "Galicia", "Comunidad de Madrid", "Región de Murcia",
  "Comunidad Foral de Navarra", "País Vasco", "La Rioja", "Ceuta", "Melilla"];

function enlacesLegales() {
  return `<p class="ayuda" style="text-align:center;font-size:12px">
    <a href="#/legal/privacidad">Privacidad</a> · <a href="#/legal/terminos">Condiciones</a> · <a href="#/legal/aviso">Aviso legal</a></p>`;
}

async function vistaLogin() {
  pintar(`<div class="login" style="padding-top:56px">
    <h1>${esc(CONFIG.nombreApp || "Contratos de alquiler")}</h1>
    <p class="ayuda" style="font-size:15px;max-width:34ch">Tus inquilinos rellenan sus datos desde el móvil, el contrato se genera solo y lo firma cada parte desde su teléfono.</p>
    <div class="seccion" style="padding:0;text-align:left;width:100%;max-width:420px">
      <div class="tarjeta"><div class="nombre">Sin papeleo</div><div class="meta">Un enlace por inquilino: datos, avalistas y DNI validados.</div></div>
      <div class="tarjeta"><div class="nombre">Firma en el móvil</div><div class="meta">Inquilino, avalistas y propietarios firman con el dedo. Queda registro de cada firma.</div></div>
      <div class="tarjeta"><div class="nombre">Todo en tu Google Drive</div><div class="meta">Contratos y facturas ordenados por año de la renta y por piso.</div></div>
    </div>
    <button class="btn primario" id="entrar" style="min-width:260px">Entrar con Google</button>
    <a class="btn secundario" href="${esc((CONFIG.urlApp || location.pathname) + "?demo#/")}" style="min-width:260px">Probar la demo sin registrarte</a>
    <p class="ayuda" style="font-size:13px;max-width:36ch">Estamos en <b>beta privada</b>: entra con Google y solicita acceso. La demo usa datos inventados y no guarda nada.</p>
    <p class="ayuda" style="font-size:12px;max-width:36ch">Al entrar aceptas las <a href="#/legal/terminos">condiciones de uso</a> y la <a href="#/legal/privacidad">política de privacidad</a>.</p>
    ${usuario ? '<button class="btn peligro" id="salir">Usar otra cuenta</button>' : ""}
    ${enlacesLegales()}
  </div>`);
  $("#entrar").onclick = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { aviso("No se pudo iniciar sesión: " + e.message, true); }
  };
  if ($("#salir")) $("#salir").onclick = () => signOut(auth);
}

function vistaLegal(slug) {
  const titulo = LEGALES[slug] || "Información legal";
  pintar(`${cabVolver(titulo, CONFIG.nombreApp || "", usuario ? "#/ajustes" : "#/")}
    <div class="seccion" style="gap:12px;font-size:14px">${paginaLegal(slug)}</div>
    <div class="acciones">${enlacesLegales()}</div>`);
}

/** Editor de una lista de propietarios (1 a 4). */
function editorPropietarios(cont, lista) {
  const pintarLista = () => {
    cont.innerHTML = lista.map((p, i) => `<div class="tarjeta" data-prop="${i}">
        <div class="fila"><div class="eti-campo">Propietario ${i + 1}</div>
        ${lista.length > 1 ? `<button type="button" class="btn peligro" data-quitar-prop="${i}" style="min-height:36px">Quitar</button>` : ""}</div>
        ${camposPersona(`o${i}_`, p)}</div>`).join("") +
      (lista.length < 4 ? `<button type="button" class="btn fantasma" data-mas-prop>+ Añadir copropietario</button>` : "");
    activarSegmentos(cont);
    const mas = cont.querySelector("[data-mas-prop]");
    if (mas) mas.onclick = () => { leer(); lista.push({ tipoDoc: "DNI" }); pintarLista(); };
    cont.querySelectorAll("[data-quitar-prop]").forEach(b => (b.onclick = () => { leer(); lista.splice(+b.dataset.quitarProp, 1); pintarLista(); }));
  };
  const leer = () => lista.forEach((_, i) => (lista[i] = leerPersona(cont, `o${i}_`)));
  pintarLista();
  return {
    leer: () => { leer(); return lista.map(({ tratamiento, nombre, tipoDoc, numDoc }) => ({ tratamiento, nombre, tipoDoc, numDoc })); },
    validar: () => { leer(); let ok = true; lista.forEach((p, i) => { ok = validarPersona(cont, `o${i}_`, p) && ok; }); return ok; },
  };
}

function normalizarIban(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}
const ibanValido = (iban) => /^ES\d{2}( \d{4}){5}$/.test(iban);

function selectCcaa(valor) {
  return `<label class="campo">Comunidad autónoma de tus pisos<select name="ccaa"><option value="">Sin indicar</option>
    ${CCAA.map(c => `<option ${c === valor ? "selected" : ""}>${c}</option>`).join("")}</select></label>`;
}

async function vistaBienvenida() {
  const a = await leerAjustes();
  let paso = 1;
  const props = JSON.parse(JSON.stringify(a.propietarios?.length ? a.propietarios : [{ nombre: usuario.displayName || "", tipoDoc: "DNI" }]));
  const datos = { domicilio: a.domicilio || "", iban: a.iban || "", ciudadFirma: a.ciudadFirma || "", ccaa: a.condiciones?.ccaa || "", modoDrive: a.modoDrive || "propia" };
  let editor;
  const cab = (t, sub) => `<div class="hero"><div class="eti">Bienvenida · ${paso} de 4</div><h1>${t}</h1><p>${sub}</p>
    <div class="progreso" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4].map(n => `<span class="${n <= paso ? "on" : ""}"></span>`).join("")}</div></div>`;
  const guardar = async (extra = {}) => setDoc(D("ajustes", "general"), {
    propietarios: props, domicilio: datos.domicilio, iban: datos.iban, ciudadFirma: datos.ciudadFirma,
    modoDrive: datos.modoDrive, condiciones: { ...(a.condiciones || {}), ccaa: datos.ccaa }, ...extra,
  }, { merge: true });

  const mostrar = () => {
    if (paso === 1) {
      pintar(`${cab("¿Quién alquila?", "Tus datos tal y como aparecerán en los contratos. Si el piso es de varias personas, añádelas.")}
        <div class="seccion" id="props"></div>
        <div class="acciones"><button class="btn primario ancho" id="sig">Siguiente</button></div>`);
      editor = editorPropietarios($("#props"), props);
      $("#sig").onclick = () => { if (!editor.validar()) return; props.splice(0, props.length, ...editor.leer()); paso = 2; mostrar(); };
    } else if (paso === 2) {
      pintar(`${cab("Cobro y notificaciones", "Dónde te llegan las notificaciones y dónde te pagan la renta.")}
        <form class="seccion" id="f">
          ${campo("Domicilio para notificaciones", "domicilio", datos.domicilio, 'placeholder="Calle, número, piso, CP y ciudad"')}
          ${campo("IBAN para el pago de la renta", "iban", datos.iban, 'autocapitalize="characters" placeholder="ES00 0000 0000 0000 0000 0000"')}
          ${campo("Ciudad donde sueles firmar", "ciudadFirma", datos.ciudadFirma)}
          ${selectCcaa(datos.ccaa)}
          <p class="ayuda">La comunidad autónoma se usa para la cláusula del depósito de la fianza, que es obligatorio y cambia según la región.</p>
        </form>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atrás</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      const f = $("#f");
      $("#atras").onclick = () => { paso = 1; mostrar(); };
      $("#sig").onclick = () => {
        datos.domicilio = f.domicilio.value.trim(); datos.iban = normalizarIban(f.iban.value);
        datos.ciudadFirma = f.ciudadFirma.value.trim(); datos.ccaa = f.ccaa.value;
        if (datos.domicilio.length < 8) return aviso("Escribe el domicilio completo", true);
        if (!ibanValido(datos.iban)) return aviso("El IBAN debe ser español: ES + 22 números", true);
        paso = 3; mostrar();
      };
    } else if (paso === 3) {
      pintar(`${cab("Tu Google Drive", "Aquí se guardarán los contratos firmados y las facturas, ordenados por año de la renta y por piso.")}
        <div class="seccion">
          <button type="button" class="opcion-luz ${datos.modoDrive === "propia" ? "on" : ""}" data-modo="propia"><b>Crear una carpeta «${esc(CONFIG.carpetaRaiz || "Alquileres")}» (recomendado)</b>
            <span>La app solo accede a esa carpeta. Dentro crea Renta AAAA / Contratos / Piso y Renta AAAA / Pisos facturas / Piso.</span></button>
          <button type="button" class="opcion-luz ${datos.modoDrive === "completo" ? "on" : ""}" data-modo="completo"><b>Usar carpetas que ya tengo</b>
            <span>Por ejemplo, una carpeta «Rentas» con tus Renta 2025, Renta 2026… Requiere permiso para ver tu Drive.</span></button>
          <button class="btn salvia" id="conectar">Conectar Google Drive</button>
          <p class="ayuda" id="estado-drive">${a.carpetaDriveNombre ? "Conectado: " + esc(a.carpetaDriveNombre) : "Puedes hacerlo ahora o más tarde desde Ajustes."}</p>
        </div>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atrás</button><button class="btn primario" id="sig">Siguiente</button></div></div>`);
      $$("[data-modo]").forEach(b => (b.onclick = () => {
        datos.modoDrive = b.dataset.modo; $$("[data-modo]").forEach(x => x.classList.toggle("on", x === b));
      }));
      $("#conectar").onclick = async () => {
        try {
          await guardar();
          const aj = await leerAjustes();
          if (datos.modoDrive === "completo") {
            const r = await drive.elegir("carpeta");
            if (!r) return;
            await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
            a.carpetaDriveNombre = r.name;
          } else {
            if (aj.modoDrive !== "propia" || !aj.carpetaDriveId) { aj.carpetaDriveId = ""; await raizDrive(aj); }
            a.carpetaDriveNombre = aj.carpetaDriveNombre;
          }
          $("#estado-drive").textContent = "Conectado: " + a.carpetaDriveNombre;
          aviso("Google Drive conectado");
        } catch (e) { aviso("Drive: " + e.message, true); }
      };
      $("#atras").onclick = () => { paso = 2; mostrar(); };
      $("#sig").onclick = () => { paso = 4; mostrar(); };
    } else {
      pintar(`${cab("Último paso", "Lee y acepta las condiciones para empezar.")}
        <div class="seccion">
          <label class="check"><input type="checkbox" id="acepto">
            <span>Acepto las <a href="#/legal/terminos" target="_blank" rel="noopener">condiciones de uso</a>, el <a href="#/legal/encargo" target="_blank" rel="noopener">contrato de encargo del tratamiento</a> de los datos de mis inquilinos y he leído la <a href="#/legal/privacidad" target="_blank" rel="noopener">política de privacidad</a>.</span></label>
          <p class="ayuda">Los modelos de contrato son orientativos: revísalos antes de enviarlos a firmar y adáptalos en Ajustes → Contratos.</p>
        </div>
        <div class="acciones"><div class="dos"><button class="btn secundario" id="atras">Atrás</button><button class="btn primario" id="fin">Empezar</button></div></div>`);
      $("#atras").onclick = () => { paso = 3; mostrar(); };
      $("#fin").onclick = async () => {
        if (!$("#acepto").checked) return aviso("Marca la casilla para continuar", true);
        await guardar({ terminosAceptados: serverTimestamp(), versionTerminos: CONFIG.versionTextos || "1" });
        aviso("¡Listo! Ahora añade tu primer piso");
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
        ${campo("Día límite de pago (1-28)", "diaPago", k.diaPago || 7, 'type="number" min="1" max="28" inputmode="numeric"')}
        <label class="campo">Garantía adicional<select name="garantiaMeses">
          ${[0, 1, 2].map(n => `<option value="${n}" ${String(k.garantiaMeses || 0) === String(n) ? "selected" : ""}>${n === 0 ? "Ninguna" : n === 1 ? "1 mensualidad" : "2 mensualidades"}</option>`).join("")}</select></label>
      </div>
      <label class="check"><input type="checkbox" name="clausulaLimpieza" ${k.clausulaLimpieza === false ? "" : "checked"}>
        <span>Incluir la cláusula de limpieza al devolver el piso (contratos de estudiantes)</span></label>
      <label class="campo">Cláusulas adicionales (se añaden a todos tus contratos; separa cada una con una línea en blanco)
        <textarea name="clausulasExtra" rows="5" placeholder="Por ejemplo: No se permiten mascotas sin autorización escrita del arrendador.">${esc(k.clausulasExtra || "")}</textarea></label>

      ${Object.entries(a.modelos || {}).filter(([, v]) => v?.length).map(([pl, v]) => `<div class="tarjeta"><div class="fila"><div>
          <div class="nombre" style="font-size:14px">Modelo «${esc(PLANTILLAS[pl] || pl)}»</div>
          <div class="meta">${v.length} cambio(s) guardados desde el editor de contratos</div></div>
          <button type="button" class="btn peligro" data-borrar-modelo="${pl}" style="min-height:36px">Quitar cambios</button></div></div>`).join("")}

      <div class="eti-campo">Google Drive</div>
      ${segmento("modoDrive", [["propia", "Carpeta propia de la app"], ["completo", "Mis carpetas"]], a.modoDrive || "propia")}
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
      ${(cuenta?.emailsMiembros || []).map(e => {
        const activo = Object.values(cuenta.correos || {}).includes(e);
        return `<div class="tarjeta"><div class="fila"><div><div class="nombre" style="font-size:14px">${esc(e)}</div>
          <div class="meta">${e === yo ? "Tú" : activo ? "Miembro" : "Invitación pendiente: que entre con este email"}</div></div>
          ${e !== yo && esTitular ? `<button class="btn peligro" data-quitar-miembro="${esc(e)}" style="min-height:36px">Quitar</button>` : ""}</div></div>`;
      }).join("")}
      <div class="rejilla" style="grid-template-columns:1fr auto">
        ${campo("Email de Google de la otra persona", "nuevoMiembro", "", 'type="email" id="nuevo-miembro" placeholder="nombre@gmail.com"')}
        <button class="btn secundario" id="invitar" style="align-self:end">Añadir</button>
      </div>
    </div>

    <div class="titulo-seccion"><h2>Privacidad y datos</h2></div>
    <div class="seccion">
      <div class="tarjeta" style="gap:6px">
        ${Object.entries(LEGALES).map(([k2, t]) => `<a href="#/legal/${k2}" style="font-size:14px">${t}</a>`).join("")}
      </div>
      ${DEMO ? "" : '<button class="btn secundario" id="exportar">Descargar una copia de mis datos</button>'}
      ${esTitular
        ? `<button class="btn peligro" id="borrar-cuenta">Borrar mi cuenta y todos sus datos</button><div id="confirmar-borrado"></div>`
        : `<button class="btn peligro" id="salir-equipo">Salir de este equipo</button>`}
    </div>

    ${(await esAdmin()) ? '<div class="seccion"><a class="btn salvia" href="#/admin">Panel de administración (beta)</a></div>' : ""}
    <div class="acciones">
      <p class="ayuda" style="text-align:center">Sesión: ${esc(usuario.email)}</p>
      <button class="btn secundario" id="salir">Cerrar sesión</button>
      ${enlacesLegales()}
    </div>`, "ajustes");

  const f = $("#f");
  activarSegmentos(f);
  const editor = editorPropietarios($("#props"), props);
  f.addEventListener("change", (e) => {
    if (e.target.name === "modoDrive") {
      $("#elegir").textContent = e.target.value === "completo" ? "Elegir" : "Conectar";
      aviso("Pulsa Guardar y después " + (e.target.value === "completo" ? "Elegir" : "Conectar"));
    }
  });
  $("#elegir").onclick = async () => {
    try {
      const modo = f.modoDrive.value;
      if (modo !== (a.modoDrive || "propia")) return aviso("Guarda primero el cambio de modo", true);
      if (modo === "completo") {
        const r = await drive.elegir("carpeta");
        if (!r) return;
        f.carpetaDriveId.value = r.id; f.carpetaDriveNombre.value = r.name;
        $("#carpeta-nombre").textContent = r.name;
        await setDoc(D("ajustes", "general"), { carpetaDriveId: r.id, carpetaDriveNombre: r.name }, { merge: true });
        aviso(`Carpeta «${r.name}» guardada`);
      } else {
        const aj = await leerAjustes();
        await raizDrive(aj);
        $("#carpeta-nombre").textContent = aj.carpetaDriveNombre;
        aviso("Google Drive conectado");
      }
    } catch (e) { aviso("Drive: " + e.message, true); }
  };
  $("#guardar").onclick = async () => {
    if (!editor.validar()) return;
    const iban = normalizarIban(f.iban.value);
    if (!ibanValido(iban)) return aviso("El IBAN debe ser español: ES + 22 números", true);
    const modo = f.modoDrive.value;
    const cambiaModo = modo !== (a.modoDrive || "propia");
    await setDoc(D("ajustes", "general"), {
      propietarios: editor.leer(), domicilio: f.domicilio.value.trim(), iban, ciudadFirma: f.ciudadFirma.value.trim(),
      modoDrive: modo,
      carpetaDriveId: cambiaModo ? "" : f.carpetaDriveId.value, carpetaDriveNombre: cambiaModo ? "" : f.carpetaDriveNombre.value,
      condiciones: {
        ccaa: f.ccaa.value, diaPago: Math.min(28, Math.max(1, parseInt(f.diaPago.value, 10) || 7)),
        garantiaMeses: parseInt(f.garantiaMeses.value, 10) || 0, clausulaLimpieza: f.clausulaLimpieza.checked,
        clausulasExtra: f.clausulasExtra.value.trim(),
      },
    }, { merge: true });
    aviso(cambiaModo ? "Guardado. Ahora conecta tu Drive" : "Ajustes guardados");
    if (cambiaModo) vistaAjustes();
  };
  $$("[data-borrar-modelo]").forEach(b => (b.onclick = async () => {
    if (!preguntar("¿Volver al modelo original? Los contratos ya generados no cambian.")) return;
    await setDoc(D("ajustes", "general"), { modelos: { ...(a.modelos || {}), [b.dataset.borrarModelo]: [] } }, { merge: true });
    aviso("Modelo restaurado"); vistaAjustes();
  }));
  $("#invitar").onclick = async () => {
    const email = $("#nuevo-miembro").value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return aviso("Escribe un email válido", true);
    try { await invitarMiembro(email); aviso(`Listo: ${email} ya puede entrar con su cuenta de Google`); vistaAjustes(); }
    catch (e) { aviso("No se pudo añadir: " + e.message, true); }
  };
  $$("[data-quitar-miembro]").forEach(b => (b.onclick = async () => {
    if (!preguntar(`¿Quitar a ${b.dataset.quitarMiembro} del equipo?`)) return;
    await quitarMiembro(b.dataset.quitarMiembro, cuenta);
    aviso("Quitado del equipo"); vistaAjustes();
  }));
  if ($("#exportar")) $("#exportar").onclick = async () => {
    aviso("Preparando la copia…");
    const copia = await exportarCuenta();
    const url = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" }));
    const enl = Object.assign(document.createElement("a"), { href: url, download: `mis-datos-${hoyISO()}.json` });
    document.body.appendChild(enl); enl.click(); enl.remove();
  };
  if ($("#borrar-cuenta")) $("#borrar-cuenta").onclick = () => {
    $("#confirmar-borrado").innerHTML = `<div class="tarjeta" style="gap:10px">
      <div class="meta" style="color:#A2321F">Se borrarán para siempre tus pisos, inquilinos, contratos, firmas y facturas de la app, y los enlaces dejarán de funcionar. Los archivos de tu Google Drive no se tocan.</div>
      ${campo("Escribe BORRAR para confirmar", "conf", "", 'id="conf-borrar" autocapitalize="characters"')}
      <button class="btn peligro" id="borrar-ya" style="border:1px solid #A2321F">Borrar definitivamente</button></div>`;
    $("#borrar-ya").onclick = async (e) => {
      if ($("#conf-borrar").value.trim().toUpperCase() !== "BORRAR") return aviso("Escribe BORRAR para confirmar", true);
      e.target.disabled = true; e.target.textContent = "Borrando…";
      try { await borrarCuenta(); aviso("Cuenta borrada"); await signOut(auth); location.hash = "#/"; }
      catch (err) { aviso("No se pudo borrar: " + err.message, true); e.target.disabled = false; }
    };
  };
  if ($("#salir-equipo")) $("#salir-equipo").onclick = async () => {
    if (!preguntar("¿Salir de este equipo? Dejarás de ver sus pisos y contratos.")) return;
    await quitarMiembro(yo, cuenta);
    await deleteDoc(doc(db, "usuarios", usuario.uid)).catch(() => {});
    cuentaLista = { uid: null, ok: false };
    location.hash = "#/"; enrutar();
  };
  $("#salir").onclick = () => signOut(auth);
}

// ---------- exportar y borrar (derechos RGPD) ----------

const COLS = ["ajustes", "pisos", "invitaciones", "contratos", "facturas"];
const SUBS = { invitaciones: ["respuestas"], contratos: ["firmas", "estados"] };

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
  const out = { exportado: new Date().toISOString(), cuenta: await leerCuenta(), datos: {} };
  await recorrerCuenta(async (ruta, d) => { out.datos[ruta.join("/")] = d.data(); });
  return out;
}

async function borrarCuenta() {
  await recorrerCuenta(async (ruta) => {
    if (ruta.length === 2 && ruta[0] === "invitaciones") await deleteDoc(doc(db, "enlaces", ruta[1])).catch(() => {});
    await deleteDoc(D(...ruta));
  });
  const cuenta = await leerCuenta();
  for (const e of cuenta?.emailsMiembros || []) await deleteDoc(doc(db, "accesos", e)).catch(() => {});
  await deleteDoc(doc(db, "cuentas", CID));
  await deleteDoc(doc(db, "usuarios", usuario.uid)).catch(() => {});
  cuentaLista = { uid: null, ok: false };
}


// ============ beta: espera de activación y panel de administración ============

async function vistaEspera(cuenta) {
  const pago = CONFIG.pago || {};
  const enviada = cuenta?.solicitud;
  pintar(`<div class="hero"><div class="eti">Beta privada</div><h1>Tu cuenta está casi lista</h1>
      <p>Estamos dando acceso poco a poco. En cuanto se active, entrarás directamente al asistente de configuración.</p></div>
    <div class="seccion">
      ${pago.precio && pago.bizum ? `<div class="tarjeta"><div class="nombre">Activa tu cuenta</div>
          <div class="meta" style="font-size:14px;line-height:1.5">Haz un Bizum de <b>${esc(pago.precio)} €</b> al <b>${esc(pago.bizum)}</b> con el concepto <b>${esc(usuario.email)}</b>. La activamos en menos de 24 horas${pago.duracion ? ` y tendrás acceso durante ${esc(pago.duracion)}` : ""}.</div></div>` : ""}
      ${enviada
        ? `<div class="tarjeta" style="background:var(--salvia-claro)"><div class="nombre" style="color:#3F4D37">Solicitud enviada</div>
            <div class="meta" style="color:#3F4D37">El ${fechaCorta(enviada)}. Te avisaremos en ${esc(usuario.email)}.</div></div>`
        : `<label class="campo">Cuéntanos cuántos pisos alquilas y cómo (opcional)<textarea id="mensaje" rows="3" placeholder="Por ejemplo: 3 pisos de estudiantes en Córdoba"></textarea></label>
           <button class="btn primario" id="solicitar">Solicitar acceso</button>`}
      <a class="btn secundario" href="${esc((CONFIG.urlApp || location.pathname) + "?demo#/")}">Mientras tanto, ver la demo</a>
    </div>
    <div class="acciones"><p class="ayuda" style="text-align:center">Sesión: ${esc(usuario.email)}</p>
      <button class="btn peligro" id="salir">Cerrar sesión</button>${enlacesLegales()}</div>`);
  if ($("#solicitar")) $("#solicitar").onclick = async (e) => {
    e.target.disabled = true;
    try { await solicitarAcceso($("#mensaje").value); aviso("Solicitud enviada"); enrutar(); }
    catch (err) { aviso("No se pudo enviar: " + err.message, true); e.target.disabled = false; }
  };
  $("#salir").onclick = () => signOut(auth);
}

async function vistaAdmin() {
  const cuentas = (await listarCuentas()).sort((a, b) => {
    const t = (x) => x.solicitud?.toDate ? x.solicitud.toDate().getTime() : x.creada?.toDate ? x.creada.toDate().getTime() : 0;
    return t(b) - t(a);
  });
  const estado = (c) => cuentaActiva(c)
    ? `<span class="chip ok">Activa${c.activoHasta ? " hasta " + fechaCorta(c.activoHasta) + " " + (c.activoHasta.toDate ? c.activoHasta.toDate() : new Date(c.activoHasta)).getFullYear() : ""}</span>`
    : c.solicitud ? '<span class="chip espera">Solicita acceso</span>' : '<span class="chip gris">Pendiente</span>';
  pintar(`${cabVolver("Administración", `${cuentas.length} cuentas`, "#/ajustes")}
    <div class="seccion">
      ${cuentas.map(c => `<div class="tarjeta">
          <div class="fila"><div><div class="nombre">${esc(c.nombre || "")}</div>
            <div class="meta">${esc((c.emailsMiembros || []).join(", "))}</div></div>${estado(c)}</div>
          ${c.mensajeSolicitud ? `<div class="meta" style="font-style:italic">«${esc(c.mensajeSolicitud)}»</div>` : ""}
          <div class="meta">Creada el ${fechaCorta(c.creada)}${c.solicitud ? " · solicitud el " + fechaCorta(c.solicitud) : ""}</div>
          ${c.id === CID ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn secundario" data-activar="${c.id}" data-meses="12" style="min-height:40px">Activar 1 año</button>
            <button class="btn secundario" data-activar="${c.id}" data-meses="1" style="min-height:40px">Prueba 1 mes</button>
            ${cuentaActiva(c) ? `<button class="btn peligro" data-desactivar="${c.id}" style="min-height:40px">Desactivar</button>` : ""}</div>`}
        </div>`).join("") || '<div class="vacio">Todavía no hay cuentas.</div>'}
    </div>`, "ajustes");
  $$("[data-activar]").forEach(b => (b.onclick = async () => {
    await activarCuenta(b.dataset.activar, +b.dataset.meses); aviso("Cuenta activada"); vistaAdmin();
  }));
  $$("[data-desactivar]").forEach(b => (b.onclick = async () => {
    if (!preguntar("¿Desactivar esta cuenta? Dejará de poder crear o editar nada.")) return;
    await desactivarCuenta(b.dataset.desactivar); aviso("Cuenta desactivada"); vistaAdmin();
  }));
}

// ============ router ============

async function enrutar() {
  const partes = (location.hash.replace(/^#\/?/, "") || "").split("/");
  const [ruta, arg] = partes;
  try {
    if (ruta === "i") return await vistaInquilino(arg);
    if (ruta === "legal") return vistaLegal(arg);
    if (!authListo) return;
    if (!usuario) return await vistaLogin();
    if (!(await prepararCuenta())) {
      pintar(`<div class="gracias"><h1>No se pudo abrir tu cuenta</h1><p class="ayuda">${esc(cuentaLista.error || "")}</p>
        <button class="btn secundario" id="reintentar">Reintentar</button></div>`);
      $("#reintentar").onclick = () => { cuentaLista = { uid: null }; enrutar(); };
      return;
    }
    const cuentaActual = await leerCuenta();
    const admin = await esAdmin();
    if (admin && !cuentaActiva(cuentaActual)) await activarCuenta(CID, 1200);
    if (ruta === "admin" && admin) return await vistaAdmin();
    if (!admin && !cuentaActiva(cuentaActual)) return await vistaEspera(cuentaActual);
    switch (ruta) {
      case "bienvenida": return await vistaBienvenida();
      case "": return await vistaPanel();
      case "pisos": return await vistaPisos();
      case "piso": return await vistaPiso(arg);
      case "nuevo": return await vistaNueva();
      case "inv": return await vistaInvitacion(arg);
      case "contratos": return await vistaContratos();
      case "contrato": return await vistaContrato(arg);
      case "editar": return await vistaEditar(arg);
      case "ajustes": return await vistaAjustes();
      case "facturas": return await vistaFacturas();
      default: location.hash = "#/";
    }
  } catch (e) {
    console.error(e);
    pintar(`<div class="gracias"><h1>Algo ha fallado</h1><p class="ayuda">${esc(e.message)}</p><a class="btn secundario" href="#/">Volver al inicio</a></div>`);
  }
}

window.addEventListener("hashchange", enrutar);
// El formulario del inquilino no necesita sesión: se pinta una sola vez al cargar.
onAuthStateChanged(auth, (u) => {
  usuario = u; authListo = true;
  if (!u) cuentaLista = { uid: null, ok: false };
  if (!location.hash.startsWith("#/i/") && !location.hash.startsWith("#/legal/")) enrutar();
});
if (location.hash.startsWith("#/i/") || location.hash.startsWith("#/legal/")) enrutar();
