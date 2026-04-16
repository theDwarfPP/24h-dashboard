import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableValueProps {
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  renderCustom?: (value: string) => React.ReactNode;
}

export const EditableValue = ({ initialValue, value: propValue, onChange, className = '', renderCustom }: EditableValueProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(propValue ?? initialValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = propValue !== undefined ? propValue : localValue;

  useEffect(() => {
    if (propValue !== undefined) {
      setLocalValue(propValue);
    } else if (initialValue !== undefined) {
      setLocalValue(initialValue);
    }
  }, [initialValue, propValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Optionally select all text when editing starts
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onChange) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (onChange) {
        onChange(localValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      if (propValue !== undefined) {
        setLocalValue(propValue);
      } else if (initialValue !== undefined) {
        setLocalValue(initialValue);
      }
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-white border border-blue-400 rounded px-1 outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
        style={{ width: `${Math.max(localValue.length, 1) + 1}ch`, minWidth: '40px' }}
      />
    );
  }

  return (
    <span 
      onDoubleClick={handleDoubleClick} 
      className={`cursor-text hover:bg-gray-100/50 rounded transition-colors ${className}`}
      title="双击修改数据"
    >
      {renderCustom ? renderCustom(displayValue) : displayValue}
    </span>
  );
};
