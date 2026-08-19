<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>LocalBerth</title>
</svelte:head>

<div class="min-h-full px-5 py-4">
	{@render children()}
</div>
