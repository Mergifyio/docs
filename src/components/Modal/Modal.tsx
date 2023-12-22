import { ReactNode, useEffect, useRef } from 'react';
import './Modal.css';

interface Props {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
}

export default function Modal({ open, onClose, children }: Props) {
	const modal = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const close = (e: MouseEvent) => {
			if (e.target === modal.current) {
				onClose();
			}
		};

		window.addEventListener('click', close);

		return () => window.removeEventListener('click', close);
	}, []);

	return (
		<div ref={modal} id="myModal" className="modal" style={{ display: open ? 'block' : 'none' }}>
			<div className="modal-content">{children}</div>
		</div>
	);
}
