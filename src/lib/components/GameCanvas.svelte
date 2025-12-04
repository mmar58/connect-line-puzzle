<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameManager } from '../game/state.svelte';
	import type { Point } from '../types/game';
	import { drawBackground, drawDot, clearCanvas, getCanvasPoint } from '../game/canvas';
	import { drawSmoothCurve } from '../game/smoothing';
	import { findDotAtPoint, decimatePoints } from '../game/geometry';

	interface Props {
		gameManager: GameManager;
		width?: number;
		height?: number;
	}

	let { gameManager, width = 800, height = 600 }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let animationFrameId: number;

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		startRenderLoop();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	function startRenderLoop() {
		function render() {
			if (ctx && gameManager.state.level) {
				renderGame();
			}
			animationFrameId = requestAnimationFrame(render);
		}
		render();
	}

	function renderGame() {
		// Clear and draw background
		clearCanvas(ctx, width, height);
		drawBackground(ctx, width, height);

		const state = gameManager.state;
		if (!state.level) return;

		// Draw completed lines
		for (const line of state.drawnLines) {
			if (line.points.length >= 2) {
				drawSmoothCurve(ctx, line.points, line.color, 8);
			}
		}

		// Draw current line being drawn
		if (state.currentLine && state.currentLine.points.length >= 2) {
			drawSmoothCurve(ctx, state.currentLine.points, state.currentLine.color, 8);
		}

		// Draw dots
		const connectedDots = gameManager.getConnectedDots();
		for (const dot of state.level.dots) {
			const isSelected = state.selectedDotId === dot.id;
			const isConnected = connectedDots.includes(dot.id);
			drawDot(ctx, dot, isSelected);

			// Draw checkmark on connected dots
			if (isConnected) {
				ctx.fillStyle = 'white';
				ctx.font = 'bold 16px sans-serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText('✓', dot.x, dot.y);
			}
		}
	}

	function handlePointerDown(e: PointerEvent) {
		const point = getCanvasPoint(canvas, e.clientX, e.clientY);
		
		if (!gameManager.state.level) return;

		const dot = findDotAtPoint(point, gameManager.state.level.dots);
		if (dot) {
			// Check if this dot is already connected
			const connectedDots = gameManager.getConnectedDots();
			if (!connectedDots.includes(dot.id)) {
				gameManager.startDrawing(dot.id, dot.color, { x: dot.x, y: dot.y });
			}
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!gameManager.state.isDrawing) return;

		const point = getCanvasPoint(canvas, e.clientX, e.clientY);
		gameManager.addPointToCurrentLine(point);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!gameManager.state.isDrawing) return;

		const point = getCanvasPoint(canvas, e.clientX, e.clientY);
		gameManager.finishDrawing(point);
	}

	function handlePointerCancel() {
		if (gameManager.state.isDrawing) {
			gameManager.cancelDrawing();
		}
	}
</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
	style="touch-action: none; cursor: crosshair;"
	class="game-canvas"
></canvas>

<style>
	.game-canvas {
		border: 2px solid #333;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
