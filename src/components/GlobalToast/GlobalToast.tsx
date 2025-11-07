import React, { useEffect, useState } from 'react';
import { IonToast, IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline, informationCircleOutline, warningOutline } from 'ionicons/icons';
import './GlobalToast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  sound?: boolean;
}

interface GlobalToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const GlobalToast: React.FC<GlobalToastProps> = ({ messages, onDismiss }) => {
  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return checkmarkCircleOutline;
      case 'error':
        return alertCircleOutline;
      case 'warning':
        return warningOutline;
      case 'info':
      default:
        return informationCircleOutline;
    }
  };

  const getColor = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'primary';
    }
  };

  return (
    <>
      {messages.map((toast) => (
        <IonToast
          key={toast.id}
          isOpen={true}
          message={toast.message}
          duration={toast.duration || 8000}
          position="top"
          color={getColor(toast.type)}
          onDidDismiss={() => onDismiss(toast.id)}
          cssClass={`global-toast global-toast-${toast.type}`}
          buttons={[
            {
              text: 'Dismiss',
              role: 'cancel',
            },
          ]}
        />
      ))}
    </>
  );
};

// Toast Manager Hook
export const useToastManager = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration?: number, 
    playSound = false,
    tableNumber?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type, duration, sound: playSound };
    
    setToasts((prev) => [...prev, newToast]);

    // Play notification sound if requested
    if (playSound) {
      playNotificationSound();
      
      // Speak table number if provided
      if (tableNumber) {
        speakTableNumber(tableNumber);
      }
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const playNotificationSound = () => {
    try {
      // Create a doorbell/chimes sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Doorbell chime pattern: three ascending notes (like a classic doorbell)
      const notes = [
        { frequency: 523.25, time: 0, duration: 0.2 },      // C5 - Ding
        { frequency: 659.25, time: 0.15, duration: 0.2 },   // E5 - Dong
        { frequency: 783.99, time: 0.3, duration: 0.4 }     // G5 - Ding (longer)
      ];

      notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.frequency;
        oscillator.type = 'sine'; // Smooth, bell-like tone
        
        // Louder volume with envelope for natural bell sound
        const startTime = audioContext.currentTime + note.time;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01); // Quick attack (louder!)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });
      
      // Add a subtle reverb effect by layering slightly delayed, quieter notes
      notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.frequency;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + note.time + 0.05; // Slight delay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01); // Quieter echo
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration + 0.1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration + 0.1);
      });
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const speakTableNumber = (tableNumber: string) => {
    try {
      // Use Web Speech API to announce the table number
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Attention! Table ${tableNumber} session has ended.`
        );
        
        // Configure speech
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Max volume
        utterance.lang = 'en-US';

        // Speak after a short delay to let the beep finish
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 800);
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error);
    }
  };

  return {
    toasts,
    showToast,
    dismissToast,
  };
};

