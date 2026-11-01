import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award, Globe, Trash2, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ScoreRecord, Achievement } from '../types/game';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  localRecords: ScoreRecord[];
  achievements: Achievement[];
  onClearLocalRecords: () => void;
  initialTab?: 'global' | 'local' | 'achievements';
}

export const RecordsModal: React.FC<RecordsModalProps> = ({
  isOpen,
  onClose,
  localRecords,
  achievements,
  onClearLocalRecords,
  initialTab = 'global',
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'local' | 'achievements'>(initialTab);
  const [globalScores, setGlobalScores] = useState<ScoreRecord[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const modeLabels: Record<string, string> = {
    TIME_ATTACK: 'Contrarreloj',
    SURVIVAL: 'Supervivencia',
    FRENZY: 'Frenesí',
  };

  const fetchGlobalScores = async () => {
    setLoadingGlobal(true);
    try {
      const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(15));
      const snap = await getDocs(q);
      const items: ScoreRecord[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          playerName: data.playerName || 'Jugador',
          score: data.score || 0,
          mode: data.mode || 'TIME_ATTACK',
          difficulty: data.difficulty || 'MEDIUM',
          accuracy: data.accuracy || 0,
          maxCombo: data.maxCombo || 0,
          molesHit: data.molesHit || 0,
          date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Hoy',
        });
      });
      setGlobalScores(items);
    } catch (err) {
      console.warn('Could not fetch global scores, falling back:', err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'global') {
      fetchGlobalScores();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-amber-950 border border-amber-800 rounded-3xl p-6 text-amber-50 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/80 mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black font-['Fredoka'] text-amber-300">
              Récords y Logros
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-amber-900/50 rounded-xl mb-5">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'global'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-amber-200/80 hover:text-amber-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Nube Global</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'local'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-amber-200/80 hover:text-amber-100'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            <span>Mis Partidas</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'achievements'
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-amber-200/80 hover:text-amber-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Logros ({unlockedCount}/{achievements.length})</span>
          </button>
        </div>

        {/* Global Cloud Scores */}
        {activeTab === 'global' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-amber-300">
              <span className="font-semibold">Top Récords en Línea (Google Firebase)</span>
              <button
                onClick={fetchGlobalScores}
                disabled={loadingGlobal}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingGlobal ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {loadingGlobal ? (
              <div className="text-center py-10 text-amber-200/60 text-xs">
                Cargando tabla de clasificación global...
              </div>
            ) : globalScores.length === 0 ? (
              <div className="text-center py-12 text-amber-200/60">
                <p className="text-sm">Aún no hay puntuaciones en la nube.</p>
                <p className="text-xs mt-1">¡Sé el primero en guardar un récord con tu cuenta de Google!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-900/80 text-amber-400 uppercase tracking-wider text-[11px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-3">Jugador Google</th>
                      <th className="py-2 px-3 font-mono tabular-nums text-right">Puntaje</th>
                      <th className="py-2 px-3">Modo</th>
                      <th className="py-2 px-2 text-center">Precisión</th>
                      <th className="py-2 px-2 text-center">Racha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/40">
                    {globalScores.map((rec, index) => (
                      <tr key={rec.id} className="hover:bg-amber-900/30 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-amber-300">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-100">
                          {rec.playerName}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300 text-right text-sm tabular-nums">
                          {rec.score.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-amber-200/80">
                          {modeLabels[rec.mode] || rec.mode}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono tabular-nums text-amber-200">
                          {rec.accuracy}%
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400 tabular-nums">
                          x{rec.maxCombo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Local Personal Scores */}
        {activeTab === 'local' && (
          <div>
            {localRecords.length === 0 ? (
              <div className="text-center py-12 text-amber-200/60">
                <p className="text-sm">Aún no tienes partidas registradas localmente.</p>
                <p className="text-xs mt-1">¡Juega una partida para registrar tu puntuación!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-900/80 text-amber-400 uppercase tracking-wider text-[11px]">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-3">Jugador</th>
                      <th className="py-2 px-3 font-mono tabular-nums text-right">Puntaje</th>
                      <th className="py-2 px-3">Modo</th>
                      <th className="py-2 px-2 text-center">Precisión</th>
                      <th className="py-2 px-2 text-center">Racha</th>
                      <th className="py-2 px-2 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/40">
                    {localRecords.map((rec, index) => (
                      <tr key={rec.id} className="hover:bg-amber-900/30 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-amber-300">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-100">
                          {rec.playerName || 'Jugador'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300 text-right text-sm tabular-nums">
                          {rec.score.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-amber-200/80">
                          {modeLabels[rec.mode] || rec.mode}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono tabular-nums text-amber-200">
                          {rec.accuracy}%
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-400 tabular-nums">
                          x{rec.maxCombo}
                        </td>
                        <td className="py-2.5 px-2 text-right text-amber-200/50">
                          {rec.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {localRecords.length > 0 && (
              <div className="mt-4 flex justify-between items-center pt-3 border-t border-amber-900/60">
                <button
                  onClick={() => {
                    if (window.confirm('¿Deseas borrar el historial de partidas locales?')) {
                      onClearLocalRecords();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Historial Local</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab Content */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  ach.unlocked
                    ? 'bg-amber-900/40 border-amber-600/60'
                    : 'bg-stone-900/30 border-stone-800/80 opacity-50'
                }`}
              >
                <div className="text-2xl p-2 rounded-xl bg-amber-950/80 shrink-0">
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`font-bold text-xs truncate ${ach.unlocked ? 'text-amber-200' : 'text-stone-400'}`}>
                      {ach.title}
                    </h3>
                    {ach.unlocked && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded shrink-0">
                        ¡Completado!
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-200/70 mt-1 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors cursor-pointer text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
