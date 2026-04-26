import type { PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  header?: ReactNode;
  wide?: boolean;
  panelClassName?: string;
}>;

export function Modal({ open, onClose, header, wide = false, panelClassName = "", children }: ModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className={`dialog-panel ${wide ? "feedback-dialog-panel" : "upload-dialog-panel"} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {header}
        {children}
      </div>
    </div>,
    document.body
  );
}
