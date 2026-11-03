/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db, logOut, handleFirestoreError, OperationType } from './lib/firebase';
import type {
  MoleData,
  MoleType,
  GameMode,
  Difficulty,
  HammerId,
  FloatingTextItem,
  ParticleItem,
  ScoreRecord,
  Achievement,
  GameStats,
} from './types/game';
import { INITIAL_ACHIEVEMENTS } from './types/game';
import { sound } from './utils/audio';
import { Navigation } from './components/Navigation';
import { AuthGate } from './components/AuthGate';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { MoleHole } from './components/MoleHole';
import { MalletCursor } from './components/MalletCursor';
import { FloatingEffects } from './components/FloatingEffects';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HammersModal } from './components/HammersModal';
import { RecordsModal } from './components/RecordsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { moleBackdropBase64 } from './assets/images/moleBackdropBase64';

type AppState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [appState, setAppState] = useState<AppState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('TIME_ATTACK');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [selectedHammer, setSelectedHammer] = useState<HammerId>(() => {
    try {
      return (localStorage.getItem('mole_selected_hammer') as HammerId) || 'WOODEN';
    } catch {
      return 'WOODEN';
    }
  });

  // Sound mute state
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());

  // Keyboard shortcut hints toggle
  const [showKeyHints, setShowKeyHints] = useState(true);

  // Modals
  const [howToOpen, setHowToOpen] = useState(false);
  const [hammersOpen, setHammersOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordsInitialTab, setRecordsInitialTab] = useState<'global' | 'local' | 'achievements'>('global');

  // Persistence: High Scores & Achievements
  const [localRecords, setLocalRecords] = useState<ScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mole_arcade_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem('mole_arcade_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        return INITIAL_ACHIEVEMENTS.map((item) => {
          const found = parsed.find((p: Achievement) => p.id === item.id);
          return found ? { ...item, unlocked: found.unlocked } : item;
        });
      }
      return INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  });

  // In-Game Live State
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const maxLives = 3;
  const [combo, setCombo] = useState(0);
  const [maxComboGame, setMaxComboGame] = useState(0);

  // Freeze state (Ice Mole hit)
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);

  // Screen shake effect
  const [screenShake, setScreenShake] = useState(false);
  const [redFlash, setRedFlash] = useState(false);

  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    molesHitTotal: 0,
    normalHits: 0,
    goldenHits: 0,
    ninjaHits: 0,
    helmetHits: 0,
    frozenHits: 0,
    bombsAvoided: 0,
    bombsHit: 0,
    totalSwings: 0,
    hits: 0,
    misses: 0,
    maxCombo: 0,
  });

  // Grid Holes
  const holeCount = difficulty === 'HARD' ? 16 : 9;
  const keyMap3x3 = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const keyAlt3x3 = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
  const keyMap4x4 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'q', 'w', 'e', 'r', 't', 'y'];

  const [moles, setMoles] = useState<MoleData[]>([]);

  // Visual Effects
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [particles, setParticles] = useState<ParticleItem[]>([]);

  // Mallet Cursor
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isSwinging, setIsSwinging] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const activeMolesRef = useRef<MoleData[]>([]);

  // Highest recorded score
  const highestScore = localRecords.length > 0 ? Math.max(...localRecords.map((r) => r.score)) : 0;

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize holes array when difficulty or hole count changes
  useEffect(() => {
    const newMoles: MoleData[] = Array.from({ length: holeCount }, (_, i) => ({
      id: i,
      index: i,
      type: 'NORMAL',
      state: 'HIDDEN',
      hitsLeft: 1,
      maxHits: 1,
      emergeTimestamp: 0,
      durationMs: 1500,
      keyLabel: difficulty === 'HARD' ? (keyMap4x4[i] || `${i + 1}`).toUpperCase() : keyMap3x3[i],
    }));
    setMoles(newMoles);
    activeMolesRef.current = newMoles;
  }, [holeCount, difficulty]);

  // Audio mute toggle handler
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Hammer selector
  const handleSelectHammer = (id: HammerId) => {
    setSelectedHammer(id);
    try {
      localStorage.setItem('mole_selected_hammer', id);
    } catch {
      // ignore
    }
  };

  // Spawn visual floating text
  const addFloatingText = (text: string, x: number, y: number, color: string = '#fde047', size: 'sm' | 'md' | 'lg' = 'md') => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, size }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 700);
  };

  // Spawn visual particle burst
  const addParticleBurst = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: ParticleItem[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      return {
        id: `${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        size: 4 + Math.random() * 6,
        shape: Math.random() > 0.4 ? 'star' : 'circle',
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 550);
  };

  // Trigger brief screen shake
  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  };

  // Multiplier calculation
  const getMultiplier = (currentCombo: number) => {
    if (currentCombo >= 15) return 5;
    if (currentCombo >= 10) return 3;
    if (currentCombo >= 5) return 2;
    return 1;
  };

  // Start new game
  const handleStartGame = () => {
    if (!currentUser) return; // Must be authenticated

    setScore(0);
    setTimeLeft(gameMode === 'TIME_ATTACK' ? 60 : gameMode === 'FRENZY' ? 45 : 999);
    setLives(3);
    setCombo(0);
    setMaxComboGame(0);
    setIsFrozen(false);
    setFreezeSecondsLeft(0);
    setStats({
      molesHitTotal: 0,
      normalHits: 0,
      goldenHits: 0,
      ninjaHits: 0,
      helmetHits: 0,
      frozenHits: 0,
      bombsAvoided: 0,
      bombsHit: 0,
      totalSwings: 0,
      hits: 0,
      misses: 0,
      maxCombo: 0,
    });

    // Reset all moles to HIDDEN
    const freshMoles: MoleData[] = Array.from({ length: holeCount }, (_, i) => ({
      id: i,
      index: i,
      type: 'NORMAL',
      state: 'HIDDEN',
      hitsLeft: 1,
      maxHits: 1,
      emergeTimestamp: 0,
      durationMs: 1500,
      keyLabel: difficulty === 'HARD' ? (keyMap4x4[i] || `${i + 1}`).toUpperCase() : keyMap3x3[i],
    }));
    setMoles(freshMoles);
    activeMolesRef.current = freshMoles;

    sound.playStart();
    sound.startBgm(1.0);
    setAppState('PLAYING');
  };

  // Resume or Pause
  const handlePause = () => {
    sound.stopBgm();
    setAppState('PAUSED');
  };

  const handleResume = () => {
    sound.startBgm(1.0);
    setAppState('PLAYING');
  };

  // Game Over trigger
  const handleGameOver = useCallback(() => {
    sound.stopBgm();
    sound.playGameOver();
    setAppState('GAME_OVER');

    // Check achievements
    setAchievements((prev) => {
      let updated = false;
      const next = prev.map((ach) => {
        if (ach.unlocked) return ach;
        let unlock = false;
        if (ach.id === 'FIRST_HIT' && stats.hits >= 1) unlock = true;
        if (ach.id === 'GOLD_HUNTER' && stats.goldenHits >= 3) unlock = true;
        if (ach.id === 'COMBO_KING' && maxComboGame >= 10) unlock = true;
        if (ach.id === 'SHARPSHOOTER' && stats.totalSwings >= 15) {
          const acc = Math.round((stats.hits / stats.totalSwings) * 100);
          if (acc >= 85) unlock = true;
        }
        if (ach.id === 'DEFUSER' && gameMode === 'SURVIVAL' && stats.bombsHit === 0 && stats.hits >= 15) {
          unlock = true;
        }
        if (ach.id === 'SCORE_5000' && score >= 5000) unlock = true;

        if (unlock) {
          updated = true;
          return { ...ach, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }
        return ach;
      });

      if (updated) {
        try {
          localStorage.setItem('mole_arcade_achievements', JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [gameMode, maxComboGame, score, stats]);

  // Main Whack Handler
  const handleWhack = (holeIndex: number, clientX?: number, clientY?: number) => {
    if (appState !== 'PLAYING') return;

    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 90);

    const hole = activeMolesRef.current[holeIndex];
    if (!hole) return;

    const targetX = clientX || mousePos.x;
    const targetY = clientY || mousePos.y;

    setStats((prev) => ({
      ...prev,
      totalSwings: prev.totalSwings + 1,
    }));

    if (hole.state === 'UP' || hole.state === 'EMERGING') {
      const isBomb = hole.type === 'BOMB';

      if (isBomb) {
        sound.playBomb();
        triggerScreenShake();
        setRedFlash(true);
        setTimeout(() => setRedFlash(false), 200);

        addFloatingText('-200 ¡BOOM!', targetX, targetY, '#ef4444', 'lg');
        addParticleBurst(targetX, targetY, '#ef4444', 14);

        setScore((prev) => Math.max(0, prev - 200));
        setCombo(0);
        setStats((prev) => ({
          ...prev,
          hits: prev.hits + 1,
          bombsHit: prev.bombsHit + 1,
        }));

        if (gameMode === 'SURVIVAL') {
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setTimeout(() => handleGameOver(), 300);
            }
            return Math.max(0, nextL);
          });
        }

        const updated = activeMolesRef.current.map((m, idx) =>
          idx === holeIndex ? { ...m, state: 'HIT' as const } : m
        );
        activeMolesRef.current = updated;
        setMoles(updated);

        setTimeout(() => {
          const hidden = activeMolesRef.current.map((m, idx) =>
            idx === holeIndex ? { ...m, state: 'HIDDEN' as const } : m
          );
          activeMolesRef.current = hidden;
          setMoles(hidden);
        }, 350);
        return;
      }

      // Helmet mole requires 2 hits!
      if (hole.type === 'HELMET' && hole.hitsLeft > 1) {
        sound.playHelmetHit();
        addFloatingText('¡CASCO FUERA! +50', targetX, targetY, '#facc15', 'sm');
        addParticleBurst(targetX, targetY, '#facc15', 6);

        setScore((prev) => prev + 50);
        setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));

        const updated = activeMolesRef.current.map((m, idx) =>
          idx === holeIndex ? { ...m, hitsLeft: m.hitsLeft - 1 } : m
        );
        activeMolesRef.current = updated;
        setMoles(updated);
        return;
      }

      const currentCombo = combo + 1;
      setCombo(currentCombo);
      setMaxComboGame((prev) => Math.max(prev, currentCombo));

      const mult = getMultiplier(currentCombo);

      let basePoints = 100;
      let hitColor = '#facc15';
      let hitLabel = `+${100 * mult}`;

      if (hole.type === 'GOLDEN') {
        basePoints = 300;
        hitColor = '#fde047';
        hitLabel = `+${300 * mult} ¡ORO!`;
        sound.playGoldenHit();
      } else if (hole.type === 'NINJA') {
        basePoints = 200;
        hitColor = '#c084fc';
        hitLabel = `+${200 * mult} ¡NINJA!`;
        sound.playWhack(currentCombo);
      } else if (hole.type === 'FROZEN') {
        basePoints = 150;
        hitColor = '#38bdf8';
        hitLabel = `+${150 * mult} ¡HIELO!`;
        sound.playFreeze();

        setIsFrozen(true);
        setFreezeSecondsLeft(5);
      } else if (hole.type === 'HELMET') {
        basePoints = 150;
        hitColor = '#fbbf24';
        hitLabel = `+${150 * mult} ¡PLAF!`;
        sound.playWhack(currentCombo);
      } else {
        if (selectedHammer === 'TOY') {
          sound.playSqueak();
        } else if (selectedHammer === 'GOLDEN') {
          sound.playGoldenHit();
        } else {
          sound.playWhack(currentCombo);
        }
      }

      const pointsEarned = basePoints * mult;
      setScore((s) => s + pointsEarned);

      if (currentCombo === 5) {
        sound.playComboUp(1);
        addFloatingText('¡RACHA x2!', targetX, targetY - 24, '#fb923c', 'md');
      } else if (currentCombo === 10) {
        sound.playComboUp(2);
        addFloatingText('¡RACHA x3 FUEGO!', targetX, targetY - 24, '#f97316', 'lg');
        triggerScreenShake();
      } else if (currentCombo === 15) {
        sound.playComboUp(3);
        addFloatingText('¡ULTRA COMBO x5!', targetX, targetY - 24, '#ef4444', 'lg');
        triggerScreenShake();
      }

      addFloatingText(hitLabel, targetX, targetY, hitColor, hole.type === 'GOLDEN' ? 'lg' : 'md');
      addParticleBurst(targetX, targetY, hitColor, hole.type === 'GOLDEN' ? 12 : 8);

      const updated = activeMolesRef.current.map((m, idx) =>
        idx === holeIndex ? { ...m, state: 'HIT' as const } : m
      );
      activeMolesRef.current = updated;
      setMoles(updated);

      setStats((prev) => ({
        ...prev,
        hits: prev.hits + 1,
        molesHitTotal: prev.molesHitTotal + 1,
        normalHits: hole.type === 'NORMAL' ? prev.normalHits + 1 : prev.normalHits,
        goldenHits: hole.type === 'GOLDEN' ? prev.goldenHits + 1 : prev.goldenHits,
        ninjaHits: hole.type === 'NINJA' ? prev.ninjaHits + 1 : prev.ninjaHits,
        helmetHits: hole.type === 'HELMET' ? prev.helmetHits + 1 : prev.helmetHits,
        frozenHits: hole.type === 'FROZEN' ? prev.frozenHits + 1 : prev.frozenHits,
        maxCombo: Math.max(prev.maxCombo, currentCombo),
      }));

      setTimeout(() => {
        const hidden = activeMolesRef.current.map((m, idx) =>
          idx === holeIndex ? { ...m, state: 'HIDDEN' as const } : m
        );
        activeMolesRef.current = hidden;
        setMoles(hidden);
      }, 300);
    } else {
      sound.playMiss();
      setCombo(0);
      setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
      addFloatingText('¡Aire!', targetX, targetY, '#94a3b8', 'sm');
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'PLAYING') return;

      const key = e.key.toLowerCase();
      let matchedIndex = -1;

      if (difficulty === 'HARD') {
        matchedIndex = keyMap4x4.indexOf(key);
      } else {
        const numIndex = keyMap3x3.indexOf(key);
        if (numIndex !== -1) {
          matchedIndex = numIndex;
        } else {
          const letterIndex = keyAlt3x3.indexOf(key);
          if (letterIndex !== -1) {
            matchedIndex = letterIndex;
          }
        }
      }

      if (matchedIndex !== -1 && matchedIndex < holeCount) {
        e.preventDefault();
        handleWhack(matchedIndex, window.innerWidth / 2, window.innerHeight / 2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, difficulty, holeCount]);

  // Freeze timer interval
  useEffect(() => {
    if (!isFrozen) return;
    const interval = window.setInterval(() => {
      setFreezeSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsFrozen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFrozen]);

  // Main Game Clock
  useEffect(() => {
    if (appState !== 'PLAYING') return;
    if (gameMode !== 'TIME_ATTACK' && gameMode !== 'FRENZY') return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        if (prev === 11) {
          sound.setBgmSpeed(1.35);
        }
        return prev - 1;
      });
    }, isFrozen ? 1600 : 1000);

    return () => clearInterval(timer);
  }, [appState, gameMode, handleGameOver, isFrozen]);

  // Mole Spawner and Lifecycle Loop
  useEffect(() => {
    if (appState !== 'PLAYING') return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const now = Date.now();
      const currentMoles = [...activeMolesRef.current];
      let stateChanged = false;

      currentMoles.forEach((m, idx) => {
        if (m.state === 'UP') {
          const effectiveDuration = isFrozen ? m.durationMs * 1.8 : m.durationMs;
          if (now - m.emergeTimestamp >= effectiveDuration) {
            stateChanged = true;
            currentMoles[idx] = { ...m, state: 'HIDDEN' };

            if (gameMode === 'SURVIVAL' && m.type !== 'BOMB') {
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setTimeout(() => handleGameOver(), 200);
                }
                return Math.max(0, nextLives);
              });
              setRedFlash(true);
              setTimeout(() => setRedFlash(false), 200);
              setCombo(0);
            } else if (m.type === 'BOMB') {
              setStats((prev) => ({ ...prev, bombsAvoided: prev.bombsAvoided + 1 }));
            }
          }
        }
      });

      const activeCount = currentMoles.filter((m) => m.state !== 'HIDDEN').length;
      const maxSimultaneous = difficulty === 'HARD' ? 4 : difficulty === 'MEDIUM' ? 3 : 2;

      let spawnInterval = 750;
      if (difficulty === 'EASY') spawnInterval = 1000;
      if (difficulty === 'HARD') spawnInterval = 550;
      if (gameMode === 'FRENZY') spawnInterval = Math.max(380, spawnInterval - 180);
      if (isFrozen) spawnInterval *= 1.6;

      if (activeCount < maxSimultaneous && now - lastSpawnTime.current >= spawnInterval) {
        const hiddenIndices = currentMoles
          .map((m, idx) => (m.state === 'HIDDEN' ? idx : -1))
          .filter((idx) => idx !== -1);

        if (hiddenIndices.length > 0) {
          const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];

          const rand = Math.random();
          let chosenType: MoleType = 'NORMAL';
          let duration = 1400;
          let hitsNeeded = 1;

          if (rand < 0.50) {
            chosenType = 'NORMAL';
            duration = difficulty === 'HARD' ? 1000 : 1300;
          } else if (rand < 0.65) {
            chosenType = 'GOLDEN';
            duration = 900;
          } else if (rand < 0.77) {
            chosenType = 'BOMB';
            duration = 1400;
          } else if (rand < 0.88) {
            chosenType = 'NINJA';
            duration = 650;
          } else if (rand < 0.95) {
            chosenType = 'HELMET';
            duration = 1600;
            hitsNeeded = 2;
          } else {
            chosenType = 'FROZEN';
            duration = 1200;
          }

          if (gameMode === 'FRENZY') {
            duration = Math.max(500, duration * 0.75);
          }

          currentMoles[randomIndex] = {
            ...currentMoles[randomIndex],
            type: chosenType,
            state: 'UP',
            hitsLeft: hitsNeeded,
            maxHits: hitsNeeded,
            emergeTimestamp: now,
            durationMs: duration,
          };

          lastSpawnTime.current = now;
          stateChanged = true;
        }
      }

      if (stateChanged) {
        activeMolesRef.current = currentMoles;
        setMoles(currentMoles);
      }

      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [appState, difficulty, gameMode, handleGameOver, isFrozen]);

  // Save record to local state & Firestore Cloud Database
  const handleSaveRecord = async (playerName: string) => {
    const accuracy = stats.totalSwings > 0
      ? Math.round((stats.hits / stats.totalSwings) * 100)
      : 0;

    const newRecord: ScoreRecord = {
      id: `${Date.now()}`,
      playerName,
      score,
      mode: gameMode,
      difficulty,
      accuracy,
      maxCombo: stats.maxCombo,
      molesHit: stats.molesHitTotal,
      date: new Date().toLocaleDateString(),
    };

    // Save locally
    const updated = [...localRecords, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    setLocalRecords(updated);
    try {
      localStorage.setItem('mole_arcade_records', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Save to Firestore if user is authenticated with Google
    if (currentUser) {
      try {
        await addDoc(collection(db, 'scores'), {
          userId: currentUser.uid,
          playerName: playerName.slice(0, 100),
          userEmail: currentUser.email || '',
          score,
          mode: gameMode,
          difficulty,
          accuracy,
          maxCombo: stats.maxCombo,
          molesHit: stats.molesHitTotal,
          createdAt: new Date().toISOString(),
        });

        // Update user best score in /users/{userId}
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            bestScore: Math.max(score, highestScore),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'scores');
      }
    }
  };

  const handleClearLocalRecords = () => {
    setLocalRecords([]);
    try {
      localStorage.removeItem('mole_arcade_records');
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    sound.stopBgm();
    setAppState('MENU');
    await logOut();
  };

  // Cursor tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setCursorVisible(true);
  };

  const accuracyPercent = stats.totalSwings > 0
    ? Math.round((stats.hits / stats.totalSwings) * 100)
    : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setCursorVisible(true)}
      onMouseLeave={() => setCursorVisible(false)}
      className={`min-h-screen flex flex-col bg-amber-950 font-['Outfit'] select-none relative overflow-x-hidden ${
        screenShake ? 'animate-shake' : ''
      }`}
      style={{
        backgroundImage: `linear-gradient(rgba(41, 20, 10, 0.75), rgba(20, 10, 5, 0.88)), url(${moleBackdropBase64})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Red Flash on Bomb or Life Loss */}
      {redFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 bg-red-600/30 transition-opacity duration-150" />
      )}

      {/* Frost Overlay on Freeze Mole */}
      {isFrozen && (
        <div className="fixed inset-0 pointer-events-none z-30 bg-cyan-500/10 border-8 border-cyan-400/40 backdrop-blur-[1px] transition-all" />
      )}

      {/* Top Bar Navigation */}
      <Navigation
        onOpenHowTo={() => setHowToOpen(true)}
        onOpenHammers={() => setHammersOpen(true)}
        onOpenRecords={() => {
          setRecordsInitialTab('global');
          setRecordsOpen(true);
        }}
        onOpenAchievements={() => {
          setRecordsInitialTab('achievements');
          setRecordsOpen(true);
        }}
        onStartOrResume={() => {
          if (!currentUser) return;
          if (appState === 'PLAYING') handlePause();
          else if (appState === 'PAUSED') handleResume();
          else handleStartGame();
        }}
        isPlaying={appState === 'PLAYING'}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl w-full mx-auto relative z-20">
        {/* Floating Effects */}
        <FloatingEffects floatingTexts={floatingTexts} particles={particles} />

        {/* Custom Mallet Cursor */}
        <MalletCursor
          x={mousePos.x}
          y={mousePos.y}
          isSwinging={isSwinging}
          hammerId={selectedHammer}
          visible={cursorVisible}
        />

        {authLoading ? (
          <div className="text-center p-10 text-amber-200 text-sm">
            Cargando juego y sesión de usuario...
          </div>
        ) : !currentUser ? (
          /* Authentication Gate: User MUST sign in with Google/Gmail to play */
          <AuthGate />
        ) : appState === 'MENU' ? (
          <TitleScreen
            onStartGame={handleStartGame}
            mode={gameMode}
            onSelectMode={setGameMode}
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            selectedHammer={selectedHammer}
            onOpenHammers={() => setHammersOpen(true)}
            onOpenHowTo={() => setHowToOpen(true)}
            onOpenRecords={() => {
              setRecordsInitialTab('global');
              setRecordsOpen(true);
            }}
            onOpenAchievements={() => {
              setRecordsInitialTab('achievements');
              setRecordsOpen(true);
            }}
            showKeyboardHints={showKeyHints}
            onToggleKeyboardHints={() => setShowKeyHints(!showKeyHints)}
            highScore={highestScore}
            currentUser={currentUser}
          />
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* In-Game HUD */}
            <GameHUD
              score={score}
              timeLeft={timeLeft}
              lives={lives}
              maxLives={maxLives}
              combo={combo}
              multiplier={getMultiplier(combo)}
              accuracy={accuracyPercent}
              mode={gameMode}
              isFrozen={isFrozen}
              freezeSecondsLeft={freezeSecondsLeft}
              onPause={handlePause}
            />

            {/* Arcade Playing Lawn / Grid Frame */}
            <div
              className={`w-full max-w-3xl p-4 sm:p-8 rounded-3xl bg-amber-900/70 border-4 border-amber-800/90 shadow-2xl backdrop-blur-sm grid gap-3 sm:gap-6 relative transition-all ${
                difficulty === 'HARD'
                  ? 'grid-cols-4 max-w-4xl'
                  : 'grid-cols-3'
              }`}
              style={{
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.6)',
              }}
            >
              {moles.map((mole) => (
                <MoleHole
                  key={mole.id}
                  data={mole}
                  onWhack={(idx, e) => {
                    const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX;
                    const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY;
                    handleWhack(idx, clientX, clientY);
                  }}
                  showKeyHint={showKeyHints}
                />
              ))}
            </div>

            {/* Quick Keyboard Hint Footer */}
            {showKeyHints && (
              <div className="mt-3 text-[11px] text-amber-200/70 text-center">
                Pulsa los números del teclado o haz clic con el ratón/toca la pantalla para aporrear.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <HowToPlayModal
        isOpen={howToOpen}
        onClose={() => setHowToOpen(false)}
      />

      <HammersModal
        isOpen={hammersOpen}
        onClose={() => setHammersOpen(false)}
        selectedHammer={selectedHammer}
        onSelectHammer={handleSelectHammer}
        highScore={highestScore}
      />

      <RecordsModal
        isOpen={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        localRecords={localRecords}
        achievements={achievements}
        onClearLocalRecords={handleClearLocalRecords}
        initialTab={recordsInitialTab}
      />

      <PauseModal
        isOpen={appState === 'PAUSED'}
        onResume={handleResume}
        onRestart={handleStartGame}
        onQuit={() => {
          sound.stopBgm();
          setAppState('MENU');
        }}
        onOpenHowTo={() => setHowToOpen(true)}
      />

      <GameOverModal
        isOpen={appState === 'GAME_OVER'}
        score={score}
        isNewRecord={score > highestScore && score > 0}
        mode={gameMode}
        difficulty={difficulty}
        stats={stats}
        currentUser={currentUser}
        onPlayAgain={handleStartGame}
        onBackToMenu={() => setAppState('MENU')}
        onSaveRecord={handleSaveRecord}
      />
    </div>
  );
}
