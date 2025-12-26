export interface Point {
	x: number;
	y: number;
}

export interface Dot {
	id: number;
	x: number;
	y: number;
	color: string;
	radius?: number;
}

export interface Connection {
	dotId1: number;
	dotId2: number;
}

export interface LineSegment {
	start: Point;
	end: Point;
}

export interface DrawnLine {
	id: number;
	points: Point[];
	color: string;
	fromDotId: number;
	toDotId: number | null;
	isComplete: boolean;
}

export interface Level {
	id: number;
	name: string;
	dots: Dot[];
	requiredConnections: Connection[];
	gridWidth: number;
	gridHeight: number;
	isOfficial?: boolean;
}

export interface GameState {
	level: Level | null;
	drawnLines: DrawnLine[];
	currentLine: DrawnLine | null;
	lives: number;
	maxLives: number;
	isDrawing: boolean;
	isComplete: boolean;
	selectedDotId: number | null;
}

export interface LevelProgress {
	levelId: number;
	completed: boolean;
	bestLives: number;
	attempts: number;
}
