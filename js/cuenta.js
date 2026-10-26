// Cuentas: cada propietario (o grupo de propietarios) tiene su espacio
// cuentas/{id}, con sus ajustes, pisos, invitaciones, contratos y facturas.
//
//   usuarios/{uid}        → { cuentaId, email }
//   cuentas/{id}          → { nombre, miembros: [uid], emailsMiembros: [email], creada, plan }
//   accesos/{email}       → { cuentaId }   (invitación para unirse a una cuenta)
//   enlaces/{token}       → { cuentaId }   (enlace público del inquilino → su cuenta)

import { db, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp, arrayUnion, DEMO } from "./datos.js";

export let CID = null;
let ADMIN = null;

/** ¿Es la administradora del servicio? Lo deciden las reglas: solo ella puede leer admin/config. */
export async function esAdmin() {
  if (DEMO) return false;
  if (ADMIN !== null) return ADMIN;
  try { await getDoc(doc(db, "admin", "config")); ADMIN = true; } catch { ADMIN = false; }
  return ADMIN;
}

/** ¿La cuenta tiene acceso? (beta aprobada o pase vigente) */
export function cuentaActiva(c) {
  if (DEMO) return true;
  if (!c || c.plan !== "activo") return false;
  const hasta = c.activoHasta?.toDate ? c.activoHasta.toDate() : c.activoHasta ? new Date(c.activoHasta) : null;
  return !hasta || hasta > new Date();
}
export function fijarCuenta(id) { CID = id; }

/** Referencias dentro de la cuenta activa. */
export const D = (...segs) => doc(db, "cuentas", CID, ...segs);
export const C = (...segs) => collection(db, "cuentas", CID, ...segs);

const emailDe = (u) => String(u.email || "").toLowerCase();

/**
 * Devuelve { cuentaId, nueva } para el usuario: la suya, la de una invitación
 * de equipo pendiente o una nueva. Si hay datos de la versión anterior de la
 * app que este usuario puede leer, los migra a su cuenta.
 */
export async function resolverCuenta(u) {
  const ref = doc(db, "usuarios", u.uid);
  const email = emailDe(u);

  // ¿Le han invitado a un equipo? Tiene prioridad (aunque ya tuviera cuenta propia).
  const acc = await getDoc(doc(db, "accesos", email)).catch(() => null);
  if (acc?.exists()) {
    const cid = acc.data().cuentaId;
    await updateDoc(doc(db, "cuentas", cid), { miembros: arrayUnion(u.uid), ["correos." + u.uid]: email });
    await setDoc(ref, { cuentaId: cid, email, desde: serverTimestamp() });
    await deleteDoc(doc(db, "accesos", email)).catch(() => {});
    return { cuentaId: cid, nueva: false };
  }

  const s = await getDoc(ref);
  if (s.exists() && s.data().cuentaId) {
    const cid = s.data().cuentaId;
    // Comprobar que sigue siendo miembro (le pueden haber quitado del equipo).
    const c = await getDoc(doc(db, "cuentas", cid)).catch(() => null);
    if (c?.exists() && (c.data().miembros || []).includes(u.uid)) return { cuentaId: cid, nueva: false };
  }

  // ¿Ya tenía su propia cuenta (p. ej. salió de un equipo)?
  const propia = await getDoc(doc(db, "cuentas", u.uid)).catch(() => null);
  if (propia?.exists()) {
    await setDoc(ref, { cuentaId: u.uid, email, desde: serverTimestamp() });
    return { cuentaId: u.uid, nueva: false };
  }

  // Cuenta nueva.
  const cid = u.uid;
  await setDoc(doc(db, "cuentas", cid), {
    nombre: u.displayName || email, propietario: u.uid, miembros: [u.uid], emailsMiembros: [email],
    correos: { [u.uid]: email },
    creada: serverTimestamp(), plan: (await esAdmin()) ? "activo" : "pendiente",
  });
  await setDoc(ref, { cuentaId: cid, email, desde: serverTimestamp() });
  fijarCuenta(cid);
  const migrados = DEMO ? false : await migrarDatosAntiguos(cid).catch((e) => { console.warn("migración", e); return false; });
  return { cuentaId: cid, nueva: !migrados };
}

// ---------- migración de la versión de un solo usuario ----------

const COLECCIONES = ["pisos", "invitaciones", "contratos", "facturas"];
const SUB = { invitaciones: ["respuestas"], contratos: ["firmas", "estados"] };

async function migrarDatosAntiguos(cid) {
  let viejo;
  try { viejo = await getDoc(doc(db, "ajustes", "general")); } catch { return false; } // sin permiso: no es usuario antiguo
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

// ---------- equipo ----------

export async function leerCuenta() {
  const s = await getDoc(doc(db, "cuentas", CID));
  return s.exists() ? s.data() : null;
}

export async function invitarMiembro(email) {
  email = email.trim().toLowerCase();
  await updateDoc(doc(db, "cuentas", CID), { emailsMiembros: arrayUnion(email) });
  await setDoc(doc(db, "accesos", email), { cuentaId: CID, invitadoEl: serverTimestamp() });
}

export async function quitarMiembro(email, cuenta) {
  email = email.trim().toLowerCase();
  const correos = { ...(cuenta.correos || {}) };
  const uid = Object.keys(correos).find(k => correos[k] === email);
  if (uid) delete correos[uid];
  await updateDoc(doc(db, "cuentas", CID), {
    emailsMiembros: (cuenta.emailsMiembros || []).filter(e => e !== email),
    miembros: (cuenta.miembros || []).filter(m => m !== uid),
    correos,
  });
  await deleteDoc(doc(db, "accesos", email)).catch(() => {});
}

/** Busca a qué cuenta pertenece un enlace de inquilino. */
export async function cuentaDeEnlace(token) {
  const s = await getDoc(doc(db, "enlaces", token)).catch(() => null);
  return s?.exists() ? s.data().cuentaId : null;
}

/** Pedir acceso a la beta (lo ve la administradora en su panel). */
export async function solicitarAcceso(mensaje) {
  await updateDoc(doc(db, "cuentas", CID), { solicitud: serverTimestamp(), mensajeSolicitud: String(mensaje || "").slice(0, 500) });
}

// ---------- panel de administración ----------

export async function listarCuentas() {
  const s = await getDocs(collection(db, "cuentas"));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function activarCuenta(id, meses) {
  const hasta = new Date(); hasta.setMonth(hasta.getMonth() + meses);
  await updateDoc(doc(db, "cuentas", id), { plan: "activo", activoHasta: hasta, activadaEl: serverTimestamp() });
}

export async function desactivarCuenta(id) {
  await updateDoc(doc(db, "cuentas", id), { plan: "pendiente" });
}
