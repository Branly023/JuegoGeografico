import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            confirmBg: 'bg-red-500 hover:bg-red-600',
            confirmShadow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-yellow-500/20',
            iconColor: 'text-yellow-400',
            confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
            confirmShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
            confirmBg: 'bg-blue-500 hover:bg-blue-600',
            confirmShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        }
    };

    const style = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-night/90 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
            onClick={onCancel}
        >
            <div
                className="bg-deep border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-3xl">{style.icon}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-black text-white mb-2 text-center">
                    {title}
                </h2>

                {/* Message */}
                <p className="text-soft-gray text-center mb-6 leading-relaxed text-sm">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-all transform hover:-translate-y-0.5 text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 ${style.confirmBg} text-white font-bold rounded-lg ${style.confirmShadow} transition-all transform hover:-translate-y-0.5 text-sm`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
