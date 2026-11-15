// Cliente de dados na nuvem (Supabase). Mesma "forma" do localClient:
//   api.entities.Nome.list / filter / get / create / update / delete / deleteMany
//   api.auth.me
//   api.integrations.Core.UploadFile
// Tudo é gravado na tabela "records" e só a pessoa logada enxerga os próprios dados (RLS no banco).
import defaults from './entityDefaults.json';
import { supabase } from './supabase';
import { shrinkImage, fileToDataUrl } from './images';

const TABLE = 'records';
const PAGE = 1000;
const RESERVED = ['id', 'created_date', 'updated_date', 'created_by'];

const toRecord = (row) => ({ ...row.data, id: row.id, created_date: row.created_date, updated_date: row.updated_date });
const clean = (data) => Object.fromEntries(Object.entries(data || {}).filter(([k]) => !RESERVED.includes(k)));

function check({ data, error }) {
  if (error) throw new Error(error.message || 'Erro ao falar com o servidor');
  return data;
}

function sortRecords(list, sort) {
  if (!sort) return list;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...list].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    const r = av > bv ? 1 : -1;
    return desc ? -r : r;
  });
}

function base(entity, query) {
  let q = supabase.from(TABLE).select('id,data,created_date,updated_date').eq('entity', entity);
  if (query && Object.keys(query).length) q = q.contains('data', query);
  return q;
}

async function fetchAll(entity, query) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const data = check(
      await base(entity, query)
        .order('created_date', { ascending: false })
        .order('id')
        .range(from, from + PAGE - 1)
    );
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows.map(toRecord);
}

function makeEntity(name) {
  return {
    async list(sort, limit) {
      // caso mais comum: mais recentes primeiro, com limite — o servidor já devolve só o necessário
      if ((sort === '-created_date' || !sort) && limit && limit <= PAGE) {
        const data = check(await base(name).order('created_date', { ascending: false }).order('id').limit(limit));
        return data.map(toRecord);
      }
      let rows = sortRecords(await fetchAll(name), sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async filter(query, sort, limit) {
      let rows = sortRecords(await fetchAll(name, query), sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async get(id) {
      const row = check(await base(name).eq('id', id).maybeSingle());
      if (!row) throw new Error(`${name} não encontrado`);
      return toRecord(row);
    },
    async create(data) {
      const row = check(
        await supabase
          .from(TABLE)
          .insert({ entity: name, data: { ...defaults[name], ...clean(data) } })
          .select('id,data,created_date,updated_date')
          .single()
      );
      return toRecord(row);
    },
    async update(id, data) {
      const current = check(await supabase.from(TABLE).select('data').eq('id', id).eq('entity', name).maybeSingle());
      if (!current) throw new Error(`${name} não encontrado`);
      const row = check(
        await supabase
          .from(TABLE)
          .update({ data: { ...current.data, ...clean(data) } })
          .eq('id', id)
          .select('id,data,created_date,updated_date')
          .single()
      );
      return toRecord(row);
    },
    async delete(id) {
      check(await supabase.from(TABLE).delete().eq('id', id).eq('entity', name));
      return { success: true };
    },
    async deleteMany(query) {
      let q = supabase.from(TABLE).delete().eq('entity', name);
      if (query && Object.keys(query).length) q = q.contains('data', query);
      check(await q);
      return { success: true };
    },
  };
}

const entities = {};
for (const name of Object.keys(defaults)) entities[name] = makeEntity(name);

const BUCKET = 'study-images';

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2);

export const remoteApi = {
  entities,
  auth: {
    async me() {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) throw new Error('Não autenticado');
      return { id: u.id, email: u.email, full_name: u.user_metadata?.full_name || '', role: 'user' };
    },
  },
  integrations: {
    Core: {
      // Fotos vão para o armazenamento do Supabase (pasta da própria pessoa); outros arquivos (backups) viram data URL.
      async UploadFile({ file }) {
        if (file.type?.startsWith('image/')) {
          const small = await shrinkImage(file);
          const { data: u } = await supabase.auth.getUser();
          const path = `${u.user.id}/${newId()}.jpg`;
          const { error } = await supabase.storage.from(BUCKET).upload(path, small, { contentType: small.type || 'image/jpeg' });
          if (error) throw new Error(error.message);
          return { file_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
        }
        return { file_url: await fileToDataUrl(file) };
      },
    },
  },
};
