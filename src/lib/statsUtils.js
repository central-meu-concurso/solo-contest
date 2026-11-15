// Cálculos da aba Estatísticas. Tudo é derivado dos registros reais
// (StudySession = estudo de conteúdo, ReviewLog = tempo de revisão). Nada é gravado aqui.
// Datas são textos "AAAA-MM-DD" (como o app já grava) e meses "AAAA-MM".

const num = (v) => Number(v) || 0;
export const minutesOf = (r) => num(r?.duration_minutes);
export const monthKey = (d) => (d || '').slice(0, 7);

const blank = () => ({ today: 0, month: 0, total: 0, rToday: 0, rMonth: 0, rTotal: 0, sessions: 0 });

function addTo(bucket, date, mins, isReview, today) {
  const t = isReview ? 'rTotal' : 'total';
  const d = isReview ? 'rToday' : 'today';
  const m = isReview ? 'rMonth' : 'month';
  bucket[t] += mins;
  if (date === today) bucket[d] += mins;
  if (monthKey(date) === monthKey(today)) bucket[m] += mins;
  if (!isReview) bucket.sessions += 1;
}

// Agrupa tempo por matéria e por assunto (hoje / mês atual / total), estudo e revisão separados.
export function aggregate({ sessions, reviewLogs, subjects, topics, today }) {
  const bySubject = new Map();
  subjects.forEach((s) => {
    bySubject.set(s.id, { ...blank(), id: s.id, name: s.name, plan_id: s.plan_id, topics: new Map(), loose: blank() });
  });
  topics.forEach((t) => {
    const sub = bySubject.get(t.subject_id);
    if (sub) sub.topics.set(t.id, { ...blank(), id: t.id, name: t.name });
  });
  const unknown = { ...blank(), id: '__none', name: 'Sem matéria', topics: new Map(), loose: blank() };

  const place = (rec, isReview) => {
    const mins = minutesOf(rec);
    const sub = bySubject.get(rec.subject_id) || (rec.subject_id ? null : unknown);
    const target = sub || unknown;
    addTo(target, rec.date, mins, isReview, today);
    const top = rec.topic_id && target.topics.get(rec.topic_id);
    addTo(top || target.loose, rec.date, mins, isReview, today);
  };
  sessions.forEach((s) => place(s, false));
  reviewLogs.forEach((r) => place(r, true));

  const list = [...bySubject.values()];
  const hasUnknown = unknown.total > 0 || unknown.rTotal > 0;

  const kpis = { studyToday: 0, studyMonth: 0, studyTotal: 0, reviewToday: 0, reviewMonth: 0, reviewTotal: 0, sessionCount: 0, reviewCount: reviewLogs.length };
  sessions.forEach((s) => {
    const m = minutesOf(s);
    kpis.studyTotal += m;
    if (s.date === today) kpis.studyToday += m;
    if (monthKey(s.date) === monthKey(today)) kpis.studyMonth += m;
  });
  kpis.sessionCount = sessions.length;
  reviewLogs.forEach((r) => {
    const m = minutesOf(r);
    kpis.reviewTotal += m;
    if (r.date === today) kpis.reviewToday += m;
    if (monthKey(r.date) === monthKey(today)) kpis.reviewMonth += m;
  });

  return { subjects: list, unknown: hasUnknown ? unknown : null, kpis };
}

// Tudo o que aconteceu em um dia: estudo, revisão, matérias, assuntos e cada atividade.
export function dayDetail({ sessions, reviewLogs, date }) {
  const study = sessions.filter((s) => s.date === date).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  const reviews = reviewLogs.filter((r) => r.date === date);
  const studyMin = study.reduce((a, s) => a + minutesOf(s), 0);
  const reviewMin = reviews.reduce((a, r) => a + minutesOf(r), 0);

  const subj = new Map();
  const tops = new Map();
  study.forEach((s) => {
    const sn = s.subject_name || 'Sem matéria';
    subj.set(sn, (subj.get(sn) || 0) + minutesOf(s));
    if (s.topic_name) {
      const k = `${sn}||${s.topic_name}`;
      tops.set(k, { subject: sn, topic: s.topic_name, minutes: (tops.get(k)?.minutes || 0) + minutesOf(s) });
    }
  });
  const activities = [
    ...study.map((s) => ({ id: s.id, kind: 'study', subject: s.subject_name || 'Sem matéria', topic: s.topic_name || '', start: s.start_time || '', minutes: minutesOf(s), notes: s.notes || '' })),
    ...reviews.map((r) => ({ id: r.id, kind: 'review', subject: r.subject_name || '', topic: r.topic_name || '', start: '', minutes: minutesOf(r), notes: '' })),
  ];
  return {
    studyMin,
    reviewMin,
    totalMin: studyMin + reviewMin,
    subjects: [...subj.entries()].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes),
    topics: [...tops.values()].sort((a, b) => b.minutes - a.minutes),
    activities,
  };
}

// ---- datas sem depender de fuso horário ----
const toDate = (s) => new Date(`${s}T00:00:00Z`);
export const addDays = (s, n) => {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const addMonths = (ym, n) => {
  const [y, m] = ym.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`;
};
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const monthLabel = (ym) => `${MONTHS_SHORT[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;
export const dayLabel = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export function sumByDate(list) {
  const m = {};
  list.forEach((r) => { if (r.date) m[r.date] = (m[r.date] || 0) + minutesOf(r); });
  return m;
}

// Filtro de período dos gráficos: 'day' (dia de referência), 'month' (mês de referência) ou 'total'.
export const inFilter = (date, filter, ref) => {
  if (filter === 'day') return date === ref;
  if (filter === 'month') return monthKey(date) === monthKey(ref);
  return true;
};

export function totalsBySubject({ records, subjects, filter, ref }) {
  const m = new Map(subjects.map((s) => [s.id, { id: s.id, name: s.name, minutes: 0 }]));
  const none = { id: '__none', name: 'Sem matéria', minutes: 0 };
  records.filter((r) => inFilter(r.date, filter, ref)).forEach((r) => {
    const t = m.get(r.subject_id) || none;
    t.minutes += minutesOf(r);
  });
  return [...m.values(), none].filter((x) => x.minutes > 0).sort((a, b) => b.minutes - a.minutes);
}

// Série de evolução. day = últimos 30 dias; month = últimos 12 meses; total = acumulado mês a mês desde o 1º registro.
export function evolution({ sessions, reviewLogs, filter, ref }) {
  const st = sumByDate(sessions);
  const rv = sumByDate(reviewLogs);
  if (filter === 'day') {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(ref, -i);
      out.push({ key: d, label: dayLabel(d), study: st[d] || 0, review: rv[d] || 0 });
    }
    return out;
  }
  const byMonth = {};
  const put = (date, k, v) => {
    const mk = monthKey(date);
    byMonth[mk] = byMonth[mk] || { study: 0, review: 0 };
    byMonth[mk][k] += v;
  };
  Object.entries(st).forEach(([d, v]) => put(d, 'study', v));
  Object.entries(rv).forEach(([d, v]) => put(d, 'review', v));
  const refM = monthKey(ref);
  if (filter === 'month') {
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const mk = addMonths(refM, -i);
      out.push({ key: mk, label: monthLabel(mk), study: byMonth[mk]?.study || 0, review: byMonth[mk]?.review || 0 });
    }
    return out;
  }
  const months = Object.keys(byMonth).sort();
  if (!months.length) return [];
  const out = [];
  let cs = 0;
  let cr = 0;
  for (let mk = months[0]; mk <= (months[months.length - 1] > refM ? months[months.length - 1] : refM); mk = addMonths(mk, 1)) {
    cs += byMonth[mk]?.study || 0;
    cr += byMonth[mk]?.review || 0;
    out.push({ key: mk, label: monthLabel(mk), study: cs, review: cr });
  }
  return out;
}

export const fmtHours = (min) => Math.round((min / 60) * 10) / 10;

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const weekdayName = (d) => WEEKDAYS[toDate(d).getUTCDay()];
export const monthName = (ym) => `${MONTHS_FULL[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const dayFull = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
