import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { db } from '../../db/db';
import { useLock } from '../../hooks/useLock';
import './Drafts.css';

export const Drafts: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [font, setFont] = useState('Inter');
    const { isLocked, showUnlock, hasPasskey, setShowUnlock, setPasskey, unlock } = useLock('3');

    const extensions = React.useMemo(() => [
        StarterKit,
        Placeholder.configure({
            placeholder: 'Start drafting...',
        }),
        TextStyle,
        FontFamily,
    ], []);

    const editor = useEditor({
        extensions,
        content: '',
        onUpdate: ({ editor }) => {
            save(editor.getHTML());
        },
    }, []);

    useEffect(() => {
        if (!editor) return;

        db.entries.where('diaryId').equals('3').last().then(entry => {
            if (entry && entry.content) {
                editor.commands.setContent(entry.content.body);
                setTitle(entry.content.title || '');
                if (entry.content.font) {
                    setFont(entry.content.font);
                    editor.chain().focus().setFontFamily(entry.content.font).run();
                }
            }
        });
    }, [editor]);

    const save = async (body: string) => {
        await db.entries.put({
            diaryId: '3',
            content: { title, body, font },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    useEffect(() => {
        if (editor) save(editor.getHTML());
    }, [title, font]);

    const handleLockAction = () => {
        if (hasPasskey) {
            // If already locked/has passkey, maybe offer to remove lock?
            // For simplicity, just lock it again if unlocked
            if (!isLocked) {
                // Lock it
                window.location.reload(); // Simple way to re-engage lock state
            } else {
                // It's locked, so we are in the locked view
            }
        } else {
            const pass = prompt('Set a passkey for this diary:');
            if (pass) setPasskey(pass);
        }
    };

    if (isLocked) {
        return (
            <div className="drafts-container locked">
                <div className="lock-screen">
                    <h2>Drafts Locked</h2>
                    {showUnlock ? (
                        <div className="unlock-form">
                            <input
                                type="password"
                                placeholder="Enter Passkey"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (!unlock(e.currentTarget.value)) alert('Wrong passkey');
                                    }
                                }}
                                autoFocus
                            />
                            <button onClick={() => setShowUnlock(false)}>Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowUnlock(true)}>Unlock</button>
                    )}
                    <button className="back-btn" onClick={() => navigate('/')}>← Shelf</button>
                </div>
            </div>
        );
    }

    return (
        <div className="drafts-container">
            <div className="drafts-nav">
                <button onClick={() => navigate('/')}>← Shelf</button>
                <span>Drafts</span>
                <div className="drafts-controls">
                    <select value={font} onChange={(e) => {
                        setFont(e.target.value);
                        editor?.chain().focus().setFontFamily(e.target.value).run();
                    }}>
                        <option value="Inter">UI Font</option>
                        <option value="Merriweather">Serif</option>
                        <option value="monospace">Mono</option>
                    </select>
                    <button onClick={handleLockAction}>{hasPasskey ? 'Lock' : 'Set Lock'}</button>
                </div>
            </div>

            <div className="drafts-paper" style={{ fontFamily: font }}>
                <input
                    type="text"
                    className="drafts-title"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ fontFamily: font }}
                />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
