import { renderCanvas } from './cover.js';

const $ = (id) => document.getElementById(id);
const SIZES = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080] };

const state = {
  images: [null, null, null, null],
  title: 'VICE CITY',
  subtitle: 'One city. Every hustle.',
  style: 'sunset',
  layout: 3,
  captionColor: '#ffffff',
  captionScale: 1,
  zoom: 1,
  ox: 0,
  oy: 0,
  sizeKey: 'square',
};

function currentOpts(width, height) {
  const zooms = [state.zoom, state.zoom, state.zoom, state.zoom];
  const oxs = [state.ox, state.ox, state.ox, state.ox];
  const oys = [state.oy, state.oy, state.oy, state.oy];
  return {
    width, height,
    images: state.images,
    title: state.title,
    subtitle: state.subtitle,
    style: state.style,
    layout: state.layout,
    captionColor: state.captionColor,
    captionScale: state.captionScale,
    zoom: zooms, ox: oxs, oy: oys,
  };
}

function renderPreview() {
  const [w, h] = SIZES[state.sizeKey];
  const scale = 640 / Math.max(w, h);
  const canvas = $('preview');
  renderCanvas(canvas, currentOpts(Math.round(w * scale), Math.round(h * scale)));
}

function loadImage(src, slot) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      state.images[slot] = img;
      renderPreview();
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function readStateFromControls() {
  state.title = $('titleInput').value || 'VICE CITY';
  state.subtitle = $('subtitleInput').value || '';
  state.style = $('styleSelect').value;
  state.layout = Number($('layoutSelect').value);
  state.captionColor = $('colorInput').value;
  state.captionScale = Number($('captionSizeInput').value) / 100;
  state.zoom = Number($('zoomInput').value);
  state.ox = Number($('xInput').value);
  state.oy = Number($('yInput').value);
  state.sizeKey = $('sizeSelect').value;
}

function bind() {
  ['titleInput', 'subtitleInput', 'styleSelect', 'layoutSelect', 'colorInput',
   'captionSizeInput', 'zoomInput', 'xInput', 'yInput', 'sizeSelect'].forEach((id) => {
    $(id).addEventListener('input', () => { readStateFromControls(); renderPreview(); });
    $(id).addEventListener('change', () => { readStateFromControls(); renderPreview(); });
  });
  $('photoInput').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        for (let i = 0; i < 4; i++) state.images[i] = img;
        renderPreview();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  $('exportBtn').addEventListener('click', () => {
    readStateFromControls();
    const [w, h] = SIZES[state.sizeKey];
    const off = document.createElement('canvas');
    renderCanvas(off, currentOpts(w, h));
    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gta6-cover.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'cover') {
    document.body.classList.add('cover-only');
    const canvas = $('preview');
    const coverSize = params.get('size') === 'portrait' ? SIZES.portrait : SIZES.wide;
    const [w, h] = coverSize;
    await loadImage('samples/pier.jpg', 0);
    state.images[1] = state.images[0];
    state.images[2] = state.images[0];
    state.images[3] = state.images[0];
    renderCanvas(canvas, currentOpts(w, h));
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    return;
  }
  bind();
  readStateFromControls();
  await loadImage('samples/pier.jpg', 0);
  state.images[1] = state.images[0];
  state.images[2] = state.images[0];
  state.images[3] = state.images[0];
  renderPreview();
}

init();
