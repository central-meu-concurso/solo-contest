// Cliente de dados 100% local do Solo Contest.
// Tudo fica guardado no próprio aparelho (IndexedDB) — não precisa de internet,
// de login nem de servidor. Mantém a mesma "forma" de uso que o app já tinha:
//   localApi.entities.Nome.list / filter / get / create / update / delete / deleteMany
//   localApi.auth.me / logout
//   localApi.integrations.Core.UploadFile
import defaults from './entityDefaults.json';
import { shrinkImage, fileToDataUrl } from './images';

const DB_NAME = 'solo-contest';
const DB_VERSION = 1;
const ENTITY_NAMES = Object.keys(defaults);

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ENTITY_NAMES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run(store, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const os = tx.objectStore(store);
        let result;
        Promise.resolve(fn(os)).then((r) => { result = r; }).catch(reject);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

const reqToPromise = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

let lastStamp = 0;
function nowIso() {
  // garante datas de criação sempre crescentes (evita empate ao ordenar)
  let t = Date.now();
  if (t <= lastStamp) t = lastStamp + 1;
  lastStamp = t;
  return new Date(t).toISOString();
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  return Date.now().toString(16) + Math.random().toString(16).slice(2, 12);
}

function matches(record, query) {
  if (!query) return true;
  return Object.entries(query).every(([k, v]) => record[k] === v);
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

function makeEntity(name) {
  const all = () => run(name, 'readonly', (os) => reqToPromise(os.getAll()));
  return {
    async list(sort, limit) {
      let rows = sortRecords(await all(), sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async filter(query, sort, limit) {
      let rows = sortRecords((await all()).filter((r) => matches(r, query)), sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async get(id) {
      const row = await run(name, 'readonly', (os) => reqToPromise(os.get(id)));
      if (!row) throw new Error(`${name} não encontrado`);
      return row;
    },
    async create(data) {
      const stamp = nowIso();
      const record = {
        ...defaults[name],
        ...data,
        id: newId(),
        created_date: stamp,
        updated_date: stamp,
        created_by: 'local',
      };
      await run(name, 'readwrite', (os) => reqToPromise(os.add(record)));
      return record;
    },
    async update(id, data) {
      return run(name, 'readwrite', async (os) => {
        const current = await reqToPromise(os.get(id));
        if (!current) throw new Error(`${name} não encontrado`);
        const next = { ...current, ...data, id, updated_date: nowIso() };
        await reqToPromise(os.put(next));
        return next;
      });
    },
    async delete(id) {
      await run(name, 'readwrite', (os) => reqToPromise(os.delete(id)));
      return { success: true };
    },
    async deleteMany(query) {
      return run(name, 'readwrite', async (os) => {
        const rows = (await reqToPromise(os.getAll())).filter((r) => matches(r, query));
        for (const r of rows) await reqToPromise(os.delete(r.id));
        return { deleted: rows.length };
      });
    },
  };
}

const entities = {};
for (const name of ENTITY_NAMES) entities[name] = makeEntity(name);

const LOCAL_USER = { id: 'local-user', email: '', full_name: '', role: 'user' };

export const localApi = {
  entities,
  auth: {
    async me() {
      return LOCAL_USER;
    },
    // Sem contas: "sair" apenas volta para a tela inicial.
    logout(redirectTo) {
      if (typeof window !== 'undefined') {
        window.location.hash = '#/';
        if (redirectTo) window.location.reload();
      }
    },
  },
  integrations: {
    Core: {
      // Arquivos (fotos, backups) ficam guardados no próprio registro como data URL.
      async UploadFile({ file }) {
        return { file_url: await fileToDataUrl(await shrinkImage(file)) };
      },
    },
  },
};
