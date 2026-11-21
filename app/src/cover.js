// GTA-style multi-panel cover renderer. Pure canvas, no network, no fonts to load.
export const STYLES = {
  sunset: { sky: ['#ff9a3d', '#ff5e78', '#7b2fbe'], tint: 'rgba(255,110,60,0.22)', band: '#12041f' },
  neon: { sky: ['#00e5ff', '#ff2fb3', '#5a1bff'], tint: 'rgba(0,229,255,0.20)', band: '#05001a' },
  night: { sky: ['#2b3a67', '#101528', '#000000'], tint: 'rgba(40,60,160,0.25)', band: '#02030a' },
};

function fitImage(ctx, img, x, y, w, h, zoom, ox, oy) {
  if (!img) {
    ctx.fillStyle = '#2a1a33';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function panelsFor(layout, W, H, gap) {
  if (layout === 1) return [{ x: 0, y: 0, w: W, h: H }];
  if (layout === 2) {
    const w = (W - gap) / 2;
    return [{ x: 0, y: 0, w, h: H }, { x: w + gap, y: 0, w, h: H }];
  }
  if (layout === 3) {
    const top = Math.round(H * 0.58);
    const w = (W - gap) / 2;
    return [
      { x: 0, y: 0, w: W, h: top },
      { x: 0, y: top + gap, w, h: H - top - gap },
      { x: w + gap, y: top + gap, w, h: H - top - gap },
    ];
  }
  const w = (W - gap) / 2;
  const h = (H - gap) / 2;
  return [
    { x: 0, y: 0, w, h },
    { x: w + gap, y: 0, w, h },
    { x: 0, y: h + gap, w, h },
    { x: w + gap, y: h + gap, w, h },
  ];
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? line + ' ' + word : word;
    if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawCover(ctx, W, H, opts) {
  const style = STYLES[opts.style] || STYLES.sunset;
  const gap = Math.max(4, Math.round(W / 180));
  const panels = panelsFor(opts.layout || 3, W, H, gap);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const images = opts.images || [];
  panels.forEach((p, i) => {
    const img = images[i] || images[0] || null;
    const zoom = (opts.zoom && opts.zoom[i]) || 1;
    const ox = (opts.ox && opts.ox[i]) || 0;
    const oy = (opts.oy && opts.oy[i]) || 0;
    fitImage(ctx, img, p.x, p.y, p.w, p.h, zoom, ox, oy);
    ctx.fillStyle = style.tint;
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });
  // Sunset sun disc, top right of the first panel.
  const sunR = W * 0.09;
  const sunX = W - sunR * 1.6;
  const sunY = H * 0.16;
  const grad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunR * 2.2);
  grad.addColorStop(0, style.sky[0]);
  grad.addColorStop(0.55, style.sky[1]);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Diagonal colour grade over the whole poster.
  const grade = ctx.createLinearGradient(0, 0, W, H);
  grade.addColorStop(0, style.sky[0] + '33');
  grade.addColorStop(0.5, 'rgba(0,0,0,0)');
  grade.addColorStop(1, style.sky[2] + '55');
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, W, H);
  // Caption band.
  const bandH = Math.round(H * 0.20);
  const bandY = H - bandH;
  ctx.fillStyle = style.band;
  ctx.globalAlpha = 0.88;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.globalAlpha = 1;
  ctx.fillStyle = style.sky[0];
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  // Title lettering.
  const title = (opts.title || 'VICE CITY').toUpperCase();
  const scale = opts.captionScale || 1;
  let size = Math.round(H * 0.105 * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (s) => { ctx.font = `900 ${s}px Impact, 'Arial Black', sans-serif`; };
  setFont(size);
  while (ctx.measureText(title).width > W * 0.92 && size > 12) {
    size -= 2;
    setFont(size);
  }
  const titleY = bandY + bandH * 0.38;
  ctx.lineWidth = Math.max(3, size / 9);
  ctx.strokeStyle = '#000';
  ctx.strokeText(title, W / 2, titleY);
  ctx.fillStyle = opts.captionColor || '#ffffff';
  ctx.fillText(title, W / 2, titleY);
  // Subtitle.
  const sub = (opts.subtitle || '').toUpperCase();
  if (sub) {
    const subSize = Math.max(12, Math.round(H * 0.028));
    ctx.font = `700 ${subSize}px 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffd9a0';
    const lines = wrapText(ctx, sub, W * 0.9);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, W / 2, bandY + bandH * 0.72 + i * subSize * 1.25);
    });
  }
  return ctx;
}

export function renderCanvas(canvas, opts) {
  const W = opts.width;
  const H = opts.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, W, H, opts);
  return canvas;
}
