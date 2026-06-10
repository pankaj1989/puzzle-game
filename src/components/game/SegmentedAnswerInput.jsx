import { useEffect, useMemo, useRef } from 'react';
import { buildAnswerSlots } from './answerSlots';

function slotsWithCharIndices(slots) {
  let charSlotIndex = -1;
  return slots.map((slot) => {
    if (slot.type === 'space') return { ...slot, charSlotIndex: -1 };
    charSlotIndex += 1;
    return { ...slot, charSlotIndex };
  });
}

export function SegmentedAnswerInput({
  wordLengths,
  cells,
  revealed = {},
  onChange,
  disabled = false,
  onSubmit,
}) {
  const slots = buildAnswerSlots(wordLengths);
  const slotsWithMeta = useMemo(() => slotsWithCharIndices(slots), [slots]);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, slots.filter((s) => s.type === 'char').length);
  }, [slots]);

  function setCell(index, value) {
    const next = [...cells];
    next[index] = value;
    onChange(next);
  }

  function focusCharSlot(charSlotIndex) {
    const el = inputRefs.current[charSlotIndex];
    el?.focus();
    el?.select();
  }

  function handleCharChange(answerIndex, charSlotIndex, raw) {
    if (revealed[answerIndex] !== undefined) return;
    const letter = raw.replace(/[^a-zA-Z0-9]/g, '').slice(-1);
    if (!letter) return;

    const next = [...cells];
    next[answerIndex] = letter.toLowerCase();
    onChange(next);

    const charSlots = slots.filter((s) => s.type === 'char');
    const allFilled = charSlots.every(
      (s) => revealed[s.index] !== undefined || next[s.index]
    );

    if (allFilled) {
      onSubmit?.(next);
      return;
    }

    const nextCharSlot = findNextCharSlot(slots, answerIndex);
    if (nextCharSlot !== -1) focusCharSlot(nextCharSlot);
  }

  function handleKeyDown(answerIndex, charSlotIndex, e) {
    if (e.key === 'Backspace' && !cells[answerIndex] && revealed[answerIndex] === undefined) {
      e.preventDefault();
      const prevCharSlot = findPrevCharSlot(slots, answerIndex);
      if (prevCharSlot !== -1) {
        const prevIndex = slots.filter((s) => s.type === 'char')[prevCharSlot].index;
        setCell(prevIndex, '');
        focusCharSlot(prevCharSlot);
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 px-2 sm:px-6">
      {slotsWithMeta.map((slot) => {
        if (slot.type === 'space') {
          return <div key={`space-${slot.index}`} className="w-3 sm:w-5 shrink-0" aria-hidden />;
        }

        const charSlotIndex = slot.charSlotIndex;
        const hintLetter = revealed[slot.index];
        const value = hintLetter !== undefined ? hintLetter.toLowerCase() : (cells[slot.index] || '');
        const isLocked = hintLetter !== undefined;

        return (
          <input
            key={slot.index}
            ref={(el) => {
              inputRefs.current[charSlotIndex] = el;
            }}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={1}
            value={value}
            disabled={disabled || isLocked}
            placeholder="?"
            aria-label={`Answer letter ${slot.index + 1}`}
            className={`answer-cell ${isLocked ? 'answer-cell--locked' : ''}`}
            onChange={(e) => handleCharChange(slot.index, charSlotIndex, e.target.value)}
            onKeyDown={(e) => handleKeyDown(slot.index, charSlotIndex, e)}
          />
        );
      })}
    </div>
  );
}

function findNextCharSlot(slots, currentIndex) {
  const charSlots = slots.filter((s) => s.type === 'char');
  const pos = charSlots.findIndex((s) => s.index === currentIndex);
  return pos >= 0 && pos < charSlots.length - 1 ? pos + 1 : -1;
}

function findPrevCharSlot(slots, currentIndex) {
  const charSlots = slots.filter((s) => s.type === 'char');
  const pos = charSlots.findIndex((s) => s.index === currentIndex);
  return pos > 0 ? pos - 1 : -1;
}
