/* ================================================================
   INMOESCALA CLUB — Landing de lanzamiento
   Contador · formulario multi-paso · validación · normalización IG
   captura de UTMs · envío a Apps Script · redirección a WhatsApp
   ================================================================ */

/* ---------- CONFIG (editar aquí) ---------- */
const CONFIG = {
  // Enlace de invitación al grupo de WhatsApp
  WHATSAPP_GROUP: "https://chat.whatsapp.com/ITDVWsMDcHaIc5t96VjvVS",

  // URL de la Web App de Google Apps Script (se obtiene al publicar — ver README)
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzCb2-LP-9A1JyExoPpAFYHLkmyfnVkZ5dCYQ3tMf7jXQUzjz6yXw5ixOKoUe4Ktle1/exec",

  // Fecha/hora del lanzamiento — 8 oct 2026, 18:00 GMT-5 (Ecuador/Colombia/Perú)
  LAUNCH_DATE: "2026-10-08T18:00:00-05:00",

  // Pop-up de conversión: aparece a los X segundos si no se ha registrado ni cerrado antes
  POPUP_DELAY_MS: 60000,

  // Tiempo máximo de espera por la confirmación del guardado (una sola solicitud,
  // sin reintento automático). Google Apps Script puede tardar varios segundos,
  // sobre todo en redes móviles, así que el plazo es generoso.
  SAVE_CONFIRM_TIMEOUT_MS: 15000,
};

/* ================================================================
   1. AÑO EN FOOTER
   ================================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

/* ================================================================
   1a. STICKY CTA (móvil) — se oculta mientras el formulario está a la vista
   para no tapar sus botones (Atrás / Continuar / Enviar).
   ================================================================ */
(function stickyCtaVisibility() {
  const sticky = document.querySelector(".sticky-cta");
  const form = document.getElementById("registro");
  if (!sticky || !form || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        sticky.classList.toggle("sticky-cta--hidden", e.isIntersecting);
      });
    },
    { threshold: 0.1 }
  );
  io.observe(form);
})();

/* ================================================================
   1b. APARICIÓN AL HACER SCROLL (.reveal → .is-in)
   ================================================================ */
(function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

/* ================================================================
   1c. CONTADORES ANIMADOS (.js-count) — suben desde 0 al entrar en vista
   ================================================================ */
const runCounter = (function counterSetup() {
  function animate(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = parseInt(el.dataset.count, 10) || 0;
    const prefix = el.dataset.prefix || "";
    const duration = 1100;
    let start = null;

    function frame(ts) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const value = Math.round(target * eased);
      el.textContent = prefix + value.toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counters = document.querySelectorAll(".js-count");
  if (counters.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => io.observe(el));
  } else {
    counters.forEach(animate);
  }

  return animate; // se reutiliza para contadores dentro del pop-up (oculto al cargar)
})();

/* ================================================================
   2. CONTADOR REGRESIVO
   ================================================================ */
(function countdown() {
  const target = new Date(CONFIG.LAUNCH_DATE).getTime();
  const el = {
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    minutes: document.querySelector('[data-cd="minutes"]'),
    seconds: document.querySelector('[data-cd="seconds"]'),
  };
  if (!el.days) return;

  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      el.days.textContent = el.hours.textContent =
        el.minutes.textContent = el.seconds.textContent = "00";
      const label = document.querySelector(".countdown__label");
      if (label) label.textContent = "¡El lanzamiento en vivo está por comenzar!";
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.days.textContent = pad(d);
    el.hours.textContent = pad(h);
    el.minutes.textContent = pad(m);
    el.seconds.textContent = pad(s);
  }

  tick();
  const timer = setInterval(tick, 1000);
})();

/* ================================================================
   3. CAPTURA DE UTMs
   ================================================================ */
function getUTMs() {
  const p = new URLSearchParams(location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_content: p.get("utm_content") || "",
    utm_term: p.get("utm_term") || "",
  };
}

/* ================================================================
   4. NORMALIZACIÓN DE INSTAGRAM
   quita @, URLs, espacios → deja solo el handle
   ================================================================ */
function normalizeInstagram(value) {
  if (!value) return "";
  let v = value.trim().toLowerCase();
  v = v.replace(/https?:\/\/(www\.)?instagram\.com\//, "");
  v = v.replace(/[/?#].*$/, "");   // quita todo tras / ? #
  v = v.replace(/^@+/, "");        // quita @ inicial
  v = v.replace(/\s+/g, "");       // quita espacios
  return v;
}

/* ================================================================
   4b. SUBMISSION ID + DEDUP DEL EVENTO "Lead"
   El backend (Apps Script) no devuelve un ID único de fila, así que
   generamos uno estable por sesión de formulario (persiste en
   sessionStorage, se re-crea en una pestaña/sesión nueva). Sirve como
   eventID de deduplicación en Meta y para evitar reenvíos por doble
   clic o remontajes del formulario.
   ================================================================ */
function getSubmissionId_() {
  try {
    let id = sessionStorage.getItem("inmoescala_submission_id");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      sessionStorage.setItem("inmoescala_submission_id", id);
    }
    return id;
  } catch (_) {
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }
}

function leadAlreadySent_(submissionId) {
  try {
    return sessionStorage.getItem("inmoescala_lead_sent_" + submissionId) === "1";
  } catch (_) {
    return false;
  }
}

function markLeadSent_(submissionId) {
  try { sessionStorage.setItem("inmoescala_lead_sent_" + submissionId, "1"); } catch (_) {}
}

/* ================================================================
   5. "OTRO" EN ROL → muestra input de texto
   ================================================================ */
(function rolOtro() {
  const otherInput = document.getElementById("rol_otro");
  document.querySelectorAll('input[name="rol"]').forEach((r) => {
    r.addEventListener("change", () => {
      const isOther = document.querySelector('input[name="rol"]:checked')?.value === "Otro";
      otherInput.hidden = !isOther;
      if (!isOther) otherInput.value = "";
    });
  });
})();

/* ================================================================
   6. FORMULARIO MULTI-PASO
   ================================================================ */
(function multiStep() {
  const form = document.getElementById("lead-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".form__step"));
  const bar = document.getElementById("progress-bar");
  const stepCurrent = document.getElementById("step-current");
  const stepTotal = document.getElementById("step-total");
  const status = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  let current = 0;

  if (stepTotal) stepTotal.textContent = steps.length;

  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    bar.style.width = ((i + 1) / steps.length) * 100 + "%";
    stepCurrent.textContent = i + 1;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    // enfoca el primer campo de texto del nuevo paso (mejora la experiencia)
    const firstText = steps[i].querySelector('input[type="text"], input[type="email"], input[type="tel"]');
    if (firstText) setTimeout(() => firstText.focus({ preventScroll: true }), 350);
  }

  // Valida solo los campos del paso actual
  function validateStep(i) {
    const fields = steps[i].querySelectorAll("input, textarea");
    let ok = true;
    const groupsChecked = new Set();

    fields.forEach((f) => {
      if (f.type === "radio") {
        if (groupsChecked.has(f.name)) return;
        groupsChecked.add(f.name);
        const anyChecked = steps[i].querySelector(`input[name="${f.name}"]:checked`);
        if (f.required && !anyChecked) ok = false;
      } else if (f.type === "checkbox") {
        if (f.required && !f.checked) ok = false;
      } else if (f.hidden) {
        // ignora inputs ocultos (rol_otro cuando no aplica)
      } else if (f.required && !f.value.trim()) {
        f.classList.add("invalid");
        ok = false;
      } else if (f.type === "email" && f.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) {
        f.classList.add("invalid");
        ok = false;
      } else {
        f.classList.remove("invalid");
      }
    });

    if (!ok) {
      status.textContent = "Completa los campos obligatorios para continuar.";
      status.className = "form__status error";
    } else {
      status.textContent = "";
      status.className = "form__status";
    }
    return ok;
  }

  function goNext() {
    if (current >= steps.length - 1) return;
    if (validateStep(current)) { current++; showStep(current); }
  }

  form.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", goNext);
  });
  form.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => { current--; showStep(current); });
  });

  // limpia estado "invalid" al escribir
  form.querySelectorAll("input").forEach((f) => {
    f.addEventListener("input", () => f.classList.remove("invalid"));
  });

  // Enter en un campo de texto avanza al siguiente paso (si no es el último)
  form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach((f) => {
    f.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (current < steps.length - 1) goNext();
      }
    });
  });

  // Auto-avance al elegir una opción de radio (salvo "Otro", que espera texto)
  form.querySelectorAll('.form__step input[type="radio"]').forEach((r) => {
    r.addEventListener("change", () => {
      if (r.value === "Otro") return; // deja que escriba antes de avanzar
      if (current < steps.length - 1) {
        setTimeout(goNext, 280); // pequeña pausa para ver la selección resaltada
      }
    });
  });

  /* ---------- ENVÍO ---------- */
  // isSubmitting bloquea envíos concurrentes (doble clic, Enter + clic, etc.)
  // durante TODO el intento: desde que se pulsa "Enviar" hasta que llega la
  // respuesta (éxito, error o timeout). Solo hay UNA solicitud de red por
  // intento — no hay reintento automático en paralelo ni por sendBeacon.
  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(current)) return;
    if (isSubmitting) return;
    isSubmitting = true;

    // Mismo submissionId durante todo el intento (y en un reintento posterior,
    // porque vive en sessionStorage — no se regenera hasta que haya éxito o
    // se recargue/cierre la sesión del navegador).
    const submissionId = getSubmissionId_();

    const fd = new FormData(form);
    const utms = getUTMs();
    const payload = {
      submissionId: submissionId,
      fecha: new Date().toISOString(),
      nombre: (fd.get("nombre") || "").trim(),
      whatsapp: (fd.get("whatsapp") || "").trim(),
      email: (fd.get("email") || "").trim(),
      instagram: normalizeInstagram(fd.get("instagram")),
      rol: fd.get("rol") || "",
      rol_otro: (fd.get("rol_otro") || "").trim(),
      antiguedad: fd.get("antiguedad") || "",
      reto_contenido: fd.get("reto_contenido") || "",
      interes: fd.get("interes") || "",
      inversion: fd.get("inversion") || "",
      ...utms,
      user_agent: navigator.userAgent,
      pagina: location.href,
    };

    submitBtn.disabled = true;
    status.textContent = "Enviando tu registro…";
    status.className = "form__status";

    // Evento para GTM / Pixel si se añade después
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "lead_submit", lead: { instagram: payload.instagram } });

    // Una sola solicitud, con un tiempo máximo generoso (Apps Script puede
    // tardar varios segundos, más en redes móviles). AbortController cancela
    // el fetch si se cumple el plazo, en vez de dejarlo "colgado" en segundo
    // plano — así nunca hay dos solicitudes en vuelo para el mismo intento.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.SAVE_CONFIRM_TIMEOUT_MS);

    let result = null;
    try {
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      result = await res.json();
    } catch (_) {
      result = null; // timeout (abort) o error de red
    } finally {
      clearTimeout(timeoutId);
    }

    const confirmed = !!(result && result.ok === true && result.submissionId === submissionId);

    if (confirmed) {
      try { sessionStorage.setItem("inmoescala_registrado", "1"); } catch (_) {}

      if (!leadAlreadySent_(submissionId)) {
        markLeadSent_(submissionId);
        if (typeof fbq === "function") {
          fbq("track", "Lead", {}, { eventID: `lead_${submissionId}` });
        }
      }

      status.textContent = "¡Listo! Te llevamos al grupo…";
      status.className = "form__status ok";

      // Redirección al grupo de WhatsApp — se trata como el "clic" a WhatsApp
      // porque no hay un botón intermedio en este flujo (ver gracias.html
      // para el caso en que el usuario llegue ahí manualmente).
      if (typeof fbq === "function") {
        fbq("trackCustom", "WhatsAppGroupClick", { source: "post_registration" });
      }

      // fbq envía sus peticiones de forma asíncrona (fetch/beacon internos).
      // Si navegamos de inmediato, el navegador puede cancelar esas peticiones
      // antes de que salgan. Un pequeño margen le da tiempo al pixel a
      // despachar Lead y WhatsAppGroupClick antes de abandonar la página.
      setTimeout(() => {
        window.location.href = CONFIG.WHATSAPP_GROUP;
      }, 250);
      return;
    }

    // No confirmado (falla, timeout, o respuesta inesperada): no se dispara
    // Lead, no se reintenta automáticamente ni por sendBeacon. Se informa al
    // usuario y se reactiva el botón SOLO aquí, para permitir un reintento
    // manual explícito con el mismo submissionId.
    isSubmitting = false;
    submitBtn.disabled = false;
    status.textContent = "No pudimos confirmar tu registro. Revisa tu conexión e inténtalo de nuevo.";
    status.className = "form__status error";
  });
})();

/* ================================================================
   7. POP-UP DE CONVERSIÓN — aparece a los 60s
   No se muestra si: ya se cerró antes en esta sesión, ya se registró,
   o el usuario ya está viendo el formulario (#registro visible).
   ================================================================ */
(function conversionPopup() {
  const overlay = document.getElementById("popup-overlay");
  if (!overlay) return;

  function alreadyHandled() {
    try {
      return (
        sessionStorage.getItem("inmoescala_popup_visto") === "1" ||
        sessionStorage.getItem("inmoescala_registrado") === "1"
      );
    } catch (_) {
      return false;
    }
  }

  function markHandled() {
    try { sessionStorage.setItem("inmoescala_popup_visto", "1"); } catch (_) {}
  }

  function openPopup() {
    if (alreadyHandled()) return;
    // No interrumpir si el formulario ya está a la vista
    const form = document.getElementById("registro");
    if (form) {
      const rect = form.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) return;
    }
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    markHandled();
    // el contador del pop-up estaba oculto al cargar la página; se dispara ahora
    overlay.querySelectorAll(".js-count").forEach((el) => runCounter(el));
  }

  function closePopup() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  const timer = setTimeout(openPopup, CONFIG.POPUP_DELAY_MS);

  document.getElementById("popup-close")?.addEventListener("click", closePopup);
  document.getElementById("popup-cta")?.addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closePopup();
  });

  // Si el usuario envía el formulario antes de que salga el pop-up, cancelarlo
  document.getElementById("lead-form")?.addEventListener("submit", () => {
    clearTimeout(timer);
  });
})();
