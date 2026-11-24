import React, { useEffect } from "react";
import { Icon } from "./Icons.jsx";

export function Modal({ title, eyebrow, children, onClose, size = "md", testId }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
        <header className="modal-header">
          <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
