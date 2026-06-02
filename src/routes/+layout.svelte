<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initAuth } from '$lib/stores/auth';
	import { loading } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		initAuth();
	});
</script>

<svelte:head>
	<title>Pateros Quest</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $loading}
	<div class="flex min-h-screen items-center justify-center bg-gray-950">
		<div
			class="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
		></div>
	</div>
{:else}
	{@render children()}
{/if}
