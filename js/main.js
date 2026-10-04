/* =========================================================
   CONFIGURACIÓN: cambia estas rutas por tus propios archivos
   ========================================================= */
const IMAGENES = [
  { src: "images/foto1.jpg", titulo: "Amanecer" },
  { src: "images/foto2.jpg", titulo: "Océano" },
  { src: "images/foto3.jpg", titulo: "Bosque" },
  { src: "images/foto4.jpg", titulo: "Atardecer" }
];

const VIDEOS = [
  { src: "videos/testimonio1.mp4", titulo: "Testimonio de María" },
  { src: "videos/testimonio2.mp4", titulo: "Testimonio de Carlos" },
  { src: "videos/testimonio3.mp4", titulo: "Testimonio de Ana" },
  { src: "videos/testimonio4.mp4", titulo: "Testimonio de Luis" }
];

const INTERVALO_MS = 4500; // tiempo entre imágenes

/* =========================================================
   ANALÍTICA (Google Analytics 4)
   Envía eventos personalizados. Si gtag no está disponible
   (ej. estás probando el archivo localmente sin conexión),
   los eventos simplemente se ignoran sin romper la página.
   ========================================================= */
const analitica = {
  evento(nombre, params = {}) {
    if (typeof gtag === "function") gtag("event", nombre, params);
  }
};

/* Clic en enlaces del menú: ¿desde qué sección navegan? */
document.querySelectorAll("[data-track]").forEach(el => {
  el.addEventListener("click", () => {
    analitica.evento("menu_click", { enlace: el.dataset.track, texto: el.textContent.trim() });
  });
});

/* Clic en flechas y puntos de un carrusel */
function trackearControles(contenedor, nombreCarrusel) {
  contenedor.querySelectorAll(".prev, .next, .dots button").forEach(btn => {
    btn.addEventListener("click", () => {
      const tipo = btn.classList.contains("prev") ? "anterior"
                 : btn.classList.contains("next") ? "siguiente"
                 : "punto-" + (Array.from(btn.parentElement.children).indexOf(btn) + 1);
      analitica.evento("carrusel_click", { carrusel: nombreCarrusel, control: tipo });
    });
  });
}

/* Video más visto: registra inicio, hitos de progreso (25/50/75/100%) y fin */
function trackearVideo(video, titulo, carrusel) {
  const hitos = new Set();
  video.addEventListener("play", () => {
    analitica.evento("video_inicio", { video: titulo, carrusel });
  });
  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    const pct = Math.floor((video.currentTime / video.duration) * 100);
    [25, 50, 75].forEach(h => {
      if (pct >= h && !hitos.has(h)) {
        hitos.add(h);
        analitica.evento("video_progreso", { video: titulo, carrusel, porcentaje: h });
      }
    });
  });
  video.addEventListener("ended", () => {
    analitica.evento("video_completo", { video: titulo, carrusel });
  });
}

/* Momento de mayor atención: cuánto tiempo pasa cada sección visible en pantalla */
function trackearAtencionPorSeccion() {
  const secciones = document.querySelectorAll("main section, header");
  const entrada = new Map();

  const observer = new IntersectionObserver(cambios => {
    cambios.forEach(c => {
      const id = c.target.id || "inicio";
      if (c.isIntersecting && c.intersectionRatio >= 0.5) {
        entrada.set(id, performance.now());
      } else if (entrada.has(id)) {
        const segundos = Math.round((performance.now() - entrada.get(id)) / 1000);
        entrada.delete(id);
        if (segundos >= 1) {
          analitica.evento("atencion_seccion", { seccion: id, segundos });
        }
      }
    });
  }, { threshold: [0, 0.5] });

  secciones.forEach(s => observer.observe(s));

  // Registra el tiempo de la sección en la que el usuario estaba al salir/cerrar la pestaña
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    entrada.forEach((inicio, id) => {
      const segundos = Math.round((performance.now() - inicio) / 1000);
      if (segundos >= 1) analitica.evento("atencion_seccion", { seccion: id, segundos });
    });
  });
}

/* =========================================================
   MODAL: muestra el video testimonial centrado en pantalla
   ========================================================= */
const modal = document.getElementById("videoModal");
const modalVideo = document.getElementById("modalVideo");
const modalTitulo = document.getElementById("modalTitulo");
let modalHitos = new Set();
let modalTituloActual = "";

function abrirModalVideo(src, titulo) {
  modalTituloActual = titulo;
  modalHitos = new Set();
  modalVideo.src = src;
  modalTitulo.textContent = titulo;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modalVideo.play().catch(() => {}); // algunos navegadores bloquean el autoplay con sonido
  analitica.evento("carrusel_click", { carrusel: "testimonios", control: "abrir-video", video: titulo });
}

function cerrarModalVideo() {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.getElementById("modalClose").onclick = cerrarModalVideo;
modal.addEventListener("click", e => { if (e.target === modal) cerrarModalVideo(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) cerrarModalVideo(); });

/* Analítica del video dentro del modal: inicio, progreso y fin */
modalVideo.addEventListener("play", () => {
  analitica.evento("video_inicio", { video: modalTituloActual, carrusel: "testimonios" });
});
modalVideo.addEventListener("timeupdate", () => {
  if (!modalVideo.duration) return;
  const pct = Math.floor((modalVideo.currentTime / modalVideo.duration) * 100);
  [25, 50, 75].forEach(h => {
    if (pct >= h && !modalHitos.has(h)) {
      modalHitos.add(h);
      analitica.evento("video_progreso", { video: modalTituloActual, carrusel: "testimonios", porcentaje: h });
    }
  });
});
modalVideo.addEventListener("ended", () => {
  analitica.evento("video_completo", { video: modalTituloActual, carrusel: "testimonios" });
});

/* Imagen de respaldo si el archivo no existe */
function respaldo(texto) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#bfeafd"/><stop offset="1" stop-color="#6cc3ea"/>
    </linearGradient></defs>
    <rect width="1600" height="800" fill="url(#g)"/>
    <text x="800" y="410" fill="#2b3a45" font-size="64" font-family="sans-serif" text-anchor="middle">${texto}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* =========================================================
   CARRUSEL 1: imágenes con efecto fade
   ========================================================= */
const fade = document.getElementById("fade");
const dots = document.getElementById("dots");
let actual = 0;
let timer;

IMAGENES.forEach((im, i) => {
  const slide = document.createElement("div");
  slide.className = "slide" + (i === 0 ? " on" : "");

  const img = document.createElement("img");
  img.alt = im.titulo;
  img.src = im.src;
  img.onerror = () => { img.onerror = null; img.src = respaldo(im.titulo); };

  const cap = document.createElement("div");
  cap.className = "cap";
  cap.textContent = im.titulo;

  slide.append(img, cap);
  fade.insertBefore(slide, dots);

  const punto = document.createElement("button");
  punto.setAttribute("aria-label", "Ir a imagen " + (i + 1));
  if (i === 0) punto.className = "on";
  punto.onclick = () => { ir(i); reiniciar(); };
  dots.appendChild(punto);
});

const slides = fade.querySelectorAll(".slide");
const puntos = dots.children;

function ir(n) {
  slides[actual].classList.remove("on");
  puntos[actual].classList.remove("on");
  actual = (n + slides.length) % slides.length;
  slides[actual].classList.add("on");
  puntos[actual].classList.add("on");
}

function reiniciar() {
  clearInterval(timer);
  timer = setInterval(() => ir(actual + 1), INTERVALO_MS);
}

fade.querySelector(".prev").onclick = () => { ir(actual - 1); reiniciar(); };
fade.querySelector(".next").onclick = () => { ir(actual + 1); reiniciar(); };
fade.addEventListener("mouseenter", () => clearInterval(timer));
fade.addEventListener("mouseleave", reiniciar);
reiniciar();
trackearControles(fade.parentElement, "momentos-del-evento");

/* =========================================================
   CARRUSELES DE VIDEO (reutilizable)
   ========================================================= */
function tarjetaVacia(card, mensaje) {
  const ph = document.createElement("div");
  ph.className = "ph";
  ph.innerHTML = `<div><b>▶</b>${mensaje}</div>`;
  card.querySelector("video").replaceWith(ph);
}

/**
 * Crea un carrusel de video dentro de `track`.
 * opciones.loop = true  -> video ambiental: autoplay, silenciado, en bucle, sin controles
 * opciones.loop = false -> video testimonial: la tarjeta muestra el video, y al
 *                          hacer clic se abre centrado en pantalla (modal)
 */
function construirCarruselVideo(track, lista, opciones = {}) {
  const loop = !!opciones.loop;

  lista.forEach(v => {
    const card = document.createElement("div");
    card.className = "vcard";

    const video = document.createElement("video");
    video.preload = loop ? "auto" : "metadata";
    video.playsInline = true;
    video.src = v.src;
    video.addEventListener("error", () => tarjetaVacia(card, loop ? "No se encontró el video ambiental" : "No se encontró el video"));

    if (loop) {
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.controls = false;
      const badge = document.createElement("span");
      badge.className = "loop-badge";
      badge.textContent = "En bucle";
      card.appendChild(badge);
      trackearVideo(video, v.titulo, opciones.nombreCarrusel || "videos");
    } else {
      // La tarjeta sigue mostrando el video (primer cuadro como vista previa),
      // pero no se reproduce ahí: el clic abre el modal centrado en pantalla.
      video.controls = false;
      video.muted = true;
      card.classList.add("vcard-clickable");

      const playIcon = document.createElement("span");
      playIcon.className = "play-icon";
      playIcon.setAttribute("aria-hidden", "true");
      playIcon.textContent = "▶";
      card.appendChild(playIcon);

      card.addEventListener("click", () => abrirModalVideo(v.src, v.titulo));
    }

    const titulo = document.createElement("h3");
    titulo.textContent = v.titulo;

    card.append(video, titulo);
    track.appendChild(card);
  });

  const paso = () => track.querySelector(".vcard").offsetWidth + 16;
  return paso;
}

/* Carrusel de testimonios (con controles) */
const vtrack = document.getElementById("vtrack");
const pasoTestimonios = construirCarruselVideo(vtrack, VIDEOS, { loop: false, nombreCarrusel: "testimonios" });
document.getElementById("vprev").onclick = () => vtrack.scrollBy({ left: -pasoTestimonios() });
document.getElementById("vnext").onclick = () => vtrack.scrollBy({ left: pasoTestimonios() });
trackearControles(document.getElementById("videos"), "testimonios");

/* Activar medición de atención por sección */
trackearAtencionPorSeccion();
