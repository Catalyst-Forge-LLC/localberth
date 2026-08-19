<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { dashboardHttpUrl } from '$lib/dashboard-url';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function hrefFor(
		bind: string | undefined,
		port: number | undefined,
		listening: boolean
	): string | null {
		if (!listening || !bind || !port) return null;
		return dashboardHttpUrl(bind, port);
	}

	onMount(() => {
		const id = setInterval(() => {
			void invalidateAll();
		}, 8000);
		return () => clearInterval(id);
	});
</script>

<header class="mb-3 flex flex-wrap items-center justify-between gap-3">
	<p class="font-semibold">LocalBerth</p>
	<p class="text-xs text-[var(--muted)]">
		:54321 ·
		{#if data.showSystem}
			<a class="text-[var(--accent)]" href="/">Hide system ports</a>
		{:else}
			<a class="text-[var(--accent)]" href="/?system=1">
				Show {data.hiddenSystem} system port{data.hiddenSystem === 1 ? '' : 's'}
			</a>
		{/if}
	</p>
</header>

<section class="mb-5">
	<h2 class="mb-1.5 text-xs font-medium text-[var(--muted)]">Leases</h2>
	<div class="overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="border-b border-[var(--line)] text-[var(--muted)]">
				<tr>
					<th class="px-3 py-2 font-medium">Name</th>
					<th class="px-3 py-2 font-medium">Port</th>
					<th class="px-3 py-2 font-medium">Bind</th>
					<th class="px-3 py-2 font-medium">Listening</th>
					<th class="px-3 py-2 font-medium">Process</th>
					<th class="px-3 py-2 font-medium">Firewall</th>
				</tr>
			</thead>
			<tbody>
				{#each data.leaseRows as row}
					{@const href = hrefFor(row.lease?.bind, row.lease?.port, row.listening)}
					<tr class="border-t border-[var(--line)] even:bg-white/[0.035]">
						<td class="px-3 py-2 font-medium">
							{#if href}
								<a class="text-[var(--accent)]" href={href} target="_blank" rel="noreferrer">{row.lease?.name}</a>
							{:else}
								{row.lease?.name}
							{/if}
						</td>
						<td class="px-3 py-2 tabular-nums">
							{#if href}
								<a class="text-[var(--accent)]" href={href} target="_blank" rel="noreferrer">{row.lease?.port}</a>
							{:else}
								{row.lease?.port}
							{/if}
						</td>
						<td class="px-3 py-2 text-[var(--muted)]">{row.lease?.bind}</td>
						<td class="px-3 py-2">
							{#if row.listening}
								<span class="text-[var(--accent)]">yes</span>
							{:else}
								<span class="text-[var(--muted)]">no</span>
							{/if}
						</td>
						<td class="px-3 py-2 text-[var(--muted)]">
							{row.observed?.process ?? '—'}
							{#if row.observed?.pid}
								<span class="text-xs">({row.observed.pid})</span>
							{/if}
						</td>
						<td class="px-3 py-2 text-[var(--muted)]">{row.lease?.firewall}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section>
	<h2 class="mb-1.5 text-xs font-medium text-[var(--muted)]">Observed</h2>
	<div class="overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--bg-elevated)]">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="border-b border-[var(--line)] text-[var(--muted)]">
				<tr>
					<th class="px-3 py-2 font-medium">Port</th>
					<th class="px-3 py-2 font-medium">Bind</th>
					<th class="px-3 py-2 font-medium">Process</th>
				</tr>
			</thead>
			<tbody>
				{#each data.observedRows as row}
					{@const href = hrefFor(row.observed?.bind, row.observed?.port, row.listening)}
					<tr class="border-t border-[var(--line)] even:bg-white/[0.035]">
						<td class="px-3 py-2 tabular-nums">
							{#if href}
								<a class="text-[var(--accent)]" href={href} target="_blank" rel="noreferrer">{row.observed?.port}</a>
							{:else}
								{row.observed?.port}
							{/if}
						</td>
						<td class="px-3 py-2 text-[var(--muted)]">{row.observed?.bind}</td>
						<td class="px-3 py-2 text-[var(--muted)]">
							{row.observed?.process ?? '—'}
							{#if row.observed?.pid}
								<span class="text-xs">({row.observed.pid})</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td class="px-3 py-2 text-[var(--muted)]" colspan="3">
							Nothing extra listening (system ports hidden).
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<p class="mt-6 text-sm text-[var(--muted)]">
	<code class="text-[var(--text)]">localberth claim name --port N</code>
	·
	<code class="text-[var(--text)]">localberth get name</code>
	·
	<code class="text-[var(--text)]">localberth release name</code>
	·
	<code class="text-[var(--text)]">localberth serve</code>
</p>
