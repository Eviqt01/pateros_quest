<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	let { children } = $props();

	onMount(() => {
		if ($user) {
			goto(resolve('/dashboard'));
		}
	});
</script>

{@render children()}
