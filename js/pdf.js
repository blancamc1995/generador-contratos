// Convierte los bloques de contratos.js en un PDF A4 (jsPDF) y, si se
// indica, añade al final las páginas de un PDF de fotos (pdf-lib).
// Requiere los scripts globales window.jspdf y window.PDFLib (CDN en index.html).

const W = 210, H = 297, ML = 25, MR = 25, MT = 22, MB = 22;
const ANCHO = W - ML - MR;

function render(doc, bloques, firmasHechas = {}) {
  let y = MT;
  const espacio = (mm) => { if (y + mm > H - MB) { doc.addPage(); y = MT; } };

  const parrafo = (texto, o = {}) => {
    const size = o.size || 10.5;
    doc.setFont("helvetica", o.style || "normal");
    doc.setFontSize(size);
    const lineas = doc.splitTextToSize(texto, ANCHO);
    const alto = size * 0.42;
    lineas.forEach((l, i) => {
      espacio(alto);
      const ultima = i === lineas.length - 1;
      if (o.align === "center") doc.text(l, W / 2, y, { align: "center" });
      else if (!ultima && o.justify !== false) doc.text(l, ML, y, { align: "justify", maxWidth: ANCHO });
      else doc.text(l, ML, y);
      y += alto;
    });
    y += o.after ?? 3.2;
  };

  for (const b of bloques) {
    switch (b.type) {
      case "title": parrafo(b.text, { size: 13, style: "bold", align: "center", after: 2 }); break;
      case "subtitle": parrafo(b.text, { size: 10, style: "italic", align: "center", after: 6 }); break;
      case "heading": espacio(12); y += 2; parrafo(b.text, { size: 11.5, style: "bold", after: 3, justify: false }); break;
      case "subheading": espacio(10); y += 1.5; parrafo(b.text, { size: 10.5, style: "bold", after: 2, justify: false }); break;
      case "annex": espacio(14); y += 8; parrafo(b.text, { size: 11.5, style: "bold", justify: false }); break;
      case "signatures": y = firmas(doc, b.text, y, firmasHechas); break;
      default: parrafo(b.text);
    }
  }
}

function firmas(doc, s, y, hechas) {
  const filas = Math.max(s.propietarios.length, s.inquilinos.length);
  const alto = 14 + filas * 18 + (s.avales.length ? 14 + Math.ceil(s.avales.length / 2) * 18 : 0);
  if (y + alto > H - MB) { doc.addPage(); y = MT; }
  y += 8;
  const xI = ML, xD = W / 2 + 5;
  const cab = (t, x) => { doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text(t, x, y); };
  const linea = (p, x, yy) => {
    const f = p.fid && hechas[p.fid];
    if (f?.imagen) {
      try { doc.addImage(f.imagen, "PNG", x, yy - 15, 52, 14); } catch (e) { console.warn("firma", e); }
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    doc.setDrawColor(120); doc.line(x, yy, x + 62, yy);
    doc.text(p.nombre, x, yy + 5);
  };
  cab("EL ARRENDADOR", xI);
  cab(s.inquilinos.length > 1 ? "LOS ARRENDATARIOS" : "EL ARRENDATARIO", xD);
  y += 16;
  let yI = y, yD = y;
  s.propietarios.forEach(p => { linea(p, xI, yI); yI += 18; });
  s.inquilinos.forEach(p => { linea(p, xD, yD); yD += 18; });
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

function numerar(doc, desde, total) {
  for (let i = 1; i <= desde; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(140);
    doc.text(`Página ${i} de ${total}`, W / 2, H - 10, { align: "center" });
    doc.setTextColor(0);
  }
}

// Página final con la constancia de cada firma electrónica.
function paginaRegistro(doc, r) {
  doc.addPage();
  let y = MT;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("REGISTRO DE FIRMA ELECTRÓNICA", W / 2, y, { align: "center" }); y += 10;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  const intro = doc.splitTextToSize(`Las partes han firmado este contrato de forma electrónica mediante firma manuscrita digitalizada, tras declarar haber leído y aceptado su contenido. La huella digital (SHA-256) identifica de forma única el texto firmado; cualquier modificación posterior del contenido daría lugar a una huella distinta.`, ANCHO);
  doc.text(intro, ML, y); y += intro.length * 4.2 + 4;
  doc.setFont("courier", "normal"); doc.setFontSize(8);
  doc.text(doc.splitTextToSize(`Huella del contrato: ${r.huella}`, ANCHO), ML, y); y += 10;
  r.firmantes.forEach(f => {
    if (y > H - MB - 26) { doc.addPage(); y = MT; }
    doc.setDrawColor(210); doc.line(ML, y - 4, W - MR, y - 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`${f.nombre} (${f.rolTexto})`, ML, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`${f.tipoDoc || "Documento"}: ${f.numDoc || "-"}`, ML, y + 5);
    doc.text(`Firmado el ${f.fecha}`, ML, y + 10);
    if (f.imagen) { try { doc.addImage(f.imagen, "PNG", W - MR - 50, y - 3, 48, 13); } catch (e) { /* nada */ } }
    y += 20;
  });
}

/**
 * @param bloques  salida de generarContrato()
 * @param fotos    ArrayBuffer de un PDF de fotos (opcional)
 * @returns Uint8Array con el PDF final
 */
export async function construirPdf(bloques, fotos, firmasHechas = null, registro = null) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  render(doc, bloques, firmasHechas || {});
  if (registro) paginaRegistro(doc, registro);
  const paginas = doc.internal.getNumberOfPages();
  numerar(doc, paginas, paginas);
  const base = doc.output("arraybuffer");
  if (!fotos) return new Uint8Array(base);

  const { PDFDocument } = window.PDFLib;
  const final = await PDFDocument.create();
  const contrato = await PDFDocument.load(base);
  (await final.copyPages(contrato, contrato.getPageIndices())).forEach(p => final.addPage(p));
  const anexo = await PDFDocument.load(fotos, { ignoreEncryption: true });
  (await final.copyPages(anexo, anexo.getPageIndices())).forEach(p => final.addPage(p));
  return await final.save();
}

export function descargar(bytes, nombre) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
