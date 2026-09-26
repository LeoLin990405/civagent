// One source of truth for tab names. Chinese first (the product's court
// metaphor), English kept as a small secondary label for non-Chinese readers.
export interface TabTitle { zh: string; en: string }

export const TAB_TITLES: Record<string, TabTitle> = {
  overview: { zh: '朝堂总览', en: 'Empire Overview' },
  launch: { zh: '发起锦标赛', en: 'Tournament Launcher' },
  regimes: { zh: '制度图鉴', en: 'Regime Browser' },
  analytics: { zh: '数据分析', en: 'Analytics' },
  memory: { zh: '情节记忆', en: 'Episodic Memory' },
  editor: { zh: '制度编辑', en: 'Regime Editor' },
  skills: { zh: '技能库', en: 'Skill Library' },
  veto: { zh: '宪制监察', en: 'Constitution Monitor' },
  archive: { zh: '对局档案', en: 'Match Archive' },
  live: { zh: '实时朝堂', en: 'Live Court' },
  rankings: { zh: '跨赛排名', en: 'Cross-Tournament Rankings' },
};
