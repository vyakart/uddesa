import type { DiaryScreenProps } from '../types';

export function JournalView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Journal preset powered by Tiptap ships in PR4.</p>
    </section>
  );
}
