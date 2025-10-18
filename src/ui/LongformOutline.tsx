import { useState, useCallback } from 'react';
import type { OutlineHeading } from '../features/diaries/longform/useOutline';

export interface LongformOutlineProps {
  outline: OutlineHeading[];
  activeId?: string | null;
  onNavigate: (headingId: string, position: number) => void;
}

interface HeadingItemProps {
  heading: OutlineHeading;
  level: number;
  isActive: boolean;
  activeId: string | null | undefined;
  onNavigate: (headingId: string, position: number) => void;
}

/**
 * Recursive component for rendering a single heading item
 */
function HeadingItem({ heading, level, isActive, activeId, onNavigate }: HeadingItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = heading.children.length > 0;

  const handleClick = useCallback(() => {
    onNavigate(heading.id, heading.position);
  }, [heading.id, heading.position, onNavigate]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    },
    [isExpanded],
  );

  return (
    <li className={`longform-outline__item longform-outline__item--level${heading.level}`}>
      <button
        className={`longform-outline__button ${isActive ? 'longform-outline__button--active' : ''}`}
        onClick={handleClick}
        aria-current={isActive ? 'true' : undefined}
      >
        {hasChildren && (
          <span
            className="longform-outline__toggle"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="longform-outline__text">{heading.text}</span>
      </button>
      
      {hasChildren && isExpanded && (
        <ul className="longform-outline__children">
          {heading.children.map((child) => (
            <HeadingItem
              key={child.id}
              heading={child}
              level={level + 1}
              isActive={child.id === activeId}
              activeId={activeId}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Outline navigation panel for longform documents
 * 
 * Displays hierarchical heading structure and allows navigation
 */
export function LongformOutline({ outline, activeId, onNavigate }: LongformOutlineProps) {
  if (outline.length === 0) {
    return (
      <div className="longform-outline">
        <div className="longform-outline__header">
          <h3 className="longform-outline__title">Outline</h3>
          <span className="longform-outline__count">0</span>
        </div>
        <p className="longform-outline__empty">
          Add headings (H1, H2, H3) to see outline
        </p>
      </div>
    );
  }

  const totalHeadings = outline.reduce((count, heading) => {
    return count + 1 + heading.children.length;
  }, 0);

  return (
    <nav className="longform-outline" aria-label="Document outline">
      <div className="longform-outline__header">
        <h3 className="longform-outline__title">Outline</h3>
        <span className="longform-outline__count">{totalHeadings}</span>
      </div>
      
      <ul className="longform-outline__list">
        {outline.map((heading) => (
          <HeadingItem
            key={heading.id}
            heading={heading}
            level={0}
            isActive={heading.id === activeId}
            activeId={activeId}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}