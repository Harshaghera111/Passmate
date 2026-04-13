import React, { useRef } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ length = 6, value, onChange, disabled }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...value];
      if (next[index]) {
        next[index] = '';
        onChange(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        next[index - 1] = '';
        onChange(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = Array(length).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={[
            'w-12 h-14 text-center text-xl font-bold font-mono rounded-input border-2 outline-none transition-all duration-200',
            'bg-bg-surface text-text-primary',
            value[i]
              ? 'border-accent-primary bg-blue-50'
              : 'border-border focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)]',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  );
};

export default OTPInput;
