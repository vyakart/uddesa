import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Excalidraw, MainMenu, WelcomeScreen } from '@excalidraw/excalidraw';
import { db } from '../../db/db';
import './Blackboard.css';

export const Blackboard: React.FC = () => {
    const navigate = useNavigate();
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [indexPoints, setIndexPoints] = useState<Array<{ id: string, name: string, x: number, y: number, zoom: number }>>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        // Load data
        db.entries.where('diaryId').equals('1').last().then(entry => {
            if (entry && entry.content) {
                setInitialData(entry.content);
                if (entry.content.indexPoints) {
                    setIndexPoints(entry.content.indexPoints);
                }
            }
        });
    }, []);

    const save = async () => {
        if (!excalidrawAPI) return;
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        await db.entries.put({
            diaryId: '1',
            content: { elements, appState, indexPoints },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    const addIndexPoint = () => {
        if (!excalidrawAPI) return;
        const appState = excalidrawAPI.getAppState();
        const name = prompt("Name this index point:");
        if (name) {
            const newPoint = {
                id: crypto.randomUUID(),
                name,
                x: appState.scrollX,
                y: appState.scrollY,
                zoom: appState.zoom.value
            };
            setIndexPoints([...indexPoints, newPoint]);
            // Trigger save
            setTimeout(save, 100);
        }
    };

    const goToIndexPoint = (point: { x: number, y: number, zoom: number }) => {
        if (!excalidrawAPI) return;
        excalidrawAPI.updateScene({
            appState: {
                scrollX: point.x,
                scrollY: point.y,
                zoom: { value: point.zoom }
            }
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
            if (e.key === 'Escape') {
                navigate('/');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [excalidrawAPI, navigate, indexPoints]); // Add dependencies as needed

    return (
        <div className="blackboard-container">
            <div className="blackboard-nav">
                <button onClick={() => { save(); navigate('/'); }}>← Shelf</button>
                <span>Blackboard</span>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? 'Hide Index' : 'Show Index'}</button>
                <button onClick={save}>Save</button>
            </div>

            <div className={`blackboard-sidebar ${isSidebarOpen ? '' : 'closed'}`}>
                <h3>Index</h3>
                {indexPoints.map(point => (
                    <div key={point.id} className="index-item" onClick={() => goToIndexPoint(point)}>
                        {point.name}
                    </div>
                ))}
                <button className="add-index-btn" onClick={addIndexPoint}>+ Add Index Point</button>
            </div>

            <div className="excalidraw-wrapper">
                <Excalidraw
                    excalidrawAPI={(api) => setExcalidrawAPI(api)}
                    initialData={initialData}
                    theme="dark"
                    UIOptions={{
                        canvasActions: {
                            saveToActiveFile: false,
                            loadScene: false,
                            export: false,
                            toggleTheme: false,
                        }
                    }}
                >
                    <MainMenu>
                        <MainMenu.DefaultItems.ClearCanvas />
                        <MainMenu.DefaultItems.ChangeCanvasBackground />
                    </MainMenu>
                    <WelcomeScreen />
                </Excalidraw>
            </div>
        </div>
    );
};
