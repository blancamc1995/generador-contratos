// Números de los pisos: ingresos, rentabilidad, resumen para la Renta y
// simulador de compra. Funciones puras (sin pantalla ni base de datos).
//
// Todo son estimaciones orientativas para que el propietario y su gestor
// tengan los datos ordenados; no sustituyen el asesoramiento fiscal.

export const num = (v) => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let t = String(v ?? "").replace(/[€\s]/g, "");
  // «1.234,56» o «200.000» (formato español) → 1234.56 / 200000
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
};

// Tipo general del ITP para vivienda usada (orientativo; cada comunidad tiene escalas y bonificaciones).
export const ITP = {
  "Andalucía": 7, "Aragón": 8, "Principado de Asturias": 8, "Illes Balears": 8, "Canarias": 6.5, "Cantabria": 10,
  "Castilla-La Mancha": 9, "Castilla y León": 8, "Cataluña": 10, "Comunitat Valenciana": 10, "Extremadura": 8,
  "Galicia": 10, "Comunidad de Madrid": 6, "Región de Murcia": 8, "Comunidad Foral de Navarra": 6, "País Vasco": 7,
  "La Rioja": 7, "Ceuta": 6, "Melilla": 6,
};

// Tipos de gasto de las facturas, según su tratamiento en la Renta.
export const CATEGORIAS = {
  reparacion: "Reparación y conservación",
  mobiliario: "Muebles y electrodomésticos",
  mejora: "Reforma o mejora",
  suministros: "Suministros (luz, agua, gas, internet)",
  servicios: "Servicios (gestoría, administrador, anuncios…)",
  otros: "Otros gastos deducibles",
  personal: "No deducible / personal",
};

/** Cuota mensual de un préstamo francés. */
export function cuotaHipoteca(capital, interesAnual, años) {
  const C = num(capital), i = num(interesAnual) / 100 / 12, n = Math.round(num(años) * 12);
  if (C <= 0 || n <= 0) return 0;
  if (i === 0) return C / n;
  return (C * i) / (1 - Math.pow(1 + i, -n));
}

const DIA = 864e5;
const fechaUTC = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return Date.UTC(y, m - 1, d); };
const diasDelAño = (a) => ((a % 4 === 0 && a % 100 !== 0) || a % 400 === 0 ? 366 : 365);

/** Cantidad mensual que cobra el propietario por un contrato (renta + cuotas fijas de suministros). */
export function cobroMensual(datos) {
  let t = num(datos.renta);
  const luz = datos.luz || {};
  if ((luz.opcion === "B" || luz.opcion === "C") && num(luz.cuota) > 0) t += num(luz.cuota);
  for (const s of [datos.agua, datos.wifi]) if (s?.opcion === "cuota") t += num(s.cuota);
  return t;
}

export const esViviendaHabitual = (pl) => ["habitacion", "larga_duracion", "piso_entero"].includes(pl);

/** Periodo [inicio, fin] (ms UTC) de un contrato; los indefinidos llegan hasta su finalización o hasta hoy+1 año. */
function periodo(c) {
  const d = c.datos || {};
  const ini = d.fechaInicio ? fechaUTC(d.fechaInicio) : null;
  if (ini === null) return null;
  const finTxt = c.finalizado || d.fechaFin;
  const fin = finTxt ? fechaUTC(finTxt) : ini + 365 * 50 * DIA;
  return [ini, fin];
}

/** Contratos que cuentan para los números: los enviados a firmar o firmados. */
export const contratosVigentes = (contratos) => contratos.filter(c => c.estado === "firmado" || c.estado === "firmando");

/**
 * Ingresos de un piso en un año a partir de sus contratos.
 * Devuelve { ingresos, ingresosHabitual, diasArrendado, detalle: [{nombre, plantilla, dias, importe}] }.
 */
export function ingresosDelAño(contratos, año) {
  const a0 = Date.UTC(año, 0, 1), a1 = Date.UTC(año, 11, 31);
  const dA = diasDelAño(año);
  let ingresos = 0, ingresosHabitual = 0;
  const ocupados = new Set();
  const detalle = [];
  for (const c of contratosVigentes(contratos)) {
    const p = periodo(c);
    if (!p) continue;
    const ini = Math.max(p[0], a0), fin = Math.min(p[1], a1);
    if (fin < ini) continue;
    const dias = Math.round((fin - ini) / DIA) + 1;
    const importe = cobroMensual(c.datos) * 12 * dias / dA;
    ingresos += importe;
    if (esViviendaHabitual(c.plantilla)) ingresosHabitual += importe;
    for (let t = ini; t <= fin; t += DIA) ocupados.add(t);
    detalle.push({ nombre: (c.inquilinos || []).join(", "), plantilla: c.plantilla, dias, importe });
  }
  return { ingresos, ingresosHabitual, diasArrendado: ocupados.size, detalle };
}

/** Gastos anuales fijos que el propietario ha anotado en la ficha económica del piso. */
export function gastosFijos(e = {}) {
  const lineas = [
    ["IBI y tasas", num(e.ibi) + num(e.basura)],
    ["Comunidad de propietarios", num(e.comunidad)],
    ["Seguros (hogar e impago)", num(e.seguroHogar) + num(e.seguroImpago)],
    ["Suministros a tu cargo", num(e.suministros)],
    ...(e.otros || []).filter(o => num(o.importe) > 0).map(o => [o.concepto || "Otros", num(o.importe)]),
  ];
  return { lineas: lineas.filter(([, v]) => v > 0), total: lineas.reduce((s, [, v]) => s + v, 0) };
}

/** Suma de facturas por categoría (en el año indicado o en todos si año es null). */
export function facturasPorCategoria(facturas, año = null) {
  const out = {};
  for (const f of facturas) {
    if (año !== null && String(f.fecha || "").slice(0, 4) !== String(año)) continue;
    const k = f.categoria || "reparacion";
    out[k] = (out[k] || 0) + num(f.importe);
  }
  return out;
}

/**
 * Resumen de los rendimientos del capital inmobiliario de un piso para la Renta de un año.
 *   piso: ficha (con economia), contratos del piso, facturas del piso.
 */
export function resumenRenta(piso, contratos, facturas, año) {
  const e = piso.economia || {};
  const dA = diasDelAño(año);
  const { ingresos, ingresosHabitual, diasArrendado, detalle } = ingresosDelAño(contratos, año);
  const f = diasArrendado / dA;
  const fact = facturasPorCategoria(facturas, año);

  // Gastos con límite: intereses de la hipoteca + reparación y conservación (no pueden superar los ingresos).
  const intereses = num(e.hipoteca?.interesesAnuales) * f;
  const reparacion = fact.reparacion || 0;
  const conLimite = intereses + reparacion;
  const conLimiteAplicado = Math.min(conLimite, Math.max(0, ingresos));
  const exceso = conLimite - conLimiteAplicado;

  // Resto de gastos deducibles: los fijos de la ficha (proporcionales a los días alquilado) y las facturas.
  const fijos = gastosFijos(e);
  const otros = [
    ...fijos.lineas.map(([t, v]) => [t, v * f]),
    ["Suministros (facturas)", fact.suministros || 0],
    ["Servicios (facturas)", fact.servicios || 0],
    ["Otros gastos (facturas)", fact.otros || 0],
  ].filter(([, v]) => v > 0);
  const totalOtros = otros.reduce((s, [, v]) => s + v, 0);

  // Amortización del inmueble: 3 % del mayor entre coste de adquisición y valor catastral, sin el suelo.
  const vc = num(e.valorCatastral), vcc = num(e.valorCatastralConstruccion);
  const pctConstruccion = vc > 0 && vcc > 0 ? Math.min(1, vcc / vc) : 0;
  const coste = num(e.precioCompra) + num(e.gastosCompra);
  const mejorasPrevias = num(e.mejoras) + Object.entries(facturasPorCategoriaHasta(facturas, año)).reduce((s, [k, v]) => s + (k === "mejora" ? v : 0), 0);
  const baseAmortizable = Math.max(coste, vc) * pctConstruccion + mejorasPrevias;
  const amortInmueble = 0.03 * baseAmortizable * f;
  // Muebles: 10 % anual de su valor, durante diez años.
  const muebles = num(e.mobiliario) + mueblesUltimosDiez(facturas, año);
  const amortMuebles = 0.10 * muebles * f;

  const rendimientoNeto = ingresos - conLimiteAplicado - totalOtros - amortInmueble - amortMuebles;
  const pctReduccion = num(e.reduccion ?? 50) / 100;
  const reduccion = rendimientoNeto > 0 && ingresos > 0 ? rendimientoNeto * (ingresosHabitual / ingresos) * pctReduccion : 0;
  const rendimientoReducido = rendimientoNeto - reduccion;

  // Imputación de rentas por los días que el piso estuvo vacío (desde su compra).
  let diasPosesion = dA;
  if (e.fechaCompra) {
    const c = fechaUTC(e.fechaCompra), a0 = Date.UTC(año, 0, 1), a1 = Date.UTC(año, 11, 31);
    diasPosesion = c > a1 ? 0 : c <= a0 ? dA : Math.round((a1 - c) / DIA) + 1;
  }
  const diasVacio = Math.max(0, diasPosesion - diasArrendado);
  const imputacion = vc * (num(e.imputacion || 1.1) / 100) * diasVacio / dA;

  return {
    año, ingresos, ingresosHabitual, diasArrendado, diasVacio, detalle,
    intereses, reparacion, conLimiteAplicado, exceso, otros, totalOtros,
    baseAmortizable, pctConstruccion, amortInmueble, muebles, amortMuebles,
    rendimientoNeto, pctReduccion, reduccion, rendimientoReducido, imputacion,
    faltan: [
      !vc && "valor catastral",
      !vcc && "valor catastral de la construcción",
      !coste && "precio de compra",
      !e.hipoteca?.interesesAnuales && num(e.hipoteca?.cuotaMensual) > 0 && "intereses anuales de la hipoteca",
    ].filter(Boolean),
  };
}

function facturasPorCategoriaHasta(facturas, año) {
  return facturasPorCategoria(facturas.filter(f => parseInt(String(f.fecha || "0").slice(0, 4), 10) < año));
}

function mueblesUltimosDiez(facturas, año) {
  return facturas.filter(f => f.categoria === "mobiliario").reduce((s, f) => {
    const a = parseInt(String(f.fecha || "0").slice(0, 4), 10);
    return a <= año && a > año - 10 ? s + num(f.importe) : s;
  }, 0);
}

/**
 * Rentabilidad actual de un piso.
 * rentaMensual: lo que se cobra ahora (contratos vigentes) o una estimación.
 */
export function rentabilidad(piso, rentaMensual, facturas = []) {
  const e = piso.economia || {};
  const ingresosAño = rentaMensual * 12;
  const hace12 = new Date(); hace12.setFullYear(hace12.getFullYear() - 1);
  const recientes = facturas.filter(f => f.fecha && new Date(f.fecha) >= hace12);
  const fact = facturasPorCategoria(recientes);
  const gastosFacturas = (fact.reparacion || 0) + (fact.suministros || 0) + (fact.servicios || 0) + (fact.otros || 0);
  const gastosAño = gastosFijos(e).total + gastosFacturas;
  const compra = num(e.precioCompra) + num(e.gastosCompra);
  const inversion = compra + num(e.mejoras) + num(e.mobiliario);
  const cuota = num(e.hipoteca?.cuotaMensual);
  const flujoAño = ingresosAño - gastosAño - cuota * 12;
  const prestamo = num(e.hipoteca?.importeInicial);
  const capitalPropio = prestamo > 0 ? Math.max(0, inversion - prestamo) : 0;
  return {
    ingresosAño, gastosAño, gastosFacturas, inversion, cuota, flujoAño, flujoMes: flujoAño / 12, capitalPropio,
    bruta: inversion > 0 ? ingresosAño / inversion : null,
    neta: inversion > 0 ? (ingresosAño - gastosAño) / inversion : null,
    sobreCapital: capitalPropio > 0 ? flujoAño / capitalPropio : null,
  };
}

/**
 * Simulador de compra. Devuelve los números de una modalidad de alquiler.
 *   s: { precio, itp, notaria, reforma, muebles, financiacion (%), interes, años, gastosHipoteca,
 *        ibi, comunidad, seguro, mantenimiento (% renta), suministros (€/año), gestion (% renta) }
 *   m: { renta (€/mes), meses (ocupados al año) }
 */
export function simular(s, m) {
  const precio = num(s.precio);
  const impuestos = precio * num(s.itp) / 100;
  const gastosCompra = impuestos + num(s.notaria) + num(s.gastosHipoteca);
  const inversion = precio + gastosCompra + num(s.reforma) + num(s.muebles);
  const prestamo = precio * num(s.financiacion) / 100;
  const cuota = cuotaHipoteca(prestamo, s.interes, s.años);
  const capitalPropio = inversion - prestamo;
  const ingresos = num(m.renta) * num(m.meses);
  const gastos = num(s.ibi) + num(s.comunidad) + num(s.seguro) + num(s.suministros)
    + ingresos * (num(s.mantenimiento) + num(s.gestion)) / 100;
  const beneficio = ingresos - gastos;
  const flujoAño = beneficio - cuota * 12;
  return {
    impuestos, gastosCompra, inversion, prestamo, cuota, capitalPropio, ingresos, gastos, beneficio, flujoAño, flujoMes: flujoAño / 12,
    bruta: inversion > 0 ? ingresos / inversion : null,
    neta: inversion > 0 ? beneficio / inversion : null,
    sobreCapital: capitalPropio > 0 ? flujoAño / capitalPropio : null,
    recuperacion: flujoAño > 0 ? capitalPropio / flujoAño : null,
  };
}
