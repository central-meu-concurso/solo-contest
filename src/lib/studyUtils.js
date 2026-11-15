import moment from 'moment';
import { api } from '@/api/client';

export async function deleteSubjectCascade(subjectId, topics) {
  const subTopics = (topics || []).filter(t => t.subject_id === subjectId);
  for (const t of subTopics) {
    await api.entities.StudySession.deleteMany({ topic_id: t.id });
    await api.entities.Review.deleteMany({ topic_id: t.id });
    await api.entities.QuestionLog.deleteMany({ topic_id: t.id });
    try {
      await api.entities.Topic.delete(t.id);
    } catch (e) {
      // Topic may have already been deleted (stale state)
    }
  }
  await api.entities.StudySession.deleteMany({ subject_id: subjectId });
  await api.entities.Review.deleteMany({ subject_id: subjectId });
  await api.entities.QuestionLog.deleteMany({ subject_id: subjectId });
  try {
    await api.entities.Subject.delete(subjectId);
  } catch (e) {
    // Subject may have already been deleted (double-click / stale state)
  }
}

export function calculateMasteryIndex(topic) {
  if (!topic) return 0;

  const questionScore = Math.min((topic.total_questions || 0) / 50, 1) * 25;
  const accuracyScore = topic.total_questions > 0
    ? ((topic.total_correct || 0) / topic.total_questions) * 35
    : 0;
  const studyTimeScore = Math.min((topic.total_study_minutes || 0) / 300, 1) * 20;
  const frequencyScore = Math.min((topic.study_count || 0) / 10, 1) * 10;

  const lastStudied = topic.last_studied ? moment(topic.last_studied) : null;
  const daysSince = lastStudied ? moment().diff(lastStudied, 'days') : 999;
  const recencyScore = daysSince <= 1 ? 10 : daysSince <= 7 ? 7 : daysSince <= 15 ? 4 : daysSince <= 30 ? 2 : 0;

  return Math.round(questionScore + accuracyScore + studyTimeScore + frequencyScore + recencyScore);
}

export function getMasteryLabel(index) {
  if (index >= 91) return { label: 'Dominado', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  if (index >= 71) return { label: 'Bom domínio', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  if (index >= 41) return { label: 'Em desenvolvimento', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
  return { label: 'Precisa melhorar', color: 'text-red-400', bg: 'bg-red-500/20' };
}

export function formatStudyTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0 && minutes > 0) return `${hours}h${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
}

export function calculateLevel(xp) {
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  return { level, progress: Math.min(progress, 100), currentXp: xp, nextLevelXp };
}

export function getXpForAction(action) {
  const xpMap = {
    study_session: 10,
    review_completed: 15,
    questions_batch: 5,
  };
  return xpMap[action] || 0;
}

export function getRecommendation(topics, reviews, sessions) {
  const now = moment();

  const overdueReviews = (reviews || []).filter(r => !r.completed && moment(r.due_date).isBefore(now, 'day'));
  if (overdueReviews.length > 0) {
    const oldest = overdueReviews.sort((a, b) => moment(a.due_date).diff(moment(b.due_date)))[0];
    const daysSince = now.diff(moment(oldest.due_date), 'days');
    return {
      topic_name: oldest.topic_name,
      subject_name: oldest.subject_name,
      reason: `Revisão atrasada há ${daysSince} dia(s).`,
      type: 'review',
      review_id: oldest.id
    };
  }

  const weakTopics = (topics || [])
    .filter(t => t.total_questions > 0)
    .map(t => ({ ...t, mastery: calculateMasteryIndex(t) }))
    .filter(t => t.mastery < 70)
    .sort((a, b) => a.mastery - b.mastery);

  if (weakTopics.length > 0) {
    const w = weakTopics[0];
    const accuracy = w.total_questions > 0 ? Math.round((w.total_correct / w.total_questions) * 100) : 0;
    const lastStudied = w.last_studied ? moment(w.last_studied) : null;
    const daysSince = lastStudied ? now.diff(lastStudied, 'days') : null;
    let reason = `Seu desempenho está em ${accuracy}%`;
    if (daysSince !== null) reason += ` e a última revisão foi há ${daysSince} dia(s).`;
    else reason += '.';
    return { topic_name: w.name, subject_name: '', reason, type: 'study', topic_id: w.id };
  }

  return null;
}
