import React, { useState } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import './SketchModal.css';

interface SketchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (blob: Blob) => void;
}

export const SketchModal: React.FC<SketchModalProps> = ({ isOpen, onClose, onInsert }) => {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

    if (!isOpen) return null;

    const handleInsert = async () => {
        if (!excalidrawAPI) return;

        const elements = excalidrawAPI.getSceneElements();
        if (!elements || elements.length === 0) {
            onClose();
            return;
        }

        const blob = await exportToBlob({
            elements,
            mimeType: 'image/png',
            appState: {
                ...excalidrawAPI.getAppState(),
                exportWithDarkMode: false,
            },
            files: excalidrawAPI.getFiles(),
        });

        if (blob) {
            onInsert(blob);
        }
        onClose();
    };

    return (
        <div className="sketch-modal-overlay">
            <div className="sketch-modal-content">
                <div className="sketch-modal-header">
                    <h3>Sketch</h3>
                    <div>
                        <button onClick={handleInsert}>Insert</button>
                        <button onClick={onClose}>Cancel</button>
                    </div>
                </div>
                <div className="sketch-modal-body">
                    <Excalidraw
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        UIOptions={{
                            canvasActions: {
                                saveToActiveFile: false,
                                loadScene: false,
                                export: false,
                                toggleTheme: false,
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
