# Contratos de alquiler

App web para gestionar los contratos de los pisos:

1. Creáis una invitación (piso, modalidad, renta, luz…) y mandáis el enlace al inquilino.
2. El inquilino rellena sus datos y los de sus avalistas.
3. Generáis el contrato y lo enviáis a firmar.
4. Cada persona firma su parte con el dedo desde el móvil.
5. El PDF firmado se guarda solo en Google Drive: `Rentas / Renta AAAA / Contratos / Piso`, en cada año fiscal que abarque el contrato.
6. Las facturas de los pisos (foto o archivo) van a `Rentas / Renta AAAA / Pisos facturas / Piso`, según la fecha de la factura.

Funciona entera en el navegador, sin servidor propio:

- **GitHub Pages** aloja la web.
- **Firebase** guarda los datos y gestiona el inicio de sesión (plan gratuito).
- **Google Drive** guarda los PDF.

## Modo demostración

Mientras `js/firebase-config.js` no esté rellenado (o si añades `?demo` a la dirección), la app funciona con datos de ejemplo guardados solo en el navegador, sin Firebase ni Drive.

## Puesta en marcha (una sola vez, unos 20 minutos)

### 1. GitHub
1. Crea un repositorio **público** llamado `contratos`, vacío.
   - Puede ser público: el código no contiene DNIs, IBAN ni emails. Todo eso vive en Firebase.
2. Sube estos archivos.
3. Ve a **Settings → Pages → Deploy from a branch → `main` / root**.
4. Apunta la dirección, por ejemplo `https://TU_USUARIO.github.io/contratos/`.

### 2. Firebase (console.firebase.google.com)
1. **Crear proyecto** (sin Google Analytics).
2. **Añadir app → Web (`</>`)**. Copia los datos del bloque `firebaseConfig` en `js/firebase-config.js`.
3. **Authentication → Método de acceso → Google → Habilitar**.
4. **Authentication → Configuración → Dominios autorizados → Añadir** `TU_USUARIO.github.io`.
5. **Firestore Database → Crear base de datos**, en la ubicación `europe-southwest1 (Madrid)` y en modo producción.
6. **Firestore → Reglas**: pega el contenido de `firestore.rules`, cambia los dos emails por los vuestros y publica.
   - Esos emails son los únicos que pueden entrar al panel.

### 3. Google Cloud (console.cloud.google.com, mismo proyecto)
1. **APIs y servicios → Biblioteca**: habilita **Google Drive API** y **Google Picker API**.
2. **Pantalla de consentimiento de OAuth**:
   - Tipo externo.
   - Nombre «Contratos».
   - En «Usuarios de prueba», añade vuestros dos emails.
3. **Credenciales**:
   - Abre el «Web client (auto created by Google Service)».
   - En «Orígenes autorizados de JavaScript», añade `https://TU_USUARIO.github.io`.
   - Copia el **ID de cliente** en `googleClientId`.
4. En Firebase, **Configuración del proyecto → General**: copia el **Número del proyecto** en `googleProjectNumber`.

### 4. Primer uso
1. Abre la web y entra con Google.
2. **Ajustes**:
   - Vuestros DNIs.
   - El IBAN.
   - La carpeta **Rentas** de Drive, con el botón «Elegir».
3. **Pisos**: da de alta cada piso con:
   - La dirección.
   - Las habitaciones.
   - La modalidad habitual.
   - La luz o el agua.
   - El PDF de fotos (en Drive).

## Cómo se usa

- **Nuevo inquilino**:
  1. Eliges piso y condiciones.
  2. Pulsas «Crear enlace» y lo mandas por WhatsApp.
  3. En piso entero, todos los compañeros usan el mismo enlace.
- **Generar contrato**:
  - Revisas o corriges los datos recibidos y eliges la fecha de firma.
  - En habitaciones sale un contrato por inquilino.
  - En piso entero y larga duración sale un único contrato.
- **Enviar a firmar**:
  - El inquilino abre el mismo enlace, lee el contrato y firma.
  - Cada avalista firma su parte, desde el mismo móvil o reenviándole el enlace.
  - Vosotros firmáis desde la ficha del contrato.
- **Guardar firmado**:
  - Cuando han firmado todos, pulsa «Guardar contrato firmado en Drive».
  - El PDF incluye las firmas y una página de registro con la fecha y hora de cada firma y la huella del texto firmado.
- **Firma en papel**: también puedes subir el escaneado con «Subir firmado en papel».

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html`, `css/styles.css` | La web y su diseño |
| `js/app.js` | Pantallas, base de datos y firma |
| `js/contratos.js` | **El texto de los contratos** (habitación, piso entero, larga duración) |
| `js/pdf.js` | Maquetación del PDF |
| `js/drive.js` | Subida a Google Drive |
| `js/firebase-config.js` | Vuestra configuración de Firebase |
| `firestore.rules` | Quién puede leer y escribir cada cosa |

## Notas

- **Drive**: la app pide acceso a Drive para encontrar vuestras carpetas existentes (Renta 2026, Contratos, Pisos facturas…) aunque el nombre tenga tildes, mayúsculas o espacios distintos, y crea las que falten.
  - Como la app es vuestra y está en «modo de prueba», Google mostrará un aviso de «app no verificada» la primera vez: pulsad «Continuar».
  - La carpeta Rentas es de Blanca y está compartida con Manu, así que los dos podéis guardar en ella.
- **Larga duración**: mientras el contrato esté vigente, cada año nuevo el panel ofrece copiarlo a la carpeta de la nueva Renta con un toque. Al terminar el contrato, márcalo como «finalizado» y deja de copiarse.
- **Revisión legal**: las plantillas siguen la LAU vigente, pero conviene que una gestoría revise el texto antes de usarlas.
  - En particular, la elección entre vivienda habitual y temporada para estudiantes.
  - Y el depósito de la fianza en el organismo autonómico.
