<script lang="ts">
	import { user, profile } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { computeBestScores, fetchUserGameScores, type GameScore } from '$lib/gameScores';
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let currentUser = $derived($user);
	let currentProfile = $derived($profile);
	let userProfile = $state<{ username: string | null } | null>(null);
	let gameScores = $state<GameScore[]>([]);
	let bestScores = $state<Record<string, number>>({});
	let totalScore = $state(0);
	let recentActivity = $state<GameScore[]>([]);
	let loading = $state(true);

	// Redirect admins to admin panel
	$effect(() => {
		if (currentProfile?.role === 'admin') {
			goto(resolve('/dashboard/admin'));
		}
	});

	async function loadDashboard() {
		if (!currentUser) {
			loading = false;
			return;
		}

		loading = true;

		const [profileRes, scoresRes] = await Promise.all([
			supabase.from('profiles').select('username').eq('id', currentUser.id).single(),
			fetchUserGameScores(currentUser.id)
		]);

		if (profileRes.data) userProfile = profileRes.data;

		if (scoresRes.error) {
			console.error('Failed to load scores:', scoresRes.error);
			gameScores = [];
			bestScores = {};
			totalScore = 0;
			recentActivity = [];
		} else if (scoresRes.data) {
			gameScores = scoresRes.data as GameScore[];
			totalScore = gameScores.reduce((sum, s) => sum + s.score, 0);
			bestScores = computeBestScores(gameScores);
			recentActivity = gameScores.slice(0, 5);
		}

		loading = false;
	}

	onMount(loadDashboard);

	afterNavigate(({ to }) => {
		if (to?.url.pathname === resolve('/dashboard')) {
			loadDashboard();
		}
	});

	function getGameEmoji(type: string) {
		switch (type) {
			case 'puzzle':
				return '🧩';
			case 'quiz':
				return '❓';
			case 'flappy':
				return '🐦';
			default:
				return '🎮';
		}
	}

	function getGameName(type: string) {
		switch (type) {
			case 'puzzle':
				return 'Puzzle Game';
			case 'quiz':
				return 'Quiz Game';
			case 'flappy':
				return 'Flappy Bird';
			default:
				return type;
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Pateros Quest</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div
			class="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
		></div>
	</div>
{:else}
	<div class="space-y-8">
		<!-- Welcome -->
		<div>
			<h1 class="text-3xl font-bold text-white">
				Welcome, {userProfile?.username || currentUser?.email} 👋
			</h1>
			<p class="mt-1 text-gray-400">Here's your gaming overview</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<p class="text-sm font-medium text-gray-400">Total Score</p>
				<p class="mt-2 text-3xl font-bold text-amber-400">{totalScore}</p>
			</div>
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<p class="text-sm font-medium text-gray-400">Best Puzzle</p>
				<p class="mt-2 text-3xl font-bold text-purple-400">{bestScores['puzzle'] || 0}</p>
			</div>
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<p class="text-sm font-medium text-gray-400">Best Quiz</p>
				<p class="mt-2 text-3xl font-bold text-blue-400">{bestScores['quiz'] || 0}</p>
			</div>
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<p class="text-sm font-medium text-gray-400">Best Flappy</p>
				<p class="mt-2 text-3xl font-bold text-green-400">{bestScores['flappy'] || 0}</p>
			</div>
		</div>

		<!-- Game Cards -->
		<div>
			<h2 class="mb-4 text-xl font-semibold text-white">Games</h2>
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
				<a
					href={resolve('/dashboard/games/puzzle')}
					class="group rounded-xl border border-purple-500/30 bg-purple-500/5 p-6 transition-all hover:border-purple-500/50 hover:bg-purple-500/10"
				>
					<div class="mb-4 text-5xl">🧩</div>
					<h3 class="text-lg font-semibold text-purple-400 group-hover:text-purple-300">
						Puzzle Game
					</h3>
					<p class="mt-1 text-sm text-gray-500">
						Challenge your logic with Easy, Medium, or Hard levels
					</p>
					<div class="mt-4 text-sm font-medium text-purple-400">Play Now →</div>
				</a>

				<a
					href={resolve('/dashboard/games/quiz')}
					class="group rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
				>
					<div class="mb-4 text-5xl">❓</div>
					<h3 class="text-lg font-semibold text-blue-400 group-hover:text-blue-300">Quiz Game</h3>
					<p class="mt-1 text-sm text-gray-500">30 questions, 3 lives, test your knowledge</p>
					<div class="mt-4 text-sm font-medium text-blue-400">Play Now →</div>
				</a>

				<a
					href={resolve('/dashboard/games/flappy')}
					class="group rounded-xl border border-green-500/30 bg-green-500/5 p-6 transition-all hover:border-green-500/50 hover:bg-green-500/10"
				>
					<div class="mb-4 text-5xl">🦆</div>
					<h3 class="text-lg font-semibold text-green-400 group-hover:text-green-300">
						Flappy Bird
					</h3>
					<p class="mt-1 text-sm text-gray-500">
						Speed increases with score. Beat the leaderboard!
					</p>
					<div class="mt-4 text-sm font-medium text-green-400">Play Now →</div>
				</a>
			</div>
		</div>

		<!-- Recent Activity -->
		<div>
			<h2 class="mb-4 text-xl font-semibold text-white">Recent Activity</h2>
			<div class="rounded-xl border border-gray-800 bg-gray-900">
				{#if recentActivity.length === 0}
					<div class="p-8 text-center text-gray-500">
						<p class="text-lg">No games played yet</p>
						<p class="mt-1 text-sm">Start playing to see your activity here!</p>
					</div>
				{:else}
					<div class="divide-y divide-gray-800">
						{#each recentActivity as activity (activity.id)}
							<div class="flex items-center justify-between px-6 py-4">
								<div class="flex items-center gap-3">
									<span class="text-2xl">{getGameEmoji(activity.game_type)}</span>
									<div>
										<p class="font-medium text-white">{getGameName(activity.game_type)}</p>
										<p class="text-sm text-gray-500">{formatDate(activity.created_at)}</p>
									</div>
								</div>
								<span class="text-lg font-bold text-amber-400">{activity.score}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
