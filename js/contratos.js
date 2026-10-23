// Plantillas de contrato. Funciones puras: reciben los datos y devuelven
// una lista de bloques { type, text } que pdf.js convierte en PDF.
//
// Plantillas:
//   - "habitacion"      → habitación en vivienda compartida (estudiantes)
//   - "piso_entero"     → piso completo para varios inquilinos (estudiantes)
//   - "larga_duracion"  → vivienda habitual de larga duración (5 años LAU)

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const ORDINALES = ["PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA", "SEXTA", "SÉPTIMA",
  "OCTAVA", "NOVENA", "DÉCIMA", "UNDÉCIMA", "DUODÉCIMA", "DECIMOTERCERA", "DECIMOCUARTA"];

const LAU = "Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos";
const HUECO = "______________";

// ---------- utilidades ----------

export function fechaLarga(iso) {
  if (!iso) return "____ de __________ de ____";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export function euros(valor) {
  const n = typeof valor === "number" ? valor : parseFloat(String(valor).replace(",", "."));
  if (!isFinite(n)) return "_______ €";
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function num(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return isFinite(n) ? n : 0;
}

function sinPunto(s) { return (s || "").trim().replace(/[.;,]\s*$/, ""); }

// "con D.N.I. 12345678A" / "con N.I.E. X1234567L" / "con pasaporte n.º AB123456"
export function documento(p) {
  const n = (p.numDoc || "").trim() || HUECO;
  switch (p.tipoDoc) {
    case "NIE": return `con N.I.E. ${n}`;
    case "Pasaporte": return `con pasaporte n.º ${n}`;
    case "Otro": return `con documento de identidad n.º ${n}`;
    default: return `con D.N.I. ${n}`;
  }
}

function trato(p) { return p.tratamiento === "Dña." ? "Dña." : "D."; }

function unir(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join("; ") + "; y de otra, " + items[items.length - 1];
}

// ---------- generador principal ----------

/**
 * datos = {
 *   plantilla, ciudadFirma, fechaFirma,
 *   propietarios: [{tratamiento, nombre, tipoDoc, numDoc}], domicilioPropietarios, iban,
 *   piso: { nombre, direccion, descripcion },
 *   habitacion,
 *   inquilinos: [{tratamiento, nombre, tipoDoc, numDoc, domicilio,
 *                 avales: [{tratamiento, nombre, tipoDoc, numDoc, parentesco}]}],
 *   renta, fianza,
 *   fechaInicio, fechaFin, fechaEntrega,
 *   luz: { opcion: "A"|"B"|"C"|"D", cuota, tope },
 *   agua: { opcion: "incluida"|"cuota", cuota },
 *   conFotos
 * }
 */
export function generarContrato(datos) {
  if (datos.plantilla === "larga_duracion") return contratoLargaDuracion(datos);
  return contratoEstudiantes(datos);
}

/** Condiciones configurables por cada propietario (Ajustes → Contratos). */
function condiciones(datos) {
  const c = datos.condiciones || {};
  const dia = parseInt(c.diaPago, 10);
  return {
    diaPago: dia >= 1 && dia <= 28 ? dia : 7,
    garantia: Math.min(2, Math.max(0, parseInt(c.garantiaMeses, 10) || 0)),
    ccaa: (c.ccaa || "").trim(),
    extra: (c.clausulasExtra || "").trim(),
    limpieza: c.clausulaLimpieza !== false,
  };
}

const NUM_TXT = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
  "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés",
  "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho"];

function plazoPago(datos) {
  const d = condiciones(datos).diaPago;
  return d === 1 ? "el primer día de cada mes" : `dentro de los ${NUM_TXT[d]} primeros días de cada mes`;
}

function bloquesGarantiaYDeposito(add, datos, ARR, v, renta) {
  const k = condiciones(datos);
  if (k.garantia > 0) {
    add("p", `Adicionalmente, y conforme al artículo 36.5 de la LAU, ${ARR} ${v("entrega", "entregan")} a EL ARRENDADOR la cantidad de ${euros(renta * k.garantia)}, equivalente a ${k.garantia === 1 ? "una mensualidad" : "dos mensualidades"} de renta, en concepto de garantía adicional del cumplimiento de sus obligaciones, que se devolverá en las mismas condiciones que la fianza.`);
  }
  if (k.ccaa) {
    add("p", `EL ARRENDADOR depositará la fianza en el organismo competente de ${k.ccaa}, conforme a la normativa autonómica aplicable.`);
  }
}

function bloqueClausulasExtra(add, datos, c) {
  const extra = condiciones(datos).extra;
  if (!extra) return;
  add("subheading", c.siguiente("Otras estipulaciones."));
  extra.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean).forEach(t => add("p", t.replace(/\s*\n\s*/g, " ")));
}

function contexto(datos) {
  const inquilinos = datos.inquilinos || [];
  const varios = inquilinos.length > 1;
  const avales = [];
  inquilinos.forEach(inq => (inq.avales || []).forEach(av => avales.push({ ...av, inquilino: inq })));
  const ARR = varios ? "LOS ARRENDATARIOS" : "EL ARRENDATARIO";
  const FIA = avales.length > 1 ? "LOS FIADORES" : "EL FIADOR";
  const v = (sing, plur) => (varios ? plur : sing);
  let n = 0;
  const siguiente = (titulo) => `${ORDINALES[n++]}. ${titulo}`;
  return { inquilinos, varios, avales, ARR, FIA, v, siguiente };
}

function bloquesReunidos(datos, add, c, { conDomicilioTitulo }) {
  const props = datos.propietarios;
  const descProps = props.map(p => `${trato(p)} ${p.nombre}, mayor de edad, ${documento(p)}`);
  add("p", `DE UNA PARTE, ${descProps.length > 1 ? descProps.slice(0, -1).join(", ") + ", y " + descProps[descProps.length - 1] : descProps[0]}, ${props.length === 2 ? "ambos" : props.length > 2 ? "todos" : ""} con domicilio a efectos de notificaciones en ${sinPunto(datos.domicilioPropietarios)}, en adelante "EL ARRENDADOR".`.replace(",  con", ", con"));

  const descInq = c.inquilinos.map(i =>
    `${trato(i)} ${i.nombre || HUECO}, mayor de edad, ${documento(i)}, con domicilio ${conDomicilioTitulo} en ${sinPunto(i.domicilio) || HUECO}`);
  add("p", `DE OTRA PARTE, ${unir(descInq)}; en adelante, ${c.varios ? "conjuntamente, " : ""}"${c.ARR}".`);

  if (c.avales.length) {
    const descAv = c.avales.map(av => `${trato(av)} ${av.nombre || HUECO}, mayor de edad, ${documento(av)}`);
    add("p", `Y DE OTRA PARTE, en concepto de fiador${c.avales.length > 1 ? "es" : ""} solidario${c.avales.length > 1 ? "s" : ""}: ${unir(descAv)}; en adelante, "${c.FIA}".`);
  }
  add("p", "Las partes se reconocen mutuamente la capacidad legal necesaria para suscribir el presente contrato y, a tal efecto,");
}

function textoActualizacion(c) {
  return `La renta podrá actualizarse anualmente, en la fecha en que se cumpla cada año de vigencia del contrato, conforme a lo dispuesto en el artículo 18 de la LAU, aplicando la variación anual del índice de referencia que resulte legalmente aplicable en cada momento (a la fecha de firma, el Índice de Referencia para la Actualización Anual de los Contratos de Arrendamiento de Vivienda, IRAV, publicado por el Instituto Nacional de Estadística) y con sujeción, en todo caso, a los límites que establezca la normativa vigente. La actualización deberá notificarse por escrito a ${c.ARR} con, al menos, un mes de antelación a la fecha en que haya de aplicarse.`;
}

function bloqueFiadores(add, c, objetoRef, esHabitacion) {
  c.avales.forEach(av => {
    const par = (av.parentesco || "").trim();
    const calidad = par && par.toLowerCase() !== "aval" && par.toLowerCase() !== "avalista"
      ? `en su calidad de ${par.toLowerCase()} y avalista de ${trato(av.inquilino)} ${av.inquilino.nombre}`
      : `en calidad de avalista de ${trato(av.inquilino)} ${av.inquilino.nombre}`;
    add("p", `${trato(av)} ${av.nombre}, ${documento(av)}, ${calidad}, interviene en el presente contrato en concepto de fiador solidario y, como tal, queda ${av.tratamiento === "Dña." ? "obligada" : "obligado"} solidariamente con ${c.varios ? "el arrendatario al que avala" : c.ARR}, con renuncia expresa a los beneficios de orden, división y excusión que pudieran corresponderle conforme a los artículos 1822 y siguientes del Código Civil, al cumplimiento de todas las obligaciones derivadas del presente contrato y, en especial, al pago de la renta, suministros y demás cantidades debidas, hasta la completa restitución de ${objetoRef} y liquidación de cuantas obligaciones se deriven de este contrato.`);
  });
}

function bloqueFirmas(add, datos, c) {
  add("p", `Y en prueba de conformidad con cuanto antecede, las partes firman el presente contrato por ${c.avales.length ? "triplicado" : "duplicado"} y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.`);
  const f = firmantesDe(datos);
  const de = (rol) => f.filter(x => x.rol === rol);
  add("signatures", { propietarios: de("arrendador"), inquilinos: de("arrendatario"), avales: de("fiador") });
}

/**
 * Lista de personas que firman, con un identificador estable:
 * arr0, arr1 (arrendadores) · inq0… (arrendatarios) · fia0… (fiadores, en orden).
 */
export function firmantesDe(datos) {
  const out = [];
  (datos.propietarios || []).forEach((p, i) => out.push({ fid: `arr${i}`, rol: "arrendador", nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc }));
  let k = 0;
  (datos.inquilinos || []).forEach((p, i) => out.push({ fid: `inq${i}`, rol: "arrendatario", nombre: p.nombre, tipoDoc: p.tipoDoc, numDoc: p.numDoc }));
  (datos.inquilinos || []).forEach((p) => (p.avales || []).forEach((a) =>
    out.push({ fid: `fia${k++}`, rol: "fiador", nombre: a.nombre, tipoDoc: a.tipoDoc, numDoc: a.numDoc, avalaA: p.nombre })));
  return out;
}

// ---------- estudiantes: habitación o piso entero ----------

function contratoEstudiantes(datos) {
  const esHab = datos.plantilla === "habitacion";
  const c = contexto(datos);
  const { ARR, v } = c;
  const L = [];
  const add = (type, text) => L.push({ type, text });
  const objetoRef = esHab ? "la habitación arrendada" : "la vivienda arrendada";
  const dir = sinPunto(datos.piso.direccion);
  const renta = num(datos.renta);
  const fianza = datos.fianza != null && datos.fianza !== "" ? num(datos.fianza) : renta;
  const luz = datos.luz || { opcion: "D" };
  const cuotaLuz = num(luz.cuota);
  const conCuota = (luz.opcion === "B" || luz.opcion === "C") && cuotaLuz > 0;

  add("title", "CONTRATO DE ARRENDAMIENTO DE VIVIENDA PARA USO DE VIVIENDA HABITUAL Y PERMANENTE");
  if (esHab) add("subtitle", "(arrendamiento de habitación en vivienda compartida)");
  add("p", `En ${datos.ciudadFirma || HUECO}, a ${fechaLarga(datos.fechaFirma)}.`);

  add("heading", "REUNIDOS");
  bloquesReunidos(datos, add, c, { conDomicilioTitulo: "a efectos de notificaciones" });

  add("heading", "EXPONEN");
  add("p", `I. Que EL ARRENDADOR es propietario de la vivienda sita en ${dir}.`);
  add("p", `II. Que EL ARRENDADOR está interesado en ceder en arrendamiento ${esHab ? "una habitación" : "la totalidad"} de dicha vivienda, con destino a vivienda habitual y permanente de ${ARR}, de conformidad con el artículo 2 de la ${LAU} (en adelante, "LAU").`);
  add("p", `III. Que ${ARR} ${v("está interesado", "están interesados")} en concertar dicho arrendamiento en los términos y condiciones que se especifican a continuación.`);
  add("p", "En su virtud, las partes formalizan el presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA, que se regirá por la LAU y, en lo no previsto en ella, por el Código Civil, y en particular por las siguientes");

  add("heading", "CLÁUSULAS");

  add("subheading", c.siguiente("Objeto."));
  if (esHab) {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que lo recibe de conformidad, la habitación identificada como «${datos.habitacion || HUECO}» dentro de la vivienda sita en ${dir}, junto con el derecho de uso compartido, en condiciones de igualdad con los restantes ocupantes de la vivienda, de sus zonas comunes (cocina, salón, baños, terrazas y demás estancias no destinadas a uso privativo de un ocupante). El presente arrendamiento se destina exclusivamente a vivienda habitual y permanente de ${ARR}.`);
  } else {
    add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que ${v("lo recibe", "lo reciben")} de conformidad, la totalidad de la vivienda sita en ${dir}, con destino exclusivo a vivienda habitual y permanente de ${ARR}.`);
  }

  add("subheading", c.siguiente("Duración."));
  add("p", `El presente contrato se concierta por un plazo de duración determinada, que comenzará el día ${fechaLarga(datos.fechaInicio)} y finalizará el día ${fechaLarga(datos.fechaFin)}.`);
  add("p", "Llegada dicha fecha, el contrato se prorrogará, en su caso, conforme a lo dispuesto en la LAU, salvo que concurra alguna de las causas legales de extinción o resolución previstas en dicha normativa.");
  add("p", `En caso de no producirse prórroga legal, ${ARR} ${v("deberá", "deberán")} dejar libre, vacua, expedita y a disposición de EL ARRENDADOR ${objetoRef}, junto con sus llaves y enseres.`);

  add("subheading", c.siguiente("Renta y forma de pago."));
  const conceptoRenta = esHab ? "renta por la habitación arrendada" : "renta por la vivienda arrendada";
  const solid = esHab ? "" : (c.varios ? "solidariamente, " : "");
  if (conCuota) {
    add("p", `La renta mensual total a abonar por ${ARR} asciende a ${euros(renta + cuotaLuz)} mensuales, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado ${plazoPago(datos)}, y que se desglosa en ${euros(renta)} en concepto de ${conceptoRenta} y ${euros(cuotaLuz)} en concepto de cuota fija por el suministro eléctrico, conforme a lo dispuesto en el párrafo siguiente.`);
  } else {
    add("p", `La renta mensual ${esHab ? "de la habitación arrendada" : "de la vivienda"} se fija en ${euros(renta)} mensuales, que ${ARR} se ${v("obliga", "obligan")} a abonar ${solid}por adelantado ${plazoPago(datos)}.`);
  }
  const concepto = `Alquiler ${datos.piso.nombre} + ${c.inquilinos.map(i => i.nombre).join(" y ")}`;
  add("p", `El pago se realizará mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, debiendo hacerse constar en el concepto de la transferencia: "${concepto}".`);
  add("p", textoLuzEstudiantes(luz, c, esHab, datos.fechaFin));
  add("p", textoActualizacion(c));

  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el artículo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta. La fianza será devuelta a ${ARR} a la finalización del contrato, previa comprobación del buen estado de ${objetoRef} y enseres, y una vez deducidas, en su caso, las cantidades que correspondan en concepto de desperfectos, suministros pendientes u otras cantidades adeudadas.`);
  bloquesGarantiaYDeposito(add, datos, ARR, v, renta);

  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, esHab);
    if (!esHab && c.varios) {
      add("p", `Asimismo, ${ARR} firmantes del presente contrato responden solidariamente entre sí frente a EL ARRENDADOR del cumplimiento íntegro de las obligaciones derivadas de este contrato, y en particular del pago de la totalidad de la renta pactada, con independencia de la parte proporcional que individualmente les corresponda satisfacer.`);
    }
    if (esHab) {
      add("p", `La responsabilidad de ${ARR} y de su${c.avales.length > 1 ? "s fiadores" : " fiador"} se circunscribe exclusivamente a las obligaciones derivadas del arrendamiento de su propia habitación, sin extenderse solidariamente a las obligaciones que pudieran corresponder a los restantes ocupantes de la vivienda, quienes mantienen, en su caso, contratos de arrendamiento independientes y autónomos con EL ARRENDADOR.`);
    }
  }

  add("subheading", c.siguiente("Conservación, uso y obras."));
  add("p", `${ARR} se ${v("obliga", "obligan")} a conservar ${esHab ? "la habitación y las zonas comunes" : "la vivienda"} en buen estado, destinándola exclusivamente a vivienda habitual, sin desarrollar en ella actividades molestas, insalubres, nocivas, peligrosas o ilícitas, ni ceder o subarrendar, total o parcialmente, ${objetoRef} sin consentimiento previo y por escrito de EL ARRENDADOR. Las pequeñas reparaciones que exija el desgaste por el uso ordinario serán de cuenta de ${ARR}, conforme al artículo 21.4 de la LAU.`);
  const objLimpieza = esHab
    ? "la habitación arrendada, así como las zonas comunes de la vivienda (cocina, salón, baños y demás estancias de uso compartido),"
    : "la vivienda arrendada";
  if (condiciones(datos).limpieza) add("p", `Asimismo, ${ARR} se ${v("obliga", "obligan")} a devolver ${objLimpieza} en unas condiciones generales de limpieza equiparables a las que existían al inicio del contrato, sin que sea exigible un estado de limpieza impecable, pero sí un estado adecuado y no descuidado. Si al finalizar el contrato no se entregase en dichas condiciones, EL ARRENDADOR podrá descontar de la fianza el importe correspondiente para restituirlas a un estado adecuado de limpieza.`);

  add("subheading", c.siguiente("Gastos."));
  add("p", "Los gastos generales del inmueble (comunidad de propietarios, Impuesto sobre Bienes Inmuebles y demás tributos que graven la propiedad) serán de cuenta de EL ARRENDADOR. Los gastos por suministros se regirán por lo dispuesto en la cláusula tercera.");

  add("subheading", c.siguiente("Resolución."));
  add("p", "Serán causa de resolución del presente contrato, además de las previstas en el artículo 27 de la LAU, el impago de la renta o de cualquier cantidad asimilada a la misma, el incumplimiento grave de las obligaciones de conservación y buen uso, y la cesión o el subarriendo no consentidos por EL ARRENDADOR.");

  add("subheading", c.siguiente("Notificaciones."));
  add("p", "A los efectos del presente contrato, las partes señalan como domicilios válidos para notificaciones los que constan en el encabezamiento de este documento.");

  add("subheading", c.siguiente("Normativa aplicable."));
  add("p", "En todo lo no previsto expresamente en este contrato, las partes se someten a lo dispuesto en la LAU y, supletoriamente, al Código Civil.");

  bloqueClausulasExtra(add, datos, c);
  bloqueFirmas(add, datos, c);
  return L;
}

function textoLuzEstudiantes(luz, c, esHab, fechaFin) {
  const { ARR, v } = c;
  const cuota = euros(luz.cuota);
  const finTxt = fechaFin ? `el día ${fechaLarga(fechaFin).replace(/ de \d{4}$/, "")}` : "a la finalización del contrato";
  switch (luz.opcion) {
    case "A":
      return `La renta pactada incluye los suministros de agua y conexión a internet (wifi) de la vivienda. El suministro de energía eléctrica se encuentra actualmente contratado a nombre de EL ARRENDADOR. ${ARR} ${v("deberá", "deberán")}, en el plazo más breve posible desde la entrada en vigor del presente contrato, tramitar el cambio de titularidad de dicho suministro a su nombre y con cargo a su cuenta bancaria, haciéndose cargo a partir de entonces de su contratación, alta y abono${c.varios ? " en la proporción que corresponda" : ""}.`;
    case "B":
      return `La renta pactada incluye los suministros de agua y conexión a internet (wifi) de la vivienda. En cuanto al suministro de energía eléctrica, ${ARR} ${v("abonará", "abonarán")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo eléctrico. Dicha cantidad cubre el consumo hasta un máximo de ${euros(luz.tope)} mensuales; el eventual exceso sobre dicho importe será de cuenta de ${ARR}, que ${v("deberá", "deberán")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.`;
    case "C":
      if (esHab) {
        return `La renta pactada incluye los suministros de agua y conexión a internet (wifi) de la vivienda. En cuanto al suministro de energía eléctrica, ${ARR} abonará a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo eléctrico. A la finalización del contrato, ${finTxt}, se procederá a una regularización final: el importe real de las facturas de electricidad de la vivienda correspondientes al periodo del contrato se dividirá a partes iguales entre el número de habitaciones arrendadas durante dicho periodo, resultando así la parte proporcional que corresponde a la habitación objeto de este contrato. Si la cantidad abonada por ${ARR} resultase superior a dicha parte proporcional, EL ARRENDADOR le devolverá el exceso; si, por el contrario, resultase inferior, ${ARR} deberá abonar a EL ARRENDADOR la diferencia.`;
      }
      return `La renta pactada incluye los suministros de agua y conexión a internet (wifi) de la vivienda. En cuanto al suministro de energía eléctrica, ${ARR} ${v("abonará", "abonarán")} a EL ARRENDADOR, junto con la renta, una cantidad fija de ${cuota} mensuales en concepto de consumo eléctrico. A la finalización del contrato, ${finTxt}, se procederá a una regularización final, comparando el total abonado por este concepto con el importe real de las facturas de electricidad del periodo del contrato: si lo abonado resultase superior, EL ARRENDADOR devolverá el exceso a ${ARR}; si resultase inferior, ${ARR} ${v("deberá", "deberán")} abonar la diferencia.${c.varios ? " Dicha diferencia, a favor o en contra, se distribuirá a partes iguales entre todos los arrendatarios firmantes." : ""}`;
    default: // D: todo incluido, con o sin tope
      if (num(luz.tope) > 0) {
        return esHab
          ? `La renta pactada incluye los suministros de agua, conexión a internet (wifi) y energía eléctrica de la vivienda, siempre que el importe mensual de la factura de electricidad del conjunto de la vivienda no supere los ${euros(luz.tope)}. En caso de superarse dicho límite, el exceso será de cuenta de los arrendatarios de la vivienda, repercutiéndose a partes iguales entre las habitaciones arrendadas, debiendo ${ARR} abonar a EL ARRENDADOR la parte que le corresponda conforme a las facturas que le sean facilitadas.`
          : `La renta pactada incluye los suministros de agua, conexión a internet (wifi) y energía eléctrica de la vivienda, siempre que el importe mensual de la factura de electricidad no supere los ${euros(luz.tope)}. En caso de superarse dicho límite, el exceso será de cuenta de ${ARR}, que ${v("deberá", "deberán")} abonarlo a EL ARRENDADOR conforme a las facturas que le${c.varios ? "s" : ""} sean facilitadas.`;
      }
      return `La renta pactada incluye los suministros de agua, conexión a internet (wifi) y energía eléctrica de la vivienda, sin que ${ARR} ${v("deba", "deban")} realizar pago adicional alguno por dichos conceptos.`;
  }
}

// ---------- larga duración ----------

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
  add("p", "II. Que la vivienda se encuentra libre de cargas que puedan afectar al presente arrendamiento, y no está arrendada ni ocupada a la fecha de firma de este contrato.");
  add("p", `III. Que EL ARRENDADOR hace entrega a ${ARR}, en este acto, de una copia del certificado de eficiencia energética de la vivienda.`);
  add("p", `IV. Que ${ARR} ${v("está interesado", "están interesados")} en arrendar dicha vivienda para destinarla a su vivienda habitual, por lo que las partes formalizan el presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA, que se regirá por la ${LAU} (en adelante, "LAU") y, en lo no previsto en ella, por el Código Civil, y en particular por las siguientes`);

  add("heading", "CLÁUSULAS");

  add("subheading", c.siguiente("Objeto y destino."));
  add("p", `EL ARRENDADOR cede en arrendamiento a ${ARR}, que ${v("la recibe", "la reciben")} de conformidad, la vivienda descrita en el expositivo I, junto con el mobiliario y enseres que la integran. La vivienda se destinará exclusivamente a vivienda habitual y permanente de ${ARR}, quedando prohibido destinarla, total o parcialmente, a comercio, industria, despacho profesional, oficina, hospedaje o cualquier otra actividad distinta. La variación de dicho destino sin autorización escrita de EL ARRENDADOR será causa de resolución del contrato.`);

  add("subheading", c.siguiente("Duración."));
  add("p", `El contrato entrará en vigor el día ${fechaLarga(datos.fechaInicio)} y tendrá una duración inicial de un año a contar desde dicha fecha.`);
  add("p", `Llegado el día de vencimiento, el contrato se prorrogará obligatoriamente por plazos anuales hasta alcanzar una duración mínima de cinco años, salvo que ${ARR} ${v("manifieste", "manifiesten")} a EL ARRENDADOR, con treinta días de antelación como mínimo a la fecha de terminación del contrato o de cualquiera de sus prórrogas, su voluntad de no renovarlo, conforme al artículo 9 de la LAU.`);
  add("p", `Transcurridos los cinco años, si ninguna de las partes hubiese notificado a la otra su voluntad de no renovar el contrato, con al menos cuatro meses de antelación en el caso de EL ARRENDADOR o dos meses en el caso de ${ARR}, el contrato se prorrogará obligatoriamente por plazos anuales hasta un máximo de tres años más, salvo que ${ARR} ${v("manifieste", "manifiesten")} con un mes de antelación a la fecha de terminación de cualquiera de dichas anualidades su voluntad de no renovarlo, conforme al artículo 10 de la LAU.`);
  add("p", `No obstante lo anterior, ${ARR} ${v("podrá", "podrán")} desistir del contrato una vez transcurridos al menos seis meses desde su entrada en vigor, siempre que lo ${v("comunique", "comuniquen")} a EL ARRENDADOR con una antelación mínima de treinta días, conforme al artículo 11 de la LAU.`);

  add("subheading", c.siguiente("Renta y forma de pago."));
  if (cuotaAgua > 0) {
    add("p", `La renta mensual se fija en ${euros(renta)}, a la que se añade una cantidad fija de ${euros(cuotaAgua)} mensuales en concepto de suministro de agua, conforme a la cláusula de gastos, lo que hace un total de ${euros(renta + cuotaAgua)} mensuales.`);
  } else {
    add("p", `La renta mensual se fija en ${euros(renta)}.`);
  }
  add("p", `${ARR} se ${v("obliga", "obligan")} a abonar dicha cantidad ${c.varios ? "solidariamente, " : ""}por adelantado ${plazoPago(datos)}, mediante transferencia bancaria a la cuenta de titularidad de EL ARRENDADOR ${datos.iban}, haciendo constar en el concepto: "Alquiler ${datos.piso.nombre} + ${c.inquilinos.map(i => i.nombre).join(" y ")}". El justificante de la transferencia acreditará el pago y servirá de recibo, salvo prueba en contrario.`);
  add("p", "Las cantidades no satisfechas en plazo devengarán el interés legal del dinero desde la fecha en que debieron abonarse.");

  add("subheading", c.siguiente("Actualización de la renta."));
  add("p", textoActualizacion(c));
  add("p", "La base sobre la que se efectuará cada actualización será la renta vigente en el mes inmediatamente anterior a la fecha de actualización. La actualización no tendrá efectos retroactivos.");

  add("subheading", c.siguiente("Fianza."));
  add("p", `En el momento de la firma del presente contrato, ${ARR} ${v("hace", "hacen")} entrega a EL ARRENDADOR, en concepto de fianza legal y de conformidad con el artículo 36 de la LAU, de la cantidad de ${euros(fianza)}, equivalente a una mensualidad de renta.`);
  add("p", `La fianza garantiza el cumplimiento de las obligaciones de ${ARR} derivadas de este contrato. A la finalización del arrendamiento será devuelta a ${ARR} en el plazo de un mes desde la entrega de llaves, una vez deducidas, en su caso, las cantidades que correspondan en concepto de rentas o suministros pendientes y de desperfectos que no se deban al uso ordinario de la vivienda. La fianza no podrá aplicarse al pago de la última mensualidad de renta.`);
  bloquesGarantiaYDeposito(add, datos, ARR, v, renta);

  if (c.avales.length) {
    add("subheading", c.siguiente(c.avales.length > 1 ? "Fiadores solidarios." : "Fiador solidario."));
    bloqueFiadores(add, c, objetoRef, false);
  }

  add("subheading", c.siguiente("Gastos y suministros."));
  add("p", "Serán de cuenta de EL ARRENDADOR los gastos de la comunidad de propietarios, el Impuesto sobre Bienes Inmuebles, la tasa de recogida de basuras y demás tributos que graven la propiedad.");
  add("p", `Serán de cuenta de ${ARR} los gastos por consumo de energía eléctrica. A tal efecto, ${ARR} ${v("deberá", "deberán")}, en el plazo más breve posible desde la entrada en vigor del presente contrato, tramitar el cambio de titularidad de dicho suministro a su nombre y con cargo a su cuenta bancaria.`);
  if (cuotaAgua > 0) {
    add("p", `En cuanto al suministro de agua, ${ARR} ${v("abonará", "abonarán")} a EL ARRENDADOR la cantidad fija de ${euros(cuotaAgua)} mensuales indicada en la cláusula de renta.`);
  } else {
    add("p", "El suministro de agua está incluido en la renta pactada.");
  }
  add("p", `Cualquier otro servicio o suministro susceptible de individualizarse mediante contador será igualmente de cuenta de ${ARR}.`);

  add("subheading", c.siguiente("Conservación, obras y subarriendo."));
  add("p", `${ARR} se ${v("obliga", "obligan")} a conservar la vivienda, su mobiliario y sus instalaciones en buen estado. Las pequeñas reparaciones que exija el desgaste por el uso ordinario serán de cuenta de ${ARR}, conforme al artículo 21.4 de la LAU; las reparaciones necesarias para conservar la vivienda en condiciones de habitabilidad corresponden a EL ARRENDADOR, conforme al artículo 21.1 de la LAU.`);
  add("p", `${ARR} no ${v("podrá", "podrán")}, sin autorización previa y por escrito de EL ARRENDADOR, realizar obras que modifiquen la configuración de la vivienda o sus instalaciones. Las mejoras que, en su caso, se autoricen quedarán en beneficio de la vivienda, sin derecho a indemnización.`);
  add("p", `Queda prohibido ceder el contrato o subarrendar la vivienda, total o parcialmente, sin consentimiento escrito de EL ARRENDADOR.`);

  add("subheading", c.siguiente("Entrega y devolución de la vivienda."));
  add("p", `EL ARRENDADOR entrega la vivienda a ${ARR} en buen estado de conservación, amueblada y con plena habitabilidad, siendo la entrega de llaves el día ${fechaLarga(entrega)}.${datos.conFotos ? " Como anexo a este contrato se adjuntan fotografías del estado actual de la vivienda." : ""}`);
  add("p", `A la finalización del contrato, ${ARR} ${v("deberá", "deberán")} devolver la vivienda en el mismo estado en que la ${v("recibió", "recibieron")}, salvo el deterioro derivado del uso ordinario, y en unas condiciones de limpieza adecuadas. En caso contrario, EL ARRENDADOR podrá descontar de la fianza el importe necesario para su reparación o limpieza.`);

  add("subheading", c.siguiente("Resolución."));
  add("p", `Serán causa de resolución del presente contrato, además de las previstas en los artículos 26, 27 y 28 de la LAU, el impago de la renta o de cualquiera de las cantidades cuyo pago haya asumido ${ARR}, el incumplimiento grave de las obligaciones de conservación y buen uso, la realización de obras no consentidas, el cambio de destino de la vivienda y la cesión o el subarriendo no consentidos.`);

  add("subheading", c.siguiente("Notificaciones."));
  add("p", `Las notificaciones a ${ARR} se practicarán en la vivienda arrendada, y las dirigidas a EL ARRENDADOR, en el domicilio indicado en el encabezamiento. Serán igualmente válidas las comunicaciones por correo electrónico o mensajería siempre que quede constancia de su recepción.`);

  add("subheading", c.siguiente("Normativa aplicable y jurisdicción."));
  add("p", "En todo lo no previsto expresamente en este contrato será de aplicación la LAU y, supletoriamente, el Código Civil. Para cualquier controversia derivada del presente contrato serán competentes los Juzgados y Tribunales del lugar en que radica la vivienda.");

  bloqueClausulasExtra(add, datos, c);
  bloqueFirmas(add, datos, c);
  if (datos.conFotos) add("annex", "ANEXO I. ESTADO ACTUAL DE LA VIVIENDA");
  return L;
}
