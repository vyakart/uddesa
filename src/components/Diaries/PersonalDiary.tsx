import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { db } from '../../db/db';
import './PersonalDiary.css';

export const PersonalDiary: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLocked, setIsLocked] = useState(true);
  const [passkey, setPasskey] = useState('');
  const [showUnlock, setShowUnlock] = useState(false);

  const extensions = React.useMemo(() => [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Dear Diary...',
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content: '',
    onUpdate: ({ editor }) => {
      save(editor.getHTML());
    },
  }, []);

  // Load content for date
  useEffect(() => {
    if (!editor) return;

    // Simple key: diaryId-date
    db.entries.where('diaryId').equals('2').toArray().then(entries => {
      // Find entry for this date
      // We need a better schema for date-based retrieval, but let's stick to simple for MVP
      // We'll store date in the title for now or a separate field if we changed schema
      // Let's assume we store it in title
      const entry = entries.find(e => e.content.title === date);
      if (entry) {
        editor.commands.setContent(entry.content.body);
      } else {
        editor.commands.setContent('');
      }
    });
  }, [date, editor]);

  const save = async (body: string) => {
    // We need to find the existing entry for this date to update it, or create new
    const entries = await db.entries.where('diaryId').equals('2').toArray();
    const existing = entries.find(e => e.content.title === date);

    if (existing && existing.id) {
      await db.entries.update(existing.id, {
        content: { title: date, body },
        updatedAt: Date.now()
      });
    } else {
      await db.entries.put({
        diaryId: '2',
        content: { title: date, body },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  };

  const toggleLock = () => {
    if (isLocked) {
      setShowUnlock(true);
    } else {
      const newPass = prompt('Set a passkey to lock:');
      if (newPass) {
        setPasskey(newPass);
        setIsLocked(true);
      }
    }
  };

  const handleUnlock = (inputPass: string) => {
    if (inputPass === passkey) {
      setIsLocked(false);
      setShowUnlock(false);
    } else {
      alert('Incorrect passkey');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editor) save(editor.getHTML());
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setIsLocked(true);
      }
      if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, navigate]);

  if (isLocked) {
    return (
      <div className="personal-diary-locked">
        <div className="lock-screen">
          <h2>Personal Diary</h2>
          <p>This diary is locked.</p>
          {showUnlock ? (
            <div className="unlock-form">
              <input
                type="password"
                placeholder="Enter Passkey"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock(e.currentTarget.value);
                }}
                autoFocus
              />
              <button onClick={() => setShowUnlock(false)}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowUnlock(true)}>Unlock</button>
          )}
          <button className="back-btn" onClick={() => navigate('/')}>← Back to Shelf</button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-diary-container">
      <div className="personal-diary-nav">
        <button onClick={() => navigate('/')}>← Shelf</button>
        <div className="date-picker">
          <button onClick={() => {
            const d = new Date(date);
            d.setDate(d.getDate() - 1);
            setDate(d.toISOString().split('T')[0]);
          }}>←</button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={() => {
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            setDate(d.toISOString().split('T')[0]);
          }}>→</button>
        </div>
        <button onClick={toggleLock}>Lock</button>
      </div>

      <div className="personal-diary-paper">
        <div className="diary-header">
          <h1>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
