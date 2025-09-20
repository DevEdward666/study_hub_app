
export interface SlideoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    position?: 'start' | 'end';
    size?: 'small' | 'medium' | 'large' | 'full';
    showHeader?: boolean;
    children?: React.ReactNode;
    className?: string;
  }
  