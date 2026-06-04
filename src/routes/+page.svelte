<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let currentUser = $derived($user);

	function handleStart() {
		if (currentUser) {
			goto(resolve('/dashboard'));
		} else {
			goto(resolve('/auth/register'));
		}
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
	<div class="mx-auto max-w-2xl px-4 text-center">
		<div class="mb-8">
			<h1 class="mb-4 text-6xl font-bold tracking-tight text-amber-400 sm:text-7xl">
				🎮 Pateros Quest
			</h1>
			<p class="text-xl text-gray-400 sm:text-2xl">
				Embark on an epic gaming adventure with puzzles, quizzes, and challenges!
			</p>
		</div>

		<!-- Game Cards Preview -->
		<div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div
				class="rounded-xl border border-purple-500/30 bg-purple-500/10 p-6 transition-colors hover:border-purple-500/50"
			>
				<div class="mb-2 text-4xl">🧩</div>
				<h3 class="text-lg font-semibold text-purple-400">Puzzle Game</h3>
				<p class="text-sm text-gray-500">Test your logic skills</p>
			</div>
			<div
				class="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 transition-colors hover:border-blue-500/50"
			>
				<div class="mb-2 text-4xl">❓</div>
				<h3 class="text-lg font-semibold text-blue-400">Quiz Game</h3>
				<p class="text-sm text-gray-500">Answer questions, (3) lives</p>
			</div>
			<div
				class="rounded-xl border border-green-500/30 bg-green-500/10 p-6 transition-colors hover:border-green-500/50"
			>
				<div class="mb-2 text-4xl">🦆</div>
				<h3 class="text-lg font-semibold text-green-400">Flapy Bird</h3>
				<p class="text-sm text-gray-500">Beat the high score</p>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
			{#if currentUser}
				<button
					onclick={handleStart}
					class="rounded-lg bg-amber-500 px-8 py-3 text-lg font-semibold text-gray-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-500/40"
				>
					Go to Dashboard
				</button>
			{:else}
				<a
					href={resolve('/auth/register')}
					class="rounded-lg bg-amber-500 px-8 py-3 text-lg font-semibold text-gray-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 hover:shadow-amber-500/40"
				>
					Register
				</a>
				<a
					href={resolve('/auth/login')}
					class="rounded-lg border border-gray-700 bg-gray-800 px-8 py-3 text-lg font-semibold text-gray-300 transition-all hover:border-gray-600 hover:bg-gray-700"
				>
					Login
				</a>
			{/if}
		</div>
	</div>
</main>
