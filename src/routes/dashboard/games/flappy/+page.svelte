<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { fetchFlappyLeaderboard, fetchUserBestScore, saveGameScore } from '$lib/gameScores';
	import { drawDuck } from '$lib/flappy/drawDuck';
	import { onMount, onDestroy } from 'svelte';

	let currentUser = $derived($user);
	let canvas: HTMLCanvasElement;
	let gameState = $state<'menu' | 'playing' | 'gameover'>('menu');
	let score = $state(0);
	let highScore = $state(0);
	let saving = $state(false);
	let saveError = $state('');
	let leaderboard = $state<{ username: string; score: number }[]>([]);

	const CANVAS_WIDTH = 400;
	const CANVAS_HEIGHT = 600;
	const GRAVITY = 0.2;
	const JUMP_FORCE = -5;
	const PIPE_WIDTH = 75;
	const PIPE_GAP = 180;
	const PIPE_SPACING = 300;
	const PIPE_CAP_HEIGHT = 10;
	const BASE_SPEED = 1;

	let birdY = 300;
	let birdVelocity = 0;
	let pipes: { x: number; gapY: number; passed: boolean }[] = [];
	let animFrame: number | null = null;
	let gameScore = 0;
	let speed = $state(BASE_SPEED);

	function drawInitial() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
		gradient.addColorStop(0, '#0f172a');
		gradient.addColorStop(1, '#1e293b');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		ctx.fillStyle = '#92400e';
		ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
		drawDuck(ctx, 300);
	}

	onMount(async () => {
		drawInitial();
		if (!currentUser) return;

		const { data: best } = await fetchUserBestScore(currentUser.id, 'flappy');
		if (best) highScore = best.score;

		const { data: topPlayers } = await fetchFlappyLeaderboard(10);
		leaderboard = topPlayers.map((p) => ({
			username: p.username,
			score: p.score
		}));
	});

	function startGame() {
		gameState = 'playing';
		birdY = 300;
		birdVelocity = 0;
		pipes = [];
		gameScore = 0;
		speed = BASE_SPEED;
		score = 0;
		saveError = '';

		if (animFrame) cancelAnimationFrame(animFrame);
		gameLoop();
	}

	function jump() {
		if (gameState !== 'playing') {
			startGame();
			return;
		}
		birdVelocity = JUMP_FORCE;
	}

	function gameLoop() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		birdVelocity += GRAVITY;
		birdY += birdVelocity;
		speed = BASE_SPEED + Math.floor(gameScore / 5) * 0.3;

		const rightmostPipeX = pipes.length > 0 ? Math.max(...pipes.map((p) => p.x)) : -PIPE_SPACING;
		if (rightmostPipeX <= CANVAS_WIDTH - PIPE_SPACING) {
			const gapY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
			pipes.push({ x: CANVAS_WIDTH, gapY, passed: false });
		}

		for (const pipe of pipes) {
			pipe.x -= speed;
			if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
				pipe.passed = true;
				gameScore++;
				score = gameScore;
			}
		}

		pipes = pipes.filter((p) => p.x > -PIPE_WIDTH);

		const birdTop = birdY - 8;
		const birdBottom = birdY + 8;

		if (birdY > CANVAS_HEIGHT - 20 || birdY < 0) {
			endGame();
			return;
		}

		for (const pipe of pipes) {
			if (60 > pipe.x && 40 < pipe.x + PIPE_WIDTH) {
				if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
					endGame();
					return;
				}
			}
		}

		const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
		gradient.addColorStop(0, '#0f172a');
		gradient.addColorStop(1, '#1e293b');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

		for (const pipe of pipes) {
			ctx.fillStyle = '#22c55e';
			ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
			ctx.fillStyle = '#16a34a';
			ctx.fillRect(pipe.x - 3, pipe.gapY - PIPE_CAP_HEIGHT, PIPE_WIDTH + 6, PIPE_CAP_HEIGHT);
			ctx.fillStyle = '#22c55e';
			ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT);
			ctx.fillStyle = '#16a34a';
			ctx.fillRect(pipe.x - 3, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 6, PIPE_CAP_HEIGHT);
		}

		ctx.fillStyle = '#92400e';
		ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
		ctx.fillStyle = '#a16207';
		ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 5);

		drawDuck(ctx, birdY);

		ctx.fillStyle = '#fff';
		ctx.font = 'bold 32px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(gameScore.toString(), CANVAS_WIDTH / 2, 50);

		animFrame = requestAnimationFrame(gameLoop);
	}

	function endGame() {
		gameState = 'gameover';
		if (animFrame) cancelAnimationFrame(animFrame);
		if (gameScore > highScore) {
			highScore = gameScore;
		}
		saveScore();
	}

	async function saveScore() {
		if (!currentUser || gameScore === 0) return;
		saving = true;
		saveError = '';
		const { error } = await saveGameScore({
			userId: currentUser.id,
			gameType: 'flappy',
			score: gameScore
		});
		if (error) {
			console.error('Failed to save flappy score:', error);
			saveError = error.message;
		}
		saving = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space' || e.key === ' ') {
			e.preventDefault();
			jump();
		}
	}

	onDestroy(() => {
		if (animFrame) cancelAnimationFrame(animFrame);
	});
</script>

<svelte:head>
	<title>Flappy Bird - Pateros Quest</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col items-center gap-6">
	<div class="text-center">
		<h1 class="text-3xl font-bold text-white">🦆 Flappy Duck</h1>
		<p class="text-gray-400">Press Space or tap to fly!</p>
	</div>

	<div class="relative">
		<canvas
			bind:this={canvas}
			width={CANVAS_WIDTH}
			height={CANVAS_HEIGHT}
			onclick={jump}
			class="cursor-pointer rounded-xl border-2 border-gray-700"
		></canvas>

		{#if gameState === 'menu'}
			<div
				class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60"
			>
				<h2 class="mb-4 text-2xl font-bold text-white">Ready to Fly?</h2>
				<p class="mb-6 text-gray-300">Click or press Space to start</p>
				<div class="mb-4 text-sm text-gray-400">
					High Score: <span class="font-bold text-amber-400">{highScore}</span>
				</div>
			</div>
		{/if}

		{#if gameState === 'gameover'}
			<div
				class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/70"
			>
				<h2 class="mb-2 text-3xl font-bold text-red-400">Game Over!</h2>
				<div class="mb-4 text-5xl font-bold text-white">{score}</div>
				<p class="mb-1 text-sm text-gray-400">
					Best: <span class="font-bold text-amber-400">{highScore}</span>
				</p>
				{#if saving}
					<p class="mb-2 text-xs text-gray-500">Saving...</p>
				{:else if saveError}
					<p class="mb-2 max-w-xs text-center text-xs text-red-400">
						Score not saved: {saveError}
					</p>
				{:else if score > 0}
					<p class="mb-2 text-xs text-green-500">Score saved!</p>
				{/if}
				<button
					onclick={startGame}
					class="mt-2 rounded-lg bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-400"
				>
					Play Again
				</button>
			</div>
		{/if}
	</div>

	<div class="flex gap-8 text-center">
		<div>
			<p class="text-sm text-gray-400">Score</p>
			<p class="text-2xl font-bold text-amber-400">{score}</p>
		</div>
		<div>
			<p class="text-sm text-gray-400">High Score</p>
			<p class="text-2xl font-bold text-green-400">{highScore}</p>
		</div>
		<div>
			<p class="text-sm text-gray-400">Speed</p>
			<p class="text-2xl font-bold text-blue-400">{speed.toFixed(1)}x</p>
		</div>
	</div>

	{#if leaderboard.length > 0}
		<div class="w-full max-w-md">
			<h2 class="mb-3 text-lg font-semibold text-white">🏆 Leaderboard</h2>
			<div class="rounded-xl border border-gray-800 bg-gray-900">
				<div class="divide-y divide-gray-800">
					{#each leaderboard as entry, i (entry.username + i)}
						<div class="flex items-center justify-between px-4 py-3">
							<div class="flex items-center gap-3">
								<span
									class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
									{i === 0
										? 'bg-yellow-500/20 text-yellow-400'
										: i === 1
											? 'bg-gray-400/20 text-gray-400'
											: i === 2
												? 'bg-orange-500/20 text-orange-400'
												: 'bg-gray-700 text-gray-500'}"
								>
									{i + 1}
								</span>
								<span class="text-sm text-white">{entry.username}</span>
							</div>
							<span class="font-bold text-amber-400">{entry.score}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
