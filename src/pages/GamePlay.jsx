import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { api } from '../api/client';
import { PremiumAdModal } from '../components/common/PremiumAdModal';
import AdSlot from '../ads/AdSlot';

export function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state;

  useEffect(() => {
    if (!initial?.session || !initial?.puzzle) {
      navigate('/game-start', { replace: true });
    }
  }, [initial, navigate]);

  if (!initial?.session || !initial?.puzzle) return null;

  return <GameScreen initialSession={initial.session} puzzle={initial.puzzle} />;
}

function GameScreen({ initialSession, puzzle }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(initialSession);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState({});
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

  async function submitGuess(e) {
    e.preventDefault();
    if (submitting || result || !guess.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post(`/sessions/${session.id}/guess`, { guess });
      setSession(data.session);
      if (data.solved) {
        setResult({ solved: true, score: data.score, correctAnswer: data.correctAnswer });
      } else {
        setError('Not quite — try again.');
        setGuess('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestHint() {
    setError(null);
    try {
      const data = await api.post(`/sessions/${session.id}/hint`, {});
      setRevealed((prev) => ({ ...prev, [data.nextHint.index]: data.nextHint.letter }));
      setSession((prev) => ({ ...prev, hintsUsed: data.hintsUsed }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (result) {
    return (
      <ResultScreen
        result={result}
        puzzle={puzzle}
        session={session}
        onPlayAgain={() => navigate('/game-start')}
      />
    );
  }

  if (timeUp) {
    return (
      <ResultScreen
        result={{ solved: false, score: 0, correctAnswer: null }}
        puzzle={puzzle}
        session={session}
        onPlayAgain={() => navigate('/game-start')}
      />
    );
  }

  const hintsMax = puzzle.revealSequence.length;
  const hintsLeft = hintsMax - session.hintsUsed;

  return (
    <div
      className="min-h-screen py-6 px-1 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(350deg, #FFFBF5 0%, #FFF5E9 30%, #FFE8D6 60%, #FFD4B8 100%)' }}
    >
      {/* Header */}
      <div className="mx-auto mb-8 sm:mb-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#FFFFFF6E] hover:bg-gray-50 text-gray-800 font-medium text-[14px] sm:text-[15px] shadow-sm border border-white"
          >
            <IoArrowBack className="size-4 sm:size-5" />
            <span>Exit Game</span>
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#FFFFFF6E] text-gray-800 font-medium text-[14px] sm:text-[15px] shadow-sm border border-white">
              <span>
                Wrong: <span className="font-bold">{session.wrongGuesses}</span>
              </span>
            </div>

            <button
              onClick={() => setShowPremiumModal(true)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-[14px] sm:text-[15px] shadow-sm transition-all flex items-center gap-2"
            >
              <span>👑</span>
              <span>Premium</span>
            </button>

            <div className="px-4 sm:px-6 py-2 sm:py-2 rounded-full bg-[#FE9A0021] border border-[#FE9A00] shadow-sm flex items-center gap-2">
              <img src="/clock.svg" alt="Clock" />
              <span className={`font-bold text-[14px] sm:text-[15px] ${remaining < 10 ? 'text-red-600' : 'text-[#073165]'}`}>
                {remaining}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-8">
          {/* License Plate Preview */}
          <div className="w-full sm:max-w-[60%] lg:w-auto flex flex-col justify-center border-[10px] border-[#264DA7] rounded-[28px] lg:rounded-[50px] bg-white overflow-hidden">
            <img src="/gamebase.png" alt="" className="w-full" />
            <div className="flex bg-white items-center justify-center px-4 py-6">
              <h2
                style={{
                  fontFamily: 'Alumni Sans',
                  fontWeight: 400,
                  fontSize: 'clamp(60px, 10vw, 128px)',
                  lineHeight: 1,
                  color: '#073165',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {puzzle.plate}
              </h2>
            </div>
            <img src="/gamebase2.png" alt="" className="w-full" />
          </div>

          {/* Clue Card */}
          <div className="w-full py-3 sm:max-w-[40%] lg:w-auto lg:flex-1 bg-[#032563] border-[10px] border-[#264DA7] rounded-[25px] shadow-lg text-white">
            <p className="text-[#FE9A00] font-bold text-[32px] sm:text-[36px] text-center">Clue</p>
            <p className="text-white px-4 text-[18px] sm:text-[22px] text-center">
              {puzzle.clue}
            </p>
            <div className="mt-3 text-center text-xs text-white/70">
              {puzzle.difficulty} · {puzzle.basePoints} base pts · {hintsLeft} hints left
            </div>
          </div>
        </div>

        {/* Revealed letters */}
        {Object.keys(revealed).length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            <span className="text-xs uppercase tracking-wide text-text-muted2 w-full text-center mb-1">
              Revealed letters
            </span>
            {Object.entries(revealed)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([idx, letter]) => (
                <span key={idx} className="px-3 py-1 rounded bg-card-yellow border border-[#FE9A00] text-navy font-mono font-bold">
                  [{idx}] {letter}
                </span>
              ))}
          </div>
        )}

        {/* Answer input */}
        <form onSubmit={submitGuess} className="max-w-xl mx-auto">
          <label className="block text-xs uppercase tracking-wide text-text-muted2 mb-2 text-center" htmlFor="guess">
            Type your answer
          </label>
          <input
            id="guess"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-3 border-2 border-navy rounded-lg text-lg focus:outline-none focus:border-brand-orange bg-white"
            placeholder="e.g. love tomorrow"
            autoFocus
          />

          <div className="flex gap-3 mt-3">
            <button
              type="submit"
              disabled={submitting || !guess.trim()}
              className="flex-1 py-3 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange disabled:opacity-60"
            >
              {submitting ? 'Checking…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={requestHint}
              disabled={hintsLeft === 0 || submitting}
              className="py-3 px-5 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream disabled:opacity-60"
            >
              Hint ({hintsLeft})
            </button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-text-muted2">
            Wrong guesses: {session.wrongGuesses} · Hints used: {session.hintsUsed}
          </div>
        </form>
      </div>

      <PremiumAdModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => setShowPremiumModal(false)}
      />
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
      setShareError(err.message);
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
        <h1 className="text-4xl font-serif text-navy mb-3">
          {result.solved ? 'Solved!' : 'Out of time'}
        </h1>
        {result.solved && (
          <div className="text-6xl font-bold text-brand-orange-dark mb-6">+{result.score}</div>
        )}
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
              onClick={copyShare}
              className="py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={loadShare}
            className="mb-6 py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
          >
            Share result
          </button>
        )}

        {shareError && (
          <div className="mb-6 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {shareError}
          </div>
        )}

        <AdSlot slot="9876543210" className="mb-6" />

        <button
          onClick={onPlayAgain}
          className="py-3 px-8 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
