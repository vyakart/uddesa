import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DIARIES } from '../../types';
import { SettingsModal } from '../Shared/SettingsModal';
import './Shelf.css';

export const Shelf: React.FC = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="shelf-container">
      <div className="shelf-header">
        <h1>My Shelf</h1>
        <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>Settings</button>
      </div>

      <div className="shelf-grid">
        {DIARIES.map((diary, index) => (
          <div
            key={diary.id}
            className="diary-spine"
            style={{
              '--diary-color': `var(--color-diary-${index})`,
              animationDelay: `${index * 0.1}s`
            } as React.CSSProperties}
            onClick={() => navigate(`/diary/${diary.id}`)}
            title={diary.description}
          >
            <div className="diary-glow" />
            <div className="diary-title">{diary.name}</div>
          </div>
        ))}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
