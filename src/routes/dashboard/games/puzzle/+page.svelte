<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { saveGameScore } from '$lib/gameScores';

	let currentUser = $derived($user);
	let difficulty = $state<'easy' | 'medium' | 'hard' | null>(null);
	let grid = $state<number[][]>([]);
	let solution = $state<number[][]>([]);
	let selectedCell = $state<[number, number] | null>(null);
	let gameWon = $state(false);
	let score = $state(0);
	let timer = $state(0);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let saving = $state(false);

	const GRID_SIZES = { easy: 4, medium: 6, hard: 9 };

	function startGame(level: 'easy' | 'medium' | 'hard') {
		difficulty = level;
		gameWon = false;
		score = 0;
		timer = 0;
		selectedCell = null;

		const size = GRID_SIZES[level];
		const { puzzle, sol } = generateSudoku(size);
		grid = puzzle;
		solution = sol;

		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			timer++;
		}, 1000);
	}

	function generateSudoku(size: number): { puzzle: number[][]; sol: number[][] } {
		const board: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
		solveSudoku(board, size);
		const sol = board.map((row) => [...row]);

		// Remove cells based on difficulty
		const cellsToRemove = size === 4 ? 6 : size === 6 ? 12 : 30;
		let removed = 0;
		while (removed < cellsToRemove) {
			const r = Math.floor(Math.random() * size);
			const c = Math.floor(Math.random() * size);
			if (board[r][c] !== 0) {
				board[r][c] = 0;
				removed++;
			}
		}

		return { puzzle: board, sol };
	}

	function solveSudoku(board: number[][], size: number): boolean {
		const boxSize = size === 4 ? 2 : size === 6 ? 2 : 3;
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (board[r][c] === 0) {
					const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, size));
					for (const num of nums) {
						if (isValid(board, r, c, num, size, boxSize)) {
							board[r][c] = num;
							if (solveSudoku(board, size)) return true;
							board[r][c] = 0;
						}
					}
					return false;
				}
			}
		}
		return true;
	}

	function shuffle(arr: number[]): number[] {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function isValid(
		board: number[][],
		row: number,
		col: number,
		num: number,
		size: number,
		boxSize: number
	): boolean {
		for (let i = 0; i < size; i++) {
			if (board[row][i] === num) return false;
			if (board[i][col] === num) return false;
		}
		const boxRow = Math.floor(row / boxSize) * boxSize;
		const boxCol = Math.floor(col / boxSize) * boxSize;
		for (let r = boxRow; r < boxRow + boxSize; r++) {
			for (let c = boxCol; c < boxCol + boxSize; c++) {
				if (board[r][c] === num) return false;
			}
		}
		return true;
	}

	function handleCellClick(row: number, col: number) {
		if (grid[row][col] !== 0 && grid[row][col] !== solution[row][col]) return;
		if (gameWon) return;
		selectedCell = [row, col];
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!selectedCell || gameWon) return;
		const [row, col] = selectedCell;
		const num = parseInt(e.key);
		if (num >= 1 && num <= (difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9)) {
			const newGrid = grid.map((r) => [...r]);
			newGrid[row][col] = num;
			grid = newGrid;
			checkWin();
		} else if (e.key === 'Backspace' || e.key === 'Delete') {
			const newGrid = grid.map((r) => [...r]);
			newGrid[row][col] = 0;
			grid = newGrid;
		}
	}

	function handleNumInput(num: number) {
		if (!selectedCell || gameWon) return;
		const [row, col] = selectedCell;
		const size = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
		if (num >= 1 && num <= size) {
			const newGrid = grid.map((r) => [...r]);
			newGrid[row][col] = num;
			grid = newGrid;
			checkWin();
		}
	}

	function checkWin() {
		if (!difficulty) return;
		const size = GRID_SIZES[difficulty];
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (grid[r][c] !== solution[r][c]) return;
			}
		}
		gameWon = true;
		if (timerInterval) clearInterval(timerInterval);

		const baseScore = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 250 : 500;
		const timeBonus = Math.max(0, 300 - timer);
		score = baseScore + timeBonus;
		saveScore();
	}

	async function saveScore() {
		if (!currentUser || !difficulty) return;
		saving = true;
		await saveGameScore({
			userId: currentUser.id,
			gameType: 'puzzle',
			score,
			difficulty
		});
		saving = false;
	}

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function goBack() {
		if (timerInterval) clearInterval(timerInterval);
		difficulty = null;
		grid = [];
		solution = [];
		selectedCell = null;
		gameWon = false;
	}
</script>

<svelte:head>
	<title>Puzzle Game - Pateros Quest</title>
</svelte:head>

<svelte:window onkeydown={handleKeyDown} />

<div class="mx-auto max-w-2xl">
	{#if !difficulty}
		<!-- Difficulty Selection -->
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold text-white">🧩 Puzzle Game</h1>
			<p class="mb-8 text-gray-400">Select your difficulty level</p>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<button
					onclick={() => startGame('easy')}
					class="rounded-xl border border-green-500/30 bg-green-500/5 p-8 transition-all hover:border-green-500/50 hover:bg-green-500/10"
				>
					<div class="mb-2 text-4xl">😊</div>
					<h3 class="text-lg font-semibold text-green-400">Easy</h3>
					<p class="text-sm text-gray-500">4×4 Grid</p>
				</button>

				<button
					onclick={() => startGame('medium')}
					class="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-8 transition-all hover:border-yellow-500/50 hover:bg-yellow-500/10"
				>
					<div class="mb-2 text-4xl">🤔</div>
					<h3 class="text-lg font-semibold text-yellow-400">Medium</h3>
					<p class="text-sm text-gray-500">6×6 Grid</p>
				</button>

				<button
					onclick={() => startGame('hard')}
					class="rounded-xl border border-red-500/30 bg-red-500/5 p-8 transition-all hover:border-red-500/50 hover:bg-red-500/10"
				>
					<div class="mb-2 text-4xl">🔥</div>
					<h3 class="text-lg font-semibold text-red-400">Hard</h3>
					<p class="text-sm text-gray-500">9×9 Grid</p>
				</button>
			</div>
		</div>
	{:else}
		<!-- Game Board -->
		<div class="mb-6 flex items-center justify-between">
			<button
				onclick={goBack}
				class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
			>
				← Back
			</button>
			<div class="text-center">
				<span class="text-sm text-gray-400">Time: </span>
				<span class="font-mono text-lg font-bold text-amber-400">{formatTime(timer)}</span>
			</div>
			<span class="rounded-lg bg-gray-800 px-3 py-1 text-sm font-medium text-gray-300 capitalize">
				{difficulty}
			</span>
		</div>

		{#if gameWon}
			<div class="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
				<div class="mb-2 text-5xl">🎉</div>
				<h2 class="text-2xl font-bold text-green-400">Puzzle Complete!</h2>
				<p class="mt-2 text-gray-300">
					Score: <span class="font-bold text-amber-400">{score}</span>
					{#if saving}(saving...){/if}
				</p>
				<p class="text-sm text-gray-500">Time: {formatTime(timer)}</p>
				<button
					onclick={goBack}
					class="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400"
				>
					Play Again
				</button>
			</div>
		{/if}

		<!-- Sudoku Grid -->
		<div class="mb-6 flex justify-center">
			<div
				class="inline-grid gap-0 border-2 border-amber-500/50"
				style="grid-template-columns: repeat({grid.length}, 1fr);"
			>
				{#each grid as row, r (r)}
					{#each row as cell, c (c)}
						{@const isOriginal =
							solution[r][c] !== 0 && grid[r][c] === solution[r][c] && grid[r][c] !== 0}
						{@const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c}
						{@const boxSize = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 2 : 3}
						{@const isBoxBorderR = (r + 1) % boxSize === 0 && r < grid.length - 1}
						{@const isBoxBorderC = (c + 1) % boxSize === 0 && c < grid.length - 1}
						<button
							onclick={() => handleCellClick(r, c)}
							class="flex h-10 w-10 items-center justify-center border border-gray-700 text-sm font-bold transition-colors sm:h-12 sm:w-12 sm:text-base
								{isSelected ? 'bg-amber-500/20 ring-2 ring-amber-500' : ''}
								{isOriginal ? 'text-white' : 'text-blue-400'}
								{isBoxBorderR ? 'border-b-2 border-b-amber-500/50' : ''}
								{isBoxBorderC ? 'border-r-2 border-r-amber-500/50' : ''}
								hover:bg-gray-700"
						>
							{cell || ''}
						</button>
					{/each}
				{/each}
			</div>
		</div>

		<!-- Number Input -->
		<div class="flex justify-center gap-2">
			{#each Array.from({ length: grid.length }, (_, i) => i + 1) as num (num)}
				<button
					onclick={() => handleNumInput(num)}
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-sm font-bold text-white hover:border-amber-500 hover:bg-gray-700 sm:h-12 sm:w-12 sm:text-base"
				>
					{num}
				</button>
			{/each}
			<button
				onclick={() => handleNumInput(0)}
				class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-400 hover:border-red-500 hover:bg-gray-700 sm:h-12 sm:w-12"
			>
				✕
			</button>
		</div>
	{/if}
</div>
