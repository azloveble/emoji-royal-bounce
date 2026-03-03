import { useRef, useState, useCallback } from "react";

const COLORS = [
  "hsl(270, 70%, 40%)",
  "hsl(320, 70%, 45%)",
  "hsl(340, 80%, 50%)",
  "hsl(200, 80%, 45%)",
  "hsl(170, 70%, 40%)",
  "hsl(140, 60%, 40%)",
  "hsl(50, 80%, 50%)",
  "hsl(30, 80%, 50%)",
];

const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.25;
const INITIAL_PADDLE_WIDTH = 140;
const MIN_PADDLE_WIDTH = 70;
const PADDLE_SHRINK = 1;
export const BALL_SIZE = 40;
export const PADDLE_HEIGHT = 14;
export const PADDLE_BOTTOM = 30;

export type GameState = "menu" | "playing" | "gameover";

export function useEmojiPong() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [bgColor, setBgColor] = useState(COLORS[0]);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("emoji-pong-high");
    return saved ? parseInt(saved, 10) : 0;
  });

  const ballRef = useRef({ x: 0, y: 0, vx: 3, vy: -3 });
  const paddleXRef = useRef(0);
  const paddleWidthRef = useRef(INITIAL_PADDLE_WIDTH);
  const scoreRef = useRef(0);
  const animRef = useRef<number>(0);
  const highScoreRef = useRef(highScore);

  const startGame = useCallback((w: number, h: number) => {
    scoreRef.current = 0;
    setScore(0);
    paddleWidthRef.current = INITIAL_PADDLE_WIDTH;
    paddleXRef.current = w / 2;

    const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
    const dir = Math.random() > 0.5 ? 1 : -1;
    ballRef.current = {
      x: w / 2,
      y: h / 3,
      vx: Math.cos(angle) * INITIAL_SPEED * dir,
      vy: -Math.sin(angle) * INITIAL_SPEED,
    };

    setBgColor(COLORS[0]);
    setGameState("playing");
  }, []);

  const updatePaddle = useCallback((_x: number, _canvasWidth: number) => {
    // Auto mode: paddle follows ball automatically
  }, []);

  const tick = useCallback((cw: number, ch: number) => {
    const ball = ballRef.current;
    const pw = paddleWidthRef.current;

    // Auto-move paddle to follow ball x position
    const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
    const trackSpeed = Math.min(0.35, 0.15 + speed * 0.008);
    const targetX = Math.max(pw / 2, Math.min(cw - pw / 2, ball.x));
    paddleXRef.current += (targetX - paddleXRef.current) * trackSpeed;
    const px = paddleXRef.current;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - BALL_SIZE / 2 <= 0) { ball.x = BALL_SIZE / 2; ball.vx = Math.abs(ball.vx); }
    if (ball.x + BALL_SIZE / 2 >= cw) { ball.x = cw - BALL_SIZE / 2; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_SIZE / 2 <= 0) { ball.y = BALL_SIZE / 2; ball.vy = Math.abs(ball.vy); }

    const paddleTop = ch - PADDLE_BOTTOM - PADDLE_HEIGHT;
    if (
      ball.vy > 0 &&
      ball.y + BALL_SIZE / 2 >= paddleTop &&
      ball.y + BALL_SIZE / 2 <= paddleTop + PADDLE_HEIGHT + Math.abs(ball.vy) &&
      ball.x >= px - pw / 2 &&
      ball.x <= px + pw / 2
    ) {
      ball.y = paddleTop - BALL_SIZE / 2;
      const hitPos = (ball.x - px) / (pw / 2);
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2) + SPEED_INCREMENT;
      const angle = (30 + (1 - Math.abs(hitPos)) * 40) * (Math.PI / 180);
      ball.vx = Math.sin(angle) * speed * (hitPos < 0 ? -1 : 1);
      ball.vy = -Math.cos(angle) * speed;

      scoreRef.current += 1;
      setScore(scoreRef.current);
      paddleWidthRef.current = Math.max(MIN_PADDLE_WIDTH, pw - PADDLE_SHRINK);
      setBgColor(COLORS[scoreRef.current % COLORS.length]);
    }

    if (ball.y - BALL_SIZE / 2 > ch) {
      const finalScore = scoreRef.current;
      setGameState("gameover");
      if (finalScore > highScoreRef.current) {
        highScoreRef.current = finalScore;
        setHighScore(finalScore);
        localStorage.setItem("emoji-pong-high", String(finalScore));
      }
      return false;
    }
    return true;
  }, []);

  return {
    gameState, score, highScore, bgColor,
    ballRef, paddleXRef, paddleWidthRef,
    startGame, updatePaddle, tick, animRef,
  };
}
