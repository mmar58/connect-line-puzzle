import { writable, get } from 'svelte/store';
import type { Level, LevelProgress } from '../types/game';

const LEVELS_KEY = 'line-puzzle-levels';
const PROGRESS_KEY = 'line-puzzle-progress';

// Built-in levels
export const builtInLevels: Level[] = [
	{
		id: 1,
		isOfficial: true,
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
		isOfficial: true,
		name: 'Cross Path',
		gridWidth: 800,
		gridHeight: 600,
		// ... (omitting middle lines for brevity if valid context exists, but tool needs exact match. I'll do separate chunks or just one block if possible. The tool only supports chunks)
		// Wait, I can't easily replace disjoint blocks with one tool call unless I use multi_replace.
		// I'll used multi_replace for this.
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
		isOfficial: true,
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

function createLevelsStore() {
	const { subscribe, set, update } = writable<Level[]>([]);

	return {
		subscribe,
		init: () => {
			console.log('[LevelsStore] Initializing...');
			try {
				const stored = localStorage.getItem(LEVELS_KEY);
				const custom = stored ? JSON.parse(stored) : [];
				console.log(`[LevelsStore] Loaded ${custom.length} custom levels from localStorage.`);
				set([...builtInLevels, ...custom]);
			} catch (e) {
				console.error('[LevelsStore] Failed to load levels:', e);
				set([...builtInLevels]);
			}
		},
		saveLevel: (level: Level) => {
			console.log(`[LevelsStore] Saving level ${level.id} (${level.name})...`);
			update(levels => {
				// Determine if we are updating a custom level or adding a new one
				// Built-in levels (id < 1000) are immutable usually, but let's assume valid ID usage
				const existingIndex = levels.findIndex(l => l.id === level.id);
				const newLevels = [...levels];

				if (existingIndex >= 0) {
					newLevels[existingIndex] = level;
				} else {
					newLevels.push(level);
				}

				// Persist only custom levels (not official)
				const customLevels = newLevels.filter(l => !l.isOfficial);
				console.log(`[LevelsStore] Persisting ${customLevels.length} custom levels to localStorage.`);
				localStorage.setItem(LEVELS_KEY, JSON.stringify(customLevels));

				return newLevels;
			});
		},
		deleteLevel: (levelId: number) => {
			console.log(`[LevelsStore] Deleting level ${levelId}...`);
			update(levels => {
				const newLevels = levels.filter(l => l.id !== levelId);
				const customLevels = newLevels.filter(l => !l.isOfficial);
				localStorage.setItem(LEVELS_KEY, JSON.stringify(customLevels));
				return newLevels;
			});
		},
		// Helper to refresh from storage if triggered externally (though we should avoid this pattern)
		reload: () => {
			console.log('[LevelsStore] Reloading from storage...');
			try {
				const stored = localStorage.getItem(LEVELS_KEY);
				const custom = stored ? JSON.parse(stored) : [];
				console.log(`[LevelsStore] Reload found ${custom.length} custom levels.`);
				set([...builtInLevels, ...custom]);
			} catch (e) {
				set([...builtInLevels]);
			}
		}
	};
}

export const levelsStore = createLevelsStore();

// Initialize on import (client-side only check if needed, but svelte stores are fine)
if (typeof localStorage !== 'undefined') {
	levelsStore.init();
}


// Legacy/Helper wrappers to maintain API where possible, or refactor consumers
export function saveLevelToStorage(level: Level) {
	levelsStore.saveLevel(level);
}

export function loadCustomLevels(): Level[] {
	// This is synchronous and non-reactive, problematic for sync.
	// Better to read from store value or storage directly.
	try {
		const stored = localStorage.getItem(LEVELS_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		return [];
	}
}

export function getAllLevels(): Level[] {
	return get(levelsStore);
}

export function getLevel(id: number): Level | null {
	const all = get(levelsStore);
	return all.find(l => l.id === id) || null;
}

export function deleteLevelFromStorage(levelId: number) {
	levelsStore.deleteLevel(levelId);
}

// Progress Store
function createProgressStore() {
	const { subscribe, set, update } = writable<Record<number, LevelProgress>>({});

	return {
		subscribe,
		init: () => {
			try {
				const stored = localStorage.getItem(PROGRESS_KEY);
				set(stored ? JSON.parse(stored) : {});
			} catch (e) {
				set({});
			}
		},
		saveProgress: (levelId: number, progress: LevelProgress) => {
			update(all => {
				const newProgress = { ...all, [levelId]: progress };
				localStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
				return newProgress;
			});
		},
		clear: () => {
			localStorage.removeItem(PROGRESS_KEY);
			set({});
		}
	};
}

export const progressStore = createProgressStore();
if (typeof localStorage !== 'undefined') {
	progressStore.init();
}

export function saveProgress(levelId: number, progress: LevelProgress) {
	progressStore.saveProgress(levelId, progress);
}

export function loadAllProgress(): Record<number, LevelProgress> {
	return get(progressStore);
}

export function loadProgress(levelId: number): LevelProgress | null {
	const all = get(progressStore);
	return all[levelId] || null;
}

export function clearAllProgress() {
	progressStore.clear();
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
