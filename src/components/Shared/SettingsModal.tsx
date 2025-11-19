import React from 'react';
import { db } from '../../db/db';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleExport = async () => {
        try {
            const entries = await db.entries.toArray();
            const scratchpad = await db.scratchpadPages.toArray();
            const data = {
                entries,
                scratchpad,
                version: 1,
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `writer-ide-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('ARE YOU SURE? This will delete ALL your diaries and notes permanently. This action cannot be undone.')) {
            if (window.confirm('Really sure? Last chance.')) {
                try {
                    await db.entries.clear();
                    await db.scratchpadPages.clear();
                    alert('All data cleared.');
                    onClose();
                    window.location.reload();
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Delete failed. Check console for details.');
                }
            }
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
                <h2>Settings</h2>

                <div className="settings-section">
                    <h3>Data Management</h3>
                    <p>Backup your work or clear everything to start fresh.</p>
                    <div className="settings-actions">
                        <button className="export-btn" onClick={handleExport}>Export All Data (JSON)</button>
                        <button className="delete-btn" onClick={handleDelete}>Delete All Data</button>
                    </div>
                </div>

                <div className="settings-footer">
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
