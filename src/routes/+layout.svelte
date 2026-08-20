<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>LocalBerth</title>
</svelte:head>

<div class="h-full">
	{@render children()}
</div>
