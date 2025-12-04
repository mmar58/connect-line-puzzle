<script lang="ts">
	import { onMount } from 'svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import { GameManager } from '$lib/game/state.svelte';
	import { getAllLevels, getLevel, saveProgress, loadProgress } from '$lib/stores/levels';
	import type { Level } from '$lib/types/game';

	let gameManager = new GameManager();
	
	let currentLevelId = $state(1);
	let showLevelSelect = $state(false);
	let allLevels = $state<Level[]>([]);

	onMount(() => {
		allLevels = getAllLevels();
		loadLevel(currentLevelId);
	});

	function loadLevel(levelId: number) {
		const level = getLevel(levelId);
		if (level) {
			gameManager.loadLevel(level);
			currentLevelId = levelId;
			showLevelSelect = false;
		}
	}

	function handleReset() {
		gameManager.resetLevel();
	}

	function handleUndo() {
		gameManager.undoLastLine();
	}

	function handleNextLevel() {
		const nextId = currentLevelId + 1;
		const nextLevel = getLevel(nextId);
		if (nextLevel) {
			loadLevel(nextId);
		}
	}

	$effect(() => {
		if (gameManager.state.isComplete) {
			// Save progress
			const progress = loadProgress(currentLevelId);
			const newProgress = {
				levelId: currentLevelId,
				completed: true,
				bestLives: progress ? Math.max(progress.bestLives, gameManager.state.lives) : gameManager.state.lives,
				attempts: progress ? progress.attempts + 1 : 1
			};
			saveProgress(currentLevelId, newProgress);
		}
	});
</script>

<main>
	<div class="container">
		<header>
			<div class="header-left">
				<a href="/menu" class="back-button">← Menu</a>
				<h1>🎮 Line Connect Puzzle</h1>
			</div>
			<div class="header-right">
				<button class="secondary" onclick={() => (showLevelSelect = !showLevelSelect)}>
					{showLevelSelect ? 'Close' : 'Select Level'}
				</button>
			</div>
		</header>

		{#if showLevelSelect}
			<div class="level-select">
				<h2>Choose a Level</h2>
				<div class="level-grid">
					{#each allLevels as level}
						{@const progress = loadProgress(level.id)}
						<button
							class="level-card"
							class:active={currentLevelId === level.id}
							class:completed={progress?.completed}
							onclick={() => loadLevel(level.id)}
						>
							<span class="level-number">{level.id}</span>
							<span class="level-name">{level.name}</span>
							{#if progress?.completed}
								<span class="check">✓</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{:else if gameManager.state.level}
			<div class="game-area">
				<div class="hud">
					<div class="info">
						<h2>Level {currentLevelId}: {gameManager.state.level.name}</h2>
						<div class="stats">
							<div class="lives">
								❤️ Lives: {gameManager.state.lives}/{gameManager.state.maxLives}
							</div>
							<div class="connections">
								🔗 Connected: {gameManager.state.drawnLines.filter((l) => l.isComplete).length}/
								{gameManager.state.level.requiredConnections.length}
							</div>
						</div>
					</div>
					<div class="controls">
						<button onclick={handleUndo} disabled={gameManager.state.drawnLines.length === 0}>
							↶ Undo
						</button>
						<button onclick={handleReset}>🔄 Reset</button>
					</div>
				</div>

				<GameCanvas {gameManager} width={800} height={600} />

				{#if gameManager.state.isComplete}
					<div class="victory">
						<h2>🎉 Level Complete!</h2>
						<p>Lives remaining: {gameManager.state.lives}</p>
						<div class="victory-buttons">
							<button onclick={handleReset}>Play Again</button>
							<button onclick={handleNextLevel}>Next Level</button>
						</div>
					</div>
				{/if}

				{#if gameManager.state.lives === 0}
					<div class="game-over">
						<h2>💔 Game Over</h2>
						<p>Out of lives! The level has been reset.</p>
					</div>
				{/if}
			</div>

			<div class="instructions">
				<h3>How to Play</h3>
				<ul>
					<li>🎯 Connect matching colored dots by drawing lines</li>
					<li>✏️ Click/tap and drag from one dot to another of the same color</li>
					<li>⚠️ Lines cannot overlap - you'll lose a life!</li>
					<li>🎮 Complete all connections to win the level</li>
				</ul>
			</div>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	main {
		padding: 2rem;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	header {
		margin-bottom: 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.back-button {
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		font-weight: 600;
		transition: background 0.2s;
	}

	.back-button:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	h1 {
		color: white;
		font-size: 2rem;
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.game-area {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		position: relative;
	}

	.hud {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.info h2 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 1.5rem;
	}

	.stats {
		display: flex;
		gap: 1.5rem;
		font-size: 1.1rem;
		color: #666;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: 6px;
		background: #667eea;
		color: white;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: #5568d3;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	button.secondary {
		background: #764ba2;
	}

	button.secondary:hover {
		background: #653a8a;
	}

	.victory, .game-over {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 2rem 3rem;
		border-radius: 12px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
		text-align: center;
		z-index: 100;
	}

	.victory h2 {
		color: #4ECDC4;
		margin-top: 0;
	}

	.game-over h2 {
		color: #FF6B6B;
		margin-top: 0;
	}

	.victory-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.instructions {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 12px;
		padding: 1.5rem;
		margin-top: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.instructions h3 {
		margin-top: 0;
		color: #333;
	}

	.instructions ul {
		list-style: none;
		padding: 0;
	}

	.instructions li {
		padding: 0.5rem 0;
		color: #666;
	}

	.level-select {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.level-select h2 {
		margin-top: 0;
		color: #333;
		text-align: center;
	}

	.level-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.level-card {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		position: relative;
		background: #e8e8e8;
		color: #999;
		border: 2px solid #ddd;
	}

	.level-card:hover {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.level-card.active {
		background: #667eea;
		color: white;
		border: 3px solid #5568d3;
	}

	.level-card.completed {
		background: #4ECDC4;
		color: white;
		border: 2px solid #3db8af;
	}
	
	.level-card.completed:hover {
		background: #3db8af;
	}

	.level-number {
		font-size: 2rem;
		font-weight: bold;
	}

	.level-name {
		font-size: 0.9rem;
	}

	.check {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		font-size: 1.5rem;
	}

	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}

		h1 {
			font-size: 1.8rem;
		}

		.hud {
			flex-direction: column;
			align-items: stretch;
		}

		.controls {
			justify-content: center;
		}
	}
</style>
