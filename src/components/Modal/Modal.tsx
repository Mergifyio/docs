import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const TRANSITION_MS = 180;

export default function Modal({ open, onClose, children }: Props) {
  const modal = useRef<HTMLDivElement>(null);
  // Decouple "in DOM" from "visually open" so we can transition out before
  // unmounting. mounted controls render; visible drives the .modal-open class.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (e.target === modal.current) {
        onClose();
      }
    };

    window.addEventListener('click', close);

    return () => window.removeEventListener('click', close);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div ref={modal} id="myModal" className={`modal${visible ? ' modal-open' : ''}`}>
      <div className="modal-content">{children}</div>
    </div>,
    document.body
  );
}
