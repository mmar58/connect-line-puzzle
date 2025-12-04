import type { Point, Dot } from '../types/game';

/**
 * Canvas drawing utilities
 */

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
	ctx.clearRect(0, 0, width, height);
}

export function drawDot(ctx: CanvasRenderingContext2D, dot: Dot, isHighlighted: boolean = false) {
	const radius = dot.radius || 20;

	// Draw outer glow if highlighted
	if (isHighlighted) {
		ctx.shadowColor = dot.color;
		ctx.shadowBlur = 15;
	}

	// Draw main circle
	ctx.fillStyle = dot.color;
	ctx.beginPath();
	ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
	ctx.fill();

	// Draw inner white circle for contrast
	ctx.fillStyle = 'white';
	ctx.beginPath();
	ctx.arc(dot.x, dot.y, radius * 0.4, 0, Math.PI * 2);
	ctx.fill();

	// Reset shadow
	ctx.shadowBlur = 0;

	// Draw border
	ctx.strokeStyle = isHighlighted ? 'white' : '#333';
	ctx.lineWidth = isHighlighted ? 3 : 2;
	ctx.beginPath();
	ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
	ctx.stroke();
}

export function drawLine(
	ctx: CanvasRenderingContext2D,
	points: Point[],
	color: string,
	lineWidth: number = 8
) {
	if (points.length < 2) return;

	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);

	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}

	ctx.stroke();
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
	// Draw gradient background
	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, '#1a1a2e');
	gradient.addColorStop(1, '#16213e');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	// Draw subtle grid
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
	ctx.lineWidth = 1;

	const gridSize = 50;
	for (let x = 0; x < width; x += gridSize) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();
	}

	for (let y = 0; y < height; y += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(width, y);
		ctx.stroke();
	}
}

export function getCanvasPoint(
	canvas: HTMLCanvasElement,
	clientX: number,
	clientY: number
): Point {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	return {
		x: (clientX - rect.left) * scaleX,
		y: (clientY - rect.top) * scaleY
	};
}
