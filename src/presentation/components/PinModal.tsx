import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, KeySquare } from 'lucide-react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => {
                setPin('');
                setError(false);
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple mock PIN for parental control (e.g. 1234)
        if (pin === '1234') {
            onSuccess();
        } else {
            setError(true);
            setPin('');
            inputRef.current?.focus();
        }
    };

    return (
        <div 
            onClick={onClose} 
            style={{ 
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    maxWidth: 400, 
                    width: '90%', 
                    textAlign: 'center', 
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                    borderRadius: '24px',
                    padding: '32px',
                    position: 'relative'
                }}
            >
                <button 
                    onClick={onClose}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                    <X size={20} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                        <Lock size={32} />
                    </div>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0' }}>Restricted Content</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                    Please enter the Parental Control PIN to access 18+ content.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <input
                            ref={inputRef}
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value.replace(/\D/g, ''));
                                setError(false);
                            }}
                            placeholder="****"
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '24px',
                                textAlign: 'center',
                                letterSpacing: '8px',
                                borderRadius: '12px',
                                border: `2px solid ${error ? '#ef4444' : 'var(--border)'}`,
                                background: 'var(--bg-glass)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>Incorrect PIN. Try again.</p>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={pin.length < 4}
                        style={{
                            padding: '16px',
                            background: pin.length === 4 ? 'var(--accent)' : 'var(--border)',
                            color: pin.length === 4 ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '16px',
                            cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <KeySquare size={18} /> Unlock Category
                    </button>
                </form>
            </div>
        </div>
    );
}
