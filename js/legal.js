// Textos legales de la app. Son una base redactada para una app de este tipo
// en España (RGPD, LOPDGDD y LSSI-CE): deben revisarse por un abogado antes
// de comercializar, y hay que completar los datos del titular en
// firebase-config.js (CONFIG.titular).

import { CONFIG } from "./firebase-config.js";

const T = () => ({
  app: CONFIG.nombreApp || "Contratos de alquiler",
  nombre: CONFIG.titular?.nombre || "[NOMBRE O RAZÓN SOCIAL DEL TITULAR]",
  nif: CONFIG.titular?.nif || "[NIF]",
  domicilio: CONFIG.titular?.domicilio || "[DOMICILIO]",
  email: CONFIG.titular?.email || "[EMAIL DE CONTACTO]",
  web: location.origin + location.pathname,
  fecha: CONFIG.titular?.fechaTextos || "octubre de 2026",
});

const h = (t) => `<h2 style="font-size:19px;margin-top:8px">${t}</h2>`;
const p = (t) => `<p style="margin:0;line-height:1.6">${t}</p>`;
const ul = (xs) => `<ul style="margin:0;padding-left:20px;line-height:1.6;display:flex;flex-direction:column;gap:4px">${xs.map(x => `<li>${x}</li>`).join("")}</ul>`;

export const LEGALES = {
  aviso: "Aviso legal",
  privacidad: "Política de privacidad",
  terminos: "Condiciones de uso",
  encargo: "Contrato de encargo del tratamiento",
  inquilinos: "Información para inquilinos y avalistas",
};

/** Texto de la casilla que marca el inquilino antes de enviar sus datos. */
export function TEXTO_CONSENTIMIENTO(arrendadores) {
  return `He leído la <a href="#/legal/inquilinos" target="_blank" rel="noopener">información sobre protección de datos</a>. Mis datos y los de mis avalistas los trata ${arrendadores || "el arrendador"} para preparar, firmar y gestionar el contrato de alquiler. Declaro que mis avalistas conocen y aceptan que facilito sus datos con esta finalidad.`;
}

export function paginaLegal(slug) {
  const t = T();
  switch (slug) {
    case "aviso": return [
      p(`En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de que el titular de ${t.app}, accesible en ${t.web}, es ${t.nombre}, con NIF ${t.nif} y domicilio en ${t.domicilio}. Contacto: ${t.email}.`),
      h("Objeto"),
      p(`${t.app} es una herramienta para que propietarios de viviendas recojan los datos de sus inquilinos, generen contratos de arrendamiento a partir de modelos, los firmen electrónicamente y archiven contratos y facturas en su propio Google Drive.`),
      h("Responsabilidad"),
      p(`Los modelos de contrato son plantillas orientativas basadas en la Ley 29/1994 de Arrendamientos Urbanos. No constituyen asesoramiento jurídico. Cada propietario es responsable de revisar el contenido de sus contratos, adaptarlo a su caso y a la normativa de su comunidad autónoma, y de los datos que introduce.`),
      h("Propiedad intelectual"),
      p(`El código, el diseño y los textos de la aplicación pertenecen a su titular o se usan con licencia. Los contratos generados pertenecen a quienes los suscriben.`),
      h("Legislación aplicable"),
      p(`Este aviso se rige por la legislación española.`),
    ].join("");

    case "privacidad": return [
      p(`Última actualización: ${t.fecha}.`),
      h("1. Quién trata tus datos"),
      p(`Hay dos situaciones distintas:`),
      ul([
        `<b>Si eres usuario de la app (propietario):</b> el responsable de tus datos de cuenta es ${t.nombre} (NIF ${t.nif}, ${t.domicilio}, ${t.email}).`,
        `<b>Si eres inquilino o avalista:</b> el responsable es el propietario que te ha enviado el enlace. ${t.nombre} actúa solo como encargado del tratamiento por cuenta de ese propietario. Consulta la <a href="#/legal/inquilinos">información para inquilinos</a>.`,
      ]),
      h("2. Qué datos tratamos"),
      ul([
        `Datos de la cuenta: nombre y email de tu cuenta de Google y los miembros de tu equipo.`,
        `Datos que introduces para los contratos: nombre, documento de identidad, domicilio, IBAN y datos de tus viviendas.`,
        `Datos de inquilinos y avalistas: nombre, tipo y número de documento, domicilio, teléfono, email, parentesco, firma manuscrita digitalizada, fecha y hora de firma e información técnica del dispositivo con el que se firma.`,
        `Registro de facturas: proveedor, concepto, fecha e importe. Los archivos se guardan en tu Google Drive, no en nuestros servidores.`,
      ]),
      h("3. Para qué y con qué base legal"),
      ul([
        `Prestarte el servicio (art. 6.1.b RGPD: ejecución del contrato de uso de la app).`,
        `Atender tus solicitudes y comunicaciones del servicio (art. 6.1.b RGPD).`,
        `Cumplir obligaciones legales, por ejemplo fiscales si hay facturación (art. 6.1.c RGPD).`,
        `Seguridad e integridad del servicio y prevención del fraude (art. 6.1.f RGPD: interés legítimo).`,
      ]),
      p(`No usamos tus datos ni los de tus inquilinos para publicidad, no elaboramos perfiles y no vendemos datos a terceros.`),
      h("4. Dónde se guardan y quién más interviene"),
      ul([
        `Google Cloud / Firebase (Google Ireland Ltd.): base de datos e inicio de sesión. La base de datos se aloja en la región europe-southwest1 (Madrid).`,
        `Google Drive de cada propietario: los PDF de contratos y las facturas se guardan en el Drive del propio usuario, bajo su control.`,
        `GitHub Pages (GitHub, Inc.): alojamiento de la web. Puede registrar direcciones IP por motivos técnicos y de seguridad.`,
      ]),
      p(`Algunos de estos proveedores pertenecen a grupos con sede en EE. UU. Las transferencias internacionales que puedan producirse se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo de la Comisión Europea.`),
      h("5. Cuánto tiempo"),
      p(`Los datos de tu cuenta se conservan mientras la mantengas. Puedes borrar tu cuenta y todos sus datos desde Ajustes. Los datos de inquilinos se conservan el tiempo que decida su propietario. Recomendamos borrarlos al terminar el contrato, una vez pasados los plazos legales de prescripción de las acciones derivadas del arrendamiento. Tras borrar una cuenta, las copias de seguridad técnicas del proveedor se eliminan en sus plazos ordinarios.`),
      h("6. Tus derechos"),
      p(`Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${t.email}. Desde Ajustes puedes además descargar una copia de tus datos y borrar tu cuenta. Si eres inquilino, dirígete primero a tu arrendador, que es el responsable. Si consideras que no se han atendido tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).`),
      h("7. Almacenamiento en el navegador"),
      p(`La app usa almacenamiento técnico del navegador (sesión de inicio de Google y borradores del formulario del inquilino). Es imprescindible para el funcionamiento y no se usa para analítica ni publicidad, por lo que no requiere consentimiento.`),
      h("8. Seguridad"),
      p(`El acceso a los datos de cada cuenta está restringido a sus miembros mediante reglas de seguridad de la base de datos. Cada inquilino accede solo a su propio formulario y contrato mediante un enlace único. Las comunicaciones van cifradas (HTTPS).`),
    ].join("");

    case "terminos": return [
      p(`Última actualización: ${t.fecha}. Al crear una cuenta en ${t.app} aceptas estas condiciones.`),
      h("1. El servicio"),
      p(`${t.app} permite gestionar pisos, invitar a inquilinos a rellenar sus datos, generar contratos a partir de modelos, firmarlos electrónicamente y archivar documentos en tu Google Drive.`),
      h("2. Tu cuenta"),
      p(`Accedes con tu cuenta de Google. Eres responsable de su uso y de los miembros que añadas a tu equipo, que tendrán acceso a todos los datos de la cuenta.`),
      h("3. Tus obligaciones"),
      ul([
        `Introducir datos veraces y tener base legal para tratar los datos de tus inquilinos y avalistas: normalmente, la preparación y ejecución del contrato de arrendamiento.`,
        `Informar a tus inquilinos de que usas esta herramienta. La app les muestra la información básica antes de enviar sus datos.`,
        `Revisar cada contrato antes de enviarlo a firmar. Los modelos son orientativos y no sustituyen el asesoramiento jurídico.`,
        `Cumplir la normativa aplicable a tus arrendamientos, como el depósito de la fianza en tu comunidad autónoma o las obligaciones fiscales.`,
      ]),
      h("4. Firma electrónica"),
      p(`La firma en la app es una firma electrónica simple (Reglamento (UE) 910/2014, eIDAS). Registra la firma manuscrita digitalizada, la aceptación expresa, la fecha y hora y una huella criptográfica del texto firmado. Es válida para contratos de arrendamiento, pero su valor como prueba lo decide, en su caso, un juez. Para operaciones que lo requieran, usa firma electrónica avanzada o cualificada.`),
      h("5. Protección de datos"),
      p(`Respecto a los datos de tus inquilinos, tú eres el responsable del tratamiento y ${t.nombre} actúa como encargado según el <a href="#/legal/encargo">contrato de encargo del tratamiento</a>, que aceptas junto con estas condiciones.`),
      h("6. Precio"),
      p(`Las condiciones económicas, si las hay, se informarán antes de contratar. Durante el periodo de prueba el servicio es gratuito.`),
      h("7. Disponibilidad y responsabilidad"),
      p(`Ponemos los medios razonables para que el servicio funcione, pero no garantizamos que esté libre de interrupciones. ${t.nombre} no responde del contenido de los contratos que generes ni de su adecuación a tu caso, ni de la pérdida de archivos guardados en tu Google Drive. Te recomendamos conservar copias.`),
      h("8. Baja"),
      p(`Puedes borrar tu cuenta en cualquier momento desde Ajustes. Podemos suspender cuentas que hagan un uso ilícito del servicio.`),
      h("9. Ley y jurisdicción"),
      p(`Se aplica la ley española. Si eres consumidor, son competentes los tribunales de tu domicilio.`),
    ].join("");

    case "encargo": return [
      p(`Contrato de encargo del tratamiento conforme al artículo 28 del Reglamento (UE) 2016/679 (RGPD), entre el usuario de ${t.app} (el <b>Responsable</b>) y ${t.nombre}, NIF ${t.nif} (el <b>Encargado</b>). Se acepta al crear la cuenta.`),
      h("1. Objeto"),
      p(`El Encargado trata por cuenta del Responsable los datos personales de sus inquilinos, avalistas y demás personas que figuren en los contratos, con la única finalidad de prestar el servicio de ${t.app}: recogida de datos, generación de contratos, firma electrónica y archivo.`),
      h("2. Datos y personas afectadas"),
      p(`Identificativos (nombre, documento de identidad, domicilio, teléfono, email), firma manuscrita digitalizada, datos del contrato (renta, fianza, fechas) y datos técnicos de firma. Afecta a inquilinos, avalistas y copropietarios.`),
      h("3. Duración"),
      p(`Mientras el Responsable mantenga su cuenta. Al darse de baja, el Encargado suprimirá los datos de la base de datos. Los documentos del Google Drive del Responsable quedan bajo su control.`),
      h("4. Obligaciones del Encargado"),
      ul([
        `Tratar los datos solo según las instrucciones documentadas del Responsable, que son las propias del funcionamiento de la app.`,
        `Garantizar la confidencialidad de las personas autorizadas a tratarlos.`,
        `Aplicar medidas de seguridad adecuadas (art. 32 RGPD): control de acceso por cuenta, enlaces únicos, cifrado en tránsito y alojamiento en la UE.`,
        `No subcontratar sin autorización. El Responsable autoriza a Google (Firebase/Google Cloud) y GitHub (alojamiento web) como subencargados. Cualquier cambio se informará con antelación para que pueda oponerse.`,
        `Ayudar al Responsable a atender los derechos de los interesados y a cumplir sus obligaciones de seguridad, notificación de brechas y evaluaciones de impacto.`,
        `Notificar sin dilación indebida, y en todo caso antes de 48 horas, cualquier violación de seguridad de la que tenga conocimiento.`,
        `Suprimir o devolver los datos al terminar el servicio, salvo obligación legal de conservarlos.`,
        `Poner a disposición del Responsable la información necesaria para demostrar el cumplimiento.`,
      ]),
      h("5. Obligaciones del Responsable"),
      ul([
        `Disponer de base legal para el tratamiento y facilitar a los interesados la información del artículo 13 RGPD (la app la muestra antes de enviar los datos).`,
        `Velar por el cumplimiento del RGPD y supervisar el tratamiento.`,
      ]),
    ].join("");

    case "inquilinos": return [
      p(`Esta información se te da antes de enviar tus datos a través de ${t.app}, conforme al artículo 13 del RGPD.`),
      h("Responsable"),
      p(`El propietario (arrendador) que te ha enviado el enlace. Sus datos de identificación y contacto figuran en el contrato. ${t.nombre} (${t.email}) proporciona la herramienta y actúa como encargado del tratamiento.`),
      h("Finalidad y base legal"),
      p(`Preparar, firmar y gestionar tu contrato de arrendamiento y su fianza. La base legal es la aplicación de medidas precontractuales y la ejecución del contrato (art. 6.1.b RGPD). Para los avalistas, el interés legítimo del arrendador en garantizar el contrato (art. 6.1.f RGPD). Quien facilita los datos de sus avalistas declara haberles informado.`),
      h("Datos"),
      p(`Nombre, documento de identidad, domicilio, teléfono, email, parentesco de los avalistas, firma manuscrita digitalizada, fecha y hora de firma y datos técnicos del dispositivo con el que firmas.`),
      h("Destinatarios"),
      p(`El arrendador y su equipo. Los proveedores técnicos del servicio (Google, con alojamiento en la UE). Los organismos públicos cuando la ley lo exija, como el registro de fianzas de la comunidad autónoma o la Administración tributaria.`),
      h("Conservación"),
      p(`Durante la vigencia del contrato y, después, durante los plazos legales de prescripción de las acciones derivadas del arrendamiento.`),
      h("Derechos"),
      p(`Puedes pedir al arrendador el acceso, la rectificación, la supresión, la oposición, la limitación y la portabilidad de tus datos. También puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).`),
    ].join("");
  }
  return p("Página no encontrada.");
}
