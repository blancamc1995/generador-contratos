// Google Drive. Se pide acceso a Drive para poder encontrar vuestras
// carpetas existentes (Rentas / Renta 2026 / Contratos…), no solo las que
// crea la app. En modo demostración no se toca Drive: los PDF se descargan.

import { CONFIG } from "./firebase-config.js";
import { DEMO } from "./datos.js";

const SCOPE = "https://www.googleapis.com/auth/drive";
let token = null, caduca = 0;

function esperar(cond, ms = 8000) {
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
  if (token && Date.now() < caduca - 60000) return token;
  await esperar(() => window.google?.accounts?.oauth2);
  return new Promise((ok, ko) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) return ko(new Error(r.error));
        token = r.access_token;
        caduca = Date.now() + r.expires_in * 1000;
        ok(token);
      },
      error_callback: (e) => ko(new Error(e?.message || "Permiso de Drive cancelado")),
    });
    cliente.requestAccessToken({ prompt: "" });
  });
}

async function api(url, opciones = {}) {
  const t = await obtenerToken();
  const r = await fetch(url, { ...opciones, headers: { ...(opciones.headers || {}), Authorization: `Bearer ${t}` } });
  if (!r.ok) {
    const e = new Error(`Drive ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r;
}

const COMUNES = "supportsAllDrives=true&includeItemsFromAllDrives=true";

/** "Maestro Priego López " ≈ "maestro priego" (sin tildes, mayúsculas ni espacios). */
export function normalizar(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Selector de Google para elegir una carpeta o un PDF. Devuelve {id, name} o null. */
export async function elegir(tipo = "carpeta") {
  if (DEMO) return tipo === "carpeta" ? { id: "demo-rentas", name: "Rentas (demo)" } : { id: "demo-fotos", name: "Fotos del piso (demo).pdf" };
  const t = await obtenerToken();
  await esperar(() => window.gapi);
  await new Promise(ok => gapi.load("picker", ok));
  return new Promise(ok => {
    const P = google.picker;
    const vista = tipo === "carpeta"
      ? new P.DocsView(P.ViewId.FOLDERS).setSelectFolderEnabled(true).setIncludeFolders(true)
      : new P.DocsView(P.ViewId.DOCS).setMimeTypes("application/pdf").setIncludeFolders(true);
    new P.PickerBuilder()
      .setOAuthToken(t)
      .setDeveloperKey(CONFIG.firebase.apiKey)
      .setAppId(CONFIG.googleProjectNumber)
      .addView(vista)
      .setLocale("es")
      .setTitle(tipo === "carpeta" ? "Elige la carpeta Rentas" : "Elige el PDF de fotos")
      .setCallback(d => {
        if (d.action === P.Action.PICKED) ok({ id: d.docs[0].id, name: d.docs[0].name });
        else if (d.action === P.Action.CANCEL) ok(null);
      })
      .build()
      .setVisible(true);
  });
}

/**
 * Busca una subcarpeta dentro de `padreId` aceptando variaciones del nombre
 * (tildes, mayúsculas, espacios, "Pisos facturas " ≈ "facturas") y la crea si no existe.
 * `nombres` = lista de nombres aceptables; el primero es el que se usa al crear.
 */
export async function asegurarCarpeta(nombres, padreId) {
  const lista = Array.isArray(nombres) ? nombres : [nombres];
  if (DEMO) return `${padreId}/${lista[0]}`;
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and '${padreId}' in parents and trashed=false`);
  const r = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=200&${COMUNES}`);
  const { files } = await r.json();
  const buscados = lista.map(normalizar).filter(Boolean);
  const exacta = files.find(f => buscados.includes(normalizar(f.name)));
  const parecida = files.find(f => buscados.some(b => normalizar(f.name).includes(b) || b.includes(normalizar(f.name))));
  const hallada = exacta || parecida;
  if (hallada) return hallada.id;
  const c = await api(`https://www.googleapis.com/drive/v3/files?fields=id&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: lista[0], mimeType: "application/vnd.google-apps.folder", parents: [padreId] }),
  });
  return (await c.json()).id;
}

/** Sube un archivo a la carpeta indicada. Devuelve {id, webViewLink}. */
export async function subirPdf(bytes, nombre, carpetaId, mime = "application/pdf") {
  if (DEMO) return { id: "demo-" + Math.random().toString(36).slice(2), webViewLink: "#", ruta: carpetaId };
  const limite = "-------contratos" + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: nombre, mimeType: mime, parents: [carpetaId] });
  const cuerpo = new Blob([
    `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${limite}\r\nContent-Type: ${mime}\r\n\r\n`, bytes, `\r\n--${limite}--`,
  ]);
  const r = await api(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${limite}` },
    body: cuerpo,
  });
  return r.json();
}

/** Copia un archivo de Drive a otra carpeta. Devuelve {id, webViewLink}. */
export async function copiar(id, carpetaId, nombre) {
  if (DEMO) return { id: "demo-" + Math.random().toString(36).slice(2), webViewLink: "#" };
  const r = await api(`https://www.googleapis.com/drive/v3/files/${id}/copy?fields=id,webViewLink&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombre, parents: [carpetaId] }),
  });
  return r.json();
}

/** Descarga un archivo de Drive como ArrayBuffer. */
export async function descargarArchivo(id) {
  if (DEMO) throw new Error("Sin fotos en la demo");
  const r = await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&${COMUNES}`);
  return r.arrayBuffer();
}
