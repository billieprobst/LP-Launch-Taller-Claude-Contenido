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

  // Espera antes de redirigir (ms) para que se vea el mensaje de éxito
  REDIRECT_DELAY_MS: 1200,
};

/* ================================================================
   1. AÑO EN FOOTER
   ================================================================ */
document.getElementById("year").textContent = new Date().getFullYear();

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
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(current)) return;

    const fd = new FormData(form);
    const utms = getUTMs();
    const payload = {
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
      ...utms,
      user_agent: navigator.userAgent,
      pagina: location.href,
    };

    submitBtn.disabled = true;
    status.textContent = "Guardando tu registro…";
    status.className = "form__status";

    // Evento para GTM / Pixel si se añade después
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "lead_submit", lead: { instagram: payload.instagram } });

    let saved = false;
    try {
      const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        // text/plain evita el preflight CORS con Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      saved = data && data.ok === true;
    } catch (err) {
      console.error("Error al guardar el lead:", err);
      // fallback: no perder el registro
      try {
        navigator.sendBeacon(
          CONFIG.APPS_SCRIPT_URL,
          new Blob([JSON.stringify(payload)], { type: "text/plain" })
        );
      } catch (_) {}
    }

    status.textContent = "¡Listo! Te llevamos al grupo…";
    status.className = "form__status ok";

    // Guardar en sessionStorage para gracias.html (fallback)
    try {
      sessionStorage.setItem("inmoescala_registrado", "1");
    } catch (_) {}

    setTimeout(() => {
      window.location.href = CONFIG.WHATSAPP_GROUP;
    }, CONFIG.REDIRECT_DELAY_MS);
  });
})();
