import type { DiaryScreenProps } from '../types';

export function DraftsView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Drafts editor with title and body lands in PR5.</p>
    </section>
  );
}
