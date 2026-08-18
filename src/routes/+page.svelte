<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	onMount(() => {
		const id = setInterval(() => {
			void invalidateAll();
		}, 8000);
		return () => clearInterval(id);
	});
</script>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div>
		<p class="text-sm tracking-wide text-[var(--accent)]">Local DNS for ports</p>
		<h1 class="text-3xl font-semibold">LocalBerth</h1>
		<p class="mt-1 text-[var(--muted)]">Named port leases and what’s actually listening.</p>
	</div>
	<p class="text-sm text-[var(--muted)]">
		dashboard :54321
		<br />
		{#if data.showSystem}
			<a class="text-[var(--accent)]" href="/">Hide system ports</a>
		{:else}
			<a class="text-[var(--accent)]" href="/?system=1">
				Show {data.hiddenSystem} system port{data.hiddenSystem === 1 ? '' : 's'}
			</a>
		{/if}
	</p>
</header>

<section class="mb-8">
	<h2 class="mb-2 text-sm font-medium text-[var(--muted)]">Leases</h2>
	<div class="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="border-b border-[var(--line)] text-[var(--muted)]">
				<tr>
					<th class="px-4 py-3 font-medium">Name</th>
					<th class="px-4 py-3 font-medium">Port</th>
					<th class="px-4 py-3 font-medium">Bind</th>
					<th class="px-4 py-3 font-medium">Listening</th>
					<th class="px-4 py-3 font-medium">Process</th>
					<th class="px-4 py-3 font-medium">Firewall</th>
				</tr>
			</thead>
			<tbody>
				{#each data.leaseRows as row}
					<tr class="border-t border-[var(--line)]">
						<td class="px-4 py-3 font-medium">{row.lease?.name}</td>
						<td class="px-4 py-3 tabular-nums">{row.lease?.port}</td>
						<td class="px-4 py-3 text-[var(--muted)]">{row.lease?.bind}</td>
						<td class="px-4 py-3">
							{#if row.listening}
								<span class="text-[var(--accent)]">yes</span>
							{:else}
								<span class="text-[var(--muted)]">no</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-[var(--muted)]">
							{row.observed?.process ?? '—'}
							{#if row.observed?.pid}
								<span class="text-xs">({row.observed.pid})</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-[var(--muted)]">{row.lease?.firewall}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section>
	<h2 class="mb-2 text-sm font-medium text-[var(--muted)]">Observed</h2>
	<div class="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]">
		<table class="w-full min-w-[40rem] text-left text-sm">
			<thead class="border-b border-[var(--line)] text-[var(--muted)]">
				<tr>
					<th class="px-4 py-3 font-medium">Port</th>
					<th class="px-4 py-3 font-medium">Bind</th>
					<th class="px-4 py-3 font-medium">Process</th>
				</tr>
			</thead>
			<tbody>
				{#each data.observedRows as row}
					<tr class="border-t border-[var(--line)]">
						<td class="px-4 py-3 tabular-nums">{row.observed?.port}</td>
						<td class="px-4 py-3 text-[var(--muted)]">{row.observed?.bind}</td>
						<td class="px-4 py-3 text-[var(--muted)]">
							{row.observed?.process ?? '—'}
							{#if row.observed?.pid}
								<span class="text-xs">({row.observed.pid})</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td class="px-4 py-3 text-[var(--muted)]" colspan="3">
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
