import { useEffect, useRef } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export default function NumberInput({ label, onChange, value, min, max }: Props) {
  const holdIntervalRef = useRef<number | null>(null);
  const holdDelayRef = useRef<number | null>(null);

  const handleIncrement = () => {
    onChange(value + 1 > (max ?? Infinity) ? value : value + 1);
  };

  const handleDecrement = () => {
    onChange(value - 1 < (min ?? -Infinity) ? value : value - 1);
  };

  const stopHold = () => {
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdDelayRef.current !== null) {
      window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
  };

  const startHold = (dir: 'inc' | 'dec') => {
    // Do one step immediately
    if (dir === 'inc') {
      handleIncrement();
    } else {
      handleDecrement();
    }
    // After a short delay, start repeating quickly
    holdDelayRef.current = window.setTimeout(() => {
      holdIntervalRef.current = window.setInterval(() => {
        if (dir === 'inc') {
          handleIncrement();
        } else {
          handleDecrement();
        }
      }, 75);
    }, 250);
  };

  useEffect(() => {
    const onUp = () => stopHold();
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
      stopHold();
    };
  }, []);

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {label}
      <div style={{ marginTop: 'auto' }}>
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          onChange={(e: any) => onChange(Number(e.target.value))}
        />
        <div className="input-number-nav">
          <div
            className="input-number-button input-number-up"
            onClick={handleIncrement}
            onMouseDown={() => startHold('inc')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('inc')}
            onTouchEnd={stopHold}
          >
            +
          </div>
          <div
            className="input-number-button input-number-down"
            onClick={handleDecrement}
            onMouseDown={() => startHold('dec')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('dec')}
            onTouchEnd={stopHold}
          >
            -
          </div>
        </div>
      </div>
    </label>
  );
}
