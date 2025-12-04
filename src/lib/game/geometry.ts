import type { Point, LineSegment, Dot } from '../types/game';

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two line segments intersect
 * Uses the cross product method
 */
export function segmentsIntersect(seg1: LineSegment, seg2: LineSegment): boolean {
	const p1 = seg1.start;
	const p2 = seg1.end;
	const p3 = seg2.start;
	const p4 = seg2.end;

	const d1 = direction(p3, p4, p1);
	const d2 = direction(p3, p4, p2);
	const d3 = direction(p1, p2, p3);
	const d4 = direction(p1, p2, p4);

	if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
		return true;
	}

	// Check for collinear cases
	if (d1 === 0 && onSegment(p3, p4, p1)) return true;
	if (d2 === 0 && onSegment(p3, p4, p2)) return true;
	if (d3 === 0 && onSegment(p1, p2, p3)) return true;
	if (d4 === 0 && onSegment(p1, p2, p4)) return true;

	return false;
}

/**
 * Calculate the direction of turn formed by three points
 * Returns positive for counter-clockwise, negative for clockwise, 0 for collinear
 */
function direction(p1: Point, p2: Point, p3: Point): number {
	return (p3.y - p1.y) * (p2.x - p1.x) - (p2.y - p1.y) * (p3.x - p1.x);
}

/**
 * Check if point p lies on line segment (p1, p2)
 */
function onSegment(p1: Point, p2: Point, p: Point): boolean {
	return (
		p.x <= Math.max(p1.x, p2.x) &&
		p.x >= Math.min(p1.x, p2.x) &&
		p.y <= Math.max(p1.y, p2.y) &&
		p.y >= Math.min(p1.y, p2.y)
	);
}

/**
 * Check if a point is near a dot
 */
export function isPointNearDot(point: Point, dot: Dot, threshold: number = 30): boolean {
	return distance(point, { x: dot.x, y: dot.y }) <= threshold;
}

/**
 * Find a dot at a specific point
 */
export function findDotAtPoint(point: Point, dots: Dot[], threshold: number = 30): Dot | null {
	for (const dot of dots) {
		if (isPointNearDot(point, dot, threshold)) {
			return dot;
		}
	}
	return null;
}

/**
 * Check if a new line segment overlaps with existing line segments
 */
export function checkLineOverlap(newSegment: LineSegment, existingPoints: Point[]): boolean {
	if (existingPoints.length < 2) return false;

	for (let i = 0; i < existingPoints.length - 1; i++) {
		const existingSegment: LineSegment = {
			start: existingPoints[i],
			end: existingPoints[i + 1]
		};

		if (segmentsIntersect(newSegment, existingSegment)) {
			return true;
		}
	}

	return false;
}

/**
 * Check if a line path overlaps with multiple existing lines
 */
export function checkMultiLineOverlap(
	newPoints: Point[],
	existingLines: Point[][]
): boolean {
	if (newPoints.length < 2) return false;

	// Create segments from new points
	for (let i = 0; i < newPoints.length - 1; i++) {
		const newSegment: LineSegment = {
			start: newPoints[i],
			end: newPoints[i + 1]
		};

		// Check against all existing lines
		for (const existingLine of existingLines) {
			if (checkLineOverlap(newSegment, existingLine)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Decimate points using Douglas-Peucker algorithm to reduce point count
 */
export function decimatePoints(points: Point[], tolerance: number = 2): Point[] {
	if (points.length <= 2) return points;

	// Find the point with maximum distance
	let maxDistance = 0;
	let index = 0;

	for (let i = 1; i < points.length - 1; i++) {
		const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
		if (dist > maxDistance) {
			maxDistance = dist;
			index = i;
		}
	}

	// If max distance is greater than tolerance, recursively simplify
	if (maxDistance > tolerance) {
		const left = decimatePoints(points.slice(0, index + 1), tolerance);
		const right = decimatePoints(points.slice(index), tolerance);

		// Concatenate results, avoiding duplicate middle point
		return [...left.slice(0, -1), ...right];
	} else {
		// Return simplified line with just endpoints
		return [points[0], points[points.length - 1]];
	}
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;

	if (dx === 0 && dy === 0) {
		return distance(point, lineStart);
	}

	const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
	const denominator = Math.sqrt(dx * dx + dy * dy);

	return numerator / denominator;
}
