import { useState } from 'react';

interface ConfirmationOptions {
  header?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    message: '',
    header: 'Confirm Action',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const showConfirmation = (opts: ConfirmationOptions, onConfirm: () => void) => {
    setOptions({
      header: opts.header || 'Confirm Action',
      message: opts.message,
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel'
    });
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    options,
    showConfirmation,
    handleConfirm,
    handleCancel,
    handleDismiss
  };
};