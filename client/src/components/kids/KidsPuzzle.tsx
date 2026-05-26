import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { puzzleImages, randomPuzzleImage, type PuzzleImage } from '@/lib/kids-puzzle-data';

type Level = '3x3' | '4x4';

function buildSolvedBoard(n: number): number[] {
  return [...Array(n * n - 1).keys()].map(i => i + 1).concat(0);
}

function countInversions(board: number[]): number {
  let inv = 0;
  const flat = board.filter(x => x !== 0);
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;
  return inv;
}

function isSolvable(board: number[], n: number): boolean {
  const inv = countInversions(board);
  if (n % 2 === 1) return inv % 2 === 0;
  const blankRow = Math.floor(board.indexOf(0) / n);
  const blankFromBottom = n - blankRow;
  return (blankFromBottom % 2 === 1) ? inv % 2 === 0 : inv % 2 === 1;
}

function shuffle(board: number[], n: number): number[] {
  let arr = [...board];
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr, n) || JSON.stringify(arr) === JSON.stringify(buildSolvedBoard(n)));
  return arr;
}

function getNeighbors(idx: number, n: number): number[] {
  const row = Math.floor(idx / n), col = idx % n;
  const nb: number[] = [];
  if (row > 0) nb.push(idx - n);
  if (row < n - 1) nb.push(idx + n);
  if (col > 0) nb.push(idx - 1);
  if (col < n - 1) nb.push(idx + 1);
  return nb;
}

interface GameState {
  board: number[];
  image: PuzzleImage;
  level: Level;
  moves: number;
  solved: boolean;
}

export default function KidsPuzzle() {
  const [game, setGame] = useState<GameState | null>(null);

  const startGame = useCallback((level: Level) => {
    const n = level === '3x3' ? 3 : 4;
    const solved = buildSolvedBoard(n);
    const board = shuffle(solved, n);
    setGame({ board, image: randomPuzzleImage(), level, moves: 0, solved: false });
  }, []);

  const handleTile = useCallback((idx: number) => {
    if (!game || game.solved) return;
    const n = game.level === '3x3' ? 3 : 4;
    const blankIdx = game.board.indexOf(0);
    if (!getNeighbors(blankIdx, n).includes(idx)) return;
    const newBoard = [...game.board];
    [newBoard[idx], newBoard[blankIdx]] = [newBoard[blankIdx], newBoard[idx]];
    const solved = JSON.stringify(newBoard) === JSON.stringify(buildSolvedBoard(n));
    setGame(g => g ? { ...g, board: newBoard, moves: g.moves + 1, solved } : g);
  }, [game]);

  // ── شاشة البداية ──────────────────────────────────────────────────
  if (!game) {
    return (
      <Card className="p-6 text-center">
        <div className="text-5xl mb-3">🧩</div>
        <h3 className="text-xl font-bold mb-1">لغز الصور</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          رتّب القطع لتكتشف صورة من قصص الكتاب المقدس
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => startGame('3x3')} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            😊 سهل — ٣×٣
          </Button>
          <Button onClick={() => startGame('4x4')} className="bg-violet-500 hover:bg-violet-600 text-white gap-2">
            🔥 صعب — ٤×٤
          </Button>
        </div>
        {/* معاينة الصور المتاحة */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {puzzleImages.map(img => (
            <img
              key={img.id}
              src={`https://img.youtube.com/vi/${img.youtubeId}/default.jpg`}
              alt={img.title}
              title={img.title}
              className="w-12 h-9 rounded object-cover opacity-60 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">تُختار الصورة عشوائياً في كل لعبة</p>
      </Card>
    );
  }

  const n = game.level === '3x3' ? 3 : 4;
  const thumbUrl = `https://img.youtube.com/vi/${game.image.youtubeId}/hqdefault.jpg`;
  const cellPct = 100 / n;

  return (
    <Card className="p-4">
      {/* رأس */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧩</span>
          <span className="font-bold text-sm text-foreground">{game.image.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">المشوارات: {game.moves}</span>
          <Button variant="outline" size="sm" onClick={() => setGame(null)} className="text-xs h-7">
            تغيير المستوى
          </Button>
          <Button variant="outline" size="sm" onClick={() => startGame(game.level)} className="text-xs h-7">
            🔀 خلط
          </Button>
        </div>
      </div>

      {/* شاشة الفوز */}
      {game.solved && (
        <div className="text-center py-6">
          <div className="text-5xl mb-2">🎉</div>
          <h3 className="text-xl font-bold mb-1">أحسنت!</h3>
          <p className="text-muted-foreground mb-1">
            حللت لغز <strong>{game.image.title}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-4">في {game.moves} مشوار</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => startGame(game.level)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              العب مرة أخرى
            </Button>
            <Button variant="outline" onClick={() => setGame(null)}>تغيير المستوى</Button>
          </div>
        </div>
      )}

      {/* شبكة اللغز */}
      {!game.solved && (
        <div className="flex flex-col sm:flex-row gap-4 items-start justify-center">
          {/* اللغز */}
          <div
            className="grid mx-auto"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gap: '3px',
              width: 'min(320px, 90vw)',
              height: 'min(320px, 90vw)',
            }}
          >
            {game.board.map((tile, idx) => {
              const isBlank = tile === 0;
              // الموضع الأصلي للقطعة في الصورة
              const origPos = tile - 1; // 0-indexed
              const origCol = origPos % n;
              const origRow = Math.floor(origPos / n);

              return (
                <button
                  key={idx}
                  onClick={() => handleTile(idx)}
                  disabled={isBlank}
                  className={`rounded transition-all duration-150 ${
                    isBlank
                      ? 'bg-muted/40 cursor-default'
                      : 'cursor-pointer hover:brightness-110 active:scale-95'
                  }`}
                  style={isBlank ? {} : {
                    backgroundImage: `url(${thumbUrl})`,
                    backgroundSize: `${n * 100}% ${n * 100}%`,
                    backgroundPosition: `${origCol * cellPct / (1 - 1 / n)}% ${origRow * cellPct / (1 - 1 / n)}%`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              );
            })}
          </div>

          {/* الصورة الكاملة كمرجع */}
          <div className="flex-shrink-0 text-center">
            <p className="text-xs text-muted-foreground mb-1">الصورة الكاملة</p>
            <img
              src={thumbUrl}
              alt={game.image.title}
              className="rounded-lg w-24 h-auto opacity-70 mx-auto"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
