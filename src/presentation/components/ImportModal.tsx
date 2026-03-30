import React, { useState } from 'react';
import { X, Link2, KeySquare, Server, User, Key, PlusCircle, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [tab, setTab] = useState<'m3u' | 'xtream'>('m3u');
    
    // M3U form
    const [m3uUrl, setM3uUrl] = useState('');
    const [m3uName, setM3uName] = useState('');

    // Xtream form
    const [xtreamUrl, setXtreamUrl] = useState('');
    const [xtreamUser, setXtreamUser] = useState('');
    const [xtreamPass, setXtreamPass] = useState('');
    const [xtreamName, setXtreamName] = useState('');

    const customPlaylists = useAppStore(s => s.customPlaylists);
    const addPlaylist = useAppStore(s => s.addPlaylist);
    const removePlaylist = useAppStore(s => s.removePlaylist);

    if (!isOpen) return null;

    const handleConnectM3U = (e: React.FormEvent) => {
        e.preventDefault();
        if (!m3uUrl) return;
        addPlaylist({
            id: crypto.randomUUID(),
            name: m3uName || 'My M3U Playlist',
            url: m3uUrl,
            type: 'm3u'
        });
        setM3uUrl('');
        setM3uName('');
        // We do not close the modal instantly so they can see it added, or trigger a load
    };

    const handleConnectXtream = (e: React.FormEvent) => {
        e.preventDefault();
        if (!xtreamUrl || !xtreamUser || !xtreamPass) return;
        
        // Armamos la URL cruda de M3U Plus API para Xtream Codes
        // http://server.com:port/get.php?username=XXX&password=YYY&type=m3u_plus
        const base = xtreamUrl.replace(/\/$/, ""); // quitar slash final
        const fullUrl = `${base}/get.php?username=${encodeURIComponent(xtreamUser)}&password=${encodeURIComponent(xtreamPass)}&type=m3u_plus`;

        addPlaylist({
            id: crypto.randomUUID(),
            name: xtreamName || 'My Xtream Codes',
            url: fullUrl,
            type: 'xtream',
            username: xtreamUser,
            password: xtreamPass
        });

        setXtreamUrl('');
        setXtreamUser('');
        setXtreamPass('');
        setXtreamName('');
    };

    return (
        <div 
            onClick={onClose} 
            style={{ 
                position: 'fixed', inset: 0, zIndex: 10000, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    maxWidth: 480, width: '90%', maxHeight: '90vh', overflowY: 'auto',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
                    borderRadius: '24px', position: 'relative', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10, borderRadius: '24px 24px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
                            <PlusCircle size={20} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add Custom Provider</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-glass)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 8, borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)' }}>
                    <button 
                        onClick={() => setTab('m3u')}
                        style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'm3u' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'm3u' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                    >
                        <Link2 size={18} /> M3U Link
                    </button>
                    <button 
                        onClick={() => setTab('xtream')}
                        style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'xtream' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'xtream' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                    >
                        <KeySquare size={18} /> Xtream API
                    </button>
                </div>

                {/* Forms Area */}
                <div style={{ padding: '24px' }}>
                    {tab === 'm3u' ? (
                        <form onSubmit={handleConnectM3U} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Playlist Name (Optional)</label>
                                <input type="text" value={m3uName} onChange={e => setM3uName(e.target.value)} placeholder="e.g. My Premium List" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>M3U URL *</label>
                                <div style={{ position: 'relative' }}>
                                    <Link2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                    <input type="url" required value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} placeholder="http://domain.com/list.m3u" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <button type="submit" style={{ marginTop: 8, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'filter 0.2s', alignSelf: 'stretch' }}>Save M3U Playlist</button>
                        </form>
                    ) : (
                        <form onSubmit={handleConnectXtream} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Playlist Name (Optional)</label>
                                <input type="text" value={xtreamName} onChange={e => setXtreamName(e.target.value)} placeholder="e.g. Diablo TV" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Server URL *</label>
                                <div style={{ position: 'relative' }}>
                                    <Server size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                    <input type="url" required value={xtreamUrl} onChange={e => setXtreamUrl(e.target.value)} placeholder="http://tv.diablotv.net:8080" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Username *</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                        <input type="text" required value={xtreamUser} onChange={e => setXtreamUser(e.target.value)} placeholder="username" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                        <input type="text" required value={xtreamPass} onChange={e => setXtreamPass(e.target.value)} placeholder="password" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" style={{ marginTop: 8, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'filter 0.2s', alignSelf: 'stretch' }}>Save Xtream Codes</button>
                        </form>
                    )}

                    {/* My Playlists (List active playlists to view/remove) */}
                    {customPlaylists.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Saved Playlists</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {customPlaylists.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{p.type.toUpperCase()}</p>
                                        </div>
                                        <button 
                                            onClick={() => removePlaylist(p.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex' }}
                                            title="Remove Provider"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
