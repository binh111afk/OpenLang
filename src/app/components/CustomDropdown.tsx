import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownOptionGroup {
  groupLabel: string;
  options: DropdownOption[];
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: DropdownOption[];
  optionGroups?: DropdownOptionGroup[];
  placeholder?: string;
  className?: string;
}

export function CustomDropdown({ 
  value, 
  onChange, 
  options = [], 
  optionGroups = [],
  placeholder = 'Chọn...',
  className = '' 
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current label
  const getCurrentLabel = () => {
    if (options.length > 0) {
      return options.find(opt => opt.value === value)?.label || placeholder;
    }
    
    if (optionGroups.length > 0) {
      for (const group of optionGroups) {
        const found = group.options.find(opt => opt.value === value);
        if (found) return found.label;
      }
    }
    
    return placeholder;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full appearance-none px-4 py-3 rounded-2xl border-2 border-purple-200 dark:border-purple-700 focus:border-purple-400 dark:focus:border-purple-600 focus:outline-none transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 cursor-pointer font-medium hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-300 dark:hover:border-purple-600 text-left flex items-center justify-between"
      >
        <span>{getCurrentLabel()}</span>
        <ChevronDown 
          className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
          <div className="py-2">
            {/* Simple options */}
            {options.length > 0 && options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors flex items-center justify-between group ${
                  value === option.value ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold' : 'text-gray-800 dark:text-gray-100'
                }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
              </button>
            ))}

            {/* Grouped options */}
            {optionGroups.length > 0 && optionGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="px-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50">
                  {group.groupLabel}
                </div>
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors flex items-center justify-between group ${
                      value === option.value ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold' : 'text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <span className="pl-2">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
