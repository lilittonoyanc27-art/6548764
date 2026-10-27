import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  PhoneCall,
  Users,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Languages,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Eye,
  EyeOff,
  Radio,
  BookOpen,
  Award
} from 'lucide-react';
import { QUESTIONS, PRIZE_LADDER } from './questions';
import { Question, Option, AnswerHistory } from './types';
import { sound } from './sound';

export default function App() {
  // Game states
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<('A' | 'B' | 'C' | 'D')[]>([]);
  const [history, setHistory] = useState<AnswerHistory[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Modal for lifelines (Coach or Friend)
  const [activeModal, setActiveModal] = useState<'coach' | 'friend' | null>(null);

  // Track if 50:50 is currently active on the current question
  const [isFiftyFiftyActiveOnQuestion, setIsFiftyFiftyActiveOnQuestion] = useState<boolean>(false);

  // Translation visibility states:
  // Separate toggles for question translation, individual option translations, and global reveal
  const [showQuestionArm, setShowQuestionArm] = useState<boolean>(false);
  const [showOptionArm, setShowOptionArm] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
  });
  const [globalTranslationMode, setGlobalTranslationMode] = useState<boolean>(false);

  // Sound & layout settings
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [showLadderMobile, setShowLadderMobile] = useState<boolean>(false);
  const [showReviewList, setShowReviewList] = useState<boolean>(false);

  const currentQ: Question = QUESTIONS[currentIdx];
  const currentLadder = PRIZE_LADDER[currentIdx];

  // Sync sound settings
  useEffect(() => {
    sound.setSoundEnabled(!isAudioMuted);
  }, [isAudioMuted]);

  // When moving to the next question, reset question-level states
  useEffect(() => {
    setSelectedOptionId(null);
    setIsAnswerConfirmed(false);
    setEliminatedOptions([]);
    setIsFiftyFiftyActiveOnQuestion(false);
    setActiveModal(null);
    setShowQuestionArm(globalTranslationMode);
    setShowOptionArm({
      A: globalTranslationMode,
      B: globalTranslationMode,
      C: globalTranslationMode,
      D: globalTranslationMode,
    });
  }, [currentIdx, globalTranslationMode]);

  // Read question in Spanish with Speech Synthesis
  const handlePronounceQuestion = () => {
    sound.speakSpanish(`${currentQ.titleEs}. ${currentQ.scenarioEs}`);
  };

  const handlePronounceOption = (opt: Option) => {
    sound.speakSpanish(opt.es);
  };

  // Toggle translation for question
  const toggleQuestionTranslation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowQuestionArm((prev) => !prev);
    sound.playClick();
  };

  // Toggle translation for a specific option
  const toggleOptionTranslation = (optId: 'A' | 'B' | 'C' | 'D', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowOptionArm((prev) => ({
      ...prev,
      [optId]: !prev[optId],
    }));
    sound.playClick();
  };

  // Global translation toggle
  const toggleGlobalTranslation = () => {
    const nextVal = !globalTranslationMode;
    setGlobalTranslationMode(nextVal);
    setShowQuestionArm(nextVal);
    setShowOptionArm({
      A: nextVal,
      B: nextVal,
      C: nextVal,
      D: nextVal,
    });
    sound.playClick();
  };

  // Select an option (choosing an answer does NOT disable or hide 50/50!)
  const handleSelectOption = (optId: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswerConfirmed) return;
    if (eliminatedOptions.includes(optId)) return;
    setSelectedOptionId(optId);
    sound.playLockIn();
  };

  // Confirm answer - Key feature: Even if incorrect, game CONTINUES!
  const handleConfirmAnswer = () => {
    if (!selectedOptionId || isAnswerConfirmed) return;

    setIsAnswerConfirmed(true);
    const isCorrect = selectedOptionId === currentQ.correctOptionId;

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    const prize = isCorrect ? currentLadder.value : 0;
    setHistory((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        selectedOptionId,
        correctOptionId: currentQ.correctOptionId,
        isCorrect,
        prizeAwarded: prize,
      },
    ]);
  };

  // Proceed to next question or complete game
  const handleNextQuestion = () => {
    sound.playClick();
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsGameOver(true);
      sound.playWhistle();
    }
  };

  // Lifeline 1: 50:50
  // Fix requested by user: 50/50 NEVER disappears when an answer is chosen!
  // It can be used anytime on the current question to eliminate 2 wrong options.
  const useFiftyFifty = () => {
    if (isAnswerConfirmed || isGameOver) return;
    sound.playLifeline();

    if (isFiftyFiftyActiveOnQuestion) {
      // Toggle off / restore options if clicked again
      setEliminatedOptions([]);
      setIsFiftyFiftyActiveOnQuestion(false);
      return;
    }

    // Eliminate 2 wrong options
    const wrongOptions = currentQ.options
      .filter((o) => o.id !== currentQ.correctOptionId)
      .map((o) => o.id);

    const shuffled = [...wrongOptions].sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    setEliminatedOptions(toEliminate);
    setIsFiftyFiftyActiveOnQuestion(true);

    // If the currently selected option was one of the eliminated ones, deselect it
    if (selectedOptionId && toEliminate.includes(selectedOptionId)) {
      setSelectedOptionId(null);
    }
  };

  // Lifeline 2: Ask Coach (Staff tactical advice)
  const useAskCoach = () => {
    if (isGameOver) return;
    sound.playLifeline();
    setActiveModal('coach');
  };

  // Lifeline 3: Call a friend (Звонок другу / Llamada a un amigo / Զանգ ընկերոջը)
  // Replaced name Razmik with "Звонок другу" as explicitly requested by user
  const useCallFriend = () => {
    if (isGameOver) return;
    sound.playLifeline();
    setActiveModal('friend');
  };

  // Restart game
  const handleRestartGame = () => {
    sound.playWhistle();
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setIsAnswerConfirmed(false);
    setEliminatedOptions([]);
    setIsFiftyFiftyActiveOnQuestion(false);
    setHistory([]);
    setIsGameOver(false);
    setActiveModal(null);
    setShowReviewList(false);
  };

  // Calculate stats
  const totalCorrect = history.filter((h) => h.isCorrect).length;
  const totalAnswered = history.length;
  const currentPrize = history.reduce((sum, h) => sum + h.prizeAwarded, 0);

  // Highest safe haven achieved
  const lastCompletedIndex = history.length - 1;
  const safeMilestones = [4, 9, 14, 19]; // index of 1,000, 32,000, 1,000,000, 30,000,000
  let guaranteedBank = 0;
  safeMilestones.forEach((idx) => {
    if (lastCompletedIndex >= idx && history[idx]?.isCorrect) {
      guaranteedBank = PRIZE_LADDER[idx].value;
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-amber-500 selection:text-black">
      {/* Background Stadium Atmosphere & Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full h-80 bg-amber-500/10 rounded-full blur-[160px]" />
        {/* Pitch texture lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-wide text-white font-cinzel">
                  ¿Quién Quiere Ser Millonario?
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Fútbol A2–B1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-armenian">
                Ո՞վ է ուզում դառնալ միլիոնատեր · 20 ֆուտբոլային իրավիճակ
              </p>
            </div>
          </div>

          {/* Quick Controls: Global Translation, Sound, Ladder Drawer */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Translation Toggle */}
            <button
              onClick={toggleGlobalTranslation}
              title={globalTranslationMode ? 'Թաքցնել հայերեն թարգմանությունները' : 'Բացել բոլոր հայերեն թարգմանությունները'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                globalTranslationMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Languages className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-armenian">
                {globalTranslationMode ? 'Թարգմանություն: Միացված' : 'Թարգմանություն: Կտտացնելով'}
              </span>
              <span className="sm:hidden font-armenian">ARM</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? 'Միացնել ձայնը' : 'Անջատել ձայնը'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Mobile Ladder Toggle */}
            <button
              onClick={() => setShowLadderMobile(!showLadderMobile)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400"
            >
              <Trophy className="w-4 h-4" />
              <span>{currentLadder.amount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left/Center Game Area (8 cols on lg) */}
        <section className="lg:col-span-8 flex flex-col justify-between space-y-5">
          {/* Lifelines Bar & Level Indicator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Lifelines / Comodines (50:50 is always available, never automatically disappears) */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mr-1 hidden sm:inline">
                Подсказки / Հուշումներ:
              </span>

              {/* 50:50 - Remains always available and visible! */}
              <button
                onClick={useFiftyFifty}
                disabled={isAnswerConfirmed || isGameOver}
                title={
                  isFiftyFiftyActiveOnQuestion
                    ? '50:50 ակտիվ է: Կտտացրեք նորից՝ տարբերակները վերականգնելու համար'
                    : '50:50 — Հեռացնել 2 սխալ պատասխան'
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                  isFiftyFiftyActiveOnQuestion
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30 scale-105 cursor-pointer font-black'
                    : !isAnswerConfirmed && !isGameOver
                    ? 'bg-blue-950/80 border-blue-500/50 text-blue-300 hover:bg-blue-900 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-lg shadow-blue-950/50 cursor-pointer'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>50:50 {isFiftyFiftyActiveOnQuestion ? '✓' : ''}</span>
              </button>

              {/* Ask Coach / Entrenador */}
              <button
                onClick={useAskCoach}
                disabled={isGameOver}
                title="Մարզչական շտաբի խորհուրդ (Consejo del Entrenador)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs border transition-all ${
                  !isGameOver
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900 hover:border-amber-400 hover:scale-105 active:scale-95 shadow-lg shadow-amber-950/50 cursor-pointer'
                    : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Тренер</span>
              </button>

              {/* Call a friend: "Звонок другу" (Replaced Razmik as requested) */}
              <button
                onClick={useCallFriend}
                disabled={isGameOver}
                title="Звонок другу / Զանգ ընկերոջը (Llamada a un amigo)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs border transition-all ${
                  !isGameOver
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 hover:border-emerald-400 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-950/50 cursor-pointer'
                    : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Звонок другу</span>
              </button>
            </div>

            {/* Current Question Badge & Level */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">
                  Հարց <span className="font-bold text-white">{currentIdx + 1}</span> / 20
                </div>
                <div className="text-xs font-semibold text-amber-400 font-cinzel">
                  {currentLadder.amount}
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-armenian">Ճիշտ:</div>
                <div className="text-xs font-bold text-emerald-400">
                  {totalCorrect} / {totalAnswered}
                </div>
              </div>
            </div>
          </div>

          {/* GAME VIEW: Question & Options */}
          {!isGameOver ? (
            <div className="space-y-4">
              {/* Part title banner */}
              <div className="flex items-center justify-between text-xs px-2 text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{currentQ.partTitleEs}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-armenian">{currentQ.partTitleArm}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Nivel {currentQ.level}
                </span>
              </div>

              {/* QUESTION CARD (Millionaire Style) */}
              <div
                onClick={toggleQuestionTranslation}
                className="group relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-blue-600/60 p-5 sm:p-7 shadow-2xl shadow-blue-950/40 cursor-pointer transition-all hover:border-blue-400"
              >
                {/* Visual Diamond Node Decor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-blue-950 border border-blue-500 text-[11px] font-bold text-blue-300 rounded-full shadow tracking-wider uppercase">
                  Pregunta {currentQ.id}
                </div>

                {/* Question Header & Speech Button */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📢</span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-amber-300 tracking-wide font-cinzel">
                      {currentQ.titleEs}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Pronunciation for coach voice */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronounceQuestion();
                      }}
                      title="Լսել իսպաներեն արտասանությունը (Escuchar en español)"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-900 text-xs font-semibold transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Escuchar</span>
                    </button>

                    {/* Question Armenian Translation Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleQuestionTranslation}
                      title="Կտտացրեք՝ հայերեն թարգմանությունը տեսնելու համար"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition font-armenian ${
                        showQuestionArm
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {showQuestionArm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showQuestionArm ? 'Թաքցնել ARM' : '🇦🇲 Թարգմանել'}</span>
                    </button>
                  </div>
                </div>

                {/* Spanish Scenario (Main Text) */}
                <div className="text-slate-100 text-base sm:text-lg font-medium leading-relaxed">
                  {currentQ.scenarioEs}
                </div>

                {/* Armenian Translation Box (Toggled on click!) */}
                {showQuestionArm ? (
                  <div className="mt-4 pt-4 border-t border-blue-900/60 text-amber-200 bg-amber-950/20 rounded-xl p-3.5 border border-amber-500/20 animate-fadeIn font-armenian text-sm sm:text-base leading-relaxed">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                      <span>🇦🇲</span>
                      <span>Հայերեն թարգմանություն:</span>
                    </div>
                    <div className="font-semibold text-white mb-0.5">{currentQ.titleArm}</div>
                    <div className="text-amber-100">{currentQ.scenarioArm}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1 font-armenian group-hover:text-blue-300 transition-colors">
                    <span>💡 Կտտացրեք այստեղ կամ «🇦🇲 Թարգմանել» կոճակին՝ հարցի հայերեն թարգմանությունը բացելու համար</span>
                  </div>
                )}
              </div>

              {/* 4 OPTIONS (A, B, C, D) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {currentQ.options.map((opt) => {
                  const isEliminated = eliminatedOptions.includes(opt.id);
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrectAnswer = opt.id === currentQ.correctOptionId;
                  const isArmVisible = showOptionArm[opt.id] ?? false;

                  // Determine styling based on game state
                  let cardStyle = 'border-blue-900/70 bg-slate-900/80 text-slate-200 hover:border-blue-500 hover:bg-slate-800/90 shadow-md';
                  let letterStyle = 'bg-blue-950 border-blue-700 text-amber-400';

                  if (isEliminated) {
                    cardStyle = 'border-slate-800/40 bg-slate-950/30 text-slate-600 opacity-25 pointer-events-none line-through';
                    letterStyle = 'bg-slate-900 border-slate-800 text-slate-600';
                  } else if (isAnswerConfirmed) {
                    if (isCorrectAnswer) {
                      cardStyle = 'border-emerald-400 bg-emerald-950/80 text-white shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500/50';
                      letterStyle = 'bg-emerald-600 border-emerald-300 text-white';
                    } else if (isSelected && !isCorrectAnswer) {
                      cardStyle = 'border-rose-500 bg-rose-950/80 text-rose-100 shadow-xl shadow-rose-950/60';
                      letterStyle = 'bg-rose-600 border-rose-300 text-white';
                    } else {
                      cardStyle = 'border-slate-800 bg-slate-950/50 text-slate-500 opacity-60';
                      letterStyle = 'bg-slate-900 border-slate-800 text-slate-600';
                    }
                  } else if (isSelected) {
                    cardStyle = 'border-amber-400 bg-amber-950/60 text-white ring-2 ring-amber-400/60 animate-lock-pulse shadow-xl shadow-amber-950/50';
                    letterStyle = 'bg-amber-500 border-amber-300 text-slate-950 font-black';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`group relative rounded-xl border-2 p-4 transition-all duration-200 flex flex-col justify-between ${cardStyle} ${
                        !isEliminated && !isAnswerConfirmed ? 'cursor-pointer hover:scale-[1.015]' : ''
                      }`}
                      onClick={() => !isAnswerConfirmed && handleSelectOption(opt.id)}
                    >
                      {/* Top Row: Option letter, Spanish text, and Separate Translation Button */}
                      <div>
                        <div className="flex items-start justify-between gap-2.5">
                          {/* Option Identifier */}
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-sm shrink-0 transition-all font-cinzel ${letterStyle}`}
                          >
                            {opt.id}
                          </div>

                          {/* Spanish Option Text */}
                          <div className="flex-1 text-sm sm:text-base font-medium leading-snug">
                            {opt.es}
                          </div>

                          {/* Action icons: Audio & Separate Armenian Translation Toggle */}
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePronounceOption(opt);
                              }}
                              title="Լսել արտասանությունը"
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => toggleOptionTranslation(opt.id, e)}
                              title="Կտտացրեք՝ այս տարբերակի հայերեն թարգմանությունը տեսնելու համար"
                              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border transition font-armenian ${
                                isArmVisible
                                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                              }`}
                            >
                              🇦🇲 {isArmVisible ? 'ARM ✓' : 'ARM'}
                            </button>
                          </div>
                        </div>

                        {/* Separate Armenian Translation for THIS Option */}
                        {isArmVisible && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 pt-2.5 border-t border-slate-800 text-amber-200 font-armenian text-xs sm:text-sm bg-black/25 rounded-lg p-2 leading-relaxed"
                          >
                            <span className="text-amber-400 font-bold mr-1.5">🇦🇲 Թարգմանություն:</span>
                            {opt.arm}
                          </div>
                        )}
                      </div>

                      {/* State badge for correctness when revealed */}
                      {isAnswerConfirmed && (
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                          {isCorrectAnswer ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-armenian">
                              <CheckCircle2 className="w-4 h-4" /> Ճիշտ պատասխան (¡Correcto!)
                            </span>
                          ) : isSelected ? (
                            <span className="text-rose-400 flex items-center gap-1 font-armenian">
                              <XCircle className="w-4 h-4" /> Սխալ ընտրություն
                            </span>
                          ) : (
                            <span className="text-slate-500 font-armenian">Տարբերակ {opt.id}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTION BAR: Lock in answer or Continue Game */}
              <div className="pt-2">
                {!isAnswerConfirmed ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                    <div className="text-xs text-slate-400 font-armenian text-center sm:text-left">
                      {selectedOptionId ? (
                        <span>
                          Ընտրված է <strong className="text-amber-400">Տարբերակ {selectedOptionId}</strong>: Կտտացրեք «Հաստատել պատասխանը» կոճակին: (Կարող եք օգտվել 50:50 կամ այլ հուշումներից)
                        </span>
                      ) : (
                        <span>Ընտրեք 4 տարբերակներից մեկը: Թարգմանությունը տեսնելու համար սեղմեք «🇦🇲 ARM»:</span>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmAnswer}
                      disabled={!selectedOptionId}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                        selectedOptionId
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¿Última palabra? / Հաստատել պատասխանը</span>
                    </button>
                  </div>
                ) : (
                  /* Answer Explanation Box & CONTINUE GAME Button (Crucial requirement: if incorrect, continue game!) */
                  <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl animate-fadeIn space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        {selectedOptionId === currentQ.correctOptionId ? (
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center font-bold">
                            ✓
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500 flex items-center justify-center font-bold">
                            ✕
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-base text-white">
                            {selectedOptionId === currentQ.correctOptionId
                              ? '¡Respuesta Correcta! — Ճիշտ որոշում!'
                              : 'Respuesta Incorrecta — Սխալ ընտրություն'}
                          </div>
                          <div className="text-xs text-slate-400 font-armenian">
                            {selectedOptionId === currentQ.correctOptionId
                              ? `Դուք վաստակեցիք ${currentLadder.amount}!`
                              : 'Բայց խաղը շարունակվում է: Ուսումնասիրեք մարզչի բացատրությունը և անցեք առաջ:'}
                          </div>
                        </div>
                      </div>

                      {/* CONTINUE BUTTON */}
                      <button
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-armenian"
                      >
                        <span>
                          {currentIdx + 1 < QUESTIONS.length
                            ? 'Հաջորդ հարցը / Siguiente ➔'
                            : 'Դիտել ամբողջ արդյունքները ➔'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* TACTICAL EXPLANATION & COACH ADVICE (Both in ES & ARM) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      {/* Spanish Tactical Feedback */}
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                        <div className="text-amber-400 font-bold flex items-center gap-1.5">
                          <span>🇪🇸</span>
                          <span>Explicación táctica:</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{currentQ.explanationEs}</p>
                        <div className="pt-1 text-[11px] text-blue-300 italic">
                          Consejo del míster: {currentQ.coachTipEs}
                        </div>
                      </div>

                      {/* Armenian Tactical Feedback */}
                      <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5 font-armenian">
                        <div className="text-amber-400 font-bold flex items-center gap-1.5">
                          <span>🇦🇲</span>
                          <span>Մարզչի տակտիկական մեկնաբանությունը:</span>
                        </div>
                        <p className="text-amber-100 leading-relaxed">{currentQ.explanationArm}</p>
                        <div className="pt-1 text-[11px] text-amber-300 italic">
                          Մարզչի հուշումը: {currentQ.coachTipArm}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* GAME OVER / FINAL SUMMARY */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-500" />

              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/40 animate-bounce">
                🏆
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
                  ¡Fin del Partido! / Խաղն ավարտվեց
                </h2>
                <p className="text-sm sm:text-base text-slate-300 font-armenian max-w-xl mx-auto">
                  Դուք անցաք բոլոր 20 ֆուտբոլային իրավիճակները: Իսպաներեն ֆուտբոլային հրահանգները յուրացնելը ձեզ դարձնում է իսկական պրոֆեսիոնալ խաղացող:
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-armenian">Ճիշտ պատասխաններ</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {totalCorrect} / 20
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-armenian">Ճշգրտություն</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {Math.round((totalCorrect / 20) * 100)}%
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-armenian">Շահած գումար</div>
                  <div className="text-2xl font-black text-blue-400 mt-1 font-cinzel">
                    {totalCorrect === 20 ? '30,000,000 €' : currentPrize > 0 ? `${currentPrize.toLocaleString()} €` : `${guaranteedBank.toLocaleString()} €`}
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-armenian">Կարգավիճակ</div>
                  <div className="text-sm font-bold text-purple-300 mt-2">
                    {totalCorrect >= 18
                      ? '⭐ Crack Mundial'
                      : totalCorrect >= 14
                      ? '⚽ Titular de Primera'
                      : '🏃 Canterano Promesa'}
                  </div>
                </div>
              </div>

              {/* Buttons: Restart or View Full 20 Questions Review */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartGame}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer font-armenian"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Կրկին խաղալ / Jugar de nuevo</span>
                </button>

                <button
                  onClick={() => setShowReviewList(!showReviewList)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 flex items-center gap-2 transition cursor-pointer font-armenian"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>{showReviewList ? 'Փակել բառարանը' : 'Բոլոր 20 հրահանգների բառարան'}</span>
                </button>
              </div>

              {/* Full 20 Questions Study List Accordion */}
              {showReviewList && (
                <div className="text-left mt-6 pt-6 border-t border-slate-800 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  <div className="text-sm font-bold text-amber-300 font-armenian">
                    Ֆուտբոլային բառապաշար և հրահանգներ (20 situaciones):
                  </div>
                  {QUESTIONS.map((q) => {
                    const ans = history.find((h) => h.questionId === q.id);
                    const correctOpt = q.options.find((o) => o.id === q.correctOptionId);
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2 ${
                          ans?.isCorrect
                            ? 'bg-emerald-950/20 border-emerald-900/60'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-cinzel">
                            {q.id}. {q.titleEs} — <span className="font-armenian text-amber-300">{q.titleArm}</span>
                          </span>
                          {ans?.isCorrect ? (
                            <span className="text-emerald-400 font-bold font-armenian">✓ Ճիշտ</span>
                          ) : (
                            <span className="text-rose-400 font-bold font-armenian">✕ Սխալ</span>
                          )}
                        </div>
                        <div className="text-slate-300">{q.scenarioEs}</div>
                        <div className="text-amber-200/90 font-armenian">{q.scenarioArm}</div>
                        <div className="text-emerald-300 font-medium">
                          ✔ Ճիշտ պատասխան: {correctOpt?.id}) {correctOpt?.es} — <span className="font-armenian">{correctOpt?.arm}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Sidebar: Millionaire Money Ladder (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md space-y-4">
            {/* Ladder Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white font-cinzel">
                  Escala de Premios
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-armenian">20 աստիճան</span>
            </div>

            {/* Ladder items (Reversed: 20 down to 1) */}
            <div className="space-y-1">
              {[...PRIZE_LADDER].reverse().map((item) => {
                const itemIndex = item.level - 1;
                const isCurrent = itemIndex === currentIdx && !isGameOver;
                const historyItem = history[itemIndex];
                const isPassed = historyItem !== undefined;
                const isCorrect = historyItem?.isCorrect;

                let rowStyle = 'text-slate-400 hover:bg-slate-800/40';
                if (item.safe) {
                  rowStyle = 'text-white font-bold bg-blue-950/40 border border-blue-900/40';
                }
                if (isCurrent) {
                  rowStyle = 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-[1.02] border border-amber-300';
                } else if (isPassed) {
                  if (isCorrect) {
                    rowStyle = 'text-emerald-400 font-semibold bg-emerald-950/30';
                  } else {
                    rowStyle = 'text-slate-500 line-through bg-rose-950/20';
                  }
                }

                return (
                  <div
                    key={item.level}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${rowStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono opacity-80">{item.level}</span>
                      <span className="font-armenian">
                        {item.level === 5 && '🏁 1,000 €'}
                        {item.level === 10 && '🏁 32,000 €'}
                        {item.level === 15 && '⭐ 1,000,000 €'}
                        {item.level === 20 && '🏆 Չեմպիոն'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-cinzel tracking-wider">{item.amount}</span>
                      {isPassed && (
                        <span>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coach's Motivation Note */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400 font-armenian leading-relaxed">
              <span className="text-amber-400 font-bold">⚽ Մարզչի կարգախոսը.</span> Սխալվելուց մի՛ վախեցիր: Յուրաքանչյուր սխալ քայլից հետո խաղը շարունակվում է: Կարևորը հրահանգը հասկանալն ու առաջ շարժվելն է:
            </div>
          </div>
        </aside>

        {/* Mobile Ladder Drawer Modal */}
        {showLadderMobile && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-white font-cinzel">Escala de Premios (20)</span>
                </div>
                <button
                  onClick={() => setShowLadderMobile(false)}
                  className="p-1 rounded bg-slate-800 text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                {[...PRIZE_LADDER].reverse().map((item) => {
                  const itemIndex = item.level - 1;
                  const isCurrent = itemIndex === currentIdx && !isGameOver;
                  const historyItem = history[itemIndex];
                  const isPassed = historyItem !== undefined;
                  const isCorrect = historyItem?.isCorrect;

                  let rowStyle = 'text-slate-400';
                  if (item.safe) rowStyle = 'text-white font-bold bg-blue-950/40';
                  if (isCurrent) rowStyle = 'bg-amber-500 text-slate-950 font-black';
                  else if (isPassed) rowStyle = isCorrect ? 'text-emerald-400 font-semibold' : 'text-slate-500 line-through';

                  return (
                    <div
                      key={item.level}
                      className={`flex items-center justify-between px-3 py-1 rounded text-xs ${rowStyle}`}
                    >
                      <span>
                        {item.level}. {item.amount}
                      </span>
                      <span className="font-armenian">
                        {item.level === 5 && '🏁 1,000 €'}
                        {item.level === 10 && '🏁 32,000 €'}
                        {item.level === 15 && '⭐ 1,000,000 €'}
                        {item.level === 20 && '🏆 Չեմպիոն'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Lifeline 2 - Ask Coach Staff */}
      {activeModal === 'coach' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500 flex items-center justify-center text-lg font-bold">
                  📋
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Consejo del Entrenador / Մարզչական խորհուրդ
                  </h3>
                  <p className="text-xs text-slate-400">Совет тренерского штаба</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-amber-400 font-bold">🇪🇸 El Míster dice:</span>
                <p className="text-slate-200 leading-relaxed italic">
                  «{currentQ.coachTipEs} Recuerda que la respuesta más lógica en esta situación suele ser la opción <strong className="text-amber-300 font-bold font-cinzel">({currentQ.correctOptionId})</strong>.»
                </p>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-1 font-armenian">
                <span className="text-amber-400 font-bold">🇦🇲 Մարզչի հուշումը հայերեն.</span>
                <p className="text-amber-100 leading-relaxed italic">
                  «{currentQ.coachTipArm} Ուշադիր նայիր տարբերակ <strong className="text-amber-300 font-bold font-cinzel">({currentQ.correctOptionId})</strong>-ին, դա լիովին համապատասխանում է տակտիկային:»
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition font-armenian cursor-pointer"
            >
              Հասկացա, շնորհակալություն! (¡Entendido!)
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Lifeline 3 - Звонок другу (Call a friend / Llamada a un amigo / Զանգ ընկերոջը) */}
      {activeModal === 'friend' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center text-lg font-bold">
                  📞
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Звонок другу / Զանգ ընկերոջը
                  </h3>
                  <p className="text-xs text-slate-400">Llamada a un amigo futbolista</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <span className="text-emerald-400 font-bold">🇪🇸 Tu amigo en la llamada:</span>
                <p className="text-slate-200 leading-relaxed italic">
                  «¡Hola, amigo! Estoy viendo la jugada desde la banda. Para la orden «{currentQ.titleEs}», la acción correcta y más efectiva es sin duda la opción <strong className="text-emerald-400 font-bold font-cinzel">({currentQ.correctOptionId})</strong>. ¡Confía en eso!»
                </p>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1 font-armenian">
                <span className="text-emerald-400 font-bold">🇦🇲 Ընկերոջ պատասխանը.</span>
                <p className="text-emerald-100 leading-relaxed italic">
                  «Ողջո՛ւյն: Ես տեսնում եմ խաղադաշտը: «{currentQ.titleArm}» հրահանգի դեպքում ամենաճիշտ որոշումը միանշանակ <strong className="text-emerald-400 font-bold font-cinzel">({currentQ.correctOptionId})</strong> տարբերակն է: Վստահորեն ընտրիր դա:»
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400">
                🇷🇺 Друг на связи: «Привет! В этой ситуации самое правильное футбольное решение — это вариант ({currentQ.correctOptionId}).»
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition font-armenian cursor-pointer"
            >
              Շնորհակալություն, ընկե՛ր! / Спасибо, друг! (¡Gracias, amigo!)
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-center text-xs text-slate-500 font-armenian">
        Ֆուտբոլային իսպաներենի ուսուցողական վիկտորինա · Nivel A2–B1 · Կտտացրեք յուրաքանչյուր հարցի կամ պատասխանի վրա՝ հայերեն թարգմանությունը բացելու համար
      </footer>
    </div>
  );
}
