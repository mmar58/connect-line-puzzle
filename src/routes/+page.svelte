<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { levelsStore, loadProgress } from "$lib/stores/levels";
	import type { Level } from "$lib/types/game";

	let showLevelSelector = $state(false);
	let allLevels = $derived($levelsStore);

	function handleTutorial() {
		window.location.href = "/levels?tutorial=true";
	}

	function handlePlay() {
		showLevelSelector = true;
	}

	function handleBackToMenu() {
		showLevelSelector = false;
	}

	function handleSelectLevel(levelId: number) {
		window.location.href = `/levels?id=${levelId}`;
	}

	function handleEdit() {
		window.location.href = "/editor";
	}

	function handleSettings() {
		window.location.href = "/settings";
	}
</script>

<main>
	<div class="container">
		{#if !showLevelSelector}
			<div class="menu-card">
				<h1>🎮 Line Connect Puzzle</h1>
				<p class="subtitle">
					Connect the dots without overlapping lines!
				</p>

				<div class="menu-buttons">
					<button class="menu-btn tutorial" onclick={handleTutorial}>
						<span class="icon">🎓</span>
						<span class="label">Tutorial</span>
						<span class="desc">Learn how to play</span>
					</button>

					<button class="menu-btn play" onclick={handlePlay}>
						<span class="icon">🎯</span>
						<span class="label">Play</span>
						<span class="desc">Choose a level</span>
					</button>

					<button class="menu-btn edit" onclick={handleEdit}>
						<span class="icon">🎨</span>
						<span class="label">Edit Level</span>
						<span class="desc">Create your own levels</span>
					</button>

					<button class="menu-btn settings" onclick={handleSettings}>
						<span class="icon">⚙️</span>
						<span class="label">Settings</span>
						<span class="desc">Game preferences</span>
					</button>
				</div>

				<footer class="menu-footer">
					<p>Made with ❤️ using SvelteKit</p>
				</footer>
			</div>
		{:else}
			<div class="level-selector-card">
				<div class="selector-header">
					<button class="back-btn" onclick={handleBackToMenu}>
						← Back
					</button>
					<h2>Select a Level</h2>
				</div>

				<div class="levels-grid">
					{#each allLevels as level}
						{@const progress = loadProgress(level.id)}
						<button
							class="level-card"
							class:completed={progress?.completed}
							onclick={() => handleSelectLevel(level.id)}
						>
							<div class="level-number">{level.id}</div>
							<div class="level-name">{level.name}</div>
							{#if progress?.completed}
								<div class="completed-badge">✓</div>
							{/if}
							{#if !level.isOfficial}
								<div class="custom-badge">Custom</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
	}

	main {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
	}

	.container {
		width: 100%;
		max-width: 500px;
		display: flex;
		justify-content: center;
	}

	.container:has(.level-selector-card) {
		max-width: 900px;
	}

	.menu-card {
		background: white;
		border-radius: 20px;
		padding: 3rem 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2.5rem;
		color: #333;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.subtitle {
		margin: 0 0 2.5rem 0;
		color: #666;
		font-size: 1.1rem;
	}

	.menu-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.menu-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: none;
		border-radius: 12px;
		background: #f5f5f5;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.menu-btn::before {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.3),
			transparent
		);
		transition: left 0.5s;
	}

	.menu-btn:hover::before {
		left: 100%;
	}

	.menu-btn:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}

	.menu-btn.tutorial {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.menu-btn.play {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
	}

	.menu-btn.edit {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: white;
	}

	.menu-btn.settings {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		color: white;
	}

	.icon {
		font-size: 3rem;
		line-height: 1;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}

	.label {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.desc {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.menu-footer {
		padding-top: 1.5rem;
		border-top: 1px solid #eee;
	}

	.menu-footer p {
		margin: 0;
		color: #999;
		font-size: 0.9rem;
	}

	/* Level Selector Styles */
	.level-selector-card {
		background: white;
		border-radius: 20px;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 900px;
		width: 100%;
		max-height: 85vh;
		overflow-y: auto;
	}

	.selector-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		position: relative;
	}

	.back-btn {
		padding: 0.75rem 1.5rem;
		background: rgba(102, 126, 234, 0.1);
		color: #667eea;
		border: none;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.back-btn:hover {
		background: rgba(102, 126, 234, 0.2);
		transform: translateX(-3px);
	}

	.selector-header h2 {
		margin: 0;
		font-size: 2rem;
		color: #333;
		flex: 1;
		text-align: center;
	}

	.levels-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.level-card {
		position: relative;
		aspect-ratio: 1;
		background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
		border: 3px solid #e0e4ea;
		border-radius: 15px;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		overflow: hidden;
	}

	.level-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		border-color: #667eea;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.level-card:hover .level-number,
	.level-card:hover .level-name {
		color: white;
	}

	.level-card.completed {
		background: linear-gradient(135deg, #4ecdc4 0%, #3db8af 100%);
		border-color: #3db8af;
	}

	.level-card.completed .level-number,
	.level-card.completed .level-name {
		color: white;
	}

	.level-card.completed:hover {
		background: linear-gradient(135deg, #3db8af 0%, #2ca89f 100%);
	}

	.level-number {
		font-size: 2.5rem;
		font-weight: bold;
		color: #333;
		line-height: 1;
	}

	.level-name {
		font-size: 0.9rem;
		color: #666;
		text-align: center;
		font-weight: 500;
	}

	.completed-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		background: white;
		color: #4ecdc4;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.custom-badge {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		background: #ffd93d;
		color: #333;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.menu-card {
			padding: 2rem 1.5rem;
		}

		.icon {
			font-size: 2.5rem;
		}

		.label {
			font-size: 1.1rem;
		}

		.level-selector-card {
			padding: 1.5rem;
		}

		.selector-header h2 {
			font-size: 1.5rem;
		}

		.levels-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 0.75rem;
		}

		.level-number {
			font-size: 2rem;
		}
	}
</style>
