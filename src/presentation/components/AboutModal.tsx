"use client";
import React, { useEffect } from 'react';
import { X, Github, Globe, Info } from 'lucide-react';
import Link from 'next/link';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const hd = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", hd);
        return () => window.removeEventListener("keydown", hd);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="player-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ zIndex: 200, padding: 16 }}>
            <div className="player-container" style={{ maxWidth: 400, padding: 24, gap: 16, pointerEvents: 'auto', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Info size={18} color="var(--accent)" />
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>About IPTV Ykar</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>
                
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    This application lets you watch thousands of live public TV channels from around the world.
                </p>

                <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0 }}>
                        Data provided by <a href="https://iptv-org.github.io/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>iptv-org</a>.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    <a href="https://github.com/KarlosY/iptv-app" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, padding: "8px 12px", borderRadius: 6, background: "var(--bg-card-hover)" }}>
                        <Github size={16} /> Official Repository 
                    </a>
                    <a href="https://iptv-org.github.io/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, padding: "8px 12px", borderRadius: 6, background: "var(--bg-card-hover)" }}>
                        <Globe size={16} /> iptv-org Website
                    </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, fontWeight: 500 }} onClick={onClose}>Terms & Conditions</Link>
                    <span style={{ color: "var(--border)" }}>•</span>
                    <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, fontWeight: 500 }} onClick={onClose}>Privacy Policy</Link>
                </div>
            </div>
        </div>
    );
}
