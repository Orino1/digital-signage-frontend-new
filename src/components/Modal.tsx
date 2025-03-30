import type React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-3/4 max-w-2xl max-h-[80vh] overflow-y-auto">
                <button type="button" onClick={onClose} className="float-right text-gray-500 hover:text-gray-700">
                    &times;
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;