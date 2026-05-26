import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  EASY_BOARD, HARD_BOARD, pickGameQuestions, getQuestionDiff,
  type BoardDef, type SnakesQuestion,
} from '@/lib/kids-snakes-data';

type Level = 'easy' | 'hard';
type Phase =
  | 'start'
  | 'child-roll'
  | 'child-moving'
  | 'question'
  | 'comp-thinking'
  | 'comp-moving'
  | 'comp-question'
  | 'won';

type QuizCtx = 'child-snake' | 'comp-ladder' | 'comp-snake';

interface QuizState {
  ctx: QuizCtx;
  questions: SnakesQuestion[];
  idx: number;
  correct: number;
  targetPos: number;
  sourcePos: number;
  feedback: boolean;
  selected: number | null;
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function squareNum(displayRow: number, col: number, board: BoardDef): number {
  const { cols, rows } = board;
  const bottom = rows - 1 - displayRow;
  return bottom % 2 === 0 ? bottom * cols + col + 1 : bottom * cols + (cols - col);
}

function advance(pos: number, roll: number, total: number): number {
  const next = pos + roll;
  if (next > total) return total - (next - total);
  return next;
}

function cellClass(sq: number, board: BoardDef): string {
  if (board.ladders[sq]) return 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600';
  if (board.snakes[sq])  return 'bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-600';
  return 'bg-muted/40 border-border';
}

function cellIcon(sq: number, board: BoardDef): string {
  if (board.ladders[sq]) return '🪜';
  if (board.snakes[sq])  return '🐍';
  return '';
}

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

// ──────────────────────────────────────────────────────────────────────────────

export default function KidsSnakesLadders() {
  const [level,     setLevel]     = useState<Level | null>(null);
  const [phase,     setPhase]     = useState<Phase>('start');
  const [childPos,  setChildPos]  = useState(0);
  const [compPos,   setCompPos]   = useState(0);
  const [diceVal,   setDiceVal]   = useState(1);
  const [diceAnim,  setDiceAnim]  = useState(false);
  const [quiz,      setQuiz]      = useState<QuizState | null>(null);
  const [winner,    setWinner]    = useState<'child' | 'comp' | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const compTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const board = level ? (level === 'easy' ? EASY_BOARD : HARD_BOARD) : EASY_BOARD;
  const total = board.cols * board.rows;

  // ── helpers ────────────────────────────────────────────────────────────────

  function startGame(lv: Level) {
    setLevel(lv);
    setChildPos(0);
    setCompPos(0);
    setDiceVal(1);
    setQuiz(null);
    setWinner(null);
    setPhase('child-roll');
    setStatusMsg('أنت أولاً — اضغط الزهر!');
  }

  function resetGame() {
    if (compTimer.current) clearTimeout(compTimer.current);
    setPhase('start');
    setLevel(null);
    setQuiz(null);
    setWinner(null);
  }

  const openQuiz = useCallback((ctx: QuizCtx, sourcePos: number, targetPos: number, bd: BoardDef, tot: number) => {
    const diff = getQuestionDiff(sourcePos, tot);
    const questions = pickGameQuestions(diff);
    setQuiz({ ctx, questions, idx: 0, correct: 0, targetPos, sourcePos, feedback: false, selected: null });
    setPhase(ctx === 'child-snake' ? 'question' : 'comp-question');
  }, []);

  // ── child roll ─────────────────────────────────────────────────────────────

  function handleRoll() {
    if (phase !== 'child-roll') return;
    setDiceAnim(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setDiceVal(rollDie());
      ticks++;
      if (ticks >= 10) {
        clearInterval(iv);
        const roll = rollDie();
        setDiceVal(roll);
        setDiceAnim(false);
        setPhase('child-moving');
        const newPos = advance(childPos, roll, total);
        setStatusMsg(`رميت ${roll} — تتحرك لخانة ${newPos}`);
        setTimeout(() => {
          setChildPos(newPos);
          if (newPos === total) {
            setWinner('child');
            setPhase('won');
            return;
          }
          if (board.ladders[newPos]) {
            const dest = board.ladders[newPos];
            setChildPos(dest);
            setStatusMsg(`🪜 سلّم! صعدت إلى خانة ${dest} مجاناً! 🎉`);
            setTimeout(() => startCompTurn(), 1500);
          } else if (board.snakes[newPos]) {
            const dest = board.snakes[newPos];
            setStatusMsg(`🐍 ثعبان! أجب على ٥ أسئلة لتهرب!`);
            setTimeout(() => openQuiz('child-snake', newPos, dest, board, total), 800);
          } else {
            setStatusMsg('');
            startCompTurn();
          }
        }, 600);
      }
    }, 80);
  }

  // ── computer turn ──────────────────────────────────────────────────────────

  const startCompTurn = useCallback(() => {
    setPhase('comp-thinking');
    setStatusMsg('🤖 الكمبيوتر يفكر...');
    compTimer.current = setTimeout(() => {
      const roll = rollDie();
      setDiceVal(roll);
      setPhase('comp-moving');
      setCompPos(prev => {
        const newPos = advance(prev, roll, total);
        setStatusMsg(`🤖 رمى ${roll} — يتحرك لخانة ${newPos}`);
        setTimeout(() => {
          setCompPos(newPos);
          if (newPos === total) {
            setWinner('comp');
            setPhase('won');
            return;
          }
          if (board.ladders[newPos]) {
            const dest = board.ladders[newPos];
            setStatusMsg(`🤖 الكمبيوتر على سلّم! أجب على ٥ أسئلة لتوقفه!`);
            setTimeout(() => openQuiz('comp-ladder', newPos, dest, board, total), 800);
          } else if (board.snakes[newPos]) {
            const dest = board.snakes[newPos];
            setStatusMsg(`🤖 الكمبيوتر على ثعبان! أجب على ٥ أسئلة لتعاقبه!`);
            setTimeout(() => openQuiz('comp-snake', newPos, dest, board, total), 800);
          } else {
            setStatusMsg('');
            setPhase('child-roll');
            setTimeout(() => setStatusMsg('دورك! اضغط الزهر'), 200);
          }
        }, 600);
        return newPos;
      });
    }, 1500);
  }, [board, total, openQuiz]);

  // ── quiz answer ────────────────────────────────────────────────────────────

  function handleAnswer(optIdx: number) {
    if (!quiz || quiz.feedback) return;
    const correct = optIdx === quiz.questions[quiz.idx].correct;
    const newCorrect = quiz.correct + (correct ? 1 : 0);
    setQuiz(q => q ? { ...q, selected: optIdx, feedback: true, correct: newCorrect } : null);

    setTimeout(() => {
      if (quiz.idx < 4) {
        setQuiz(q => q ? { ...q, idx: q.idx + 1, feedback: false, selected: null } : null);
      } else {
        resolveQuiz({ ...quiz, correct: newCorrect });
      }
    }, 900);
  }

  function resolveQuiz(finalQuiz: QuizState) {
    setQuiz(null);
    const success = finalQuiz.correct >= 5;
    const { ctx, sourcePos, targetPos } = finalQuiz;

    if (ctx === 'child-snake') {
      if (success) {
        setStatusMsg(`🎉 أحسنت! ٥/٥ — هربت من الثعبان! تبقى في خانة ${sourcePos}`);
        setChildPos(sourcePos);
      } else {
        setStatusMsg(`😢 ${finalQuiz.correct}/٥ — نزلت بالثعبان إلى خانة ${targetPos}`);
        setChildPos(targetPos);
      }
      setTimeout(() => { setStatusMsg(''); startCompTurn(); }, 1500);
    } else if (ctx === 'comp-ladder') {
      if (success) {
        setStatusMsg(`🎉 أحسنت! ٥/٥ — أوقفت الكمبيوتر! يبقى في خانة ${sourcePos}`);
        setCompPos(sourcePos);
      } else {
        setStatusMsg(`😅 ${finalQuiz.correct}/٥ — الكمبيوتر صعد إلى خانة ${targetPos}`);
        setCompPos(targetPos);
      }
      setTimeout(() => { setPhase('child-roll'); setStatusMsg('دورك! اضغط الزهر'); }, 1600);
    } else {
      if (success) {
        setStatusMsg(`🎉 أحسنت! ٥/٥ — الكمبيوتر نزل بالثعبان إلى خانة ${targetPos}`);
        setCompPos(targetPos);
      } else {
        setStatusMsg(`😅 ${finalQuiz.correct}/٥ — الكمبيوتر هرب من الثعبان! يبقى في ${sourcePos}`);
        setCompPos(sourcePos);
      }
      setTimeout(() => { setPhase('child-roll'); setStatusMsg('دورك! اضغط الزهر'); }, 1600);
    }
  }

  useEffect(() => () => { if (compTimer.current) clearTimeout(compTimer.current); }, []);

  // ── board ──────────────────────────────────────────────────────────────────

  function renderBoard() {
    const { cols, rows } = board;
    const VB = 320;
    const cellPx = VB / cols;
    const boardH = cellPx * rows;

    function squareToXY(sq: number) {
      const idx = sq - 1;
      const rowFromBottom = Math.floor(idx / cols);
      const colInRow = idx % cols;
      const displayCol = rowFromBottom % 2 === 0 ? colInRow : cols - 1 - colInRow;
      const displayRow = rows - 1 - rowFromBottom;
      return { x: (displayCol + 0.5) * cellPx, y: (displayRow + 0.5) * cellPx };
    }

    function cellBg(sq: number) {
      const idx = sq - 1;
      const rowFromBottom = Math.floor(idx / cols);
      const colInRow = idx % cols;
      const displayCol = rowFromBottom % 2 === 0 ? colInRow : cols - 1 - colInRow;
      const displayRow = rows - 1 - rowFromBottom;
      return (displayRow + displayCol) % 2 === 0 ? '#bfdbfe' : '#e0f2fe';
    }

    const numFs = cellPx * 0.26;
    const tokenFs = cellPx * 0.52;

    return (
      <div className="mx-auto overflow-x-auto">
        <svg
          viewBox={`0 0 ${VB} ${boardH}`}
          width="100%"
          style={{ maxWidth: `${VB}px`, display: 'block', border: '2px solid #94a3b8', borderRadius: '8px' }}
        >
          {/* ── cells ── */}
          {Array.from({ length: rows }, (_, dr) =>
            Array.from({ length: cols }, (_, col) => {
              const sq = squareNum(dr, col, board);
              const x = col * cellPx, y = dr * cellPx;
              return (
                <g key={`c${sq}`}>
                  <rect x={x} y={y} width={cellPx} height={cellPx} fill={cellBg(sq)} stroke="#94a3b8" strokeWidth="0.5" />
                  <text x={x + 2} y={y + numFs} fontSize={numFs} fill="#475569">{sq}</text>
                </g>
              );
            })
          )}

          {/* ── ladders ── */}
          {Object.entries(board.ladders).map(([fs, to]) => {
            const f = squareToXY(Number(fs));
            const t = squareToXY(Number(to));
            const dx = t.x - f.x, dy = t.y - f.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const off = cellPx * 0.13;
            const px = (-dy / len) * off, py = (dx / len) * off;
            const n = Math.max(3, Math.floor(len / cellPx));
            return (
              <g key={`l${fs}`} opacity="0.92">
                <line x1={f.x+px} y1={f.y+py} x2={t.x+px} y2={t.y+py} stroke="#b45309" strokeWidth={cellPx * 0.07} strokeLinecap="round" />
                <line x1={f.x-px} y1={f.y-py} x2={t.x-px} y2={t.y-py} stroke="#b45309" strokeWidth={cellPx * 0.07} strokeLinecap="round" />
                {Array.from({ length: n - 1 }, (_, i) => {
                  const r = (i + 1) / n;
                  return (
                    <line key={i}
                      x1={f.x + px + dx * r} y1={f.y + py + dy * r}
                      x2={f.x - px + dx * r} y2={f.y - py + dy * r}
                      stroke="#92400e" strokeWidth={cellPx * 0.055}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ── snakes ── */}
          {Object.entries(board.snakes).map(([fs, to]) => {
            const f = squareToXY(Number(fs));
            const t = squareToXY(Number(to));
            const dx = t.x - f.x, dy = t.y - f.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const amp = len * 0.22;
            const px = (-dy / len) * amp, py = (dx / len) * amp;
            const cp1x = f.x + dx / 3 + px, cp1y = f.y + dy / 3 + py;
            const cp2x = f.x + 2 * dx / 3 - px, cp2y = f.y + 2 * dy / 3 - py;
            const hr = cellPx * 0.18;
            return (
              <g key={`s${fs}`}>
                <path
                  d={`M ${f.x} ${f.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${t.x} ${t.y}`}
                  stroke="#16a34a" strokeWidth={cellPx * 0.16} fill="none" strokeLinecap="round" opacity="0.88"
                />
                <circle cx={f.x} cy={f.y} r={hr} fill="#15803d" />
                <circle cx={f.x - hr * 0.45} cy={f.y - hr * 0.35} r={hr * 0.28} fill="white" />
                <circle cx={f.x + hr * 0.45} cy={f.y - hr * 0.35} r={hr * 0.28} fill="white" />
                <circle cx={f.x - hr * 0.45} cy={f.y - hr * 0.35} r={hr * 0.13} fill="#111" />
                <circle cx={f.x + hr * 0.45} cy={f.y - hr * 0.35} r={hr * 0.13} fill="#111" />
              </g>
            );
          })}

          {/* ── player tokens ── */}
          {Array.from({ length: rows }, (_, dr) =>
            Array.from({ length: cols }, (_, col) => {
              const sq = squareNum(dr, col, board);
              const isChild = childPos === sq;
              const isComp  = compPos  === sq;
              if (!isChild && !isComp) return null;
              const x = col * cellPx, y = dr * cellPx;
              return (
                <g key={`t${sq}`}>
                  {isChild && (
                    <text x={x + cellPx / 2 - (isComp ? cellPx * 0.22 : 0)} y={y + cellPx * 0.78}
                      textAnchor="middle" fontSize={tokenFs}>👦</text>
                  )}
                  {isComp && (
                    <text x={x + cellPx / 2 + (isChild ? cellPx * 0.22 : 0)} y={y + cellPx * 0.78}
                      textAnchor="middle" fontSize={tokenFs}>🤖</text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
    );
  }

  // ── quiz panel ─────────────────────────────────────────────────────────────

  function renderQuiz() {
    if (!quiz) return null;
    const q = quiz.questions[quiz.idx];
    const contextLabel =
      quiz.ctx === 'child-snake' ? '🐍 الثعبان يتحداك!' :
      quiz.ctx === 'comp-ladder' ? '🪜 أوقف الكمبيوتر من الصعود!' :
                                   '🐍 عاقب الكمبيوتر بالثعبان!';

    return (
      <motion.div
        key="quiz"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary rounded-t-2xl shadow-2xl p-4 pb-20 max-h-[75vh] overflow-y-auto"
      >
        {/* context + progress */}
        <div className="text-center mb-3">
          <p className="text-sm font-bold text-primary mb-2">{contextLabel}</p>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i < quiz.idx ? 'bg-green-500' :
                  i === quiz.idx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">سؤال {quiz.idx + 1} من ٥</p>
        </div>

        {/* question */}
        <p className="text-center text-sm font-semibold mb-3 leading-relaxed">{q.q}</p>

        {/* options */}
        <div className="grid grid-cols-1 gap-2">
          {q.opts.map((opt, i) => {
            let variant: string = 'outline';
            let extra = '';
            if (quiz.feedback) {
              if (i === q.correct) { extra = 'bg-green-100 border-green-500 dark:bg-green-900/40'; }
              else if (i === quiz.selected && i !== q.correct) { extra = 'bg-red-100 border-red-500 dark:bg-red-900/40'; }
            }
            return (
              <button
                key={i}
                disabled={quiz.feedback}
                onClick={() => handleAnswer(i)}
                className={`w-full text-right px-3 py-2 rounded-xl border text-sm transition-all ${
                  quiz.feedback ? extra || 'opacity-50' : 'hover:bg-accent hover:border-primary'
                } border`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {quiz.feedback && (
          <p className={`text-center text-xs mt-2 font-semibold ${quiz.selected === q.correct ? 'text-green-600' : 'text-red-600'}`}>
            {quiz.selected === q.correct ? '✅ إجابة صحيحة!' : `❌ الإجابة الصحيحة: ${q.opts[q.correct]}`}
          </p>
        )}
      </motion.div>
    );
  }

  // ── start screen ───────────────────────────────────────────────────────────

  if (phase === 'start') {
    return (
      <div className="text-center py-6">
        <div className="text-6xl mb-3">🎲</div>
        <h3 className="text-xl font-bold mb-1">سلم وثعبان</h3>
        <p className="text-muted-foreground text-sm mb-5">اختر مستوى اللعبة</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => startGame('easy')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6"
          >
            🟢 سهل (٣٠ خانة)
          </Button>
          <Button
            onClick={() => startGame('hard')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6"
          >
            🔴 صعب (١٠٠ خانة)
          </Button>
        </div>
      </div>
    );
  }

  // ── win screen ─────────────────────────────────────────────────────────────

  if (phase === 'won') {
    return (
      <div className="text-center py-6">
        {winner === 'child' ? (
          <>
            <div className="text-6xl mb-3">🏆</div>
            <h3 className="text-2xl font-bold mb-2 text-amber-500">أحسنت! فزت!</h3>
            <p className="text-muted-foreground mb-5">ذكاؤك ومعرفتك بالكتاب المقدس أوصلك للنهاية</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-3">🤖</div>
            <h3 className="text-2xl font-bold mb-2">الكمبيوتر فاز هذه المرة</h3>
            <p className="text-muted-foreground mb-5">حاول مرة أخرى وستتحسن!</p>
          </>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={() => startGame(level!)} className="bg-primary text-white">🔄 العب مرة أخرى</Button>
          <Button variant="outline" onClick={resetGame}>🏠 القائمة الرئيسية</Button>
        </div>
      </div>
    );
  }

  // ── main game ──────────────────────────────────────────────────────────────

  const isChildTurn = phase === 'child-roll';
  const quizVisible = phase === 'question' || phase === 'comp-question';

  return (
    <div className="relative">
      {/* header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">👦</span>
          <span className="font-bold">خانة {childPos}</span>
        </div>
        <span className="text-lg font-bold">{DICE_FACES[diceVal - 1]}</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold">خانة {compPos}</span>
          <span className="text-xl">🤖</span>
        </div>
      </div>

      {/* status */}
      {statusMsg && (
        <p className="text-center text-xs text-muted-foreground mb-2 min-h-[18px]">{statusMsg}</p>
      )}

      {/* board */}
      <div className="mb-3 overflow-x-auto">
        {renderBoard()}
      </div>

      {/* legend */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-3">
        <span>🪜 سلّم (صعود)</span>
        <span>🐍 ثعبان (نزول)</span>
        <span>👦 أنت</span>
        <span>🤖 الكمبيوتر</span>
      </div>

      {/* action */}
      <div className="text-center">
        {isChildTurn ? (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRoll}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-8 py-3 text-lg"
            >
              <motion.span
                animate={diceAnim ? { rotate: [0, 20, -20, 0] } : {}}
                transition={{ repeat: Infinity, duration: 0.3 }}
              >
                🎲
              </motion.span>
              {' '}ارمِ الزهر
            </Button>
          </motion.div>
        ) : !quizVisible ? (
          <p className="text-muted-foreground text-sm">
            {phase === 'comp-thinking' ? '🤖 الكمبيوتر يلعب...' : ''}
          </p>
        ) : null}
      </div>

      {/* reset */}
      <div className="text-center mt-3">
        <button onClick={resetGame} className="text-xs text-muted-foreground underline">
          إعادة اللعبة
        </button>
      </div>

      {/* quiz overlay */}
      <AnimatePresence>
        {quizVisible && quiz && renderQuiz()}
      </AnimatePresence>
    </div>
  );
}
