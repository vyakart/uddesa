import type { DiaryScreenProps } from '../types';

export function BlackboardView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Blackboard canvas and outline arrive in PR3.</p>
    </section>
  );
}
