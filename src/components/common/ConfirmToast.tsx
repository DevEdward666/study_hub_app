import React from 'react';
import { IonAlert } from '@ionic/react';
import './ConfirmToast.css';

interface ConfirmToastProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  header?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmToast: React.FC<ConfirmToastProps> = ({
  isOpen,
  onDidDismiss,
  onConfirm,
  onCancel,
  message,
  header = 'Confirm Action',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      header={header}
      message={message}
      buttons={[
        {
          text: cancelText,
          role: 'cancel',
          cssClass: 'confirm-toast-cancel',
          handler: () => {
            onCancel();
          }
        },
        {
          text: confirmText,
          cssClass: 'confirm-toast-confirm',
          handler: () => {
            onConfirm();
          }
        }
      ]}
      cssClass="confirm-toast-alert"
    />
  );
};