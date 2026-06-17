import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { api } from '../api/client';
import { getUserFriendlyApiMessage } from '../api/apiErrors';
import { PremiumAdModal } from '../components/common/PremiumAdModal';
import { SegmentedAnswerInput } from '../components/game/SegmentedAnswerInput';
import { cellsToGuess, clearUnrevealedCells, initCells } from '../components/game/answerSlots';
import AdSlot from '../ads/AdSlot';

export function GamePlay() {
  const { sessionId: sessionIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(null);
  const [loadState, setLoadState] = useState('pending');
  const [loadError, setLoadError] = useState(null);

  const stateMatchesUrl = useMemo(
    () => !sessionIdParam || location.state?.session?.id === sessionIdParam,
    [sessionIdParam, location.state?.session?.id]
  );

  useLayoutEffect(() => {
    const state = location.state;
    if (state?.session?.id && state?.puzzle && stateMatchesUrl) {
      setHydrated({
        session: state.session,
        puzzle: state.puzzle,
        category: state.category ?? null,
      });
      setLoadState('ready');
      setLoadError(null);
      const id = state.session.id;
      if (sessionIdParam !== id) {
        navigate(`/game/${id}`, { replace: true, state });
      }
      return;
    }
    if (sessionIdParam) {
      setHydrated(null);
      setLoadState('loading');
      setLoadError(null);
      return;
    }
    navigate('/?play=1', { replace: true });
  }, [sessionIdParam, location.state, navigate, stateMatchesUrl]);

  useEffect(() => {
    const state = location.state;
    if (state?.session?.id && state?.puzzle && stateMatchesUrl) return;
    if (!sessionIdParam) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/sessions/${sessionIdParam}`);
        if (cancelled) return;
        if (data.session.completedAt) {
          navigate('/?play=1', { replace: true });
          return;
        }
        setHydrated({
          session: data.session,
          puzzle: data.puzzle,
          category: data.category ?? null,
        });
        setLoadState('ready');
      } catch (e) {
        if (cancelled) return;
        setLoadError(getUserFriendlyApiMessage(e));
        setLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionIdParam, location.state, navigate, stateMatchesUrl]);

  if (loadState === 'pending' || loadState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-navy">
        <p className="text-lg">Loading game…</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-red-600 max-w-md">{loadError}</p>
        <Link to="/?play=1" className="text-brand-orange-dark underline font-medium">
          Back to play
        </Link>
      </div>
    );
  }

  if (!hydrated?.session || !hydrated?.puzzle) return null;

  return <GameScreen initialSession={hydrated.session} puzzle={hydrated.puzzle} />;
}

function GameScreen({ initialSession, puzzle }) {
  const navigate = useNavigate();
  const wordLengths = useMemo(() => {
    if (puzzle.wordLengths?.length) return puzzle.wordLengths;
    const len = puzzle.answerLength ?? 0;
    return len > 0 ? [len] : [];
  }, [puzzle]);
  const [session, setSession] = useState(initialSession);
  const [cells, setCells] = useState(() => initCells(wordLengths));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const totalSec = puzzle.timeLimitSeconds;
  const startedAtMs = useMemo(() => new Date(session.startedAt).getTime(), [session.startedAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [result]);

  const elapsedSec = Math.min(totalSec, Math.floor((now - startedAtMs) / 1000));
  const remaining = Math.max(0, totalSec - elapsedSec);
  const timeUp = remaining === 0 && !result;

  async function submitGuess(nextCells) {
    if (submitting || result) return;
    const guess = cellsToGuess(nextCells ?? cells, wordLengths);
    if (!guess.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post(`/sessions/${session.id}/guess`, { guess });
      setSession(data.session);
      if (data.solved) {
        setResult({ solved: true, score: data.score, correctAnswer: data.correctAnswer });
      } else {
        setError('Not quite — try again.');
        setCells((prev) => clearUnrevealedCells(prev, {}, wordLengths));
      }
    } catch (err) {
      setError(getUserFriendlyApiMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function goHomePlay() {
    navigate('/?play=1');
  }

  if (result) {
    return (
      <ResultScreen
        result={result}
        puzzle={puzzle}
        session={session}
        onPlayAgain={goHomePlay}
      />
    );
  }

  if (timeUp) {
    return (
      <ResultScreen
        result={{ solved: false, score: 0, correctAnswer: null }}
        puzzle={puzzle}
        session={session}
        onPlayAgain={goHomePlay}
      />
    );
  }

  const displayScore = session.score || 0;

  return (
    <div
      className="min-h-screen py-4 sm:py-6 px-3 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(350deg, #FFFBF5 0%, #FFF5E9 30%, #FFE8D6 60%, #FFD4B8 100%)' }}
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 sm:mb-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#FFFFFF6E] hover:bg-white text-gray-800 font-medium text-sm sm:text-[15px] shadow-sm border border-white"
          >
            <IoArrowBack className="size-4 sm:size-5" />
            <span>Exit Game</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#FFFFFF6E] text-gray-800 font-medium text-sm sm:text-[15px] shadow-sm border border-white">
              Score: <span className="font-bold">{displayScore}</span>
            </div>

            <div className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FE9A0021] border border-[#FE9A00] shadow-sm flex items-center gap-2">
              <img src="/clock.svg" alt="" className="size-4 sm:size-5" />
              <span className={`font-bold text-sm sm:text-[15px] ${remaining < 10 ? 'text-red-600' : 'text-[#073165]'}`}>
                {remaining}s
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Puzzle plate + clue */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 sm:gap-6">
          <div className="w-full md:w-[55%] flex flex-col border-8 sm:border-14 border-gray-100 rounded-[24px] sm:rounded-[62px] bg-white overflow-hidden shadow-lg">
            <img src="/gamebase.png" alt="" className="w-full" />
            <div className="flex bg-white items-center justify-center px-3 py-4 sm:py-1 min-h-[80px] sm:min-h-[100px]">
              <h2
                className="uppercase text-center text-[#073165]"
                style={{
                  fontFamily: 'Alumni Sans, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(48px, 12vw, 120px)',
                  lineHeight: 0,
                  letterSpacing: '0.05em',
                }}
              >
                {puzzle.plate}
              </h2>
            </div>
            <img src="/gamebase2.png" alt="" className="w-full" />
          </div>

          <div className="w-full md:w-[45%] flex flex-col bg-[#032563] border-8 sm:border-14 border-[#264DA7] rounded-[20px] sm:rounded-[62px] shadow-lg text-white min-h-[160px]">
            <p className="text-[#FE9A00] font-bold text-2xl sm:text-[34px] text-center pt-4 sm:pt-2 ">Clue</p>
            <p className="text-white px-4 sm:px-6 text-base sm:text-[24px] text-center mt-2 flex items-center justify-center leading-snug">
              {puzzle.clue}
            </p>
            {/* <p className="text-center text-xs text-white/60 pb-4">
              {puzzle.difficulty} · {puzzle.basePoints} base pts
            </p> */}
          </div>
        </div>

        {/* Answer plate with segmented inputs */}
        <div className="w-full">
          <div className="w-full border-8 sm:border-14 border-[#264DA7] rounded-[24px] sm:rounded-[62px] bg-white overflow-hidden shadow-xl">
            <img src="/gamebase.png" alt="" className="w-full" />
            <div className="bg-white px-2 sm:px-4 py-6 sm:py-10">
              <SegmentedAnswerInput
                wordLengths={wordLengths}
                cells={cells}
                onChange={setCells}
                disabled={submitting}
                onSubmit={submitGuess}
              />
              <p className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#6a7282]">
                {submitting ? 'Checking…' : 'Type your answer'}
              </p>
              {error && (
                <p className="mt-3 text-center text-sm text-red-600">{error}</p>
              )}
            </div>
            <img src="/gamebase2.png" alt="" className="w-full" />
          </div>
        </div>
      </div>

      <PremiumAdModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={() => setShowPremiumModal(false)} />
    </div>
  );
}

function ResultScreen({ result, puzzle, session, onPlayAgain }) {
  const [shareText, setShareText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(null);

  async function loadShare() {
    setShareError(null);
    try {
      const { text } = await api.get(`/sessions/${session.id}/share`);
      setShareText(text);
    } catch (err) {
      setShareError(getUserFriendlyApiMessage(err));
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError('Copy failed — you can select the text manually');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl font-serif text-navy mb-3">{result.solved ? 'Solved!' : 'Out of time'}</h1>
        {result.solved && <div className="text-6xl font-bold text-brand-orange-dark mb-6">+{result.score}</div>}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-card-gray2 mb-6">
          <div className="text-sm uppercase tracking-wide text-text-muted2">Plate</div>
          <div
            className="text-3xl font-bold tracking-widest text-navy-dark mb-3"
            style={{ fontFamily: 'Alumni Sans, sans-serif' }}
          >
            {puzzle.plate}
          </div>
          <div className="text-sm uppercase tracking-wide text-text-muted2">Answer</div>
          <div className="text-2xl text-navy mb-3">{result.correctAnswer || '—'}</div>
          <div className="text-xs text-text-muted2">
            Hints: {session.hintsUsed} · Wrong guesses: {session.wrongGuesses}
          </div>
        </div>

        {shareText ? (
          <div className="mb-6 bg-white rounded-xl border border-card-gray2 p-4">
            <pre className="whitespace-pre-wrap text-left text-navy mb-3 font-mono text-sm">{shareText}</pre>
            <button
              type="button"
              onClick={copyShare}
              className="py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={loadShare}
            className="mb-6 py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
          >
            Share result
          </button>
        )}

        {shareError && <div className="mb-6 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{shareError}</div>}

        <AdSlot slot="9876543210" className="mb-6" />

        <button
          type="button"
          onClick={onPlayAgain}
          className="py-3 px-8 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
