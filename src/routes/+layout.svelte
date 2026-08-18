<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>LocalBerth</title>
</svelte:head>

<div class="min-h-full px-6 py-8">
	{@render children()}
</div>
