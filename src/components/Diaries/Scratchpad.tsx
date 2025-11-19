import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../db/db';
import type { ScratchpadItem } from '../../db/db';
import { DIARIES } from '../../types';
import './Scratchpad.css';

export const Scratchpad: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const diary = DIARIES.find(d => d.id === id);

  const [pageIndex, setPageIndex] = useState(0);
  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Load page data
  useEffect(() => {
    if (!id) return;
    const pageId = `${id}-${pageIndex}`;

    db.scratchpadPages.get(pageId).then(page => {
      if (page) {
        setItems(page.items);
      } else {
        setItems([]);
      }
    });
  }, [id, pageIndex]);

  // Save on change (debounced or on unmount ideally, but simple for now)
  useEffect(() => {
    if (!id || !isDirty) return;

    const pageId = `${id}-${pageIndex}`;
    const saveTimeout = setTimeout(() => {
      db.scratchpadPages.put({
        id: pageId,
        diaryId: id,
        pageIndex,
        items,
        updatedAt: Date.now()
      });
      setIsDirty(false);
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [items, id, pageIndex, isDirty]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // Ignore clicks on items

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newItem: ScratchpadItem = {
      id: crypto.randomUUID(),
      x,
      y,
      text: '',
      color: 'black' // Default color
    };

    setItems([...items, newItem]);
    setIsDirty(true);
  };

  const updateItem = (itemId: string, text: string) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, text } : item
    ).filter(item => item.text.trim() !== '')); // Remove empty items? Maybe not immediately
    setIsDirty(true);
  };

  const deleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    setIsDirty(true);
  };

  const [isTurning, setIsTurning] = useState<'next' | 'prev' | null>(null);

  const handlePageChange = (direction: 'next' | 'prev') => {
    setIsTurning(direction);
    setTimeout(() => {
      setPageIndex(prev => direction === 'next' ? prev + 1 : Math.max(0, prev - 1));
      setIsTurning(null);
    }, 300);
  };

  return (
    <div className="scratchpad-container">
      <div className="scratchpad-nav">
        <button onClick={() => navigate('/')}>← Shelf</button>
        <span>{diary?.name}</span>
        <div className="page-controls">
          <button onClick={() => handlePageChange('prev')} disabled={pageIndex === 0 || isTurning !== null}>Prev</button>
          <span>Page {pageIndex + 1}</span>
          <button onClick={() => handlePageChange('next')} disabled={isTurning !== null}>Next</button>
        </div>
      </div>

      <div className="scratchpad-wrapper" style={{ position: 'relative' }}>
        <div
          className={`scratchpad-page ${isTurning === 'next' ? 'turning-next' : ''} ${isTurning === 'prev' ? 'turning-prev' : ''}`}
          onClick={handleCanvasClick}
        >
          {items.map(item => (
            <div
              key={item.id}
              className="scratchpad-item"
              style={{ left: item.x, top: item.y, color: item.color }}
            >
              <textarea
                autoFocus={!item.text}
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value.trim()) deleteItem(item.id);
                }}
                placeholder="Type here..."
                style={{ fontFamily: 'var(--font-handwriting)', fontSize: '1.5rem' }}
              />
            </div>
          ))}
        </div>
        {/* Visual stack indicator showing "depth" based on page index */}
        <div
          className="scratchpad-stack-indicator"
          style={{
            width: `${Math.min(20, (pageIndex + 1) * 2)}px`,
            opacity: pageIndex > 0 ? 1 : 0.5
          }}
        />
      </div>
    </div>
  );
};
