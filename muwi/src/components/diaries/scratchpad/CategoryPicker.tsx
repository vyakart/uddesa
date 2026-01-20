import { useState, useRef, useEffect } from 'react';
import type { CategoryName } from '@/types/scratchpad';
import { defaultScratchpadSettings } from '@/types/scratchpad';

interface CategoryPickerProps {
  currentCategory: CategoryName;
  categoryColor: string;
  onCategoryChange: (category: CategoryName) => void;
  disabled?: boolean;
}

const categoryLabels: Record<CategoryName, string> = {
  ideas: 'Ideas',
  todos: 'Todos',
  notes: 'Notes',
  questions: 'Questions',
  misc: 'Misc',
};

export function CategoryPicker({
  currentCategory,
  categoryColor,
  onCategoryChange,
  disabled = false,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (category: CategoryName) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  const categories = Object.entries(defaultScratchpadSettings.categories) as [CategoryName, string][];

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Current category button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md
          border border-gray-200 bg-white
          text-sm font-medium text-gray-700
          transition-colors
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 hover:border-gray-300'
          }
        `}
      >
        {/* Color swatch */}
        <span
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: categoryColor }}
        />
        <span>{categoryLabels[currentCategory]}</span>
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1 z-50
          bg-white border border-gray-200 rounded-md shadow-lg
          min-w-[140px] py-1
        ">
          {categories.map(([category, color]) => (
            <button
              key={category}
              onClick={() => handleSelect(category)}
              className={`
                w-full flex items-center gap-2 px-3 py-2
                text-sm text-left
                hover:bg-gray-100 transition-colors
                ${category === currentCategory ? 'bg-gray-50 font-medium' : ''}
              `}
            >
              <span
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span>{categoryLabels[category]}</span>
              {category === currentCategory && (
                <svg
                  className="w-4 h-4 ml-auto text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
