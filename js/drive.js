// Google Drive. Se pide acceso a Drive para poder encontrar vuestras
// carpetas existentes (Rentas / Renta 2026 / Contratos…), no solo las que
// crea la app. En modo demostración no se toca Drive: los PDF se descargan.

import { CONFIG } from "./firebase-config.js";
import { DEMO } from "./datos.js";

// Dos modos:
//  - "propia" (por defecto): la app crea y usa su propia carpeta en el Drive del
//    usuario. Permiso limitado (drive.file): solo ve lo que ella crea.
//  - "completo": organiza dentro de carpetas que ya existían (p. ej. Rentas /
//    Renta 2026). Necesita permiso de lectura de todo el Drive.
const SCOPES = {
  propia: "https://www.googleapis.com/auth/drive.file",
  completo: "https://www.googleapis.com/auth/drive",
};
let MODO = "propia";
export function configurar(modo) { MODO = modo === "completo" ? "completo" : "propia"; }
export function modo() { return MODO; }
const tokens = {};
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
  const t0 = tokens[MODO];
  if (t0 && Date.now() < t0.caduca - 60000) { token = t0.token; return token; }
  await esperar(() => window.google?.accounts?.oauth2);
  return new Promise((ok, ko) => {
    const cliente = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.googleClientId,
      scope: SCOPES[MODO],
      callback: (r) => {
        if (r.error) return ko(new Error(r.error));
        tokens[MODO] = { token: r.access_token, caduca: Date.now() + r.expires_in * 1000 };
        token = r.access_token; caduca = tokens[MODO].caduca;
        ok(token);
      },
      error_callback: (e) => ko(new Error(e?.message || "Permiso de Drive cancelado")),
    });
    cliente.requestAccessToken({ prompt: "" });
  });
}

/** Crea una carpeta (por defecto en la raíz de Mi unidad). Devuelve {id, name}. */
export async function crearCarpeta(nombre, padre = "root") {
  if (DEMO) return { id: "demo-" + nombre, name: nombre };
  const c = await api(`https://www.googleapis.com/drive/v3/files?fields=id,name&${COMUNES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: nombre, mimeType: "application/vnd.google-apps.folder", parents: [padre] }),
  });
  return c.json();
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

/** "Piso Centro " ≈ "piso centro" (sin tildes, mayúsculas ni espacios). */
export function normalizar(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Buscador propio (sin el selector de Google, que exige una clave aparte):
 * lista carpetas o PDF de tu Drive por nombre y deja elegir uno.
 * Devuelve {id, name} o null.
 */
export async function elegir(tipo = "carpeta") {
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
    const cerrar = (r) => { if (cerrado) return; cerrado = true; capa.remove(); ok(r); };
    capa.querySelector("[data-cerrar]").onclick = () => cerrar(null);
    capa.addEventListener("click", (e) => { if (e.target === capa) cerrar(null); });
    const lista = capa.querySelector("[data-lista]");
    lista.addEventListener("pointerup", (e) => {
      const b = e.target.closest("[data-id]");
      if (b) cerrar({ id: b.dataset.id, name: b.querySelector(".nombre").textContent });
    });
    const input = capa.querySelector("[data-q]");
    let espera;
    const buscar = async () => {
      const texto = input.value.trim().replace(/'/g, "\\'");
      lista.innerHTML = '<p class="ayuda">Buscando…</p>';
      const filtro = esCarpeta ? "mimeType='application/vnd.google-apps.folder'" : "mimeType='application/pdf'";
      const q = encodeURIComponent(`${filtro} and trashed=false${texto ? ` and name contains '${texto}'` : ""}`);
      try {
        const r = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=30&${COMUNES}`);
        const { files } = await r.json();
        if (!files.length) { lista.innerHTML = '<p class="ayuda">No hay resultados con ese nombre.</p>'; return; }
        lista.innerHTML = files.map(f => `<button type="button" class="tarjeta" data-id="${f.id}" style="border:1px solid var(--borde);text-align:left;font:inherit;color:inherit;cursor:pointer">
            <div class="fila"><div><div class="nombre">${f.name.replace(/</g, "&lt;")}</div>
            <div class="meta">Modificado el ${new Date(f.modifiedTime).toLocaleDateString("es-ES")}</div></div>
            <span class="chip ok">Elegir</span></div></button>`).join("");
        lista.querySelectorAll("[data-id]").forEach(b => (b.onclick = () => cerrar({ id: b.dataset.id, name: b.querySelector(".nombre").textContent })));
        if (document.activeElement === input) input.blur();
      } catch (e) {
        lista.innerHTML = `<p class="ayuda" style="color:#A2321F">No se pudo buscar en Drive (${e.message}).</p>`;
      }
    };
    input.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(buscar, 350); });
    buscar();
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
