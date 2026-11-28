// Pencarian global: transaksi, catatan, tugas, kontak, agenda, tujuan, tagihan, utang, daftar belanja.
const fold = (s) =>
  String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function tokenize(q) {
  return fold(q).split(/\s+/).filter(Boolean);
}

const matches = (haystack, tokens) => {
  const h = fold(haystack);
  return tokens.every((t) => h.includes(t));
};

export function searchAll(data, query, limit = 8) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const groups = [];
  const push = (id, items) => {
    if (items.length) groups.push({ id, total: items.length, items: items.slice(0, limit) });
  };

  push(
    'transactions',
    [...(data.transactions || [])]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) =>
        matches(
          [t.description, t.category, t.notes, t.paymentMethod, t.amount, String(t.amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), t.date, (t.items || []).map((i) => i.name).join(' ')].join(' '),
          tokens
        )
      )
      .map((t) => ({ kind: 'transaction', id: t.id, title: t.description || t.category, sub: `${t.date} • ${t.category}`, amount: t.amount, tx: t }))
  );
  push(
    'notes',
    (data.notes || [])
      .filter((n) => matches([n.title, n.content, n.body, n.type, (n.tags || []).join(' ')].join(' '), tokens))
      .map((n) => ({ kind: 'note', id: n.id, title: n.title || '—', sub: String(n.content || n.body || '').replace(/\s+/g, ' ').slice(0, 80), tab: 'notes' }))
  );
  push(
    'tasks',
    (data.tasks || [])
      .filter((t) => matches([t.title, t.description, t.category, t.priority].join(' '), tokens))
      .map((t) => ({ kind: 'task', id: t.id, title: t.title, sub: `${t.dueDate || ''} • ${t.status}`, task: t }))
  );
  push(
    'contacts',
    (data.contacts || [])
      .filter((c) => matches([c.name, c.handle, c.category, c.lastTopic].join(' '), tokens))
      .map((c) => ({ kind: 'contact', id: c.id, title: c.name, sub: c.handle || c.category, tab: 'crm' }))
  );
  push(
    'events',
    (data.events || [])
      .filter((e) => matches([e.title, e.location, e.notes, e.category].join(' '), tokens))
      .map((e) => ({ kind: 'event', id: e.id, title: e.title, sub: `${e.date} ${e.startTime || ''}`, event: e }))
  );
  push(
    'finance',
    [
      ...(data.subscriptions || []).filter((s) => matches([s.name, s.category, s.amount].join(' '), tokens)).map((s) => ({ kind: 'bill', id: s.id, title: s.name, sub: s.category, amount: s.amount, tab: 'subscriptions' })),
      ...(data.debts || []).filter((d) => matches([d.title, d.counterparty, d.notes].join(' '), tokens)).map((d) => ({ kind: 'debt', id: d.id, title: d.title, sub: d.counterparty, amount: d.totalAmount - d.paidAmount, tab: 'debts' })),
      ...(data.recurring || []).filter((r) => matches([r.name, r.category].join(' '), tokens)).map((r) => ({ kind: 'recurring', id: r.id, title: r.name, sub: r.category, amount: r.amount, tab: 'recurring' })),
      ...(data.templates || []).filter((r) => matches([r.name, r.description, (r.items || []).map((i) => i.name).join(' ')].join(' '), tokens)).map((r) => ({ kind: 'template', id: r.id, title: r.name, sub: r.category, amount: r.amount, tab: 'templates' })),
    ]
  );
  push(
    'growth',
    [
      ...(data.goals || []).filter((g) => matches([g.title, g.name, g.category, g.description].join(' '), tokens)).map((g) => ({ kind: 'goal', id: g.id, title: g.title || g.name, sub: g.category || '', tab: 'goals' })),
      ...(data.habits || []).filter((h) => matches([h.name, h.category].join(' '), tokens)).map((h) => ({ kind: 'habit', id: h.id, title: h.name, sub: h.category || '', tab: 'habits' })),
      ...(data.savingsGoals || []).filter((s) => matches(s.name, tokens)).map((s) => ({ kind: 'savings', id: s.id, title: s.name, sub: '', tab: 'savings' })),
    ]
  );
  push(
    'shopping',
    (data.shoppingLists || []).flatMap((l) =>
      [
        ...(matches(l.name, tokens) ? [{ kind: 'shopping', id: l.id, title: l.name, sub: '', tab: 'shopping' }] : []),
        ...(l.items || []).filter((i) => matches([i.name, i.category].join(' '), tokens)).map((i) => ({ kind: 'shopping', id: i.id, title: i.name, sub: l.name, tab: 'shopping' })),
      ]
    )
  );
  return groups;
}

// Pecah teks menjadi bagian yang cocok untuk disorot
export function highlightParts(text, query) {
  const tokens = tokenize(query);
  const s = String(text || '');
  if (!tokens.length) return [{ t: s, hit: false }];
  const folded = fold(s);
  // fold bisa mengubah panjang (jarang); bila beda, jangan sorot
  if (folded.length !== s.length) return [{ t: s, hit: false }];
  const mask = new Array(s.length).fill(false);
  tokens.forEach((tk) => {
    let i = folded.indexOf(tk);
    while (i !== -1) {
      for (let j = i; j < i + tk.length; j += 1) mask[j] = true;
      i = folded.indexOf(tk, i + tk.length);
    }
  });
  const parts = [];
  let cur = '';
  let curHit = false;
  for (let i = 0; i < s.length; i += 1) {
    if (i === 0) curHit = mask[0];
    if (mask[i] !== curHit) {
      parts.push({ t: cur, hit: curHit });
      cur = '';
      curHit = mask[i];
    }
    cur += s[i];
  }
  if (cur) parts.push({ t: cur, hit: curHit });
  return parts;
}
