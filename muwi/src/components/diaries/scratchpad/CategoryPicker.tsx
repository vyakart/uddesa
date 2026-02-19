import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { CategoryName } from '@/types/scratchpad';
import { useSettingsStore } from '@/stores/settingsStore';

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
  const categoriesMap = useSettingsStore((state) => state.scratchpad.categories);

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

  const categories = Object.entries(categoriesMap) as [CategoryName, string][];

  return (
    <div ref={dropdownRef} className="muwi-scratchpad-category-picker">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen ? 'true' : 'false'}
        className="muwi-scratchpad-category-picker__trigger"
      >
        <span
          className="muwi-scratchpad-category-picker__swatch"
          style={{ '--muwi-category-swatch': categoryColor } as CSSProperties}
          aria-hidden="true"
        />
        <span>{categoryLabels[currentCategory]}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="muwi-scratchpad-category-picker__chevron"
          data-open={isOpen ? 'true' : 'false'}
        />
      </button>

      {isOpen && (
        <div role="menu" aria-label="Category options" className="muwi-scratchpad-category-picker__menu">
          {categories.map(([category, color]) => (
            <button
              key={category}
              type="button"
              role="menuitemradio"
              aria-checked={category === currentCategory}
              onClick={() => handleSelect(category)}
              className="muwi-scratchpad-category-picker__option"
              data-selected={category === currentCategory ? 'true' : 'false'}
            >
              <span
                className="muwi-scratchpad-category-picker__swatch"
                style={{ '--muwi-category-swatch': color } as CSSProperties}
                aria-hidden="true"
              />
              <span>{categoryLabels[category]}</span>
              {category === currentCategory && (
                <Check size={14} aria-hidden="true" className="muwi-scratchpad-category-picker__check" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
