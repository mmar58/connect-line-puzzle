import type { Level, LevelProgress } from '../types/game';

const LEVELS_KEY = 'line-puzzle-levels';
const PROGRESS_KEY = 'line-puzzle-progress';

export function saveLevelToStorage(level: Level) {
	const levels = loadCustomLevels();
	const existingIndex = levels.findIndex((l) => l.id === level.id);

	if (existingIndex >= 0) {
		levels[existingIndex] = level;
	} else {
		levels.push(level);
	}

	localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

export function loadCustomLevels(): Level[] {
	try {
		const stored = localStorage.getItem(LEVELS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		console.error('Failed to load custom levels:', e);
		return [];
	}
}

export function deleteLevelFromStorage(levelId: number) {
	const levels = loadCustomLevels();
	const filtered = levels.filter((l) => l.id !== levelId);
	localStorage.setItem(LEVELS_KEY, JSON.stringify(filtered));
}

export function saveProgress(levelId: number, progress: LevelProgress) {
	const allProgress = loadAllProgress();
	allProgress[levelId] = progress;
	localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
}

export function loadProgress(levelId: number): LevelProgress | null {
	const allProgress = loadAllProgress();
	return allProgress[levelId] || null;
}

export function loadAllProgress(): Record<number, LevelProgress> {
	try {
		const stored = localStorage.getItem(PROGRESS_KEY);
		return stored ? JSON.parse(stored) : {};
	} catch (e) {
		console.error('Failed to load progress:', e);
		return {};
	}
}

export function clearAllProgress() {
	localStorage.removeItem(PROGRESS_KEY);
}

export function exportLevelAsJSON(level: Level): string {
	return JSON.stringify(level, null, 2);
}

export function importLevelFromJSON(json: string): Level | null {
	try {
		const level = JSON.parse(json);
		// Basic validation
		if (
			typeof level.id === 'number' &&
			level.name &&
			Array.isArray(level.dots) &&
			Array.isArray(level.requiredConnections)
		) {
			return level as Level;
		}
		return null;
	} catch (e) {
		console.error('Failed to import level:', e);
		return null;
	}
}

// Built-in levels
export const builtInLevels: Level[] = [
	{
		id: 1,
		name: 'Tutorial',
		gridWidth: 800,
		gridHeight: 600,
		dots: [
			{ id: 1, x: 200, y: 200, color: '#FF6B6B' },
			{ id: 2, x: 600, y: 200, color: '#FF6B6B' },
			{ id: 3, x: 200, y: 400, color: '#4ECDC4' },
			{ id: 4, x: 600, y: 400, color: '#4ECDC4' }
		],
		requiredConnections: [
			{ dotId1: 1, dotId2: 2 },
			{ dotId1: 3, dotId2: 4 }
		]
	},
	{
		id: 2,
		name: 'Cross Path',
		gridWidth: 800,
		gridHeight: 600,
		dots: [
			{ id: 1, x: 150, y: 150, color: '#FF6B6B' },
			{ id: 2, x: 650, y: 450, color: '#FF6B6B' },
			{ id: 3, x: 650, y: 150, color: '#4ECDC4' },
			{ id: 4, x: 150, y: 450, color: '#4ECDC4' }
		],
		requiredConnections: [
			{ dotId1: 1, dotId2: 2 },
			{ dotId1: 3, dotId2: 4 }
		]
	},
	{
		id: 3,
		name: 'Triple Trouble',
		gridWidth: 800,
		gridHeight: 600,
		dots: [
			{ id: 1, x: 100, y: 150, color: '#FF6B6B' },
			{ id: 2, x: 700, y: 150, color: '#FF6B6B' },
			{ id: 3, x: 100, y: 300, color: '#4ECDC4' },
			{ id: 4, x: 700, y: 300, color: '#4ECDC4' },
			{ id: 5, x: 100, y: 450, color: '#FFD93D' },
			{ id: 6, x: 700, y: 450, color: '#FFD93D' }
		],
		requiredConnections: [
			{ dotId1: 1, dotId2: 2 },
			{ dotId1: 3, dotId2: 4 },
			{ dotId1: 5, dotId2: 6 }
		]
	}
];

export function getAllLevels(): Level[] {
	const custom = loadCustomLevels();
	return [...builtInLevels, ...custom];
}

export function getLevel(id: number): Level | null {
	const allLevels = getAllLevels();
	return allLevels.find((l) => l.id === id) || null;
}
