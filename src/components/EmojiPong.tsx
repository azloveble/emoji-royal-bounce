import { useRef, useEffect, useCallback } from "react";
import { useEmojiPong, BALL_SIZE, PADDLE_HEIGHT, PADDLE_BOTTOM } from "@/hooks/useEmojiPong";

const EmojiPong = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    gameState, score, highScore, bgColor,
    ballRef, paddleXRef, paddleWidthRef,
    startGame, updatePaddle, tick, animRef,
  } = useEmojiPong();

  const getSize = useCallback(() => {
    const el = containerRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 400, h: 600 };
  }, []);

  const handleStart = useCallback(() => {
    const s = getSize();
    startGame(s.w, s.h);
  }, [getSize, startGame]);

  // Mouse / touch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      updatePaddle(clientX - rect.left, rect.width);
    };
    const onMouse = (e: MouseEvent) => handleMove(e.clientX);
    const onTouch = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX); };

    el.addEventListener("mousemove", onMouse);
    el.addEventListener("touchmove", onTouch, { passive: false });
    el.addEventListener("touchstart", onTouch, { passive: false });
    return () => {
      el.removeEventListener("mousemove", onMouse);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("touchstart", onTouch);
    };
  }, [updatePaddle]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") { cancelAnimationFrame(animRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const s = getSize();
      canvas.width = s.w;
      canvas.height = s.h;

      const alive = tick(s.w, s.h);

      ctx.clearRect(0, 0, s.w, s.h);

      // Paddle
      const pw = paddleWidthRef.current;
      const px = paddleXRef.current;
      const paddleY = s.h - PADDLE_BOTTOM - PADDLE_HEIGHT;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowColor = "rgba(255,255,255,0.4)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, paddleY, pw, PADDLE_HEIGHT, 7);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.font = `${BALL_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👸🏼", ballRef.current.x, ballRef.current.y);

      if (alive) animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, tick, getSize, ballRef, paddleXRef, paddleWidthRef, animRef]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 select-none overflow-hidden cursor-none"
      style={{ backgroundColor: bgColor, transition: "background-color 0.6s ease" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {gameState === "playing" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
          <span className="text-5xl font-black drop-shadow-lg tracking-tight"
            style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            {score}
          </span>
        </div>
      )}

      {gameState === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-6">
          <div className="text-8xl animate-bounce">👸🏼</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: "white", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            Emoji Pong
          </h1>
          {highScore > 0 && (
            <p style={{ color: "rgba(255,255,255,0.7)" }} className="text-lg">Recorde: {highScore}</p>
          )}
          <button
            onClick={handleStart}
            className="mt-4 px-10 py-4 backdrop-blur-md text-xl font-bold rounded-2xl active:scale-95 transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Jogar
          </button>
          <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm mt-2">
            Mova o mouse ou toque para controlar
          </p>
        </div>
      )}

      {gameState === "gameover" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="text-6xl">💔</div>
          <h2 className="text-3xl md:text-4xl font-black"
            style={{ color: "white", textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
            Game Over
          </h2>
          <p className="text-5xl font-black" style={{ color: "white" }}>{score}</p>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>pontos</p>
          {score >= highScore && score > 0 && (
            <p className="font-bold text-lg animate-pulse" style={{ color: "hsl(50, 90%, 60%)" }}>
              🏆 Novo recorde!
            </p>
          )}
          <button
            onClick={handleStart}
            className="mt-6 px-10 py-4 backdrop-blur-md text-xl font-bold rounded-2xl active:scale-95 transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default EmojiPong;
