import type { DiaryScreenProps } from '../types';

export function ScratchpadView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Scratchpad tools will live here in PR2.</p>
    </section>
  );
}
