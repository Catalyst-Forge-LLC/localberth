<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { dashboardHttpUrl } from '$lib/dashboard-url';
	import type { BoardRow } from '$lib/server/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expanded = $state<string | null>(null);
	let peekLine = $state<Record<string, string>>({});

	function hrefFor(
		bind: string | undefined,
		port: number | undefined,
		listening: boolean
	): string | null {
		if (!listening || !bind || !port) return null;
		return dashboardHttpUrl(bind, port);
	}

	function rowId(row: BoardRow): string {
		if (row.lease) return `lease:${row.lease.name}`;
		return `obs:${row.observed?.port ?? ''}:${row.observed?.bind ?? ''}`;
	}

	function facts(row: BoardRow): string {
		const bits: string[] = [];
		if (row.lease) {
			bits.push(row.lease.kind);
			if (row.lease.notes) bits.push(row.lease.notes);
			bits.push(`claimed ${row.lease.updatedAt.slice(0, 19).replace('T', ' ')}`);
			bits.push(`firewall ${row.lease.firewall}`);
		}
		if (row.observed?.process) bits.push(row.observed.process);
		if (row.observed?.pid) bits.push(`pid ${row.observed.pid}`);
		return bits.join(' · ') || 'No extra notes.';
	}

	async function toggle(row: BoardRow, event: MouseEvent) {
		if ((event.target as HTMLElement | null)?.closest('a')) return;
		const key = rowId(row);
		if (expanded === key) {
			expanded = null;
			return;
		}
		expanded = key;
		if (!row.listening) {
			peekLine[key] = 'Not listening.';
			return;
		}
		const port = row.lease?.port ?? row.observed?.port;
		if (!port) {
			peekLine[key] = 'Not listening.';
			return;
		}
		peekLine[key] = 'Peeking…';
		const res = await fetch(`/api/peek?port=${port}`);
		const body = (await res.json()) as { line?: string };
		if (expanded === key) peekLine[key] = body.line || 'Not HTTP.';
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
				{#each data.leaseRows as row, i}
					{@const href = hrefFor(row.lease?.bind, row.lease?.port, row.listening)}
					{@const key = rowId(row)}
					<tr
						class="cursor-pointer border-t border-[var(--line)] hover:bg-white/[0.07] {i % 2 === 1
							? 'bg-white/[0.035]'
							: ''} {expanded === key ? 'bg-white/[0.07]' : ''}"
						onclick={(event) => toggle(row, event)}
					>
						<td class="px-3 py-2 font-medium">{row.lease?.name}</td>
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
					<tr class="detail">
						<td class="p-0" colspan="6">
							<div class="grid transition-[grid-template-rows] duration-200 {expanded === key ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
								<div class="min-h-0 overflow-hidden">
									<div class="px-3 pb-2.5 pt-1.5 text-xs {expanded === key ? '' : 'invisible'}">
										<p class="text-[var(--muted)]">{facts(row)}</p>
										<p class="mt-1 text-[var(--accent)]">{peekLine[key] ?? ''}</p>
									</div>
								</div>
							</div>
						</td>
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
				{#each data.observedRows as row, i}
					{@const href = hrefFor(row.observed?.bind, row.observed?.port, row.listening)}
					{@const key = rowId(row)}
					<tr
						class="cursor-pointer border-t border-[var(--line)] hover:bg-white/[0.07] {i % 2 === 1
							? 'bg-white/[0.035]'
							: ''} {expanded === key ? 'bg-white/[0.07]' : ''}"
						onclick={(event) => toggle(row, event)}
					>
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
					<tr>
						<td class="p-0" colspan="3">
							<div class="grid transition-[grid-template-rows] duration-200 {expanded === key ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
								<div class="min-h-0 overflow-hidden">
									<div class="px-3 pb-2.5 pt-1.5 text-xs {expanded === key ? '' : 'invisible'}">
										<p class="text-[var(--muted)]">{facts(row)}</p>
										<p class="mt-1 text-[var(--accent)]">{peekLine[key] ?? ''}</p>
									</div>
								</div>
							</div>
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
