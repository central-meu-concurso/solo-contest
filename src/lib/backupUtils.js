import { api } from '@/api/client';

const ENTITIES = [
  'StudyPlan',
  'Subject',
  'Topic',
  'StudySession',
  'Review',
  'ReviewLog',
  'QuestionLog',
  'StudyMaterial',
  'UserStats',
];

// Coleta todos os dados do usuário logado (RLS garante que só vê os próprios)
export async function buildUserSnapshot() {
  const data = {};
  let total = 0;
  for (const name of ENTITIES) {
    const records = await api.entities[name].list('-created_date', 10000);
    data[name] = records;
    total += records.length;
  }
  return { data, total };
}

// Recria os registros a partir de um snapshot, remapeando IDs para manter as relações
export async function restoreSnapshot(snap) {
  const e = api.entities;
  const idMaps = { StudyPlan: {}, Subject: {}, Topic: {} };

  for (const p of snap.StudyPlan || []) {
    const { id, created_date, updated_date, created_by_id, ...rest } = p;
    const created = await e.StudyPlan.create(rest);
    idMaps.StudyPlan[id] = created.id;
  }

  for (const s of snap.Subject || []) {
    const { id, created_date, updated_date, created_by_id, plan_id, ...rest } = s;
    const created = await e.Subject.create({ ...rest, plan_id: idMaps.StudyPlan[plan_id] || plan_id });
    idMaps.Subject[id] = created.id;
  }

  for (const t of snap.Topic || []) {
    const { id, created_date, updated_date, created_by_id, subject_id, plan_id, ...rest } = t;
    const created = await e.Topic.create({
      ...rest,
      subject_id: idMaps.Subject[subject_id] || subject_id,
      plan_id: idMaps.StudyPlan[plan_id] || plan_id,
    });
    idMaps.Topic[id] = created.id;
  }

  for (const s of snap.StudySession || []) {
    const { id, created_date, updated_date, created_by_id, plan_id, subject_id, topic_id, ...rest } = s;
    await e.StudySession.create({
      ...rest,
      plan_id: idMaps.StudyPlan[plan_id] || plan_id,
      subject_id: idMaps.Subject[subject_id] || subject_id,
      topic_id: idMaps.Topic[topic_id] || topic_id,
    });
  }

  for (const r of snap.Review || []) {
    const { id, created_date, updated_date, created_by_id, plan_id, subject_id, topic_id, session_id, ...rest } = r;
    await e.Review.create({
      ...rest,
      plan_id: idMaps.StudyPlan[plan_id] || plan_id,
      subject_id: idMaps.Subject[subject_id] || subject_id,
      topic_id: idMaps.Topic[topic_id] || topic_id,
    });
  }

  // Tempo de revisão registrado nas Estatísticas (backups antigos não têm este grupo)
  for (const r of snap.ReviewLog || []) {
    const { id, created_date, updated_date, created_by_id, plan_id, subject_id, topic_id, ...rest } = r;
    await e.ReviewLog.create({
      ...rest,
      ...(plan_id ? { plan_id: idMaps.StudyPlan[plan_id] || plan_id } : {}),
      ...(subject_id ? { subject_id: idMaps.Subject[subject_id] || subject_id } : {}),
      ...(topic_id ? { topic_id: idMaps.Topic[topic_id] || topic_id } : {}),
    });
  }

  for (const q of snap.QuestionLog || []) {
    const { id, created_date, updated_date, created_by_id, plan_id, subject_id, topic_id, ...rest } = q;
    await e.QuestionLog.create({
      ...rest,
      plan_id: idMaps.StudyPlan[plan_id] || plan_id,
      subject_id: idMaps.Subject[subject_id] || subject_id,
      topic_id: idMaps.Topic[topic_id] || topic_id,
    });
  }

  for (const m of snap.StudyMaterial || []) {
    const { id, created_date, updated_date, created_by_id, subject_id, ...rest } = m;
    await e.StudyMaterial.create({ ...rest, subject_id: idMaps.Subject[subject_id] || subject_id });
  }

  if (snap.UserStats && snap.UserStats.length > 0) {
    const { id, created_date, updated_date, created_by_id, ...rest } = snap.UserStats[0];
    const existing = await api.entities.UserStats.list('-created_date', 50);
    if (existing.length > 0) {
      await e.UserStats.update(existing[0].id, rest);
    } else {
      await e.UserStats.create(rest);
    }
  }

  return {
    plans: (snap.StudyPlan || []).length,
    subjects: (snap.Subject || []).length,
    topics: (snap.Topic || []).length,
    sessions: (snap.StudySession || []).length,
    reviews: (snap.Review || []).length,
    reviewLogs: (snap.ReviewLog || []).length,
    questions: (snap.QuestionLog || []).length,
    materials: (snap.StudyMaterial || []).length,
  };
}
