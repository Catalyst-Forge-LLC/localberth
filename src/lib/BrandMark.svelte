<script lang="ts">
	import logo from '../../site/static/logo.png';

	let { class: className = 'h-14 w-auto' }: { class?: string } = $props();
</script>

<img class={className} src={logo} alt="" />
