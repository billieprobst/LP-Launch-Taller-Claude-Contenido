# Inmoescala Club — Landing de lanzamiento

Landing estática (HTML/CSS/JS) para captar registros al lanzamiento en vivo del
**8 de octubre de 2026, 6:00 pm (Ecuador · Colombia · Perú)**.

Flujo: visitante → formulario multi-paso → Google Sheet + email de bienvenida (Resend)
→ redirección al grupo de WhatsApp.

---

## 1. Archivos

```
index.html            Landing
gracias.html          Página de respaldo (noindex) con botón manual al grupo
vercel.json            Config de despliegue
assets/
  css/style.css        Estilos (variables de marca en :root)
  js/main.js            Contador, formulario, envío, redirección  ← EDITAR CONFIG
  img/                  Imágenes (ver punto 5)
apps-script/
  Codigo.gs             Backend: Sheet + email  ← EDITAR CONFIG
```

---

## 2. Google Sheet + Apps Script

1. Crea un Google Sheet nuevo (en la cuenta que enviará/gestionará los datos).
2. Copia su **ID** desde la URL:
   `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`
3. En el Sheet: **Extensiones → Apps Script**.
4. Borra el contenido y pega **todo** `apps-script/Codigo.gs`.
5. Rellena el objeto `CONFIG` al inicio del script:
   - `SHEET_ID` → el ID del paso 2
   - `RESEND_API_KEY` → ver punto 3
   - el resto ya viene con los valores correctos (revísalos)
6. Guarda. Ejecuta una vez la función **`setup`** (menú ▶). Autoriza los permisos
   que pida (Sheets + envío de peticiones externas).
7. **Implementar → Nueva implementación → tipo: Aplicación web**
   - Descripción: `Inmoescala Club v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - Implementar → copia la **URL** que termina en `/exec`.
8. Pega esa URL en `assets/js/main.js` → `CONFIG.APPS_SCRIPT_URL`.

> Cada vez que edites `Codigo.gs` debes hacer **Implementar → Gestionar
> implementaciones → editar (lápiz) → Nueva versión**. Si creas una implementación
> nueva, la URL cambia y hay que actualizar `main.js`.

---

## 3. Resend (email de bienvenida)

1. Crea cuenta en <https://resend.com>.
2. **Domains → Add Domain** → `inmoescala.com`.
3. Añade en tu DNS los registros que muestra Resend (SPF, DKIM, y opcional DMARC).
   Espera a que aparezca **Verified**.
4. **API Keys → Create API Key** (permiso *Sending access*). Copia la clave `re_...`.
5. Pégala en `apps-script/Codigo.gs` → `CONFIG.RESEND_API_KEY`.
6. Confirma que `FROM_EMAIL` usa un remitente de ese dominio
   (`Inmoescala <soporte@inmoescala.com>`).

Límite del plan gratis: 3.000 emails/mes, 100/día. Suficiente para el lanzamiento.

---

## 4. Editar antes de publicar

**`assets/js/main.js`** → objeto `CONFIG`:
| Campo | Valor |
|---|---|
| `WHATSAPP_GROUP` | ya puesto: `https://chat.whatsapp.com/ITDVWsMDcHaIc5t96VjvVS` |
| `APPS_SCRIPT_URL` | la URL `/exec` del punto 2.7 |
| `LAUNCH_DATE` | ya puesto: `2026-10-08T18:00:00-05:00` |

**`index.html`**:
- `REEMPLAZAR-DOMINIO` (3 sitios: canonical + 2 og) → el dominio final.
- Enlaces `href="#"` de "Aviso legal" y "Política de privacidad" → URLs reales.

**`gracias.html`**: el enlace de WhatsApp ya está puesto.

---

## 5. Imágenes (colocar en `assets/img/`)

| Archivo | Qué es | Medida sugerida |
|---|---|---|
| `logo-inmoescala.png` | Logo "ie" | ~260×260, PNG con transparencia |
| `favicon.png` | Favicon | 96×96 |
| `og.jpg` | Imagen para compartir en redes | 1200×630 |
| `billie-1.jpg` | Billie frente a una propiedad (Polaroid) | ~640×720 |
| `billie-2.jpg` | Billie presentando (hero + Polaroid) | ~880×1120 |

Testimonios: por ahora son solo texto (Daniel / Dagmal). Si consigues capturas o
fotos, se añaden a la sección "Resultados reales".

Optimiza a WebP/JPG comprimido (<200 KB cada una) antes de subir.

---

## 6. Desplegar en Vercel

**Opción A — CLI**
```bash
npm i -g vercel
cd landings/inmoescala-club-lanzamiento
vercel            # primera vez: enlaza el proyecto
vercel --prod     # despliegue de producción
```

**Opción B — GitHub + Vercel**
1. Sube esta carpeta a un repo (puede ser la raíz del repo).
2. En Vercel: **Add New → Project** → importa el repo.
3. **Root Directory**: `landings/inmoescala-club-lanzamiento` (si el repo es el monorepo completo).
4. Framework preset: **Other**. Deploy.

**Dominio propio (cuando lo tengas)**
- Vercel → Project → **Settings → Domains** → añade el dominio.
- En tu proveedor DNS, apunta el registro que indique Vercel (A / CNAME).
- Actualiza `REEMPLAZAR-DOMINIO` en `index.html` y vuelve a desplegar.

---

## 7. Checklist antes de dar por lista

- [ ] `APPS_SCRIPT_URL` pegada en `main.js`
- [ ] Prueba real: enviar el formulario → aparece fila en el Sheet
- [ ] Llega el email de bienvenida (revisar también spam)
- [ ] Redirección al grupo de WhatsApp funciona
- [ ] `gracias.html` abre y el botón lleva al grupo
- [ ] Dominio en canonical + og
- [ ] Imágenes cargadas y optimizadas (F12 → Network sin 404)
- [ ] Probado en móvil (sticky CTA visible, formulario usable)
- [ ] Contador muestra la cuenta correcta
- [ ] Links de aviso legal / privacidad reales
