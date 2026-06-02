<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { saveGameScore } from '$lib/gameScores';
	import { supabase } from '$lib/supabase';
	import { resolve } from '$app/paths';

	let currentUser = $derived($user);
	let gameState = $state<'menu' | 'playing' | 'finished'>('menu');
	let currentQuestion = $state(0);
	let score = $state(0);
	let lives = $state(3);
	let selectedAnswer = $state<number | null>(null);
	let showResult = $state(false);
	let saving = $state(false);

	const allQuestions = [
		{
			q: 'What is the capital of France?',
			options: ['London', 'Berlin', 'Paris', 'Madrid'],
			answer: 2
		},
		{
			q: 'Which planet is known as the Red Planet?',
			options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
			answer: 1
		},
		{
			q: 'What is the largest ocean on Earth?',
			options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
			answer: 3
		},
		{
			q: 'Who painted the Mona Lisa?',
			options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'],
			answer: 1
		},
		{ q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
		{ q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
		{
			q: 'What is the fastest land animal?',
			options: ['Lion', 'Cheetah', 'Horse', 'Gazelle'],
			answer: 1
		},
		{
			q: 'Which country has the most people?',
			options: ['India', 'USA', 'China', 'Indonesia'],
			answer: 0
		},
		{ q: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: 2 },
		{
			q: 'What is the smallest bone in the human body?',
			options: ['Femur', 'Stapes', 'Tibia', 'Radius'],
			answer: 1
		},
		{
			q: 'Which element has the atomic number 1?',
			options: ['Helium', 'Oxygen', 'Carbon', 'Hydrogen'],
			answer: 3
		},
		{
			q: 'What is the hardest natural substance?',
			options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
			answer: 2
		},
		{
			q: 'Who wrote Romeo and Juliet?',
			options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'],
			answer: 1
		},
		{
			q: 'What is the largest mammal?',
			options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
			answer: 1
		},
		{ q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
		{
			q: 'What is the main language spoken in Brazil?',
			options: ['Spanish', 'Portuguese', 'French', 'Italian'],
			answer: 1
		},
		{
			q: 'Which gas do plants absorb?',
			options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
			answer: 2
		},
		{
			q: 'What is the tallest mountain in the world?',
			options: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'],
			answer: 2
		},
		{
			q: 'Who invented the telephone?',
			options: ['Edison', 'Tesla', 'Bell', 'Marconi'],
			answer: 2
		},
		{ q: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], answer: 2 },
		{
			q: 'How many bones are in the human body?',
			options: ['186', '206', '226', '256'],
			answer: 1
		},
		{
			q: 'What is the largest desert in the world?',
			options: ['Sahara', 'Gobi', 'Antarctic', 'Arabian'],
			answer: 2
		},
		{
			q: 'Which planet has the most moons?',
			options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
			answer: 1
		},
		{
			q: 'What is the speed of light in km/s (approx)?',
			options: ['200,000', '300,000', '400,000', '500,000'],
			answer: 1
		},
		{
			q: 'What is the boiling point of water in Celsius?',
			options: ['90°C', '95°C', '100°C', '110°C'],
			answer: 2
		},
		{
			q: 'Which animal is known as the King of the Jungle?',
			options: ['Tiger', 'Lion', 'Elephant', 'Bear'],
			answer: 1
		},
		{
			q: 'What is the largest organ in the human body?',
			options: ['Heart', 'Liver', 'Brain', 'Skin'],
			answer: 3
		},
		{ q: 'How many colors are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
		{ q: 'What is the square root of 144?', options: ['10', '11', '12', '13'], answer: 2 },
		{
			q: 'Which country gifted the Statue of Liberty to the USA?',
			options: ['England', 'Spain', 'France', 'Germany'],
			answer: 2
		}
	];

	let questions = $state<typeof allQuestions>([]);

	function startGame() {
		questions = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
		currentQuestion = 0;
		score = 0;
		lives = 3;
		selectedAnswer = null;
		showResult = false;
		gameState = 'playing';
	}

	function selectAnswer(index: number) {
		if (showResult) return;
		selectedAnswer = index;
		showResult = true;

		if (index === questions[currentQuestion].answer) {
			score += 10;
		} else {
			lives--;
			if (lives <= 0) {
				setTimeout(() => {
					gameState = 'finished';
					saveScore();
				}, 1500);
				return;
			}
		}

		setTimeout(() => {
			if (currentQuestion < questions.length - 1) {
				currentQuestion++;
				selectedAnswer = null;
				showResult = false;
			} else {
				gameState = 'finished';
				saveScore();
			}
		}, 1200);
	}

	async function saveScore() {
		if (!currentUser) return;
		saving = true;
		await saveGameScore({
			userId: currentUser.id,
			gameType: 'quiz',
			score
		});
		await supabase.from('quiz_progress').insert({
			user_id: currentUser.id,
			score,
			lives_remaining: lives
		});
		saving = false;
	}
</script>

<svelte:head>
	<title>Quiz Game - Pateros Quest</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	{#if gameState === 'menu'}
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold text-white">❓ Quiz Game</h1>
			<p class="mb-4 text-gray-400">30 questions, 3 lives. How far can you go?</p>

			<div class="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
				<h3 class="mb-3 text-lg font-semibold text-blue-400">Rules</h3>
				<ul class="space-y-2 text-sm text-gray-400">
					<li>📝 30 multiple-choice questions</li>
					<li>❤️ You have 3 lives</li>
					<li>✅ +10 points per correct answer</li>
					<li>❌ Wrong answer costs 1 life</li>
					<li>🏁 Game ends when all questions answered or lives = 0</li>
				</ul>
			</div>

			<button
				onclick={startGame}
				class="rounded-lg bg-blue-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-400"
			>
				Start Quiz
			</button>
		</div>
	{:else if gameState === 'playing'}
		<!-- Game Header -->
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#each [0, 1, 2] as i (i)}
					<span class="text-2xl">{i < lives ? '❤️' : '🖤'}</span>
				{/each}
			</div>
			<div class="text-center">
				<span class="text-sm text-gray-400">Question </span>
				<span class="font-bold text-white">{currentQuestion + 1}</span>
				<span class="text-sm text-gray-400"> / {questions.length}</span>
			</div>
			<div>
				<span class="text-sm text-gray-400">Score: </span>
				<span class="font-bold text-amber-400">{score}</span>
			</div>
		</div>

		<!-- Progress Bar -->
		<div class="mb-8 h-2 rounded-full bg-gray-800">
			<div
				class="h-2 rounded-full bg-blue-500 transition-all"
				style="width: {((currentQuestion + 1) / questions.length) * 100}%"
			></div>
		</div>

		<!-- Question -->
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-8">
			<h2 class="mb-6 text-xl font-semibold text-white">
				{questions[currentQuestion].q}
			</h2>

			<div class="space-y-3">
				{#each questions[currentQuestion].options as option, i (i)}
					{@const isCorrect = i === questions[currentQuestion].answer}
					{@const isSelected = selectedAnswer === i}
					<button
						onclick={() => selectAnswer(i)}
						disabled={showResult}
						class="w-full rounded-lg border px-6 py-4 text-left font-medium transition-all
							{showResult && isCorrect
							? 'border-green-500 bg-green-500/20 text-green-400'
							: showResult && isSelected && !isCorrect
								? 'border-red-500 bg-red-500/20 text-red-400'
								: 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500 hover:bg-gray-700'}
							{showResult ? 'cursor-default' : 'cursor-pointer'}"
					>
						<span class="mr-3 text-gray-500">{String.fromCharCode(65 + i)}.</span>
						{option}
					</button>
				{/each}
			</div>
		</div>
	{:else if gameState === 'finished'}
		<div class="text-center">
			<div class="mb-4 text-6xl">{lives > 0 ? '🏆' : '💀'}</div>
			<h1 class="mb-2 text-3xl font-bold text-white">
				{lives > 0 ? 'Quiz Complete!' : 'Game Over!'}
			</h1>
			<p class="mb-6 text-gray-400">
				{lives > 0 ? 'You answered all questions!' : 'You ran out of lives!'}
			</p>

			<div class="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-8">
				<div class="grid grid-cols-3 gap-4">
					<div>
						<p class="text-sm text-gray-400">Score</p>
						<p class="text-3xl font-bold text-amber-400">{score}</p>
					</div>
					<div>
						<p class="text-sm text-gray-400">Lives Left</p>
						<p class="text-3xl font-bold text-red-400">{lives}</p>
					</div>
					<div>
						<p class="text-sm text-gray-400">Question</p>
						<p class="text-3xl font-bold text-blue-400">
							{currentQuestion + (showResult ? 1 : 0)}/{questions.length}
						</p>
					</div>
				</div>
				{#if saving}
					<p class="mt-4 text-sm text-gray-500">Saving score...</p>
				{/if}
			</div>

			<div class="flex justify-center gap-4">
				<button
					onclick={startGame}
					class="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-400"
				>
					Play Again
				</button>
				<a
					href={resolve('/dashboard')}
					class="rounded-lg border border-gray-700 px-6 py-3 font-semibold text-gray-300 hover:bg-gray-800"
				>
					Dashboard
				</a>
			</div>
		</div>
	{/if}
</div>
