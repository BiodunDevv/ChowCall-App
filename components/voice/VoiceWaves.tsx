"use client";

import { useCallback, useEffect, useRef } from "react";

// Opacity levels for the three wave layers (resolved at runtime from --muted-foreground)
const WAVE_CONFIGS = [
	{ amplitude: 20, frequency: 0.004, speed: 0.02, opacity: 0.12, baseHeight: 0.9, verticalAmplitude: 8, parallaxFactor: 1 },
	{ amplitude: 15, frequency: 0.007, speed: 0.015, opacity: 0.10, baseHeight: 0.71, verticalAmplitude: 12, parallaxFactor: 0.7 },
	{ amplitude: 12, frequency: 0.01, speed: 0.01, opacity: 0.08, baseHeight: 0.6, verticalAmplitude: 15, parallaxFactor: 0.4 },
] as const;

type WaveConfig = (typeof WAVE_CONFIGS)[number] & { color: string };

export function VoiceWaves({ paused = false }: { paused?: boolean }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const timeRef = useRef(0);
	const rafRef = useRef<number>(0);
	const lastFrameRef = useRef(0);
	const wavesRef = useRef<WaveConfig[]>([]);

	const drawWave = useCallback(
		(
			ctx: CanvasRenderingContext2D,
			wave: WaveConfig,
			canvasWidth: number,
			canvasHeight: number,
			time: number,
		) => {
			const verticalOffset =
				wave.verticalAmplitude * Math.sin(time * 0.02 * wave.parallaxFactor);
			ctx.fillStyle = wave.color;
			ctx.beginPath();
			ctx.moveTo(0, canvasHeight);
			const steps = Math.ceil(canvasWidth);
			for (let index = 0; index <= steps; index += 1) {
				const x = (index / steps) * canvasWidth;
				const wavePos = x * wave.frequency + time * wave.speed * wave.parallaxFactor;
				const waveHeight = Math.sin(wavePos) * wave.amplitude;
				const y =
					canvasHeight * wave.baseHeight +
					verticalOffset * wave.parallaxFactor +
					waveHeight;
				if (index === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.lineTo(canvasWidth, canvasHeight);
			ctx.lineTo(0, canvasHeight);
			ctx.closePath();
			ctx.fill();
		},
		[],
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = canvas?.parentElement;
		if (!canvas || !container) return;

		// Resolve --muted-foreground from DOM (canvas ctx.fillStyle can't use CSS vars)
		const rawColor = getComputedStyle(container).getPropertyValue("--muted-foreground").trim() || "#78716c";
		// rawColor may be a hex like #78716c or an rgb value — parse it to rgba with opacity
		const toRgba = (hex: string, alpha: number) => {
			const h = hex.replace("#", "");
			if (h.length === 6) {
				const r = parseInt(h.slice(0, 2), 16);
				const g = parseInt(h.slice(2, 4), 16);
				const b = parseInt(h.slice(4, 6), 16);
				return `rgba(${r},${g},${b},${alpha})`;
			}
			return `rgba(120,113,108,${alpha})`;
		};
		wavesRef.current = WAVE_CONFIGS.map((w) => ({ ...w, color: toRgba(rawColor, w.opacity) }));

		const animate = () => {
			const ctx = canvas.getContext("2d", { alpha: true });
			if (!ctx) return;
			const now = performance.now();
			const deltaTime = (now - lastFrameRef.current) / 1000;
			lastFrameRef.current = now;
			timeRef.current += deltaTime * 50;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (const wave of [...wavesRef.current].reverse()) {
				drawWave(ctx, wave, canvas.width, canvas.height, timeRef.current);
			}
			if (!paused) rafRef.current = requestAnimationFrame(animate);
		};

		const init = () => {
			const rect = container.getBoundingClientRect();
			canvas.width = rect.width;
			canvas.height = rect.height;
			lastFrameRef.current = performance.now();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			animate();
		};

		init();
		const resizeObserver = new ResizeObserver(init);
		resizeObserver.observe(container);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			resizeObserver.disconnect();
		};
	}, [drawWave, paused]);

	return <canvas ref={canvasRef} aria-hidden className="size-full" />;
}
