<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { syncService } from '$lib/services/sync';

	let { children } = $props();

	onMount(() => {
		syncService.syncLevels();
		syncService.syncProgress();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
