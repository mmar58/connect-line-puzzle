<script lang="ts">
	import { onMount } from 'svelte';

	let soundEnabled = $state(true);
	let musicEnabled = $state(true);
	let vibrationEnabled = $state(true);
	let showGrid = $state(true);
	let lineWidth = $state(8);
	let smoothing = $state(0.5);

	const SETTINGS_KEY = 'line-puzzle-settings';

	onMount(() => {
		loadSettings();
	});

	function loadSettings() {
		try {
			const stored = localStorage.getItem(SETTINGS_KEY);
			if (stored) {
				const settings = JSON.parse(stored);
				soundEnabled = settings.soundEnabled ?? true;
				musicEnabled = settings.musicEnabled ?? true;
				vibrationEnabled = settings.vibrationEnabled ?? true;
				showGrid = settings.showGrid ?? true;
				lineWidth = settings.lineWidth ?? 8;
				smoothing = settings.smoothing ?? 0.5;
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
	}

	function saveSettings() {
		const settings = {
			soundEnabled,
			musicEnabled,
			vibrationEnabled,
			showGrid,
			lineWidth,
			smoothing
		};
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		alert('Settings saved!');
	}

	function resetSettings() {
		if (confirm('Reset all settings to default?')) {
			soundEnabled = true;
			musicEnabled = true;
			vibrationEnabled = true;
			showGrid = true;
			lineWidth = 8;
			smoothing = 0.5;
			localStorage.removeItem(SETTINGS_KEY);
		}
	}

	function clearProgress() {
		if (confirm('Clear all game progress? This cannot be undone!')) {
			localStorage.removeItem('line-puzzle-progress');
			alert('Progress cleared!');
		}
	}
</script>

<main>
	<div class="container">
		<header>
			<a href="/menu" class="back-button">← Back to Menu</a>
			<h1>⚙️ Settings</h1>
		</header>

		<div class="settings-card">
			<section class="settings-section">
				<h2>🔊 Audio</h2>
				<div class="setting-item">
					<label>
						<span>Sound Effects</span>
						<input type="checkbox" bind:checked={soundEnabled} />
					</label>
				</div>
				<div class="setting-item">
					<label>
						<span>Background Music</span>
						<input type="checkbox" bind:checked={musicEnabled} />
					</label>
				</div>
			</section>

			<section class="settings-section">
				<h2>📱 Haptics</h2>
				<div class="setting-item">
					<label>
						<span>Vibration Feedback</span>
						<input type="checkbox" bind:checked={vibrationEnabled} />
					</label>
				</div>
			</section>

			<section class="settings-section">
				<h2>🎨 Graphics</h2>
				<div class="setting-item">
					<label>
						<span>Show Grid</span>
						<input type="checkbox" bind:checked={showGrid} />
					</label>
				</div>
				<div class="setting-item">
					<label>
						<span>Line Width: {lineWidth}px</span>
						<input type="range" min="4" max="16" bind:value={lineWidth} />
					</label>
				</div>
				<div class="setting-item">
					<label>
						<span>Line Smoothing: {smoothing.toFixed(2)}</span>
						<input type="range" min="0" max="1" step="0.1" bind:value={smoothing} />
					</label>
				</div>
			</section>

			<section class="settings-section">
				<h2>💾 Data</h2>
				<div class="setting-item">
					<button class="danger" onclick={clearProgress}>Clear All Progress</button>
				</div>
			</section>

			<div class="action-buttons">
				<button class="primary" onclick={saveSettings}>💾 Save Settings</button>
				<button class="secondary" onclick={resetSettings}>🔄 Reset to Default</button>
			</div>
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
		padding: 2rem;
		min-height: 100vh;
	}

	.container {
		max-width: 700px;
		margin: 0 auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		color: white;
		font-size: 2.5rem;
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
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

	.settings-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.settings-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #eee;
	}

	.settings-section:last-of-type {
		border-bottom: none;
	}

	.settings-section h2 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.3rem;
	}

	.setting-item {
		margin-bottom: 1rem;
	}

	.setting-item:last-child {
		margin-bottom: 0;
	}

	label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.2s;
	}

	label:hover {
		background: #ebebeb;
	}

	label span {
		font-weight: 500;
		color: #333;
	}

	input[type="checkbox"] {
		width: 50px;
		height: 26px;
		appearance: none;
		background: #ccc;
		border-radius: 13px;
		position: relative;
		cursor: pointer;
		transition: background 0.2s;
	}

	input[type="checkbox"]:checked {
		background: #4ECDC4;
	}

	input[type="checkbox"]::before {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		top: 3px;
		left: 3px;
		transition: left 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type="checkbox"]:checked::before {
		left: 27px;
	}

	input[type="range"] {
		width: 200px;
		height: 6px;
		border-radius: 3px;
		background: #ddd;
		outline: none;
		appearance: none;
	}

	input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type="range"]::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	button {
		flex: 1;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
		min-width: 150px;
	}

	button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button.primary {
		background: #4ECDC4;
		color: white;
	}

	button.primary:hover {
		background: #3db8af;
	}

	button.secondary {
		background: #667eea;
		color: white;
	}

	button.secondary:hover {
		background: #5568d3;
	}

	button.danger {
		background: #ff6b6b;
		color: white;
		width: 100%;
	}

	button.danger:hover {
		background: #ee5a5a;
	}

	@media (max-width: 768px) {
		main {
			padding: 1rem;
		}

		h1 {
			font-size: 2rem;
		}

		.settings-card {
			padding: 1.5rem;
		}

		input[type="range"] {
			width: 150px;
		}

		.action-buttons {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
