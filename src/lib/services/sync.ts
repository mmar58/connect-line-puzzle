import { api } from '$lib/api';
import {
    saveLevelToStorage,
    loadAllProgress,
    saveProgress,
    getAllLevels,
    builtInLevels
} from '$lib/stores/levels';
import type { Level, LevelProgress } from '$lib/types/game';

const USER_ID_KEY = 'line-puzzle-user-id';

export function getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}

export const syncService = {
    async syncLevels() {
        try {
            const response = await api.get<{ levels: Level[] }>('/levels?perPage=100');

            if (response.success && response.data?.levels) {
                // Update local storage with server levels
                response.data.levels.forEach(level => {
                    // Skip built-in levels if they come from server to avoid duplication/issues
                    // (Assuming server might serve customized official levels, but primarily we want new ones)
                    // The store handles ID checking, so it's safer to just save.
                    saveLevelToStorage(level);
                });
                console.log(`Synced ${response.data.levels.length} levels from server.`);
            }
        } catch (e) {
            console.error('Level sync failed:', e);
            // Offline: Do nothing, rely on local storage
        }
    },

    async syncProgress() {
        try {
            const userId = getUserId();
            const response = await api.get<{ progress: LevelProgress[] }>(`/progress?userId=${userId}`);

            if (!response.success) {
                console.warn('Failed to fetch remote progress');
                return;
            }

            const remoteProgressList = response.data?.progress || [];
            const localProgressMap = loadAllProgress();

            // 1. Merge Remote -> Local
            // If remote has progress for a level that is "better" or exists where local doesn't, update local.
            remoteProgressList.forEach(remote => {
                const local = localProgressMap[remote.levelId];

                let shouldUpdateLocal = false;
                if (!local) {
                    shouldUpdateLocal = true;
                } else {
                    // Compare: Completed vs not completed
                    if (remote.completed && !local.completed) shouldUpdateLocal = true;
                    // Compare: Best lives (higher is better)
                    if (remote.bestLives > local.bestLives) shouldUpdateLocal = true;
                }

                if (shouldUpdateLocal) {
                    saveProgress(remote.levelId, remote);
                }
            });

            // 2. Push Local -> Server
            // We push all local progress. The server handles "better" logic (GREATEST, etc.)
            // To be efficient, we could track dirty flags, but for now we push all.
            // But to avoid N requests, we really should batch this.
            // However, the backend doesn't seem to have a batch endpoint.
            // Backend `api/progress/save.php` takes one item.
            // We should only push if local is likely newer or if we have no simple way to know,
            // we iterate.

            // Optimization: Only push if we didn't just receive it from server.
            // Simple check: If local state matches remote state exactly, don't push.

            // Re-read local progress (it might have been updated from remote)
            const updatedLocalProgressMap = loadAllProgress();

            for (const [levelIdStr, local] of Object.entries(updatedLocalProgressMap)) {
                const levelId = parseInt(levelIdStr);
                const remote = remoteProgressList.find(p => p.levelId === levelId);

                let shouldPush = false;
                if (!remote) {
                    shouldPush = true;
                } else {
                    // If local is "better" than remote, push
                    if (local.completed && !remote.completed) shouldPush = true;
                    if (local.bestLives > remote.bestLives) shouldPush = true;
                    if (local.attempts > remote.attempts) shouldPush = true;
                }

                if (shouldPush) {
                    await api.post('/progress', {
                        userId,
                        levelId: local.levelId,
                        completed: local.completed,
                        bestLives: local.bestLives,
                        attempts: local.attempts
                    });
                }
            }

        } catch (e) {
            console.error('Progress sync failed:', e);
        }
    }
};
