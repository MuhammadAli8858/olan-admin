import { useEffect, useMemo, useState } from 'react';
import { Save, LogOut, Plus, Trash2, RotateCcw, Box, Lightbulb, Type, Languages, Image as ImageIcon, Award, ListChecks, HelpCircle, Building2, Phone } from 'lucide-react';
import { getJson, postJson } from './lib/api.js';

const KEY_STORE = 'olan-admin-key';
const DEFAULT_LANGS = [
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: 'Oʻzbekcha' },
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
  { code: 'zh', label: '中文' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'be', label: 'Беларуская' },
];
const SOLUTION_ICONS = ['Gauge', 'CircleDot', 'SquareParking', 'TrainFront', 'BusFront', 'BadgeCheck', 'ShieldCheck', 'Factory', 'Truck'];
const BENEFIT_ICONS = ['Radar', 'Cpu', 'Shield', 'Headphones', 'BadgeCheck'];
const PROCESS_ICONS = ['Search', 'MessageSquare', 'ShoppingBag', 'Truck'];
const ABOUT_ICONS = ['ShieldCheck', 'Award', 'Factory', 'BadgeCheck'];

const inputCls = 'w-full rounded-xl border border-cyan-500/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500';
const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400';
const cardCls = 'rounded-2xl border border-cyan-500/15 bg-slate-950 p-4';

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
function isLong(value) {
  return typeof value === 'string' && (value.length > 60 || value.includes('\n'));
}
function setByPath(obj, pathArr, value) {
  let node = obj;
  for (let i = 0; i < pathArr.length - 1; i += 1) node = node[pathArr[i]];
  node[pathArr[pathArr.length - 1]] = value;
}

function ListEditor({ items, onChange, placeholder }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="space-y-2">
      {list.map((value, index) => (
        <div key={index} className="flex gap-2">
          <input
            className={inputCls}
            value={value}
            placeholder={placeholder}
            onChange={(e) => { const next = [...list]; next[index] = e.target.value; onChange(next); }}
          />
          <button type="button" onClick={() => onChange(list.filter((_, i) => i !== index))} className="shrink-0 rounded-xl border border-red-500/30 px-3 text-red-300 transition hover:bg-red-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, ''])} className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/10">
        <Plus className="h-3.5 w-3.5" /> Добавить
      </button>
    </div>
  );
}

function TranslateBtn({ onClick, busy, lang }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50">
      <Languages className="h-4 w-4" /> {busy ? 'Перевод…' : `Перевести с ${lang.toUpperCase()} на все языки`}
    </button>
  );
}

function DeleteBtn({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10">
      <Trash2 className="h-4 w-4" /> {label}
    </button>
  );
}

// ---------------- Приборы ----------------
function ProductsEditor({ content, patch, lang, onTranslate, busyId }) {
  const products = content.PRODUCTS || [];
  const categories = content.UI_TEXT?.[lang]?.catalog?.categories || content.UI_TEXT?.ru?.catalog?.categories || {};
  const catKeys = Object.keys(categories);
  const add = () => patch((c) => {
    c.PRODUCTS = c.PRODUCTS || [];
    c.PRODUCTS.unshift({ id: genId('prod'), brand: 'Новый прибор', category: [], inStock: true, price: { ru: 'По запросу' }, badge: { ru: '' }, name: { ru: 'Новый прибор' }, short: { ru: '' }, description: { ru: '' }, specs: { ru: [] }, applications: { ru: [] }, images: [] });
  });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить прибор</button>
      {products.length === 0 && <div className="text-sm text-slate-500">Приборов пока нет.</div>}
      {products.map((p, i) => (
        <details key={p.id || i} className={cardCls}>
          <summary className="flex cursor-pointer items-center justify-between">
            <span className="font-semibold text-white">{p.brand || '—'} <span className="text-slate-500">· {p.name?.[lang] || p.name?.ru || ''}</span></span>
            <span className="text-xs text-slate-500">{(p.category || []).join(', ')}</span>
          </summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (p.id || i)} onClick={() => onTranslate('PRODUCTS', i, ['name', 'short', 'description', 'price', 'badge'], ['specs', 'applications'], p.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>Бренд / модель (не переводится)</label><input className={inputCls} value={p.brand || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].brand = e.target.value; })} /></div>
            <div><label className={labelCls}>ID (латиницей, уникальный)</label><input className={inputCls} value={p.id || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].id = e.target.value; })} /></div>
            <div><label className={labelCls}>Цена ({lang})</label><input className={inputCls} value={p.price?.[lang] || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].price = { ...(c.PRODUCTS[i].price || {}), [lang]: e.target.value }; })} /></div>
            <div><label className={labelCls}>Бейдж ({lang})</label><input className={inputCls} value={p.badge?.[lang] || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].badge = { ...(c.PRODUCTS[i].badge || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Название ({lang}) — Enter для переноса</label><textarea rows={2} className={inputCls} value={p.name?.[lang] || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].name = { ...(c.PRODUCTS[i].name || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Краткое описание ({lang})</label><textarea rows={2} className={inputCls} value={p.short?.[lang] || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].short = { ...(c.PRODUCTS[i].short || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Полное описание ({lang})</label><textarea rows={3} className={inputCls} value={p.description?.[lang] || ''} onChange={(e) => patch((c) => { c.PRODUCTS[i].description = { ...(c.PRODUCTS[i].description || {}), [lang]: e.target.value }; })} /></div>
            <div><label className={labelCls}>Характеристики ({lang})</label><ListEditor items={p.specs?.[lang]} placeholder="Гарантия: 12 мес." onChange={(arr) => patch((c) => { c.PRODUCTS[i].specs = { ...(c.PRODUCTS[i].specs || {}), [lang]: arr }; })} /></div>
            <div><label className={labelCls}>Где применяется ({lang})</label><ListEditor items={p.applications?.[lang]} placeholder="Магистрали" onChange={(arr) => patch((c) => { c.PRODUCTS[i].applications = { ...(c.PRODUCTS[i].applications || {}), [lang]: arr }; })} /></div>
            <div className="md:col-span-2">
              <label className={labelCls}>Категории</label>
              <div className="flex flex-wrap gap-2">
                {catKeys.map((k) => {
                  const active = (p.category || []).includes(k);
                  return <button key={k} type="button" onClick={() => patch((c) => { const s = new Set(c.PRODUCTS[i].category || []); if (s.has(k)) s.delete(k); else s.add(k); c.PRODUCTS[i].category = [...s]; })} className={`rounded-full px-3 py-1 text-xs transition ${active ? 'bg-cyan-500 text-white' : 'border border-cyan-500/30 text-slate-300'}`}>{String(categories[k]).replace(/\n/g, ' ')}</button>;
                })}
              </div>
            </div>
            <div className="md:col-span-2"><label className={labelCls}>Картинки (/products/file.png или ссылки)</label><ListEditor items={p.images} placeholder="/products/my-device.png" onChange={(arr) => patch((c) => { c.PRODUCTS[i].images = arr; })} /></div>
            <div className="flex items-center gap-4 md:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={!!p.inStock} onChange={(e) => patch((c) => { c.PRODUCTS[i].inStock = e.target.checked; })} /> В наличии</label>
              <DeleteBtn label="Удалить прибор" onClick={() => { if (confirm('Удалить этот прибор?')) patch((c) => { c.PRODUCTS.splice(i, 1); }); }} />
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- Решения ----------------
function SolutionsEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.VIOLATION_SOLUTIONS || [];
  const categories = content.UI_TEXT?.[lang]?.catalog?.categories || content.UI_TEXT?.ru?.catalog?.categories || {};
  const catKeys = Object.keys(categories);
  const add = () => patch((c) => { c.VIOLATION_SOLUTIONS = c.VIOLATION_SOLUTIONS || []; c.VIOLATION_SOLUTIONS.unshift({ id: genId('sol'), category: catKeys[0] || 'speed', icon: 'Gauge', title: { ru: 'Новая задача' }, problem: { ru: '' }, solution: { ru: '' } }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить решение</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Решений пока нет.</div>}
      {items.map((s, i) => (
        <details key={s.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{s.title?.[lang] || s.title?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (s.id || i)} onClick={() => onTranslate('VIOLATION_SOLUTIONS', i, ['title', 'problem', 'solution'], [], s.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>ID (латиницей)</label><input className={inputCls} value={s.id || ''} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].id = e.target.value; })} /></div>
            <div><label className={labelCls}>Иконка</label><select className={inputCls} value={s.icon || 'Gauge'} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].icon = e.target.value; })}>{SOLUTION_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}</select></div>
            <div className="md:col-span-2"><label className={labelCls}>Категория (для кнопки «Подобрать комплекс»)</label><select className={inputCls} value={s.category || ''} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].category = e.target.value; })}>{catKeys.map((k) => <option key={k} value={k}>{String(categories[k]).replace(/\n/g, ' ')}</option>)}</select></div>
            <div className="md:col-span-2"><label className={labelCls}>Заголовок ({lang})</label><input className={inputCls} value={s.title?.[lang] || ''} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].title = { ...(c.VIOLATION_SOLUTIONS[i].title || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Задача ({lang})</label><textarea rows={2} className={inputCls} value={s.problem?.[lang] || ''} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].problem = { ...(c.VIOLATION_SOLUTIONS[i].problem || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Решение ({lang})</label><textarea rows={2} className={inputCls} value={s.solution?.[lang] || ''} onChange={(e) => patch((c) => { c.VIOLATION_SOLUTIONS[i].solution = { ...(c.VIOLATION_SOLUTIONS[i].solution || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><DeleteBtn label="Удалить решение" onClick={() => { if (confirm('Удалить это решение?')) patch((c) => { c.VIOLATION_SOLUTIONS.splice(i, 1); }); }} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- Проекты ----------------
function ProjectsEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.PROJECTS || [];
  const add = () => patch((c) => { c.PROJECTS = c.PROJECTS || []; c.PROJECTS.unshift({ id: genId('proj'), title: { ru: 'Новый проект' }, location: { ru: '' }, image: '' }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить проект</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Проектов пока нет.</div>}
      {items.map((p, i) => (
        <details key={p.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{p.title?.[lang] || p.title?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (p.id || i)} onClick={() => onTranslate('PROJECTS', i, ['title', 'location'], [], p.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>ID</label><input className={inputCls} value={p.id || ''} onChange={(e) => patch((c) => { c.PROJECTS[i].id = e.target.value; })} /></div>
            <div><label className={labelCls}>Картинка (/products/file.png или ссылка)</label><input className={inputCls} value={p.image || ''} onChange={(e) => patch((c) => { c.PROJECTS[i].image = e.target.value; })} /></div>
            <div><label className={labelCls}>Заголовок ({lang})</label><input className={inputCls} value={p.title?.[lang] || ''} onChange={(e) => patch((c) => { c.PROJECTS[i].title = { ...(c.PROJECTS[i].title || {}), [lang]: e.target.value }; })} /></div>
            <div><label className={labelCls}>Подпись / место ({lang})</label><input className={inputCls} value={p.location?.[lang] || ''} onChange={(e) => patch((c) => { c.PROJECTS[i].location = { ...(c.PROJECTS[i].location || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><DeleteBtn label="Удалить проект" onClick={() => { if (confirm('Удалить этот проект?')) patch((c) => { c.PROJECTS.splice(i, 1); }); }} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- Преимущества ----------------
function BenefitsEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.BENEFITS || [];
  const add = () => patch((c) => { c.BENEFITS = c.BENEFITS || []; c.BENEFITS.unshift({ id: genId('benefit'), icon: 'BadgeCheck', title: { ru: 'Новое преимущество' }, description: { ru: '' } }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить преимущество</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Пока пусто.</div>}
      {items.map((b, i) => (
        <details key={b.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{b.title?.[lang] || b.title?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (b.id || i)} onClick={() => onTranslate('BENEFITS', i, ['title', 'description'], [], b.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>Иконка</label><select className={inputCls} value={b.icon || 'BadgeCheck'} onChange={(e) => patch((c) => { c.BENEFITS[i].icon = e.target.value; })}>{BENEFIT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}</select></div>
            <div><label className={labelCls}>Заголовок ({lang})</label><input className={inputCls} value={b.title?.[lang] || ''} onChange={(e) => patch((c) => { c.BENEFITS[i].title = { ...(c.BENEFITS[i].title || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Описание ({lang})</label><textarea rows={2} className={inputCls} value={b.description?.[lang] || ''} onChange={(e) => patch((c) => { c.BENEFITS[i].description = { ...(c.BENEFITS[i].description || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><DeleteBtn label="Удалить" onClick={() => { if (confirm('Удалить?')) patch((c) => { c.BENEFITS.splice(i, 1); }); }} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- Как купить (шаги) ----------------
function ProcessEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.PROCESS_STEPS || [];
  const add = () => patch((c) => { c.PROCESS_STEPS = c.PROCESS_STEPS || []; const n = String(c.PROCESS_STEPS.length + 1).padStart(2, '0'); c.PROCESS_STEPS.push({ id: genId('step'), icon: 'Search', number: n, title: { ru: 'Новый шаг' }, description: { ru: '' } }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить шаг</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Пока пусто.</div>}
      {items.map((s, i) => (
        <details key={s.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{s.number} · {s.title?.[lang] || s.title?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (s.id || i)} onClick={() => onTranslate('PROCESS_STEPS', i, ['title', 'description'], [], s.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>Номер</label><input className={inputCls} value={s.number || ''} onChange={(e) => patch((c) => { c.PROCESS_STEPS[i].number = e.target.value; })} /></div>
            <div><label className={labelCls}>Иконка</label><select className={inputCls} value={s.icon || 'Search'} onChange={(e) => patch((c) => { c.PROCESS_STEPS[i].icon = e.target.value; })}>{PROCESS_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}</select></div>
            <div className="md:col-span-2"><label className={labelCls}>Заголовок ({lang})</label><input className={inputCls} value={s.title?.[lang] || ''} onChange={(e) => patch((c) => { c.PROCESS_STEPS[i].title = { ...(c.PROCESS_STEPS[i].title || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Описание ({lang})</label><textarea rows={2} className={inputCls} value={s.description?.[lang] || ''} onChange={(e) => patch((c) => { c.PROCESS_STEPS[i].description = { ...(c.PROCESS_STEPS[i].description || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><DeleteBtn label="Удалить шаг" onClick={() => { if (confirm('Удалить?')) patch((c) => { c.PROCESS_STEPS.splice(i, 1); }); }} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- FAQ ----------------
function FaqEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.FAQ_ITEMS || [];
  const add = () => patch((c) => { c.FAQ_ITEMS = c.FAQ_ITEMS || []; c.FAQ_ITEMS.unshift({ id: genId('faq'), question: { ru: 'Новый вопрос' }, answer: { ru: '' } }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить вопрос</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Пока пусто.</div>}
      {items.map((f, i) => (
        <details key={f.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{f.question?.[lang] || f.question?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (f.id || i)} onClick={() => onTranslate('FAQ_ITEMS', i, ['question', 'answer'], [], f.id || i)} /></div>
          <div className="mt-4 space-y-3">
            <div><label className={labelCls}>Вопрос ({lang})</label><input className={inputCls} value={f.question?.[lang] || ''} onChange={(e) => patch((c) => { c.FAQ_ITEMS[i].question = { ...(c.FAQ_ITEMS[i].question || {}), [lang]: e.target.value }; })} /></div>
            <div><label className={labelCls}>Ответ ({lang})</label><textarea rows={3} className={inputCls} value={f.answer?.[lang] || ''} onChange={(e) => patch((c) => { c.FAQ_ITEMS[i].answer = { ...(c.FAQ_ITEMS[i].answer || {}), [lang]: e.target.value }; })} /></div>
            <DeleteBtn label="Удалить вопрос" onClick={() => { if (confirm('Удалить?')) patch((c) => { c.FAQ_ITEMS.splice(i, 1); }); }} />
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- О компании (блоки) ----------------
function AboutEditor({ content, patch, lang, onTranslate, busyId }) {
  const items = content.ABOUT_FEATURES || [];
  const add = () => patch((c) => { c.ABOUT_FEATURES = c.ABOUT_FEATURES || []; c.ABOUT_FEATURES.unshift({ id: genId('feat'), icon: 'ShieldCheck', title: { ru: 'Новый блок' }, short: { ru: '' }, details: { ru: [] } }); });
  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Добавить блок</button>
      {items.length === 0 && <div className="text-sm text-slate-500">Пока пусто.</div>}
      {items.map((f, i) => (
        <details key={f.id || i} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-white">{f.title?.[lang] || f.title?.ru || '—'}</summary>
          <div className="mt-3"><TranslateBtn lang={lang} busy={busyId === (f.id || i)} onClick={() => onTranslate('ABOUT_FEATURES', i, ['title', 'short'], ['details'], f.id || i)} /></div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><label className={labelCls}>Иконка</label><select className={inputCls} value={f.icon || 'ShieldCheck'} onChange={(e) => patch((c) => { c.ABOUT_FEATURES[i].icon = e.target.value; })}>{ABOUT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}</select></div>
            <div><label className={labelCls}>Заголовок ({lang})</label><input className={inputCls} value={f.title?.[lang] || ''} onChange={(e) => patch((c) => { c.ABOUT_FEATURES[i].title = { ...(c.ABOUT_FEATURES[i].title || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Краткий текст ({lang})</label><textarea rows={2} className={inputCls} value={f.short?.[lang] || ''} onChange={(e) => patch((c) => { c.ABOUT_FEATURES[i].short = { ...(c.ABOUT_FEATURES[i].short || {}), [lang]: e.target.value }; })} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Подробности — список ({lang})</label><ListEditor items={f.details?.[lang]} placeholder="Пункт списка" onChange={(arr) => patch((c) => { c.ABOUT_FEATURES[i].details = { ...(c.ABOUT_FEATURES[i].details || {}), [lang]: arr }; })} /></div>
            <div className="md:col-span-2"><DeleteBtn label="Удалить блок" onClick={() => { if (confirm('Удалить?')) patch((c) => { c.ABOUT_FEATURES.splice(i, 1); }); }} /></div>
          </div>
        </details>
      ))}
    </div>
  );
}

// ---------------- Контакты ----------------
function ContactEditor({ content, patch, lang, onTranslateContact, busy }) {
  const ci = content.CONTACT_INFO || {};
  const setPlain = (field, value) => patch((c) => { c.CONTACT_INFO = c.CONTACT_INFO || {}; c.CONTACT_INFO[field] = value; });
  const setML = (field, value) => patch((c) => { c.CONTACT_INFO = c.CONTACT_INFO || {}; c.CONTACT_INFO[field] = { ...(c.CONTACT_INFO[field] || {}), [lang]: value }; });
  return (
    <div className={cardCls}>
      <div className="mb-3"><TranslateBtn lang={lang} busy={busy} onClick={onTranslateContact} /></div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div><label className={labelCls}>Телефон (текст)</label><input className={inputCls} value={ci.phone || ''} onChange={(e) => setPlain('phone', e.target.value)} /></div>
        <div><label className={labelCls}>Телефон (ссылка, tel:)</label><input className={inputCls} value={ci.phoneHref || ''} onChange={(e) => setPlain('phoneHref', e.target.value)} /></div>
        <div><label className={labelCls}>Email (текст)</label><input className={inputCls} value={ci.email || ''} onChange={(e) => setPlain('email', e.target.value)} /></div>
        <div><label className={labelCls}>Email (ссылка, mailto:)</label><input className={inputCls} value={ci.emailHref || ''} onChange={(e) => setPlain('emailHref', e.target.value)} /></div>
        <div><label className={labelCls}>Время работы ({lang})</label><input className={inputCls} value={ci.hours?.[lang] || ''} onChange={(e) => setML('hours', e.target.value)} /></div>
        <div><label className={labelCls}>Адрес ({lang})</label><input className={inputCls} value={ci.address?.[lang] || ''} onChange={(e) => setML('address', e.target.value)} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Карта (ссылка для встраивания, mapEmbed)</label><textarea rows={2} className={inputCls} value={ci.mapEmbed || ''} onChange={(e) => setPlain('mapEmbed', e.target.value)} /></div>
      </div>
    </div>
  );
}

// ---------------- Тексты сайта ----------------
function TextNode({ value, path, onEdit, depth }) {
  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value);
    return isLong(str)
      ? <textarea rows={2} className={inputCls} value={str} onChange={(e) => onEdit(path, e.target.value)} />
      : <input className={inputCls} value={str} onChange={(e) => onEdit(path, e.target.value)} />;
  }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2 border-l border-cyan-500/15 pl-3">
        {value.map((item, index) => (
          <div key={index}><div className="text-[11px] text-slate-500">#{index + 1}</div><TextNode value={item} path={[...path, index]} onEdit={onEdit} depth={depth + 1} /></div>
        ))}
      </div>
    );
  }
  if (value && typeof value === 'object') {
    return (
      <div className="space-y-2 border-l border-cyan-500/15 pl-3">
        {Object.keys(value).map((key) => (
          <div key={key}><label className={labelCls}>{key}</label><TextNode value={value[key]} path={[...path, key]} onEdit={onEdit} depth={depth + 1} /></div>
        ))}
      </div>
    );
  }
  return null;
}

function TextsEditor({ content, patch, lang }) {
  const root = content.UI_TEXT?.[lang];
  const onEdit = (pathArr, value) => patch((c) => { setByPath(c.UI_TEXT[lang], pathArr, value); });
  if (!root) return <div className="text-sm text-slate-500">Для языка «{lang}» текстов нет.</div>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Меняйте любой текст сайта для языка «{lang}». Разделы можно сворачивать.</p>
      {Object.keys(root).map((section) => (
        <details key={section} className={cardCls}>
          <summary className="cursor-pointer font-semibold text-cyan-300">{section}</summary>
          <div className="mt-3"><TextNode value={root[section]} path={[section]} onEdit={onEdit} depth={0} /></div>
        </details>
      ))}
    </div>
  );
}

export default function App() {
  const [key, setKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; }
  });
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [content, setContent] = useState(null);
  const [lang, setLang] = useState('ru');
  const [tab, setTab] = useState('products');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  const langs = useMemo(() => (content?.LANGUAGE_OPTIONS?.length ? content.LANGUAGE_OPTIONS : DEFAULT_LANGS), [content]);

  const patch = (fn) => setContent((prev) => { if (!prev) return prev; const next = structuredClone(prev); fn(next); return next; });

  const loadContent = async () => {
    setLoading(true); setStatus('');
    try { const data = await getJson('/api/content'); setContent(data && typeof data === 'object' ? data : {}); }
    catch (e) { setStatus(`Не удалось загрузить контент: ${e.message}`); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (key) loadContent(); /* eslint-disable-next-line */ }, [key]);

  const doLogin = async () => {
    const login = loginInput.trim();
    const password = passwordInput;
    if (!login || !password) { setAuthError('Введите логин и пароль.'); return; }
    try {
      await postJson('/api/admin/login', { login, password });
      try { localStorage.setItem(KEY_STORE, password); } catch { /* */ }
      setKey(password);
      setAuthError('');
      setPasswordInput('');
    } catch (e) {
      if (/логин|парол|401|unauthorized/i.test(e.message)) setAuthError('Неверный логин или пароль.');
      else setAuthError('Сервер недоступен. Запущен ли он? (npm run server)');
    }
  };
  const logout = () => { try { localStorage.removeItem(KEY_STORE); } catch { /* */ } setKey(''); setContent(null); };

  const save = async () => {
    if (!content) return;
    setSaving(true); setStatus('');
    try { await postJson('/api/admin/save', { key, content }); setStatus('Сохранено! Обновите страницу сайта, чтобы увидеть изменения.'); }
    catch (e) { setStatus(/ключ|401/i.test(e.message) ? 'Неверный ключ администратора.' : `Ошибка сохранения: ${e.message}`); }
    finally { setSaving(false); }
  };

  const resetContent = async () => {
    if (!confirm('Сбросить весь контент к исходному состоянию? Ваши изменения будут потеряны.')) return;
    try { await postJson('/api/admin/reset', { key }); await loadContent(); setStatus('Контент сброшен к исходному.'); }
    catch (e) { setStatus(`Ошибка сброса: ${e.message}`); }
  };

  // Перевод одной карточки с текущего языка на остальные.
  const onTranslate = async (collection, index, stringKeys, arrayKeys, itemKey) => {
    setBusyId(itemKey); setStatus('Перевод…');
    try {
      const item = content[collection][index];
      const targets = langs.map((l) => l.code).filter((c) => c !== lang);
      const texts = [];
      stringKeys.forEach((k) => texts.push((item[k] && item[k][lang]) || ''));
      arrayKeys.forEach((k) => ((item[k] && item[k][lang]) || []).forEach((v) => texts.push(v || '')));
      const { translations } = await postJson('/api/admin/translate', { key, from: lang, to: targets, texts });
      patch((c) => {
        const it = c[collection][index];
        targets.forEach((tl) => {
          const arr = translations[tl] || [];
          let p = 0;
          stringKeys.forEach((k) => { const v = arr[p]; p += 1; if (v != null && String(v).trim() !== '') { it[k] = it[k] || {}; it[k][tl] = v; } });
          arrayKeys.forEach((k) => {
            const src = (it[k] && it[k][lang]) || [];
            const out = src.map((s) => { const v = arr[p]; p += 1; return (v != null && String(v).trim() !== '') ? v : s; });
            if (src.length) { it[k] = it[k] || {}; it[k][tl] = out; }
          });
        });
      });
      setStatus('Переведено на все языки. Не забудьте «Сохранить».');
    } catch (e) { setStatus(`Ошибка перевода: ${e.message}`); }
    finally { setBusyId(''); }
  };

  const onTranslateContact = async () => {
    setBusyId('contact'); setStatus('Перевод…');
    try {
      const ci = content.CONTACT_INFO || {};
      const targets = langs.map((l) => l.code).filter((c) => c !== lang);
      const texts = [(ci.hours && ci.hours[lang]) || '', (ci.address && ci.address[lang]) || ''];
      const { translations } = await postJson('/api/admin/translate', { key, from: lang, to: targets, texts });
      patch((c) => {
        c.CONTACT_INFO = c.CONTACT_INFO || {};
        const x = c.CONTACT_INFO;
        targets.forEach((tl) => {
          const arr = translations[tl] || [];
          if (arr[0] && arr[0].trim()) { x.hours = x.hours || {}; x.hours[tl] = arr[0]; }
          if (arr[1] && arr[1].trim()) { x.address = x.address || {}; x.address[tl] = arr[1]; }
        });
      });
      setStatus('Переведено. Не забудьте «Сохранить».');
    } catch (e) { setStatus(`Ошибка перевода: ${e.message}`); }
    finally { setBusyId(''); }
  };

  if (!key) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-950 p-8 shadow-2xl">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-center text-2xl font-bold text-transparent">OLAN — Админ-панель</div>
          <p className="mt-2 text-center text-sm text-slate-400">Введите логин и пароль, чтобы редактировать сайт.</p>
          <label className="mb-1 mt-6 block text-xs font-semibold uppercase tracking-wide text-slate-400">Логин</label>
          <input type="text" autoComplete="username" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }} placeholder="Логин" className="w-full rounded-2xl border border-cyan-500/20 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" />
          <label className="mb-1 mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-400">Пароль</label>
          <input type="password" autoComplete="current-password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }} placeholder="Пароль" className="w-full rounded-2xl border border-cyan-500/20 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" />
          {authError && <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{authError}</div>}
          <button type="button" onClick={doLogin} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white">Войти</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'products', label: 'Приборы', icon: Box },
    { id: 'solutions', label: 'Решения', icon: Lightbulb },
    { id: 'projects', label: 'Проекты', icon: ImageIcon },
    { id: 'benefits', label: 'Преимущества', icon: Award },
    { id: 'process', label: 'Как купить', icon: ListChecks },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'about', label: 'О компании', icon: Building2 },
    { id: 'contact', label: 'Контакты', icon: Phone },
    { id: 'texts', label: 'Тексты сайта', icon: Type },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-cyan-500/15 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-lg font-bold text-transparent">OLAN — Админка</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Язык:</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-xl border border-cyan-500/20 bg-slate-900 px-2 py-1.5 text-sm text-white">
              {langs.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={resetContent} className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/20 px-3 py-2 text-xs text-slate-300 transition hover:text-white" title="Сбросить к исходному"><RotateCcw className="h-4 w-4" /></button>
            <button type="button" onClick={save} disabled={saving || !content} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Сохранение…' : 'Сохранить'}</button>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/20 px-3 py-2 text-xs text-slate-300 transition hover:text-white"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-5xl flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${tab === t.id ? 'bg-cyan-500 text-white' : 'border border-cyan-500/20 text-slate-300 hover:text-white'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {status && <div className="mb-4 rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{status}</div>}
        {loading && <div className="text-sm text-slate-400">Загрузка…</div>}
        {!loading && content && (
          <>
            {tab === 'products' && <ProductsEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'solutions' && <SolutionsEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'projects' && <ProjectsEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'benefits' && <BenefitsEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'process' && <ProcessEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'faq' && <FaqEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'about' && <AboutEditor content={content} patch={patch} lang={lang} onTranslate={onTranslate} busyId={busyId} />}
            {tab === 'contact' && <ContactEditor content={content} patch={patch} lang={lang} onTranslateContact={onTranslateContact} busy={busyId === 'contact'} />}
            {tab === 'texts' && <TextsEditor content={content} patch={patch} lang={lang} />}
          </>
        )}
        <div className="mt-8 text-center text-xs text-slate-600">Не забудьте нажать «Сохранить». Изменения появятся на сайте после обновления страницы.</div>
      </main>
    </div>
  );
}
