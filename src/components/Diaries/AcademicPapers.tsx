import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { db } from '../../db/db';
import './AcademicPapers.css';

export const AcademicPapers: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [activeModal, setActiveModal] = useState<'citation' | 'math' | null>(null);
    const [modalInput, setModalInput] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start your academic paper...',
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            save(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) return;

        db.entries.where('diaryId').equals('5').last().then(entry => {
            if (entry && entry.content) {
                editor.commands.setContent(entry.content.body);
                setTitle(entry.content.title || '');
            }
        });
    }, [editor]);

    const save = async (body: string) => {
        await db.entries.put({
            diaryId: '5',
            content: { title, body },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    useEffect(() => {
        if (editor) save(editor.getHTML());
    }, [title]);

    const insertContent = () => {
        if (!editor || !modalInput) return;

        if (activeModal === 'citation') {
            editor.chain().focus().insertContent(`[${modalInput}]`).run();
        } else if (activeModal === 'math') {
            // Inserting as code block for now to distinguish it
            editor.chain().focus().insertContent(`$${modalInput}$`).run();
        }

        setActiveModal(null);
        setModalInput('');
    };

    return (
        <div className="academic-container">
            <div className="academic-nav">
                <button onClick={() => navigate('/')}>← Shelf</button>
                <span>Academic Papers</span>
                <div className="academic-tools">
                    <button onClick={() => setActiveModal('citation')}>Add Citation</button>
                    <button onClick={() => setActiveModal('math')}>Add Math</button>
                </div>
            </div>

            <div className="academic-paper">
                <input
                    type="text"
                    className="academic-title"
                    placeholder="Paper Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {editor && <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="bubble-menu">
                        <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
                        <button onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
                    </div>
                </BubbleMenu>}

                <EditorContent editor={editor} />
            </div>

            {activeModal && (
                <div className="modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Insert {activeModal === 'citation' ? 'Citation' : 'Equation'}</h3>
                        <input
                            type="text"
                            value={modalInput}
                            onChange={e => setModalInput(e.target.value)}
                            placeholder={activeModal === 'citation' ? "e.g., Smith et al., 2023" : "e.g., E = mc^2"}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && insertContent()}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setActiveModal(null)}>Cancel</button>
                            <button onClick={insertContent}>Insert</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
