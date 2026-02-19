import { PropsWithChildren } from 'react';

export function Modal({ children, open, onClose, title }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <section className="modal" aria-modal="true" role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button onClick={onClose} type="button" aria-label="Close modal">✕</button>
        </header>
        {children}
      </section>
    </div>
  );
}
