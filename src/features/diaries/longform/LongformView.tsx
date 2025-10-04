import type { DiaryScreenProps } from '../types';

export function LongformView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Longform editor with outlines and footnotes is planned for PR6.</p>
    </section>
  );
}
