import React, { useState } from 'react';
import { X, Link2, KeySquare, Server, User, Key, PlusCircle, Trash2, Upload, FileText, Sparkles, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { parseM3U } from '@/application/parsers/m3uParser';
import { IndexedDBService } from '@/infrastructure/datasources/IndexedDBService';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RECOMMENDED_LISTS = [
    { name: "📺 Noticias en Vivo (Global)", url: "https://iptv-org.github.io/iptv/categories/news.m3u", desc: "Canales informativos internacionales y regionales de libre transmisión." },
    { name: "⚽ Deportes en Vivo (Global)", url: "https://iptv-org.github.io/iptv/categories/sports.m3u", desc: "Transmisiones y reportajes de disciplinas deportivas mundiales." },
    { name: "🎬 Películas y Series (Global)", url: "https://iptv-org.github.io/iptv/categories/movies.m3u", desc: "Cine, cortometrajes y canales de entretenimiento de ficción." },
    { name: "🌿 Documentales y Ciencia", url: "https://iptv-org.github.io/iptv/categories/documentary.m3u", desc: "Canales dedicados a la naturaleza, ciencia, tecnología e historia." },
    { name: "🎵 Música y Conciertos", url: "https://iptv-org.github.io/iptv/categories/music.m3u", desc: "Videoclips musicales, conciertos en vivo y géneros variados." },
    { name: "🇪🇸 Canales de España", url: "https://iptv-org.github.io/iptv/countries/es.m3u", desc: "Señales públicas españolas de libre acceso." },
    { name: "🇲🇽 Canales de México", url: "https://iptv-org.github.io/iptv/countries/mx.m3u", desc: "Canales abiertos y televisión pública de México." },
    { name: "🇵🇪 Canales de Perú", url: "https://iptv-org.github.io/iptv/countries/pe.m3u", desc: "Televisión nacional peruana y señales regionales." }
];

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
    const [tab, setTab] = useState<'m3u' | 'file' | 'xtream' | 'recommended' | 'epg'>('recommended');
    
    // States
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    
    // M3U form
    const [m3uUrl, setM3uUrl] = useState('');
    const [m3uName, setM3uName] = useState('');

    // File form
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    // Xtream form
    const [xtreamUrl, setXtreamUrl] = useState('');
    const [xtreamUser, setXtreamUser] = useState('');
    const [xtreamPass, setXtreamPass] = useState('');
    const [xtreamName, setXtreamName] = useState('');

    // EPG form
    const epgUrlStore = useAppStore(s => s.epgUrl);
    const loadEpg = useAppStore(s => s.loadEpg);
    const clearEpg = useAppStore(s => s.clearEpg);
    const [epgInputUrl, setEpgInputUrl] = useState(epgUrlStore || '');

    const customPlaylists = useAppStore(s => s.customPlaylists);
    const addPlaylist = useAppStore(s => s.addPlaylist);
    const removePlaylist = useAppStore(s => s.removePlaylist);
    const loadCustomDataFromIndexedDB = useAppStore(s => s.loadCustomDataFromIndexedDB);

    if (!isOpen) return null;

    const handleImportRecommended = async (url: string, name: string) => {
        setLoading(true);
        setStatusMsg(`Importando lista "${name}"...`);
        const playlistId = crypto.randomUUID();

        try {
            let text = '';
            // Try fetching directly first
            try {
                const directRes = await fetch(url);
                if (directRes.ok) {
                    text = await directRes.text();
                }
            } catch (err) {
                console.warn(`[CORS] Direct fetch failed for ${url}, falling back to Proxy`);
            }

            // Fallback to proxy
            if (!text) {
                const b64 = btoa(unescape(encodeURIComponent(url)));
                const proxyRes = await fetch(`/api/proxy?url=${b64}`);
                if (proxyRes.ok) {
                    text = await proxyRes.text();
                }
            }

            if (!text) {
                throw new Error("No se pudo obtener el contenido de la lista recomendada. Inténtalo de nuevo o comprueba tu conexión.");
            }

            setStatusMsg('Procesando canales y señales...');
            const { channels, streamsMap } = parseM3U(text, name);

            if (channels.length === 0) {
                throw new Error("La lista seleccionada no contiene canales válidos.");
            }

            setStatusMsg('Guardando en almacenamiento local...');
            await IndexedDBService.savePlaylistData(playlistId, channels, streamsMap);

            addPlaylist({
                id: playlistId,
                name: name,
                url: url,
                type: 'm3u'
            });

            await loadCustomDataFromIndexedDB();
            setStatusMsg(`¡Éxito! Se importaron ${channels.length} canales correctamente.`);
            
            setTimeout(() => {
                setStatusMsg('');
                setLoading(false);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setStatusMsg(`Error: ${err.message || 'Fallo al procesar la lista recomendada.'}`);
            setLoading(false);
        }
    };

    const handleConnectM3U = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!m3uUrl) return;

        setLoading(true);
        setStatusMsg('Conectando y descargando lista...');
        const playlistId = crypto.randomUUID();
        const playlistName = m3uName || 'Lista M3U Personalizada';

        try {
            let text = '';
            // Try fetching directly first
            try {
                const directRes = await fetch(m3uUrl);
                if (directRes.ok) {
                    text = await directRes.text();
                }
            } catch (err) {
                console.warn(`[CORS] Direct fetch failed for ${m3uUrl}, falling back to Proxy`);
            }

            // Fallback to proxy
            if (!text) {
                const b64 = btoa(unescape(encodeURIComponent(m3uUrl)));
                const proxyRes = await fetch(`/api/proxy?url=${b64}`);
                if (proxyRes.ok) {
                    text = await proxyRes.text();
                }
            }

            if (!text) {
                throw new Error("No se pudo obtener el contenido del enlace M3U. Comprueba la URL o usa la opción de archivo local.");
            }

            setStatusMsg('Procesando canales y streams...');
            const { channels, streamsMap } = parseM3U(text, playlistName);

            if (channels.length === 0) {
                throw new Error("La lista M3U no contiene canales válidos.");
            }

            setStatusMsg('Guardando en almacenamiento local...');
            await IndexedDBService.savePlaylistData(playlistId, channels, streamsMap);

            addPlaylist({
                id: playlistId,
                name: playlistName,
                url: m3uUrl,
                type: 'm3u'
            });

            await loadCustomDataFromIndexedDB();
            setStatusMsg(`¡Éxito! Se importaron ${channels.length} canales correctamente.`);
            setM3uUrl('');
            setM3uName('');
            
            setTimeout(() => {
                setStatusMsg('');
                setLoading(false);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setStatusMsg(`Error: ${err.message || 'Fallo desconocido al procesar la lista.'}`);
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadM3UFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        setStatusMsg('Leyendo archivo .m3u local...');
        const playlistId = crypto.randomUUID();
        const playlistName = fileName || selectedFile.name.replace(/\.[^/.]+$/, "") || 'Lista de Archivo Local';

        try {
            const reader = new FileReader();
            
            const textPromise = new Promise<string>((resolve, reject) => {
                reader.onload = (event) => {
                    if (event.target && typeof event.target.result === 'string') {
                        resolve(event.target.result);
                    } else {
                        reject(new Error("No se pudo leer el archivo."));
                    }
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo."));
                reader.readAsText(selectedFile);
            });

            const text = await textPromise;

            setStatusMsg('Procesando canales...');
            const { channels, streamsMap } = parseM3U(text, playlistName);

            if (channels.length === 0) {
                throw new Error("El archivo no contiene canales válidos.");
            }

            setStatusMsg('Guardando en IndexedDB...');
            await IndexedDBService.savePlaylistData(playlistId, channels, streamsMap);

            addPlaylist({
                id: playlistId,
                name: playlistName,
                url: 'local_file://' + selectedFile.name,
                type: 'm3u'
            });

            await loadCustomDataFromIndexedDB();
            setStatusMsg(`¡Éxito! Se importaron ${channels.length} canales del archivo.`);
            setSelectedFile(null);
            setFileName('');
            
            setTimeout(() => {
                setStatusMsg('');
                setLoading(false);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setStatusMsg(`Error: ${err.message || 'Fallo al leer o procesar el archivo.'}`);
            setLoading(false);
        }
    };

    const handleConnectXtream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!xtreamUrl || !xtreamUser || !xtreamPass) return;

        setLoading(true);
        setStatusMsg('Conectando a API de Xtream Codes...');
        const playlistId = crypto.randomUUID();
        const playlistName = xtreamName || 'Xtream Codes Provider';

        const base = xtreamUrl.replace(/\/$/, "");
        const fullUrl = `${base}/get.php?username=${encodeURIComponent(xtreamUser)}&password=${encodeURIComponent(xtreamPass)}&type=m3u_plus`;

        try {
            let text = '';
            // Fetch via proxy
            const b64 = btoa(unescape(encodeURIComponent(fullUrl)));
            const proxyRes = await fetch(`/api/proxy?url=${b64}`);
            if (proxyRes.ok) {
                text = await proxyRes.text();
            }

            if (!text) {
                throw new Error("No se pudo conectar al servidor Xtream Codes. Verifica los datos y la URL.");
            }

            setStatusMsg('Procesando la lista del servidor...');
            const { channels, streamsMap } = parseM3U(text, playlistName);

            if (channels.length === 0) {
                throw new Error("No se encontraron canales en la cuenta de Xtream Codes.");
            }

            setStatusMsg('Guardando configuración local...');
            await IndexedDBService.savePlaylistData(playlistId, channels, streamsMap);

            addPlaylist({
                id: playlistId,
                name: playlistName,
                url: fullUrl,
                type: 'xtream',
                username: xtreamUser,
                password: xtreamPass
            });

            await loadCustomDataFromIndexedDB();
            setStatusMsg(`¡Conectado! Se importaron ${channels.length} canales.`);
            
            setXtreamUrl('');
            setXtreamUser('');
            setXtreamPass('');
            setXtreamName('');

            setTimeout(() => {
                setStatusMsg('');
                setLoading(false);
            }, 3000);

        } catch (err: any) {
            console.error(err);
            setStatusMsg(`Error: ${err.message || 'Fallo de conexión.'}`);
            setLoading(false);
        }
    };

    const handleConnectEPG = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!epgInputUrl) return;

        setLoading(true);
        setStatusMsg('Conectando y descargando guía de programación EPG (esto puede tardar unos segundos)...');

        try {
            await loadEpg(epgInputUrl);
            setStatusMsg('¡Guía EPG cargada e indexada correctamente!');
            setTimeout(() => {
                setStatusMsg('');
                setLoading(false);
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setStatusMsg(`Error: ${err.message || 'Fallo al procesar la guía EPG.'}`);
            setLoading(false);
        }
    };

    const handleClearEPG = () => {
        clearEpg();
        setEpgInputUrl('');
        setStatusMsg('Se ha eliminado la guía EPG.');
        setTimeout(() => setStatusMsg(''), 2000);
    };

    return (
        <div 
            onClick={onClose} 
            style={{ 
                position: 'fixed', inset: 0, zIndex: 10000, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
                animation: 'fadeIn 0.2s ease-out',
                padding: '16px'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto',
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
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Añadir Lista de Canales</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'var(--bg-glass)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)' }}>
                    <button 
                        onClick={() => { setTab('recommended'); setStatusMsg(''); }}
                        style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'recommended' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'recommended' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '13px', transition: 'all 0.2s' }}
                    >
                        <Sparkles size={16} /> Recomendadas
                    </button>
                    <button 
                        onClick={() => { setTab('m3u'); setStatusMsg(''); }}
                        style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'm3u' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'm3u' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '13px', transition: 'all 0.2s' }}
                    >
                        <Link2 size={16} /> Enlace M3U
                    </button>
                    <button 
                        onClick={() => { setTab('file'); setStatusMsg(''); }}
                        style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'file' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'file' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '13px', transition: 'all 0.2s' }}
                    >
                        <Upload size={16} /> Archivo
                    </button>
                    <button 
                        onClick={() => { setTab('xtream'); setStatusMsg(''); }}
                        style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'xtream' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'xtream' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '13px', transition: 'all 0.2s' }}
                    >
                        <KeySquare size={16} /> Xtream
                    </button>
                    <button 
                        onClick={() => { setTab('epg'); setStatusMsg(''); }}
                        style={{ flex: 1, padding: '14px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, color: tab === 'epg' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === 'epg' ? '2px solid var(--accent)' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '13px', transition: 'all 0.2s' }}
                    >
                        <Calendar size={16} /> Guía EPG
                    </button>
                </div>

                {/* Status Message */}
                {statusMsg && (
                    <div style={{
                        margin: '16px 24px 0',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: statusMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: statusMsg.startsWith('Error') ? '1px solid #ef4444' : '1px solid #10b981',
                        color: statusMsg.startsWith('Error') ? '#f87171' : '#34d399',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        lineHeight: 1.4
                    }}>
                        {statusMsg}
                    </div>
                )}

                {/* Forms Area */}
                <div style={{ padding: '24px' }}>
                    {tab === 'recommended' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 4px', lineHeight: 1.4 }}>
                                Selecciona una lista temática pública para agregar canales de inmediato a tu biblioteca local:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                                {RECOMMENDED_LISTS.map((list) => {
                                    const isAlreadyAdded = customPlaylists.some(p => p.url === list.url);
                                    return (
                                        <div 
                                            key={list.url} 
                                            style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                gap: '6px',
                                                padding: '12px 16px', 
                                                background: 'rgba(255,255,255,0.02)', 
                                                borderRadius: '12px', 
                                                border: '1px solid var(--border)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{list.name}</span>
                                                <button
                                                    disabled={loading || isAlreadyAdded}
                                                    onClick={() => handleImportRecommended(list.url, list.name.replace(/^[^\s]+\s+/, ''))}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        border: 'none',
                                                        background: isAlreadyAdded ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
                                                        color: isAlreadyAdded ? 'var(--text-muted)' : 'white',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        cursor: (loading || isAlreadyAdded) ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {isAlreadyAdded ? 'Agregada' : 'Añadir'}
                                                </button>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{list.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {tab === 'm3u' && (
                        <form onSubmit={handleConnectM3U} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Nombre de la Lista (Opcional)</label>
                                <input type="text" disabled={loading} value={m3uName} onChange={e => setM3uName(e.target.value)} placeholder="Ej. Mis Canales Deportivos" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>URL de la Lista M3U *</label>
                                <div style={{ position: 'relative' }}>
                                    <Link2 size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                    <input type="url" required disabled={loading} value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} placeholder="https://ejemplo.com/canales.m3u" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Importando...' : 'Guardar Lista M3U'}
                            </button>
                        </form>
                    )}

                    {tab === 'file' && (
                        <form onSubmit={handleUploadM3UFile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Nombre de la Lista (Opcional)</label>
                                <input type="text" disabled={loading} value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Ej. Mi Archivo Local" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Seleccionar Archivo .m3u / .m3u8 *</label>
                                <div style={{ 
                                    border: '2px dashed var(--border)', 
                                    borderRadius: '12px', 
                                    padding: '24px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.01)',
                                    position: 'relative'
                                }}>
                                    <input 
                                        type="file" 
                                        accept=".m3u,.m3u8,text/plain" 
                                        required
                                        disabled={loading}
                                        onChange={handleFileChange}
                                        style={{ 
                                            position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer'
                                        }} 
                                    />
                                    <FileText size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                                    <span style={{ fontSize: '14px', display: 'block', fontWeight: 500 }}>
                                        {selectedFile ? selectedFile.name : 'Haz clic para seleccionar o arrastra el archivo'}
                                    </span>
                                    {selectedFile && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button type="submit" disabled={loading || !selectedFile} style={{ marginTop: 8, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: (loading || !selectedFile) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: (loading || !selectedFile) ? 0.7 : 1 }}>
                                {loading ? 'Importando...' : 'Cargar Archivo M3U'}
                            </button>
                        </form>
                    )}

                    {tab === 'xtream' && (
                        <form onSubmit={handleConnectXtream} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Nombre de la Lista (Opcional)</label>
                                <input type="text" disabled={loading} value={xtreamName} onChange={e => setXtreamName(e.target.value)} placeholder="Ej. Mi Proveedor Xtream" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>URL del Servidor *</label>
                                <div style={{ position: 'relative' }}>
                                    <Server size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                    <input type="url" required disabled={loading} value={xtreamUrl} onChange={e => setXtreamUrl(e.target.value)} placeholder="http://proveedor.tv:8080" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Usuario *</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                        <input type="text" required disabled={loading} value={xtreamUser} onChange={e => setXtreamUser(e.target.value)} placeholder="Usuario" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Contraseña *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                        <input type="password" required disabled={loading} value={xtreamPass} onChange={e => setXtreamPass(e.target.value)} placeholder="Contraseña" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Conectando...' : 'Guardar Credenciales Xtream'}
                            </button>
                        </form>
                    )}

                    {tab === 'epg' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <form onSubmit={handleConnectEPG} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>URL de la Guía EPG (XMLTV) *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
                                        <input 
                                            type="url" 
                                            required 
                                            disabled={loading} 
                                            value={epgInputUrl} 
                                            onChange={e => setEpgInputUrl(e.target.value)} 
                                            placeholder="https://ejemplo.com/guia.xml" 
                                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-glass)', color: 'var(--text)', outline: 'none' }} 
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        type="submit" 
                                        disabled={loading || !epgInputUrl} 
                                        style={{ flex: 2, padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 15, cursor: (loading || !epgInputUrl) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: (loading || !epgInputUrl) ? 0.7 : 1 }}
                                    >
                                        {loading ? 'Cargando EPG...' : 'Cargar Guía EPG'}
                                    </button>
                                    {epgUrlStore && (
                                        <button 
                                            type="button" 
                                            onClick={handleClearEPG}
                                            style={{ flex: 1, padding: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '10px', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            </form>

                            {epgUrlStore && (
                                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '12.5px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Guía EPG Activa:</span>
                                    <span style={{ wordBreak: 'break-all', color: 'var(--accent)', fontWeight: 500 }}>{epgUrlStore}</span>
                                </div>
                            )}

                            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>¿No tienes una guía EPG?</h4>
                                <div 
                                    onClick={() => {
                                        setEpgInputUrl('https://raw.githubusercontent.com/davidmuma/EPG_ES/master/guia.xml');
                                    }}
                                    style={{ 
                                        padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.2s'
                                    }}
                                    className="hover:border-var-accent hover:bg-white/5"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>🇪🇸/🌎 Guía de España y Latam (DavidMuma)</span>
                                        <span style={{ fontSize: '11px', background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Recomendado</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                        Una de las mejores guías XMLTV públicas para canales en español. Haz clic para rellenar la URL arriba.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* My Playlists */}
                    {customPlaylists.length > 0 && (
                        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mis Listas Guardadas</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {customPlaylists.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>{p.name}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{p.type.toUpperCase()}</p>
                                        </div>
                                        <button 
                                            onClick={() => removePlaylist(p.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex' }}
                                            title="Eliminar Lista"
                                        >
                                            <Trash2 size={16} />
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
