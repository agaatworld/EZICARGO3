// Shared building blocks used by several pages.
import { html, raw } from '../core/html.js';
import { t, tl } from '../core/i18n.js';
import { fmtCny, cnyToMyr, shortNum } from '../core/money.js';
import { factoryOf, byId } from '../domain/catalog.js';
import { lowestFen, moq } from '../domain/pricing.js';
import { groupPrice, groupProgress } from '../domain/rules.js';
import { art as drawArt } from '../domain/art.js';
import { ic } from './icons.js';
import { money } from '../app.js';

export const artOf = (p, col = 0, bg) => raw(drawArt(p, col, bg));
export const vtick = () => html`<span class="vt" title="${t('Verified by EZICARGO')}">${ic('check', 8)}</span>`;

// services: [legacy colour, legacy tint, icon, label, link]. v3 draws every service in the brand palette only.
export const SVC = Object.freeze({
  ship: ['#D98A00', '#FFF3DC', 'box', 'EZI Ship', '#ship'],
  shop: ['#D40B0B', '#FDECEC', 'factory', 'Shop', '#shop'],
  pay: ['#1E5FA8', '#E6EFFA', 'swap', 'Pay supplier', '#wallet/pay'],
  group: ['#138A4A', '#E3F4EC', 'group', 'Group buy', '#group'],
  escrow: ['#6B4FD8', '#EFEAFB', 'shield', 'Escrow', '#orders'],
  credit: ['#D9541E', '#FFEDE5', 'credit', 'EZI Credit', '#credit'],
  track: ['#0E8A86', '#E0F4F3', 'pin', 'Track', '#track'],
  help: ['#C2327A', '#FCE8F1', 'chat', 'Help', '#help'],
  factories: ['#3A3F47', '#ECEEF1', 'home', 'Factories', '#factories'],
  inspect: ['#B8912F', '#FBF3DE', 'eye', 'Inspection', '#ship'],
  rates: ['#16181C', '#ECEEF1', 'scale', 'Rates', '#ship/rates'],
  newgroup: ['#138A4A', '#E3F4EC', 'plus', 'New deal', '#group/new'],
  orders: ['#6B4FD8', '#EFEAFB', 'doc', 'My orders', '#orders'],
});

export function orb(key, i = 0, extra = '') {
  const [, , icn, label, href] = SVC[key];
  return html`<a class="orb" href="${href}" style="--i:${i}" ${raw(extra)}><span class="orb-ic"><span class="orb-core">${ic(icn, 22)}</span></span><b>${t(label)}</b></a>`;
}

export function pcard(p) {
  const f = factoryOf(p);
  return html`<a class="pc" href="#p/${p.id}"><div class="im">${artOf(p)}${f.lv === 'select' ? html`<span class="pill dark tag">EZI Select</span>` : ''}</div>
    <div class="bd"><span class="nm">${tl(p.n)}</span><span class="pr">${money(cnyToMyr(lowestFen(p)))}</span><span class="mt">${t('MOQ {n}', { n: moq(p) })} · ${shortNum(p.sold)} ${t('sold')}</span><span class="mt">${vtick()} ${f.n}</span></div></a>`;
}

export function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return d ? t('{d}d {h}h', { d, h }) : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}

export function dealCard(g) {
  const p = byId(g.pid), now = groupPrice(g.ladder, g.committed, p.t[0][1]), best = g.ladder.at(-1)[1];
  return html`<a class="deal card" href="#group/${g.id}"><div class="im">${artOf(p)}</div><div class="bd"><span class="nm">${tl(p.n)}</span>
    <div class="bar" role="progressbar" aria-valuenow="${Math.round(groupProgress(g) * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.round(groupProgress(g) * 100)}%"></i></div>
    <div class="mt"><span>${t('{a} / {b} pcs', { a: g.committed.toLocaleString('en-US'), b: g.goal.toLocaleString('en-US') })}</span><span class="cd" data-end="${g.endsAt}">${countdown(g.endsAt - Date.now())}</span></div>
    <div class="mt"><b>${fmtCny(now)} → ${fmtCny(best)}</b><span>${t('{n} shops', { n: g.shops })}</span></div></div></a>`;
}

export function stepsList(items, doneUpTo) {
  return html`<ol class="steps">${items.map((it, k) => html`<li class="${k < doneUpTo ? 'done' : k === doneUpTo ? 'now' : ''}"><i>${k < doneUpTo ? ic('check', 11) : k + 1}</i><div><b>${it[0]}</b>${it[1] ? html`<small>${it[1]}</small>` : ''}</div></li>`)}</ol>`;
}

export function boxSvg(level) {
  return html`<span class="pc-box"><svg viewBox="0 0 48 40" aria-hidden="true"><path d="M6 12l18-8 18 8v20l-18 8-18-8z" fill="#D9A15E"/><path d="M6 12l18 8 18-8M24 20v20" stroke="#9B6A33" stroke-width="1.6" fill="none"/><path d="M15 8l18 8" stroke="#F1CE98" stroke-width="3"/></svg><em>L${level}</em></span>`;
}

// live countdowns without re-rendering the page
setInterval(() => {
  document.querySelectorAll('[data-end]').forEach((el) => { el.textContent = countdown(+el.dataset.end - Date.now()); });
}, 1000);

// Seamless sea: each layer is twice the card's width and repeats exactly, so sliding it by half loops forever.
export function seaWaves() {
  const layer = (y, amp, per, fill, cls, line) => { let d = `M0 ${y}`; for (let x = 0; x < 1600; x += per) d += ` Q${x + per / 4} ${y - amp} ${x + per / 2} ${y} T${x + per} ${y}`; return `<svg class="${cls}" viewBox="0 0 1600 24" preserveAspectRatio="none" aria-hidden="true"><path d="${d} V24 H0Z" fill="${fill}"/>${line ? `<path d="${d}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>` : ''}</svg>`; };
  return layer(10, 5, 100, 'rgba(255,255,255,.12)', 'w1', false) + layer(14, 4, 80, 'rgba(255,255,255,.2)', 'w2', true);
}
export const PLANE = '<svg viewBox="-9 -6 18 12"><path d="M8 0 2.3 -1.3 -.9 -5.8 -2.9 -5.8 -1.4 -1.3 -5.2 -1.3 -6.9 -3.5 -8.4 -3.5 -7.2 0 -8.4 3.5 -6.9 3.5 -5.2 1.3 -1.4 1.3 -2.9 5.8 -.9 5.8 2.3 1.3Z"/></svg>';
export const CHINA_ADDRESS = (code) => `广东省广州市白云区太和镇 EZICARGO 国际仓 B2-18 收件人: ${code}`;
