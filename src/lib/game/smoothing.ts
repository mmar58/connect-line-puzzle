import type { Point } from '../types/game';

/**
 * Smooth a path using Catmull-Rom spline interpolation
 */
export function smoothPath(points: Point[], tension: number = 0.5): Point[] {
	if (points.length < 3) return points;

	const smoothed: Point[] = [];
	smoothed.push(points[0]);

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i === 0 ? i : i - 1];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] || p2;

		// Generate intermediate points using Catmull-Rom
		const segments = 10; // Number of intermediate points
		for (let t = 0; t < segments; t++) {
			const t_normalized = t / segments;
			const point = catmullRomPoint(p0, p1, p2, p3, t_normalized, tension);
			smoothed.push(point);
		}
	}

	smoothed.push(points[points.length - 1]);
	return smoothed;
}

/**
 * Calculate a point on Catmull-Rom curve
 */
function catmullRomPoint(
	p0: Point,
	p1: Point,
	p2: Point,
	p3: Point,
	t: number,
	tension: number
): Point {
	const t2 = t * t;
	const t3 = t2 * t;

	const v0x = (p2.x - p0.x) * tension;
	const v0y = (p2.y - p0.y) * tension;
	const v1x = (p3.x - p1.x) * tension;
	const v1y = (p3.y - p1.y) * tension;

	const x =
		(2 * p1.x - 2 * p2.x + v0x + v1x) * t3 +
		(-3 * p1.x + 3 * p2.x - 2 * v0x - v1x) * t2 +
		v0x * t +
		p1.x;

	const y =
		(2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
		(-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
		v0y * t +
		p1.y;

	return { x, y };
}

/**
 * Draw a smooth curve through points on canvas using bezier curves
 */
export function drawSmoothCurve(
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

	if (points.length === 2) {
		// Just draw a straight line
		ctx.lineTo(points[1].x, points[1].y);
	} else {
		// Draw quadratic curves through points
		for (let i = 1; i < points.length - 1; i++) {
			const xc = (points[i].x + points[i + 1].x) / 2;
			const yc = (points[i].y + points[i + 1].y) / 2;
			ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
		}
		// Last segment
		const lastPoint = points[points.length - 1];
		const secondLast = points[points.length - 2];
		ctx.quadraticCurveTo(secondLast.x, secondLast.y, lastPoint.x, lastPoint.y);
	}

	ctx.stroke();
}

/**
 * Get evenly spaced points along a path for collision detection
 */
export function getEvenlySpacedPoints(points: Point[], spacing: number = 5): Point[] {
	if (points.length < 2) return points;

	const result: Point[] = [points[0]];
	let accumulated = 0;

	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		const segmentLength = Math.sqrt(dx * dx + dy * dy);
		accumulated += segmentLength;

		// Add intermediate points along this segment
		const numPoints = Math.floor(segmentLength / spacing);
		for (let j = 1; j <= numPoints; j++) {
			const t = j / (numPoints + 1);
			result.push({
				x: points[i - 1].x + dx * t,
				y: points[i - 1].y + dy * t
			});
		}

		result.push(points[i]);
	}

	return result;
}
