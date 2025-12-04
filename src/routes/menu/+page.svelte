<script lang="ts">
	import { goto } from '$app/navigation';

	function handleTutorial() {
		goto('/levels?id=1');
	}

	function handlePlay() {
		goto('/levels');
	}

	function handleEdit() {
		goto('/editor');
	}

	function handleSettings() {
		goto('/settings');
	}
</script>

<main>
	<div class="container">
		<div class="menu-card">
			<h1>🎮 Line Connect Puzzle</h1>
			<p class="subtitle">Connect the dots without overlapping lines!</p>

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
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
	}

	.container {
		width: 100%;
		max-width: 500px;
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
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
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
	}
</style>
