"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Eye, Star, Activity, PlayCircle, Volume2, VolumeX, Trophy } from 'lucide-react';

export default function AnimeDashboard() {
  const [animes, setAnimes] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [isMuted, setIsMuted] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const bgMusic = useRef<HTMLAudioElement | null>(null);

  // 1. Carregar dados e evitar erro de servidor (Hydration)
  useEffect(() => {
    setIsMounted(true);
    const salvos = localStorage.getItem('otaku-db-v3');
    if (salvos) {
      try { setAnimes(JSON.parse(salvos)); } catch (e) { setAnimes([]); }
    }
    bgMusic.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.1;
  }, []);

  const toggleMusic = () => {
    if (isMuted) bgMusic.current?.play().catch(() => {});
    else bgMusic.current?.pause();
    setIsMuted(!isMuted);
  };

  const salvarNoBanco = (novaLista: any[]) => {
    setAnimes(novaLista);
    localStorage.setItem('otaku-db-v3', JSON.stringify(novaLista));
  };

  async function buscarAnime() {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${input}&limit=1`);
      const json = await res.json();
      if (json.data && json.data[0]) {
        const a = json.data[0];
        const novo = {
          id: Date.now(),
          titulo: a.title,
          imagem: a.images.jpg.large_image_url,
          nota: a.score || 0,
          sinopse: a.synopsis?.slice(0, 160) + "...",
          assistido: false
        };
        salvarNoBanco([novo, ...animes]);
        setInput('');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // 2. Cálculo das estatísticas (Blindado)
  const stats = useMemo(() => {
    if (!isMounted) return { total: 0, vistos: 0, media: "0", progresso: 0 };
    const total = animes.length;
    const vistos = animes.filter(a => a.assistido).length;
    const media = total > 0 ? (animes.reduce((acc, a) => acc + Number(a.nota), 0) / total).toFixed(1) : "0";
    const progresso = total > 0 ? Math.round((vistos / total) * 100) : 0;
    return { total, vistos, media, progresso };
  }, [animes, isMounted]);

  const rankingIds = useMemo(() => {
    if (!isMounted) return [];
    return [...animes].sort((a, b) => Number(b.nota) - Number(a.nota)).slice(0, 3).map(a => a.id);
  }, [animes, isMounted]);

  const animesFiltrados = useMemo(() => {
    if (filtro === 'vistos') return animes.filter(a => a.assistido);
    if (filtro === 'fila') return animes.filter(a => !a.assistido);
    if (filtro === 'top') return animes.filter(a => Number(a.nota) >= 8);
    return animes;
  }, [animes, filtro]);

  // Se não estiver montado no navegador ainda, não renderiza nada para evitar erro de HTML diferente
  if (!isMounted) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-20">
      
      {/* BOTÃO MÚSICA */}
      <button onClick={toggleMusic} className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-xl p-4 rounded-full border border-white/20">
        {isMuted ? <VolumeX className="text-red-500" /> : <Volume2 className="text-green-400 animate-pulse" />}
      </button>

      <header className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-10 gap-8">
        <div className="bg-[#ff003c] p-4 -skew-x-12 border-2 border-white shadow-[6px_6px_0px_white]">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">ZZN-JK.STATION</h1>
        </div>
        
        <div className="flex w-full lg:w-auto gap-3">
          <input 
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarAnime()}
            placeholder="NOME DO ANIME..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-[#ff003c] w-full lg:w-96"
          />
          <button onClick={buscarAnime} className="bg-[#ff003c] px-8 rounded-2xl font-black">
            {loading ? "..." : <Plus />}
          </button>
        </div>
      </header>

      {/* STATUS - TODOS COM SUPPRESS PARA O GOOGLE NÃO QUEBRAR */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'TOTAL', val: stats.total, col: 'text-white' },
          { label: 'VISTOS', val: stats.vistos, col: 'text-green-400' },
          { label: 'MÉDIA', val: stats.media, col: 'text-yellow-400' },
          { label: 'PROGRESSO', val: stats.progresso + '%', col: 'text-blue-400' }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
            <div suppressHydrationWarning className={`text-[10px] opacity-50 font-bold ${s.col}`}>{s.label}</div>
            <div suppressHydrationWarning className={`text-2xl font-black ${s.col}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="max-w-7xl mx-auto mb-10 flex gap-4 overflow-x-auto pb-2">
        {['todos', 'vistos', 'fila', 'top'].map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-6 py-2 rounded-xl font-bold text-[10px] border transition-all ${filtro === f ? 'bg-white text-black border-white' : 'border-white/20 text-white/40'}`}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* GRID DE CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        <AnimatePresence mode="popLayout">
          {animesFiltrados.map((anime) => {
            const rankIndex = rankingIds.indexOf(anime.id);
            return (
              <motion.div key={anime.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className={`relative group rounded-3xl overflow-hidden border-2 bg-white/5 ${rankIndex !== -1 ? 'border-yellow-400' : 'border-white/10'}`}>
                
                <div className="relative aspect-[3/4]">
                  <img src={anime.imagem} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all p-6 flex items-center text-center text-[10px]">
                    {anime.sinopse}
                  </div>
                  <button onClick={() => salvarNoBanco(animes.map(a => a.id === anime.id ? {...a, assistido: !a.assistido} : a))}
                    className={`absolute top-4 left-4 p-2 rounded-xl ${anime.assistido ? 'bg-green-500' : 'bg-black/50'}`}>
                    <CheckCircle2 size={18}/>
                  </button>
                  {rankIndex !== -1 && <Trophy className="absolute top-4 right-4 text-yellow-400" size={20} />}
                </div>

                <div className="p-4 bg-black/40 flex justify-between items-center">
                  <div className="truncate">
                    <h3 suppressHydrationWarning className="font-bold text-[11px] uppercase truncate">{anime.titulo}</h3>
                    <span suppressHydrationWarning className="text-yellow-400 text-[10px] flex items-center gap-1"><Star size={10} fill="currentColor"/> {anime.nota}</span>
                  </div>
                  <button onClick={() => salvarNoBanco(animes.filter(a => a.id !== anime.id))} className="text-white/20 hover:text-red-500">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </main>
  );
}