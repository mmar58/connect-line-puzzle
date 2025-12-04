<script lang="ts">
	import { onMount } from 'svelte';
	import type { Dot, Level, Connection } from '$lib/types/game';
	import { saveLevelToStorage, exportLevelAsJSON, importLevelFromJSON, getAllLevels } from '$lib/stores/levels';
	import { GameManager } from '$lib/game/state.svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let dots: Dot[] = $state([]);
	let connections: Connection[] = $state([]);
	let nextDotId = $state(1);
	let selectedColor = $state('#FF6B6B');
	let levelName = $state('My Level');
	let levelId = $state(1000); // Custom levels start at 1000
	let mode: 'edit' | 'test' = $state('edit');
	let gameManager: GameManager | null = $state(null);
	let allLevels: Level[] = $state([]);
	let isEditingExisting = $state(false);
	let draggedDotId: number | null = $state(null);
	let isDragging = $state(false);

	const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8E6CF'];
	const canvasWidth = 800;
	const canvasHeight = 600;

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			renderEditor();
		}

		// Load all available levels
		allLevels = getAllLevels();

		// Find next available level ID
		const maxId = Math.max(...allLevels.map(l => l.id), 999);
		levelId = maxId + 1;
	});

	function renderEditor() {
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Draw grid
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 1;
		for (let x = 0; x < canvasWidth; x += 50) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvasHeight);
			ctx.stroke();
		}
		for (let y = 0; y < canvasHeight; y += 50) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvasWidth, y);
			ctx.stroke();
		}

		// Draw connections
		for (const conn of connections) {
			const dot1 = dots.find(d => d.id === conn.dotId1);
			const dot2 = dots.find(d => d.id === conn.dotId2);
			if (dot1 && dot2) {
				ctx.strokeStyle = dot1.color;
				ctx.lineWidth = 3;
				ctx.setLineDash([5, 5]);
				ctx.beginPath();
				ctx.moveTo(dot1.x, dot1.y);
				ctx.lineTo(dot2.x, dot2.y);
				ctx.stroke();
				ctx.setLineDash([]);
			}
		}

		// Draw dots
		for (const dot of dots) {
			// Outer circle
			ctx.fillStyle = dot.color;
			ctx.beginPath();
			ctx.arc(dot.x, dot.y, 20, 0, Math.PI * 2);
			ctx.fill();

			// Inner circle
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(dot.x, dot.y, 8, 0, Math.PI * 2);
			ctx.fill();

			// Border
			ctx.strokeStyle = '#333';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(dot.x, dot.y, 20, 0, Math.PI * 2);
			ctx.stroke();

			// ID label
			ctx.fillStyle = 'white';
			ctx.font = 'bold 10px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillText(dot.id.toString(), dot.x, dot.y + 25);
		}
	}

	function handleCanvasClick(e: MouseEvent) {
		if (mode !== 'edit' || isDragging) return;

		const rect = canvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) * canvasWidth) / rect.width;
		const y = ((e.clientY - rect.top) * canvasHeight) / rect.height;

		// Check if clicking near existing dot
		const clickedDot = dots.find(d => 
			Math.sqrt((d.x - x) ** 2 + (d.y - y) ** 2) < 30
		);

		if (e.shiftKey && clickedDot) {
			// Shift+click to delete dot and its pair
			const dotsToDelete = [clickedDot.id];
			const pairConnection = connections.find(c => 
				c.dotId1 === clickedDot.id || c.dotId2 === clickedDot.id
			);
			if (pairConnection) {
				const pairId = pairConnection.dotId1 === clickedDot.id ? pairConnection.dotId2 : pairConnection.dotId1;
				dotsToDelete.push(pairId);
			}
			
			dots = dots.filter(d => !dotsToDelete.includes(d.id));
			connections = connections.filter(c => 
				!dotsToDelete.includes(c.dotId1) && !dotsToDelete.includes(c.dotId2)
			);
		} else if (!clickedDot) {
			// Add new dot with automatic pairing
			const dot1Id = nextDotId;
			const dot2Id = nextDotId + 1;
			
			// Create first dot at click position
			dots.push({
				id: dot1Id,
				x: Math.round(x),
				y: Math.round(y),
				color: selectedColor
			});
			
			// Create paired dot at offset position
			dots.push({
				id: dot2Id,
				x: Math.round(x) + 100,
				y: Math.round(y) + 100,
				color: selectedColor
			});
			
			// Auto-connect the pair
			connections.push({ dotId1: dot1Id, dotId2: dot2Id });
			
			nextDotId += 2;
		}

		renderEditor();
	}

	function handleCanvasMouseDown(e: MouseEvent) {
		if (mode !== 'edit' || e.shiftKey) return;

		const rect = canvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) * canvasWidth) / rect.width;
		const y = ((e.clientY - rect.top) * canvasHeight) / rect.height;

		// Check if clicking on existing dot to drag
		const clickedDot = dots.find(d => 
			Math.sqrt((d.x - x) ** 2 + (d.y - y) ** 2) < 30
		);

		if (clickedDot) {
			draggedDotId = clickedDot.id;
			isDragging = true;
		}
	}

	function handleCanvasMouseMove(e: MouseEvent) {
		if (!isDragging || draggedDotId === null || mode !== 'edit') return;

		const rect = canvas.getBoundingClientRect();
		const x = ((e.clientX - rect.left) * canvasWidth) / rect.width;
		const y = ((e.clientY - rect.top) * canvasHeight) / rect.height;

		// Update dot position
		const dotIndex = dots.findIndex(d => d.id === draggedDotId);
		if (dotIndex !== -1) {
			dots[dotIndex].x = Math.round(x);
			dots[dotIndex].y = Math.round(y);
			renderEditor();
		}
	}

	function handleCanvasMouseUp() {
		isDragging = false;
		draggedDotId = null;
	}

	function addConnection(dotId1: number, dotId2: number) {
		// Check if connection already exists
		const exists = connections.some(c =>
			(c.dotId1 === dotId1 && c.dotId2 === dotId2) ||
			(c.dotId1 === dotId2 && c.dotId2 === dotId1)
		);

		if (!exists) {
			connections.push({ dotId1, dotId2 });
			renderEditor();
		}
	}

	function removeConnection(index: number) {
		connections.splice(index, 1);
		renderEditor();
	}

	function clearAll() {
		if (confirm('Clear all dots and connections?')) {
			dots = [];
			connections = [];
			nextDotId = 1;
			isEditingExisting = false;
			renderEditor();
		}
	}

	function loadExistingLevel(level: Level) {
		levelId = level.id;
		levelName = level.name;
		dots = [...level.dots];
		connections = [...level.requiredConnections];
		nextDotId = Math.max(...dots.map(d => d.id), 0) + 1;
		isEditingExisting = true;
		renderEditor();
	}

	function createNewLevel() {
		dots = [];
		connections = [];
		levelName = 'My Level';
		const maxId = Math.max(...allLevels.map(l => l.id), 999);
		levelId = maxId + 1;
		nextDotId = 1;
		isEditingExisting = false;
		renderEditor();
	}

	function saveLevel() {
		if (dots.length === 0) {
			alert('Please add some dots first!');
			return;
		}

		if (connections.length === 0) {
			alert('Please add at least one connection!');
			return;
		}

		const level: Level = {
			id: levelId,
			name: levelName,
			gridWidth: canvasWidth,
			gridHeight: canvasHeight,
			dots: [...dots],
			requiredConnections: [...connections]
		};

		saveLevelToStorage(level);
		alert(`Level "${levelName}" saved successfully!`);
	}

	function exportLevel() {
		const level: Level = {
			id: levelId,
			name: levelName,
			gridWidth: canvasWidth,
			gridHeight: canvasHeight,
			dots: [...dots],
			requiredConnections: [...connections]
		};

		const json = exportLevelAsJSON(level);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `level-${levelId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function importLevel() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const json = e.target?.result as string;
					const level = importLevelFromJSON(json);
					if (level) {
						levelId = level.id;
						levelName = level.name;
						dots = [...level.dots];
						connections = [...level.requiredConnections];
						nextDotId = Math.max(...dots.map(d => d.id)) + 1;
						renderEditor();
						alert('Level imported successfully!');
					} else {
						alert('Failed to import level. Invalid JSON format.');
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	}

	function testLevel() {
		if (dots.length === 0 || connections.length === 0) {
			alert('Please add dots and connections before testing!');
			return;
		}

		const level: Level = {
			id: levelId,
			name: levelName,
			gridWidth: canvasWidth,
			gridHeight: canvasHeight,
			dots: [...dots],
			requiredConnections: [...connections]
		};

		gameManager = new GameManager();
		gameManager.loadLevel(level);
		mode = 'test';
	}

	function backToEdit() {
		mode = 'edit';
		gameManager = null;
		renderEditor();
	}

	$effect(() => {
		if (mode === 'edit') {
			renderEditor();
		}
	});
</script>

<main>
	<div class="container">
		<header>
			<h1>🎨 Level Editor</h1>
			<a href="/" class="back-button">← Menu</a>
		</header>

		{#if mode === 'edit'}
			<div class="editor">
				<div class="controls-panel">
					<div class="section">
						<h3>Level Management</h3>
						{#if isEditingExisting}
							<div class="edit-badge">✏️ Editing Existing Level</div>
						{:else}
							<div class="new-badge">✨ Creating New Level</div>
						{/if}
						<label>
							Load Level:
							<select onchange={(e) => {
								const selectedId = parseInt((e.target as HTMLSelectElement).value);
								if (selectedId === -1) {
									createNewLevel();
								} else {
									const level = allLevels.find(l => l.id === selectedId);
									if (level) loadExistingLevel(level);
								}
							}}>
								<option value="-1">+ New Level</option>
								<optgroup label="Built-in Levels">
									{#each allLevels.filter(l => l.id < 1000) as level}
										<option value={level.id} selected={level.id === levelId}>
											{level.id}. {level.name}
										</option>
									{/each}
								</optgroup>
								{#if allLevels.some(l => l.id >= 1000)}
									<optgroup label="Custom Levels">
										{#each allLevels.filter(l => l.id >= 1000) as level}
											<option value={level.id} selected={level.id === levelId}>
												{level.id}. {level.name}
											</option>
										{/each}
									</optgroup>
								{/if}
							</select>
						</label>
					</div>

					<div class="section">
						<h3>Level Info</h3>
						<label>
							Level Name:
							<input type="text" bind:value={levelName} />
						</label>
						<label>
							Level ID:
							<input type="number" bind:value={levelId} />
						</label>
					</div>

					<div class="section">
						<h3>Color Palette</h3>
						<div class="color-palette">
							{#each colors as color}
								<button
									class="color-button"
									class:active={selectedColor === color}
									style="background-color: {color}"
									onclick={() => (selectedColor = color)}
								></button>
							{/each}
						</div>
					</div>

					<div class="section">
						<h3>Instructions</h3>
						<ul class="instructions">
							<li>Click canvas to add dot pair</li>
							<li>Drag dots to reposition</li>
							<li>Shift+Click dot to delete pair</li>
							<li>Pairs auto-connect by default</li>
						</ul>
					</div>

					<div class="section">
						<h3>Connections</h3>
						<div class="connections-list">
							{#if connections.length === 0}
								<p class="empty">No connections yet</p>
							{/if}
							{#each connections as conn, i}
								{@const dot1 = dots.find(d => d.id === conn.dotId1)}
								{@const dot2 = dots.find(d => d.id === conn.dotId2)}
								<div class="connection-item">
									<span>
										Dot {conn.dotId1} ↔ Dot {conn.dotId2}
										{#if dot1}
											<span class="color-dot" style="background: {dot1.color}"></span>
										{/if}
									</span>
									<button class="remove-btn" onclick={() => removeConnection(i)}>×</button>
								</div>
							{/each}
						</div>

						{#if dots.length >= 2}
							<div class="add-connection">
								<select id="dot1">
									{#each dots as dot}
										<option value={dot.id}>Dot {dot.id}</option>
									{/each}
								</select>
								<span>↔</span>
								<select id="dot2">
									{#each dots as dot}
										<option value={dot.id}>Dot {dot.id}</option>
									{/each}
								</select>
								<button onclick={() => {
									const select1 = document.getElementById('dot1') as HTMLSelectElement;
									const select2 = document.getElementById('dot2') as HTMLSelectElement;
									addConnection(parseInt(select1.value), parseInt(select2.value));
								}}>Add</button>
							</div>
						{/if}
					</div>

					<div class="section actions">
						<button class="primary" onclick={saveLevel}>💾 Save Level</button>
						<button class="primary" onclick={testLevel}>🎮 Test Level</button>
						<button onclick={exportLevel}>📤 Export JSON</button>
						<button onclick={importLevel}>📥 Import JSON</button>
						<button class="danger" onclick={clearAll}>🗑️ Clear All</button>
					</div>
				</div>

				<div class="canvas-panel">
					<h3>Canvas (Click to add dots)</h3>
					<canvas
						bind:this={canvas}
						width={canvasWidth}
						height={canvasHeight}
						onclick={handleCanvasClick}
						onmousedown={handleCanvasMouseDown}
						onmousemove={handleCanvasMouseMove}
						onmouseup={handleCanvasMouseUp}
						onmouseleave={handleCanvasMouseUp}
						class="editor-canvas"
						class:dragging={isDragging}
					></canvas>
					<p class="stats">Dots: {dots.length} | Connections: {connections.length}</p>
				</div>
			</div>
		{:else if mode === 'test' && gameManager}
			<div class="test-mode">
				<div class="test-header">
					<h2>Testing: {levelName}</h2>
					<button onclick={backToEdit}>← Back to Editor</button>
				</div>
				<GameCanvas {gameManager} width={canvasWidth} height={canvasHeight} />
				<div class="test-info">
					<p>Lives: {gameManager.state.lives}</p>
					<p>Connections: {gameManager.state.drawnLines.filter(l => l.isComplete).length} / {connections.length}</p>
					{#if gameManager.state.isComplete}
						<p class="success">✓ Level is solvable!</p>
					{/if}
				</div>
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
		max-width: 1400px;
		margin: 0 auto;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		color: white;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		margin: 0;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
		font-size: 2.5rem;
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

	.editor {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 2rem;
	}

	.controls-panel {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		height: fit-content;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.canvas-panel {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.section:last-child {
		border-bottom: none;
	}

	.section h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #333;
		font-size: 1.1rem;
	}

	label {
		display: block;
		margin-bottom: 0.75rem;
		color: #666;
		font-size: 0.9rem;
	}

	input[type="text"],
	input[type="number"],
	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		margin-top: 0.25rem;
	}

	.color-palette {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.color-button {
		width: 100%;
		aspect-ratio: 1;
		border: 3px solid transparent;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.color-button:hover {
		transform: scale(1.1);
	}

	.color-button.active {
		border-color: #333;
		box-shadow: 0 0 0 2px white, 0 0 0 4px #333;
	}

	.instructions {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.instructions li {
		padding: 0.25rem 0;
	}

	.connections-list {
		max-height: 200px;
		overflow-y: auto;
		margin-bottom: 1rem;
	}

	.connection-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f5f5f5;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.color-dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		margin-left: 0.5rem;
	}

	.remove-btn {
		background: #ff6b6b;
		color: white;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
		padding: 0;
	}

	.add-connection {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.add-connection select {
		flex: 1;
		margin: 0;
	}

	.add-connection button {
		padding: 0.5rem 1rem;
		white-space: nowrap;
	}

	.empty {
		color: #999;
		font-style: italic;
		text-align: center;
		padding: 1rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	button {
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		border: none;
		border-radius: 6px;
		background: #667eea;
		color: white;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	button:hover {
		background: #5568d3;
		transform: translateY(-1px);
	}

	button.primary {
		background: #4ECDC4;
	}

	button.primary:hover {
		background: #3db8af;
	}

	button.danger {
		background: #ff6b6b;
	}

	button.danger:hover {
		background: #ee5a5a;
	}

	.editor-canvas {
		display: block;
		width: 100%;
		border: 2px solid #333;
		border-radius: 8px;
		cursor: crosshair;
		background: #1a1a2e;
	}

	.editor-canvas.dragging {
		cursor: move;
	}

	.edit-badge, .new-badge {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 600;
		text-align: center;
		margin-bottom: 1rem;
	}

	.edit-badge {
		background: #FFD93D;
		color: #333;
	}

	.new-badge {
		background: #4ECDC4;
		color: white;
	}

	.stats {
		text-align: center;
		color: #666;
		margin-top: 1rem;
		font-weight: 600;
	}

	.test-mode {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.test-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.test-header h2 {
		margin: 0;
		color: #333;
	}

	.test-info {
		margin-top: 1rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
		display: flex;
		gap: 2rem;
		justify-content: center;
	}

	.test-info p {
		margin: 0;
		font-weight: 600;
		color: #666;
	}

	.success {
		color: #4ECDC4 !important;
	}

	@media (max-width: 1200px) {
		.editor {
			grid-template-columns: 1fr;
		}
	}
</style>
