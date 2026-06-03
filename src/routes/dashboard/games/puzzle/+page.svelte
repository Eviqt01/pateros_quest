<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { saveGameScore } from '$lib/gameScores';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	// Types
	type Difficulty = 'easy' | 'medium' | 'hard';
	type GameMode = 'select' | 'sudoku' | 'slider';

	interface PuzzleImage {
		id: string;
		title: string;
		image_url: string;
		difficulty: Difficulty;
		created_at?: string;
	}

	// General Game State
	let currentUser = $derived($user);
	let gameMode = $state<GameMode>('select');
	let saving = $state(false);

	// ==================== SUDOKU GAME STATE ====================
	let difficulty = $state<Difficulty | null>(null);
	let grid = $state<number[][]>([]);
	let solution = $state<number[][]>([]);
	let selectedCell = $state<[number, number] | null>(null);
	let gameWon = $state(false);
	let score = $state(0);
	let timer = $state(0);
	let timerInterval = $state<ReturnType<typeof setInterval> | null>(null);

	const GRID_SIZES: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 9 };

	function startSudoku(level: Difficulty) {
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
		gameMode = 'sudoku';
	}

	function generateSudoku(size: number): { puzzle: number[][]; sol: number[][] } {
		const board: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
		solveSudoku(board, size);
		const sol = board.map((row) => [...row]);

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

	function handleSudokuKeyDown(e: KeyboardEvent) {
		if (!selectedCell || gameWon || gameMode !== 'sudoku') return;
		const [row, col] = selectedCell;
		const num = parseInt(e.key);
		if (num >= 1 && num <= (difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9)) {
			const newGrid = grid.map((r) => [...r]);
			newGrid[row][col] = num;
			grid = newGrid;
			checkSudokuWin();
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
			checkSudokuWin();
		}
	}

	function checkSudokuWin() {
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
		saveSudokuScore();
	}

	async function saveSudokuScore() {
		if (!currentUser || !difficulty) return;
		saving = true;
		await saveGameScore({
			userId: currentUser.id,
			gameType: 'puzzle',
			score,
			difficulty: `sudoku_${difficulty}`
		});
		saving = false;
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	// ==================== SLIDER PUZZLE STATE ====================
	let dbImages = $state<PuzzleImage[]>([]);
	let selectedImage = $state<PuzzleImage | null>(null);
	let sliderDifficulty = $state<Difficulty | null>(null);
	let sliderGridSize = $state(3);
	let sliderTiles = $state<number[]>([]);
	let sliderBlankIndex = $state(-1);
	let sliderSolved = $state(false);
	let sliderMoves = $state(0);
	let sliderTimer = $state(0);
	let sliderTimerInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let showPreview = $state(false);

	const defaultPuzzles: PuzzleImage[] = [
		{
			id: '1',
			title: 'San Roque Parish Church',
			image_url: '/images/puzzles/pateros_church.png',
			difficulty: 'easy'
		},
		{
			id: '2',
			title: 'Traditional Balut Making',
			image_url: '/images/puzzles/balut_making.png',
			difficulty: 'medium'
		},
		{
			id: '3',
			title: 'Pateros River Sunset',
			image_url: '/images/puzzles/pateros_river.png',
			difficulty: 'hard'
		}
	];

	async function loadSliderImages() {
		try {
			const { data, error } = await supabase.from('puzzle_images').select('*');
			if (!error && data && data.length > 0) {
				dbImages = data as PuzzleImage[];
			}
		} catch (err) {
			console.error('Failed to load puzzle images:', err);
		}
	}

	let puzzleImagesList = $derived<PuzzleImage[]>(dbImages.length > 0 ? dbImages : defaultPuzzles);

	function startSliderGame(image: PuzzleImage, diff: Difficulty) {
		selectedImage = image;
		sliderDifficulty = diff;
		sliderGridSize = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
		sliderSolved = false;
		sliderMoves = 0;
		sliderTimer = 0;

		const size = sliderGridSize * sliderGridSize;
		const tiles = Array.from({ length: size }, (_, i) => i);
		let blankIdx = size - 1;
		const N = sliderGridSize;

		for (let i = 0; i < 250; i++) {
			const r = Math.floor(blankIdx / N);
			const c = blankIdx % N;
			const validMoves: number[] = [];

			if (r > 0) validMoves.push(blankIdx - N);
			if (r < N - 1) validMoves.push(blankIdx + N);
			if (c > 0) validMoves.push(blankIdx - 1);
			if (c < N - 1) validMoves.push(blankIdx + 1);

			const nextIdx = validMoves[Math.floor(Math.random() * validMoves.length)];
			tiles[blankIdx] = tiles[nextIdx];
			tiles[nextIdx] = size - 1;
			blankIdx = nextIdx;
		}

		sliderTiles = tiles;
		sliderBlankIndex = blankIdx;

		if (sliderTimerInterval) clearInterval(sliderTimerInterval);
		sliderTimerInterval = setInterval(() => {
			sliderTimer++;
		}, 1000);

		gameMode = 'slider';
	}

	function moveTile(index: number) {
		if (sliderSolved) return;
		const N = sliderGridSize;
		const blankIdx = sliderBlankIndex;

		const r = Math.floor(index / N);
		const c = index % N;
		const br = Math.floor(blankIdx / N);
		const bc = blankIdx % N;

		if (Math.abs(r - br) + Math.abs(c - bc) === 1) {
			const newTiles = [...sliderTiles];
			newTiles[blankIdx] = newTiles[index];
			newTiles[index] = N * N - 1;

			sliderTiles = newTiles;
			sliderBlankIndex = index;
			sliderMoves++;

			checkSliderWin();
		}
	}

	function handleSliderKeyDown(e: KeyboardEvent) {
		if (sliderSolved || gameMode !== 'slider' || !selectedImage || sliderTiles.length === 0) return;
		const N = sliderGridSize;
		const blankIdx = sliderBlankIndex;
		const r = Math.floor(blankIdx / N);
		const c = blankIdx % N;
		let targetIdx = -1;

		if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
			if (r < N - 1) targetIdx = blankIdx + N;
		} else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
			if (r > 0) targetIdx = blankIdx - N;
		} else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
			if (c < N - 1) targetIdx = blankIdx + 1;
		} else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
			if (c > 0) targetIdx = blankIdx - 1;
		}

		if (targetIdx !== -1) {
			e.preventDefault();
			moveTile(targetIdx);
		}
	}

	function checkSliderWin() {
		const size = sliderGridSize * sliderGridSize;
		for (let i = 0; i < size; i++) {
			if (sliderTiles[i] !== i) return;
		}
		sliderSolved = true;
		if (sliderTimerInterval) clearInterval(sliderTimerInterval);

		const baseScore = sliderDifficulty === 'easy' ? 100 : sliderDifficulty === 'medium' ? 250 : 500;
		const timeBonus = Math.max(0, 300 - sliderTimer);
		const movesLimit = sliderDifficulty === 'easy' ? 40 : sliderDifficulty === 'medium' ? 100 : 200;
		const movePenalty = Math.max(0, (sliderMoves - movesLimit) * 2);

		const finalScore = Math.max(20, baseScore + timeBonus - movePenalty);
		score = finalScore;
		saveSliderScore(finalScore);
	}

	async function saveSliderScore(finalScore: number) {
		if (!currentUser || !sliderDifficulty) return;
		saving = true;
		await saveGameScore({
			userId: currentUser.id,
			gameType: 'puzzle',
			score: finalScore,
			difficulty: `slider_${sliderDifficulty}`
		});
		saving = false;
	}

	function handleGlobalKeyDown(e: KeyboardEvent) {
		if (gameMode === 'sudoku') handleSudokuKeyDown(e);
		else if (gameMode === 'slider') handleSliderKeyDown(e);
	}

	function goBack() {
		if (timerInterval) clearInterval(timerInterval);
		if (sliderTimerInterval) clearInterval(sliderTimerInterval);
		difficulty = null;
		grid = [];
		solution = [];
		selectedCell = null;
		gameWon = false;

		selectedImage = null;
		sliderDifficulty = null;
		sliderTiles = [];
		sliderBlankIndex = -1;
		sliderSolved = false;
		sliderMoves = 0;
		showPreview = false;

		gameMode = 'select';
	}

	onMount(() => {
		loadSliderImages();
		return () => {
			if (timerInterval) clearInterval(timerInterval);
			if (sliderTimerInterval) clearInterval(sliderTimerInterval);
		};
	});
</script>

<svelte:head>
	<title>Puzzle Game - Pateros Quest</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="mx-auto max-w-4xl">
	{#if gameMode === 'select'}
		<div class="space-y-6 text-center">
			<h1 class="text-4xl font-extrabold tracking-tight text-white">🧩 Puzzle Challenge</h1>
			<p class="mx-auto max-w-md text-gray-400">
				Select a puzzle type to test your logic or spatial assembly skills!
			</p>

			<div class="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Sudoku Option -->
				<div
					class="flex flex-col justify-between rounded-2xl border border-gray-800 bg-gray-900/50 p-8 transition-all hover:border-amber-500/30"
				>
					<div>
						<div class="mb-4 text-5xl">🔢</div>
						<h3 class="mb-2 text-xl font-bold text-white">Sudoku</h3>
						<p class="mb-6 text-sm text-gray-400">
							Traditional number logic game. Fill the grid so that every row, column, and box
							contains digits 1-9.
						</p>
					</div>
					<div class="space-y-2">
						<span class="mb-1 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>Select Difficulty</span
						>
						<div class="grid grid-cols-3 gap-2">
							<button
								onclick={() => startSudoku('easy')}
								class="rounded-lg border border-green-500/20 bg-green-500/10 py-2 text-xs font-bold text-green-400 transition-all hover:bg-green-500/20"
								>Easy</button
							>
							<button
								onclick={() => startSudoku('medium')}
								class="rounded-lg border border-yellow-500/20 bg-yellow-500/10 py-2 text-xs font-bold text-yellow-400 transition-all hover:bg-yellow-500/20"
								>Medium</button
							>
							<button
								onclick={() => startSudoku('hard')}
								class="rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20"
								>Hard</button
							>
						</div>
					</div>
				</div>

				<!-- Slider Option -->
				<div
					class="flex flex-col justify-between rounded-2xl border border-gray-800 bg-gray-900/50 p-8 transition-all hover:border-amber-500/30"
				>
					<div>
						<div class="mb-4 text-5xl">🖼️</div>
						<h3 class="mb-2 text-xl font-bold text-white">Image Slider</h3>
						<p class="mb-6 text-sm text-gray-400">
							Arrange shuffled image tiles back into their correct positions by sliding adjacent
							tiles into the empty space.
						</p>
					</div>
					<div>
						<span class="mb-2 block text-xs font-semibold tracking-wider text-gray-500 uppercase"
							>Select Image to Begin</span
						>
						<div class="max-h-[140px] space-y-2 overflow-y-auto pr-1">
							{#each puzzleImagesList as img (img.id)}
								<div
									class="flex items-center gap-3 rounded-lg border border-gray-800/80 bg-gray-950/60 p-2"
								>
									<img
										src={img.image_url}
										alt={img.title}
										class="h-10 w-10 rounded border border-gray-800 object-cover"
									/>
									<div class="flex-1 text-left">
										<p class="max-w-[130px] truncate text-xs font-semibold text-white">
											{img.title}
										</p>
										<span class="text-[10px] text-amber-500 capitalize"
											>{img.difficulty} defaults</span
										>
									</div>
									<div class="flex gap-1">
										<button
											onclick={() => startSliderGame(img, 'easy')}
											class="rounded bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-300 transition-colors hover:bg-amber-500 hover:text-gray-950"
											>3×3</button
										>
										<button
											onclick={() => startSliderGame(img, 'medium')}
											class="rounded bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-300 transition-colors hover:bg-amber-500 hover:text-gray-950"
											>4×4</button
										>
										<button
											onclick={() => startSliderGame(img, 'hard')}
											class="rounded bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-300 transition-colors hover:bg-amber-500 hover:text-gray-950"
											>5×5</button
										>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else if gameMode === 'sudoku'}
		<div class="mx-auto max-w-2xl">
			<div class="mb-6 flex items-center justify-between">
				<button
					onclick={goBack}
					class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
					>← Back</button
				>
				<div class="text-center">
					<span class="text-sm text-gray-400">Time: </span>
					<span class="font-mono text-lg font-bold text-amber-400">{formatTime(timer)}</span>
				</div>
				<span class="rounded-lg bg-gray-800 px-3 py-1 text-sm font-medium text-gray-300 capitalize"
					>Sudoku: {difficulty}</span
				>
			</div>

			{#if gameWon}
				<div class="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
					<div class="mb-2 text-5xl">🎉</div>
					<h2 class="text-2xl font-bold text-green-400">Sudoku Complete!</h2>
					<p class="mt-2 text-gray-300">
						Score: <span class="font-bold text-amber-400">{score}</span>
						{#if saving}(saving...){/if}
					</p>
					<p class="text-sm text-gray-500">Time: {formatTime(timer)}</p>
					<button
						onclick={goBack}
						class="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400"
						>Play Again</button
					>
				</div>
			{/if}

			<!-- Sudoku Grid -->
			<div class="mb-6 flex justify-center">
				<div
					class="inline-grid gap-0 border-2 border-amber-500/50 bg-gray-950"
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
								class="flex h-10 w-10 items-center justify-center border border-gray-800 text-sm font-bold transition-colors sm:h-12 sm:w-12 sm:text-base
									{isSelected ? 'bg-amber-500/20 ring-2 ring-amber-500' : ''}
									{isOriginal ? 'font-semibold text-gray-400' : 'text-blue-400'}
									{isBoxBorderR ? 'border-b-2 border-b-amber-500/50' : ''}
									{isBoxBorderC ? 'border-r-2 border-r-amber-500/50' : ''}
									hover:bg-gray-800"
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
		</div>
	{:else if gameMode === 'slider'}
		<div class="mx-auto max-w-3xl">
			<div
				class="mb-6 flex flex-col gap-4 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex items-center gap-3">
					<button
						onclick={goBack}
						class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
						>← Back</button
					>
					<div>
						<h2 class="text-xl font-bold text-white">{selectedImage?.title}</h2>
						<span class="text-xs text-gray-400 capitalize"
							>Difficulty: {sliderDifficulty} ({sliderGridSize}×{sliderGridSize})</span
						>
					</div>
				</div>
				<div class="flex items-center gap-6 self-end sm:self-center">
					<div class="text-center">
						<p class="text-xs tracking-wider text-gray-500 uppercase">Moves</p>
						<p class="font-mono text-lg font-bold text-white">{sliderMoves}</p>
					</div>
					<div class="text-center">
						<p class="text-xs tracking-wider text-gray-500 uppercase">Time</p>
						<p class="font-mono text-lg font-bold text-amber-400">{formatTime(sliderTimer)}</p>
					</div>
					<button
						onclick={() => (showPreview = !showPreview)}
						class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors
							{showPreview
							? 'border-amber-500 bg-amber-500/10 text-amber-400'
							: 'border-gray-700 text-gray-400 hover:bg-gray-800'}"
					>
						{showPreview ? 'Hide Target' : 'View Target'}
					</button>
				</div>
			</div>

			{#if sliderSolved}
				<div
					class="mb-6 animate-pulse rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center shadow-lg shadow-green-500/5"
				>
					<div class="mb-2 text-5xl">🏆</div>
					<h2 class="text-2xl font-bold text-green-400">Puzzle Solved!</h2>
					<p class="mt-2 text-gray-300">
						Final Score: <span class="font-bold text-amber-400">{score}</span>
						{#if saving}(saving...){/if}
					</p>
					<p class="text-sm text-gray-500">
						Solved in {sliderMoves} moves & {formatTime(sliderTimer)}
					</p>
					<button
						onclick={goBack}
						class="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400"
						>Back to Selection</button
					>
				</div>
			{/if}

			<div class="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
				<!-- The Slider Grid -->
				<div class="flex justify-center md:col-span-2">
					<div
						class="grid w-full max-w-[420px] gap-1 rounded-2xl border border-gray-800 bg-gray-900 p-2"
						style="grid-template-columns: repeat({sliderGridSize}, 1fr);"
					>
						{#each sliderTiles as tile, idx (idx)}
							{@const row = Math.floor(tile / sliderGridSize)}
							{@const col = tile % sliderGridSize}
							{@const isBlank = tile === sliderGridSize * sliderGridSize - 1}

							{#if isBlank}
								<div
									class="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-800 bg-gray-950 text-xs text-gray-600"
								>
									Empty
								</div>
							{:else}
								<button
									onclick={() => moveTile(idx)}
									disabled={sliderSolved}
									class="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-gray-800 bg-gray-950 transition-all hover:scale-[1.02] hover:border-amber-500/50 focus:outline-none active:scale-[0.98]"
									style="
										background-image: url('{selectedImage?.image_url}');
										background-size: {sliderGridSize * 100}% {sliderGridSize * 100}%;
										background-position: {(col / (sliderGridSize - 1)) * 100}% {(row / (sliderGridSize - 1)) * 100}%;
									"
								>
									<span
										class="absolute right-2 bottom-1 rounded bg-gray-950/70 px-1 text-[8px] font-semibold text-gray-400 select-none"
									>
										{tile + 1}
									</span>
								</button>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Sidebar -->
				<div class="space-y-4">
					{#if showPreview || sliderSolved}
						<div class="space-y-2 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
							<h3 class="text-xs font-semibold tracking-wider text-gray-400 uppercase">
								Target Image
							</h3>
							<div class="aspect-video w-full overflow-hidden rounded-lg border border-gray-800">
								<img
									src={selectedImage?.image_url}
									alt="Target"
									class="h-full w-full object-cover"
								/>
							</div>
						</div>
					{/if}

					<div
						class="space-y-2 rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-xs leading-relaxed text-gray-400"
					>
						<h3 class="font-semibold tracking-wider text-gray-300 uppercase">How to Play</h3>
						<p>
							🖱️ <strong>Click</strong> on a tile adjacent to the empty square to slide it into the empty
							slot.
						</p>
						<p>
							⌨️ <strong>Arrow Keys</strong> or <strong>WASD</strong> can also be used to slide tiles
							on your keyboard.
						</p>
						<p>
							🎯 Reconstruct the original image by putting all parts in order from 1 to {sliderGridSize *
								sliderGridSize -
								1}.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
