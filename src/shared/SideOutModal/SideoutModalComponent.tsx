import React, { useState, useEffect } from "react";
import { SlideoutModalProps } from "./SIdeoutInterface";
import "./SideoutModalComponent.css";
const SlideoutModal: React.FC<SlideoutModalProps> = ({
  isOpen,
  onClose,
  title,
  position = "end",
  size = "medium",
  showHeader = true,
  children,
  className = "",
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "slideout-small";
      case "medium":
        return "slideout-medium";
      case "large":
        return "slideout-large";
      case "full":
        return "slideout-full";
      default:
        return "slideout-medium";
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className={`slideout-modal slideout-${position} ${getSizeClass()} ${className}`}
      >
        {showHeader && (
          <header className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </header>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </>
  );
};

export default SlideoutModal;
