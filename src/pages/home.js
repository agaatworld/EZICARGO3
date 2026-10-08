import { html, raw } from '../core/html.js';
import { t, tl, ago } from '../core/i18n.js';
import { page, on, S, money } from '../app.js';
import { transact } from '../core/store.js';
import { PRODUCTS, CATS, FACTORIES, byId } from '../domain/catalog.js';
import { storage } from '../domain/pricing.js';
import * as svc from '../domain/services.js';
import { ic } from '../ui/icons.js';
import { pcard, dealCard, artOf, countdown, seaWaves, PLANE, CHINA_ADDRESS } from '../ui/parts.js';

export function nextFlight(now = Date.now()) {
  // Air cargo cut-off: 22:00 Malaysia time (UTC+8) every day.
  const d = new Date(now), utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 14, 0, 0);
  return utc > now ? utc : utc + 864e5;
}

let cat = 'all';
page('home', {
  title: () => t('Home'),
  view() {
    const s = S(), first = s.profile.name.split(' ')[0];
    const hour = +new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
    const hi = hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
    const stored = s.parcels.filter((p) => p.state === 'stored');
    const coming = s.parcels.filter((p) => p.state === 'coming').length;
    const minDays = stored.length ? Math.min(...stored.map((p) => storage(p).daysLeft)) : null;
    const moving = s.shipments.filter((x) => x.state !== 'delivered');
    const ship = moving[0];
    const open = s.groups.filter((g) => g.state === 'open');
    const nFac = Object.keys(FACTORIES).length;
    const keep = s.recent.map(byId).filter(Boolean).slice(0, 8);
    const list = PRODUCTS.filter((p) => cat === 'all' || p.c === cat).slice(0, 12);
    const tile = (href, icn, title, sub, cls = '') => html`<a class="ft ${cls}" href="${href}"><span class="ft-ic">${ic(icn, 22)}</span><b>${title}</b><small>${sub}</small><span class="ft-go" aria-hidden="true">${ic('arrow', 15)}</span></a>`;
    return html`
    <section class="hero" aria-label="${t('Buy from China')}">
      <div class="tc-sky" aria-hidden="true"><span class="tc-plane"><i>${raw(PLANE)}</i></span></div>
      <div class="hero-top"><span class="hero-hi">${hi}, <b>${first}</b></span><button class="tc-code" data-copy="${s.profile.code}" aria-label="${t('Copy customer code')}">${s.profile.code} ${ic('copy', 12)}</button></div>
      <h1>${t('Buy direct from verified factories in China')}</h1>
      <p>${t('Factory prices, money held in escrow until inspection, and your own warehouse in Guangzhou.')}</p>
      <div class="hero-btns"><a class="btn b1" href="#shop">${ic('factory', 16)} ${t('Start buying')}</a><a class="btn b2" href="#group">${ic('group', 16)} ${t('Group deals')}</a></div>
      <div class="hero-proof"><span>${ic('shield', 13)} ${t('Escrow')}</span><span>${ic('eye', 13)} ${t('Inspection')}</span><span>${ic('box', 13)} ${t('14 days free storage')}</span></div>
      <div class="tc-sea" aria-hidden="true">${raw(seaWaves())}</div>
    </section>

    <section class="feats sec" aria-label="${t('Main services')}">
      ${tile('#shop', 'factory', t('Shop factories'), t('{n} verified factories', { n: nFac }), 'hot')}
      ${tile('#group', 'group', t('Group buy'), t('{n} deals open', { n: open.length }))}
      ${tile('#ship', 'box', t('My warehouse'), t('{n} parcels in your bay', { n: stored.length }))}
      ${tile('#track', 'pin', t('Track'), t('{n} on the way', { n: moving.length }))}
    </section>

    <section class="card whp sec" aria-label="${t('Your China warehouse')}">
      <div class="whp-h"><div><small>EZI Ship · Guangzhou</small><b>${t('Your China warehouse')}</b></div><a class="link" href="#ship">${t('Open')}</a></div>
      <div class="whp-addr"><span class="num">${CHINA_ADDRESS(s.profile.code)}</span><button class="icon-btn" data-copy="${CHINA_ADDRESS(s.profile.code)}" aria-label="${t('Copy address')}">${ic('copy', 16)}</button></div>
      <div class="whp-st">
        <a href="#ship"><b>${stored.length}</b><span>${t('in your bay')}</span></a>
        <a href="#ship"><b>${coming}</b><span>${t('on the way to China')}</span></a>
        <a href="#ship"><b>${minDays != null ? minDays : '–'}</b><span>${t('free days left')}</span></a>
        <a href="#ship/rates"><b class="num" data-end="${nextFlight()}">${countdown(nextFlight() - Date.now())}</b><span>${t('next flight closes')}</span></a>
      </div>
      <div class="whp-btns"><button class="btn primary sm" data-a="declare">${ic('plus', 15)} ${t('Declare a parcel')}</button><a class="btn ghost sm" href="#ship/rates">${ic('scale', 15)} ${t('Rates')}</a></div>
    </section>

    ${ship ? html`<a class="card journey sec" href="#track/${ship.tracking}"><div class="jr-top"><b>${ship.name}</b><span class="pill">${t(stateLabel(ship.state))}</span></div>
      <div class="jr-line" aria-hidden="true"><svg viewBox="0 0 300 30" preserveAspectRatio="none"><path class="jr-path" d="M6 22 Q150 -6 294 22" vector-effect="non-scaling-stroke"/><path class="jr-done" d="M6 22 Q150 -6 294 22" pathLength="100" stroke-dasharray="${Math.round(ship.progress * 100)} 100"/></svg><i class="jr-a"></i><i class="jr-b"></i></div>
      <div class="jr-ends"><span>Guangzhou</span><span>${ship.tracking}</span><span>${t('Port Klang')}</span></div></a>` : ''}

    <section class="sec"><div class="sec-h"><h2>${t('Group deals closing soon')}</h2><a href="#group">${t('See all')}</a></div><div class="hs">${open.slice(0, 5).map(dealCard)}</div></section>

    ${keep.length ? html`<section class="sec"><div class="sec-h"><h2>${t('Keep shopping')}</h2><button class="link" data-a="clearRecent">${t('Clear')}</button></div><div class="hs" style="grid-auto-columns:88px">${keep.map((p) => html`<a class="pc" href="#p/${p.id}"><div class="im">${artOf(p)}</div></a>`)}</div></section>` : ''}

    <section class="sec"><div class="sec-h"><h2>${t('From verified factories')}</h2><a href="#shop">${t('See all')}</a></div>
      <div class="chips" role="group" aria-label="${t('Categories')}">${CATS.slice(0, 7).map((c) => html`<button class="chip" data-a="homeCat" data-c="${c}" aria-pressed="${c === cat}">${t(catName(c))}</button>`)}</div>
      <div class="pgrid" style="margin-top:6px">${list.map(pcard)}</div></section>

    <section class="card pad sec row between" style="flex-wrap:nowrap"><span class="muted small">${t('Wallet, supplier payments and EZI Credit are in the Wallet tab.')}</span><a class="btn ghost sm" href="#wallet" style="flex-shrink:0">${ic('wallet', 15)} ${t('Wallet')}</a></section>`;
  },
});

export function catName(c) { return { all: 'All', home: 'Home & kitchen', tech: 'Phone & tech', fashion: 'Fashion', beauty: 'Beauty', bags: 'Bags', toys: 'Toys', lighting: 'Lighting', packaging: 'Packaging' }[c]; }
export function stateLabel(st) { return { packing: 'Packing', departed: 'Departed', at_sea: 'At sea', customs: 'Customs', out: 'Out for delivery', delivered: 'Delivered' }[st] || st; }

on('homeCat', (el) => { cat = el.dataset.c; transact(() => {}); });
on('clearRecent', () => transact((s) => { s.recent = []; }));
