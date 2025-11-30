import React, { useState, useEffect, useMemo, useRef } from 'react';
import MatrixParticles from './components/MatrixParticles';
import EigenDistribution from './components/EigenDistribution';
import { ModelStatus, TrainingMetrics } from './types';
import { analyzeRankState } from './services/geminiService';
import { Activity, Zap, Brain, AlertTriangle, MessageSquare, Play, Pause, Languages } from 'lucide-react';

const translations = {
  en: {
    title: "RANK",
    subtitle: "Large Model Training Dynamics Visualizer",
    rankParam: "Rank Parameter (r)",
    collapse: "Collapse (↓)",
    optimal: "Optimal (≈)",
    explosion: "Explosion (↑)",
    loss: "Training Loss",
    vram: "VRAM Usage (GB)",
    iq: "Est. IQ",
    grad: "Gradient Norm",
    aiAnalysis: "AI Analysis",
    analyzeBtn: "Analyze State",
    analyzing: "Thinking...",
    startSim: "Simulate Training",
    stopSim: "Stop Simulation",
    visualization: "VISUALIZATION",
    statusCollapsed: "FEATURE COLLAPSE",
    statusStable: "MANIFOLD STABLE",
    statusExploding: "GRADIENT DIVERGENCE",
    simMode: "AUTO-TRAINING",
    modelName: "MODEL: GEMINI-ARCH-SIM-v2",
    session: "SESSION",
    promptHint: "Adjust rank and ask AI to interpret the training dynamics..."
  },
  zh: {
    title: "秩 (RANK)",
    subtitle: "大模型训练动态可视化 - 秩的平衡",
    rankParam: "秩参数 (Rank)",
    collapse: "塌缩 (Collapse ↓)",
    optimal: "平衡 (Optimal ≈)",
    explosion: "爆炸 (Explosion ↑)",
    loss: "训练损失 (Loss)",
    vram: "显存占用 (VRAM)",
    iq: "智商估计 (IQ)",
    grad: "梯度范数 (Grad)",
    aiAnalysis: "AI 分析",
    analyzeBtn: "分析状态",
    analyzing: "思考中...",
    startSim: "开始训练模拟",
    stopSim: "停止模拟",
    visualization: "可视化视图",
    statusCollapsed: "特征塌缩 (COLLAPSE)",
    statusStable: "流形稳定 (STABLE)",
    statusExploding: "梯度爆炸 (EXPLOSION)",
    simMode: "自动训练模拟",
    modelName: "模型: GEMINI-ARCH-SIM-v2",
    session: "会话",
    promptHint: "调整 Rank 值并让 AI 解释当前的训练动态..."
  }
};

const App: React.FC = () => {
  const [rank, setRank] = useState<number>(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [lang, setLang] = useState<'en' | 'zh'>('zh'); // Default to Chinese as requested
  const [isSimulating, setIsSimulating] = useState(false);

  const t = translations[lang];

  // Simulation loop refs
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Derived state
  const status = useMemo((): ModelStatus => {
    if (rank < 30) return ModelStatus.COLLAPSED;
    if (rank > 70) return ModelStatus.EXPLODING;
    return ModelStatus.STABLE;
  }, [rank]);

  const metrics = useMemo((): TrainingMetrics => {
    let loss = 0;
    let vram = 0;
    let iq = 0;
    let grad = 0;

    if (status === ModelStatus.COLLAPSED) {
        // Low rank: Loss plateaus high, VRAM low, IQ drops
        loss = 2.5 + (30 - rank) * 0.1;
        vram = 12 + rank * 0.1; // GB
        iq = rank * 2;
        grad = 0.001;
    } else if (status === ModelStatus.EXPLODING) {
        // High rank: Loss explodes, VRAM maxes, Grad infinite
        loss = 0.5 + Math.exp((rank - 70) / 5);
        vram = 40 + (rank - 70) * 2;
        iq = 100 - (rank - 70) * 3; // Gets dumb as it explodes due to noise
        grad = Math.pow(10, (rank - 60) / 5);
    } else {
        // Stable
        loss = 0.4 - Math.abs(50 - rank) * 0.01;
        vram = 24 + (rank - 30) * 0.4;
        iq = 140 - Math.abs(50 - rank);
        grad = 1.0 + (Math.random() - 0.5) * 0.1;
    }
    
    return {
        loss: Math.max(0, loss),
        vramUsage: Math.min(80, vram),
        intelligenceScore: Math.max(0, iq),
        gradientNorm: grad
    };
  }, [rank, status]);

  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRank(parseInt(e.target.value, 10));
    setAiAnalysis(""); // Clear analysis on change
    if (isSimulating) setIsSimulating(false); // Stop sim on manual intervention
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeRankState(rank, status, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
    setAiAnalysis(""); // Clear analysis as it is language specific
  };

  // Simulation Logic
  useEffect(() => {
    if (!isSimulating) {
        cancelAnimationFrame(requestRef.current);
        return;
    }

    const animate = (time: number) => {
        if (!timeRef.current) timeRef.current = time;
        const deltaTime = (time - timeRef.current) * 0.001;
        
        // Simulation Physics:
        // A "Battle" implies oscillation and sudden drifts.
        // We use a sum of sin waves to create a semi-predictable but chaotic path
        const now = Date.now() / 1000;
        
        // Base drift
        const base = Math.sin(now * 0.5) * 30; // Large slow swing +/- 30
        const jitter = Math.sin(now * 2.5) * 10; // Fast jitter +/- 10
        const noise = (Math.random() - 0.5) * 5; // Random noise
        
        let targetRank = 50 + base + jitter + noise;
        
        // Clamp
        if (targetRank < 0) targetRank = 0;
        if (targetRank > 100) targetRank = 100;

        // Smooth transition
        setRank(prev => {
            const diff = targetRank - prev;
            return Math.round(prev + diff * 0.05);
        });

        requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isSimulating]);

  // Status color helpers
  const getStatusColor = () => {
    switch (status) {
        case ModelStatus.COLLAPSED: return 'text-slate-400';
        case ModelStatus.EXPLODING: return 'text-rose-500';
        case ModelStatus.STABLE: return 'text-cyan-400';
    }
  };

  const getBorderColor = () => {
    switch (status) {
        case ModelStatus.COLLAPSED: return 'border-slate-700 shadow-slate-900/50';
        case ModelStatus.EXPLODING: return 'border-rose-900 shadow-rose-900/50';
        case ModelStatus.STABLE: return 'border-cyan-900 shadow-cyan-900/50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 flex flex-col items-center font-sans">
      
      {/* Header */}
      <header className="w-full max-w-5xl mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">
              {t.title} <span className={getStatusColor()}>{status}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="hidden md:block text-right">
                <div className="text-xs text-slate-500 font-mono">{t.modelName}</div>
                <div className="text-xs text-slate-500 font-mono">{t.session}: {Date.now()}</div>
            </div>
            <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-xs px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
            >
                <Languages size={14} /> {lang === 'en' ? '中文' : 'English'}
            </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls & Metrics */}
        <div className="space-y-6">
            
            {/* Rank Slider Control */}
            <div className={`p-6 rounded-xl border bg-slate-900/50 backdrop-blur-sm ${getBorderColor()} transition-all duration-300 relative overflow-hidden`}>
                {/* Simulation Indicator */}
                {isSimulating && (
                    <div className="absolute top-0 right-0 p-2">
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-cyan-500 animate-pulse">
                            <Activity size={10} /> {t.simMode}
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold uppercase tracking-wider text-slate-300">{t.rankParam}</label>
                    <span className={`font-mono text-xl font-bold ${getStatusColor()}`}>{rank}</span>
                </div>
                
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={rank} 
                    onChange={handleRankChange}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 relative z-10"
                />
                
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase">
                    <span>{t.collapse}</span>
                    <span>{t.optimal}</span>
                    <span>{t.explosion}</span>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            isSimulating 
                                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/50' 
                                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/50'
                        }`}
                    >
                        {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                        {isSimulating ? t.stopSim : t.startSim}
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <MetricCard 
                    label={t.loss}
                    value={metrics.loss.toFixed(4)} 
                    icon={<Activity size={16} />}
                    color={status === ModelStatus.EXPLODING ? 'text-rose-500' : 'text-slate-200'}
                />
                <MetricCard 
                    label={t.vram}
                    value={metrics.vramUsage.toFixed(1)} 
                    icon={<Zap size={16} />}
                    color={metrics.vramUsage > 70 ? 'text-rose-500' : 'text-slate-200'}
                />
                <MetricCard 
                    label={t.iq}
                    value={metrics.intelligenceScore.toFixed(0)} 
                    icon={<Brain size={16} />}
                    color={status === ModelStatus.STABLE ? 'text-cyan-400' : 'text-slate-500'}
                />
                <MetricCard 
                    label={t.grad}
                    value={metrics.gradientNorm > 1000 ? "NaN" : metrics.gradientNorm.toFixed(3)} 
                    icon={<AlertTriangle size={16} />}
                    color={metrics.gradientNorm > 10 ? 'text-rose-500 animate-pulse' : 'text-slate-200'}
                />
            </div>

            {/* AI Analysis */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <MessageSquare size={14} /> {t.aiAnalysis}
                    </h3>
                    <button 
                        onClick={triggerAnalysis}
                        disabled={isAnalyzing}
                        className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-50 transition-colors"
                    >
                        {isAnalyzing ? t.analyzing : t.analyzeBtn}
                    </button>
                </div>
                <div className="min-h-[80px] text-sm text-slate-400 leading-relaxed font-mono">
                    {aiAnalysis ? (
                        <span className="text-slate-200 typing-effect">{aiAnalysis}</span>
                    ) : (
                        <span className="opacity-50 italic">{t.promptHint}</span>
                    )}
                </div>
            </div>
            
            {/* Eigen Chart */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                <EigenDistribution rank={rank} />
            </div>

        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-2 relative h-[500px] lg:h-auto rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                    status === ModelStatus.STABLE ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' :
                    status === ModelStatus.EXPLODING ? 'bg-rose-950/30 border-rose-500/30 text-rose-500' :
                    'bg-slate-800/50 border-slate-600/30 text-slate-400'
                }`}>
                    {t.visualization}: {status === ModelStatus.STABLE ? t.statusStable : status === ModelStatus.EXPLODING ? t.statusExploding : t.statusCollapsed}
                </div>
            </div>
            <MatrixParticles rank={rank} />
            
            {/* Overlay effects for extreme states */}
            {status === ModelStatus.EXPLODING && (
                <div className="absolute inset-0 pointer-events-none bg-rose-500/10 mix-blend-overlay animate-pulse" />
            )}
            {status === ModelStatus.COLLAPSED && (
                <div className="absolute inset-0 pointer-events-none bg-slate-900/20 backdrop-grayscale-[0.5]" />
            )}
        </div>

      </main>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
            <span className="text-slate-600">{icon}</span>
        </div>
        <div className={`text-xl font-mono font-medium ${color}`}>{value}</div>
    </div>
);

export default App;