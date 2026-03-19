export type StatusInfo = { label: string; color: string }

export const PROJECT_STATUS_MAP: Record<string, StatusInfo> = {
  draft: { label: '草稿', color: 'bg-zinc-100 text-zinc-600' },
  in_progress: { label: '进行中', color: 'bg-indigo-50 text-indigo-700' },
  review: { label: '审核中', color: 'bg-amber-50 text-amber-700' },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}

export const EPISODE_STATUS_MAP: Record<string, StatusInfo> = {
  planned: { label: '待编写', color: 'bg-zinc-100 text-zinc-600' },
  writing: { label: '编写中', color: 'bg-indigo-50 text-indigo-700' },
  written: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
}
