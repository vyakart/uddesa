import type { DiaryScreenProps } from '../types';

export function AcademicView({ diary }: DiaryScreenProps) {
  return (
    <section className="diary-placeholder">
      <h2>{diary.title}</h2>
      <p>Academic writing tools with math and citations will be covered in PR7.</p>
    </section>
  );
}
