<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { signOut } from '$lib/stores/auth';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let { children } = $props();
	let currentUser = $derived($user);
	let mobileMenuOpen = $state(false);

	onMount(() => {
		if (!$user) {
			goto(resolve('/auth/login'));
		}
	});

	async function handleSignOut() {
		await signOut();
		window.location.href = '/';
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

{#if currentUser}
	<div class="min-h-screen bg-gray-950 text-white">
		<!-- Navigation -->
		<nav class="border-b border-gray-800 bg-gray-900">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-8">
						<a href={resolve('/dashboard')} class="text-xl font-bold text-amber-400"
							>🎮 Pateros Quest</a
						>
						<div class="hidden items-center gap-6 md:flex">
							<a
								href={resolve('/dashboard')}
								class="text-sm font-medium text-gray-300 transition-colors hover:text-amber-400"
							>
								Dashboard
							</a>
							<a
								href={resolve('/dashboard/games/puzzle')}
								class="text-sm font-medium text-gray-300 transition-colors hover:text-amber-400"
							>
								Puzzle
							</a>
							<a
								href={resolve('/dashboard/games/quiz')}
								class="text-sm font-medium text-gray-300 transition-colors hover:text-amber-400"
							>
								Quiz
							</a>
							<a
								href={resolve('/dashboard/games/flappy')}
								class="text-sm font-medium text-gray-300 transition-colors hover:text-amber-400"
							>
								Flappy Bird
							</a>
							<a
								href={resolve('/dashboard/account')}
								class="text-sm font-medium text-gray-300 transition-colors hover:text-amber-400"
							>
								Account
							</a>
						</div>
					</div>

					<div class="flex items-center gap-4">
						<span class="hidden text-sm text-gray-400 sm:block">
							{currentUser.email}
						</span>
						<button
							onclick={handleSignOut}
							class="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-red-500/50 hover:text-red-400"
						>
							Logout
						</button>

						<!-- Mobile menu button -->
						<button
							onclick={toggleMobileMenu}
							aria-label="Toggle menu"
							class="text-gray-400 hover:text-white md:hidden"
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			<!-- Mobile menu -->
			{#if mobileMenuOpen}
				<div class="border-t border-gray-800 px-4 pt-2 pb-4 md:hidden">
					<div class="flex flex-col gap-2">
						<a
							href={resolve('/dashboard')}
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>
							Dashboard
						</a>
						<a
							href={resolve('/dashboard/games/puzzle')}
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>
							Puzzle
						</a>
						<a
							href={resolve('/dashboard/games/quiz')}
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>
							Quiz
						</a>
						<a
							href={resolve('/dashboard/games/flappy')}
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>
							Flappy Bird
						</a>
						<a
							href={resolve('/dashboard/account')}
							onclick={() => (mobileMenuOpen = false)}
							class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>
							Account
						</a>
					</div>
				</div>
			{/if}
		</nav>

		<!-- Main content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{@render children()}
		</main>
	</div>
{/if}
