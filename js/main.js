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
  { src: "videos/video1.mp4", titulo: "Video 1" },
  { src: "videos/video2.mp4", titulo: "Video 2" },
  { src: "videos/video3.mp4", titulo: "Video 3" },
  { src: "videos/video4.mp4", titulo: "Video 4" }
];

const INTERVALO_MS = 4500; // tiempo entre imágenes

/* Imagen de respaldo si el archivo no existe */
function respaldo(texto) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#4c1d95"/>
    </linearGradient></defs>
    <rect width="1600" height="800" fill="url(#g)"/>
    <text x="800" y="410" fill="#fff" font-size="64" font-family="sans-serif" text-anchor="middle">${texto}</text>
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

/* =========================================================
   CARRUSEL 2: videos con desplazamiento
   ========================================================= */
const track = document.getElementById("vtrack");

function tarjetaVacia(card) {
  const ph = document.createElement("div");
  ph.className = "ph";
  ph.innerHTML = "<div><b>▶</b>No se encontró el video</div>";
  card.querySelector("video").replaceWith(ph);
}

VIDEOS.forEach(v => {
  const card = document.createElement("div");
  card.className = "vcard";

  const video = document.createElement("video");
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.src = v.src;
  video.addEventListener("error", () => tarjetaVacia(card));
  // Al reproducir uno, pausa los demás
  video.addEventListener("play", () => {
    track.querySelectorAll("video").forEach(o => { if (o !== video) o.pause(); });
  });

  const titulo = document.createElement("h3");
  titulo.textContent = v.titulo;

  card.append(video, titulo);
  track.appendChild(card);
});

const paso = () => track.querySelector(".vcard").offsetWidth + 16;
document.getElementById("vprev").onclick = () => track.scrollBy({ left: -paso() });
document.getElementById("vnext").onclick = () => track.scrollBy({ left: paso() });
