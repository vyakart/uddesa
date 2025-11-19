import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { db } from '../../db/db';
import { SketchModal } from '../Shared/SketchModal';
import './LongDrafts.css';

export const LongDrafts: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [isSketchOpen, setIsSketchOpen] = useState(false);

    const extensions = React.useMemo(() => [
        StarterKit,
        Placeholder.configure({
            placeholder: 'Start writing...',
        }),
        Image,
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

        db.entries.where('diaryId').equals('4').last().then(entry => {
            if (entry && entry.content) {
                editor.commands.setContent(entry.content.body);
                setTitle(entry.content.title || '');
            }
        });
    }, [editor]);

    const save = async (body: string) => {
        await db.entries.put({
            diaryId: '4',
            content: { title, body },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    useEffect(() => {
        if (editor) save(editor.getHTML());
    }, [title]);

    const handleInsertSketch = (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (editor && e.target?.result) {
                editor.chain().focus().setImage({ src: e.target.result as string }).run();
            }
        };
        reader.readAsDataURL(blob);
    };

    return (
        <div className="long-drafts-container">
            <div className="long-drafts-nav">
                <button onClick={() => navigate('/')}>← Shelf</button>
                <span>Long Drafts</span>
                <button onClick={() => setIsSketchOpen(true)}>Sketch</button>
                <button onClick={() => console.log('Export')}>Export</button>
            </div>

            <div className="long-drafts-paper">
                <input
                    type="text"
                    className="long-drafts-title"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {editor && <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="bubble-menu">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'is-active' : ''}
                        >
                            Bold
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'is-active' : ''}
                        >
                            Italic
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={editor.isActive('strike') ? 'is-active' : ''}
                        >
                            Strike
                        </button>
                    </div>
                </BubbleMenu>}

                {editor && <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="floating-menu">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                        >
                            H1
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                        >
                            H2
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'is-active' : ''}
                        >
                            Bullet List
                        </button>
                        <button onClick={() => setIsSketchOpen(true)}>Sketch</button>
                    </div>
                </FloatingMenu>}

                <EditorContent editor={editor} />
            </div>

            <SketchModal
                isOpen={isSketchOpen}
                onClose={() => setIsSketchOpen(false)}
                onInsert={handleInsertSketch}
            />
        </div>
    );
};
