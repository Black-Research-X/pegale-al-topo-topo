import React from 'react';
import {
  ArrowLeft,
  Trophy,
  Zap,
  Shield,
  Heart,
  Clock,
  Flame,
  Volume2,
  Keyboard,
  MousePointer,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { MoleGraphic } from './MoleGraphic';
import { MoleMascotBadge } from './MoleMascotBadge';
import { sound } from '../utils/audio';

interface InstructionsPageProps {
  onBackToGame: () => void;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({ onBackToGame }) => {
  const handleTestSound = (type: 'whack' | 'squeak' | 'golden' | 'freeze' | 'bomb') => {
    if (type === 'whack') sound.playWhack(2);
    else if (type === 'squeak') sound.playSqueak();
    else if (type === 'golden') sound.playGoldenHit();
    else if (type === 'freeze') sound.playFreeze();
    else if (type === 'bomb') sound.playBomb();
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 text-amber-50">
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-amber-900/80">
        <button
          onClick={onBackToGame}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 hover:text-white border border-amber-800 transition-all active:scale-95 text-xs sm:text-sm font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Menú Principal</span>
        </button>

        <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-800/60">
          /instrucciones
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-amber-950/90 border-2 border-amber-600/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md mb-8 text-center relative overflow-hidden">
        <div className="flex justify-center mb-4">
          <MoleMascotBadge className="w-24 h-24 sm:w-28 sm:h-28" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black font-['Fredoka'] text-amber-300 tracking-wide drop-shadow-md">
          Manual Oficial de Instrucciones
        </h1>
        <p className="text-xs sm:text-sm text-amber-200/80 mt-2 max-w-xl mx-auto leading-relaxed">
          Bienvenido a <strong>Pégale al Topo Arcade</strong>. Aprende las reglas, conoce a cada topo del jardín, domina el sistema de combos y prepárate para conquistar el Salón de la Fama.
        </p>
      </div>

      {/* Grid of Instructions Sections */}
      <div className="space-y-8">
        {/* Section 1: Objetivo General */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>1. Objetivo del Juego</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/85 leading-relaxed">
            Los topos asoman sus cabezas por los hoyos del jardín de manera aleatoria. Tu objetivo es utilizar tu <strong>mazo</strong> para golpearlos rápidamente antes de que se escondan bajo tierra. Cuantos más topos noquees de forma consecutiva sin fallar, mayor será tu racha de combo y los puntos que acumularás en tu cuenta de Google.
          </p>
        </section>

        {/* Section 2: Familia de Topos y Puntuación */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>2. Familia de Topos y Puntuación</span>
            </h2>
            <span className="text-[11px] text-amber-300/80 hidden sm:inline">
              Haz clic en &quot;Sonido&quot; para escucharlo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topo Clásico */}
            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="NORMAL" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-amber-100 text-sm">Topo Clásico</h3>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded">
                    +100 pts
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 leading-snug">
                  El travieso topo común. Aparece y se esconde a velocidad estándar. Golpéalo antes de que regrese bajo tierra.
                </p>
                <button
                  onClick={() => handleTestSound('whack')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido de impacto</span>
                </button>
              </div>
            </div>

            {/* Topo Dorado */}
            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-600/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="GOLDEN" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-amber-300 text-sm">Topo Rey Dorado</h3>
                  <span className="text-xs font-mono font-bold text-yellow-300 bg-amber-950 px-2 py-0.5 rounded">
                    +300 pts
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 leading-snug">
                  Porta una corona real y destella con brillo dorado. ¡Es muy codiciado pero se esconde más rápido!
                </p>
                <button
                  onClick={() => handleTestSound('golden')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-300 hover:text-yellow-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido campanilla real</span>
                </button>
              </div>
            </div>

            {/* Topo Obrero (Casco) */}
            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="HELMET" state="UP" hitsLeft={2} maxHits={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-amber-100 text-sm">Topo con Casco</h3>
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded">
                    2 Golpes (+200 pts)
                  </span>
                </div>
                <p className="text-xs text-amber-200/80 leading-snug">
                  Requiere 2 impactos: el primer golpe abolla y derriba su casco (+50 pts) y el segundo lo noquea (+150 pts).
                </p>
                <button
                  onClick={() => handleTestSound('whack')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido golpe metálico</span>
                </button>
              </div>
            </div>

            {/* Topo Ninja */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="NINJA" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-purple-200 text-sm">Topo Ninja</h3>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded">
                    +200 pts
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 leading-snug">
                  Entrenado en las sombras. Asoma su cabeza en fracciones de segundo. Solo los jugadores con mejores reflejos logran golpearlo.
                </p>
                <button
                  onClick={() => handleTestSound('whack')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-purple-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido rápido</span>
                </button>
              </div>
            </div>

            {/* Topo Congelado */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="FROZEN" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-cyan-200 text-sm">Topo Congelado</h3>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded">
                    +150 pts + Ralentizar
                  </span>
                </div>
                <p className="text-xs text-cyan-200/80 leading-snug">
                  ¡Poder especial! Al golpearlo congela el ambiente 5 segundos: todos los topos se mueven a mitad de velocidad para aporrear sin parar.
                </p>
                <button
                  onClick={() => handleTestSound('freeze')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido de escarcha</span>
                </button>
              </div>
            </div>

            {/* Topo Dinamita */}
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/70 flex items-start gap-4">
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                <MoleGraphic type="BOMB" state="UP" hitsLeft={1} maxHits={1} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-red-300 text-sm">Topo Dinamita (Bomba)</h3>
                  <span className="text-xs font-mono font-bold text-red-400 bg-black/50 px-2 py-0.5 rounded">
                    ¡PELIGRO!
                  </span>
                </div>
                <p className="text-xs text-red-200/80 leading-snug">
                  ¡No lo toques! Si lo golpeas restará <strong>-200 puntos</strong>, romperá tu racha de combo y te quitará 1 corazón en Supervivencia.
                </p>
                <button
                  onClick={() => handleTestSound('bomb')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-300 hover:text-red-100 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sonido explosión</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Modos de Juego */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>3. Modos de Juego</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/60">
              <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Contrarreloj</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Dispones de <strong>60 segundos</strong> en el cronómetro. El objetivo es conseguir la puntuación más alta posible encadenando combos y topos dorados. En los últimos 10 segundos la música se acelera.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/60">
              <div className="flex items-center gap-2 mb-2 text-red-300 font-bold text-sm">
                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                <span>Supervivencia</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Comienzas con <strong>3 vidas (corazones)</strong>. Si un topo normal se escapa sin que lo golpees, o si golpeas una bomba, perderás 1 vida. ¡La partida termina cuando se agotan tus corazones!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/60">
              <div className="flex items-center gap-2 mb-2 text-orange-300 font-bold text-sm">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span>Frenesí Arcade</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                45 segundos con velocidad acelerada continua. Los topos aparecen a un ritmo implacable y otorgan puntuaciones multiplicadas para jugadores veteranos.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Sistema de Combos y Multiplicadores */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>4. Sistema de Rachas y Combos</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/85 leading-relaxed mb-4">
            Cada topo que golpees consecutivamente incrementará tu contador de racha. Al alcanzar ciertos hitos se desbloquean multiplicadores que multiplican todos los puntos que consigas:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-amber-900/50 border border-amber-800/70">
              <span className="font-mono font-bold text-amber-300 text-base block">1 a 4 golpes</span>
              <span className="text-[11px] text-amber-200/70">Multiplicador x1 (Normal)</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-900/50 border border-amber-700">
              <span className="font-mono font-bold text-yellow-300 text-base block">5 a 9 golpes</span>
              <span className="text-[11px] text-amber-200 font-semibold">Multiplicador x2</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-900/60 border border-orange-600">
              <span className="font-mono font-bold text-orange-400 text-base block">10 a 14 golpes</span>
              <span className="text-[11px] text-orange-200 font-semibold">Multiplicador x3 (Fuego)</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-900/70 border border-red-500">
              <span className="font-mono font-bold text-red-400 text-base block">15+ golpes</span>
              <span className="text-[11px] text-red-200 font-bold">Ultra Combo x5</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-900/30 border border-amber-800/50 text-xs text-amber-200/80">
            ⚠️ <strong>Importante:</strong> Dar un golpe al aire (fallar) o golpear una dinamita reinicia inmediatamente tu racha de combo a 0.
          </div>
        </section>

        {/* Section 5: Controles */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2 mb-4">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <span>5. Controles y Formas de Jugar</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/60 flex items-start gap-3">
              <MousePointer className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-100 mb-1">Ratón o Pantalla Táctil</h3>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  En ordenadores, el cursor se transforma en un mazo físico que sigue tus movimientos. Haz clic sobre el hoyo para golpear. En teléfonos o tablets, simplemente toca el hoyo en el que aparezca el topo.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-900/40 border border-amber-800/60 flex items-start gap-3">
              <Keyboard className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-100 mb-1">Atajos de Teclado (PC)</h3>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Para velocidades récord en PC, puedes usar los números del teclado <strong>[1 al 9]</strong> o las letras <strong>[Q,W,E / A,S,D / Z,X,C]</strong> correspondientes a la posición de cada hoyo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Cuentas y Récords */}
        <section className="bg-amber-950/85 border border-amber-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-bold font-['Fredoka'] text-amber-300 flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>6. Autenticación y Salón de Récords Global</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-200/85 leading-relaxed">
            Para jugar es requisito iniciar sesión con tu cuenta de <strong>Google / Gmail</strong>. Esto permite registrar de forma segura tu perfil, tu mejor récord personal y competir en tiempo real en la pestaña <strong>Nube Global</strong> del Salón de la Fama.
          </p>
        </section>
      </div>

      {/* Footer CTA */}
      <div className="mt-8 text-center pb-6">
        <button
          onClick={onBackToGame}
          className="px-8 py-4 rounded-2xl font-black font-['Fredoka'] text-lg sm:text-xl text-amber-950 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 fill-amber-950" />
          <span>¡Volver al Menú y Jugar!</span>
        </button>
      </div>
    </div>
  );
};
