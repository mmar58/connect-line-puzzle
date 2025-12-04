import type { GameState, DrawnLine, Level, Point } from '../types/game';
import { checkMultiLineOverlap, findDotAtPoint } from './geometry';

export class GameManager {
	state = $state<GameState>({
		level: null,
		drawnLines: [],
		currentLine: null,
		lives: 3,
		maxLives: 3,
		isDrawing: false,
		isComplete: false,
		selectedDotId: null
	});

	constructor() {
		// State is initialized above
	}

	loadLevel(level: Level) {
		this.state.level = level;
		this.state.drawnLines = [];
		this.state.currentLine = null;
		this.state.lives = this.state.maxLives;
		this.state.isComplete = false;
		this.state.selectedDotId = null;
		this.state.isDrawing = false;
	}

	startDrawing(dotId: number, color: string, startPoint: Point) {
		if (!this.state.level || this.state.isDrawing) return;

		this.state.isDrawing = true;
		this.state.selectedDotId = dotId;
		this.state.currentLine = {
			id: Date.now(),
			points: [startPoint],
			color,
			fromDotId: dotId,
			toDotId: null,
			isComplete: false
		};
	}

	addPointToCurrentLine(point: Point) {
		if (!this.state.currentLine || !this.state.isDrawing) return;

		// Add the new point
		this.state.currentLine.points.push(point);

		// Check for overlaps with existing completed lines
		const existingLinePaths = this.state.drawnLines.map((line) => line.points);
		
		if (this.state.currentLine.points.length >= 2) {
			const hasOverlap = checkMultiLineOverlap(
				[
					this.state.currentLine.points[this.state.currentLine.points.length - 2],
					this.state.currentLine.points[this.state.currentLine.points.length - 1]
				],
				existingLinePaths
			);

			if (hasOverlap) {
				this.handleOverlap();
			}
		}
	}

	finishDrawing(endPoint?: Point) {
		if (!this.state.currentLine || !this.state.level) {
			this.cancelDrawing();
			return;
		}

		// Check if ended on a dot
		let endDot = null;
		if (endPoint) {
			endDot = findDotAtPoint(endPoint, this.state.level.dots);
		}

		// Validate connection
		if (endDot && endDot.id !== this.state.currentLine.fromDotId) {
			// Check if colors match
			const startDot = this.state.level.dots.find((d) => d.id === this.state.currentLine!.fromDotId);
			if (startDot && startDot.color === endDot.color) {
				// Valid connection
				this.state.currentLine.toDotId = endDot.id;
				this.state.currentLine.isComplete = true;
				this.state.drawnLines.push(this.state.currentLine);
				
				this.checkWinCondition();
			} else {
				// Invalid color match - lose a life
				this.loseLife();
			}
		} else {
			// Didn't end on valid dot - lose a life
			this.loseLife();
		}

		this.state.currentLine = null;
		this.state.isDrawing = false;
		this.state.selectedDotId = null;
	}

	cancelDrawing() {
		this.state.currentLine = null;
		this.state.isDrawing = false;
		this.state.selectedDotId = null;
	}

	handleOverlap() {
		// Line overlapped - lose a life and cancel current line
		this.loseLife();
		this.cancelDrawing();
	}

	loseLife() {
		this.state.lives = Math.max(0, this.state.lives - 1);
		
		if (this.state.lives === 0) {
			// Game over - could reset or show game over screen
			this.resetLevel();
		}
	}

	resetLevel() {
		if (this.state.level) {
			this.loadLevel(this.state.level);
		}
	}

	undoLastLine() {
		if (this.state.drawnLines.length > 0) {
			this.state.drawnLines.pop();
			this.state.isComplete = false;
		}
	}

	checkWinCondition() {
		if (!this.state.level) return;

		const completedConnections = this.state.drawnLines
			.filter((line) => line.isComplete)
			.map((line) => ({
				dotId1: Math.min(line.fromDotId, line.toDotId!),
				dotId2: Math.max(line.fromDotId, line.toDotId!)
			}));

		const requiredConnections = this.state.level.requiredConnections.map((conn) => ({
			dotId1: Math.min(conn.dotId1, conn.dotId2),
			dotId2: Math.max(conn.dotId1, conn.dotId2)
		}));

		// Check if all required connections are made
		const allConnectionsMade = requiredConnections.every((required) =>
			completedConnections.some(
				(completed) =>
					completed.dotId1 === required.dotId1 && completed.dotId2 === required.dotId2
			)
		);

		if (allConnectionsMade) {
			this.state.isComplete = true;
		}
	}

	getConnectedDots(): number[] {
		const connected = new Set<number>();
		for (const line of this.state.drawnLines) {
			if (line.isComplete) {
				connected.add(line.fromDotId);
				connected.add(line.toDotId!);
			}
		}
		return Array.from(connected);
	}
}
