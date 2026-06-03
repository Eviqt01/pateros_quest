<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { saveGameScore } from '$lib/gameScores';
	import { supabase } from '$lib/supabase';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	// Types
	interface Question {
		q: string;
		options: string[];
		answer: number;
	}

	interface DBQuestion {
		id: string;
		question: string;
		options: string[];
		answer: number;
		created_at: string;
	}

	let currentUser = $derived($user);
	let gameState = $state<'menu' | 'playing' | 'finished'>('menu');
	let currentQuestion = $state(0);
	let score = $state(0);
	let lives = $state(3);
	let selectedAnswer = $state<number | null>(null);
	let showResult = $state(false);
	let saving = $state(false);
	let dbQuestions = $state<DBQuestion[]>([]);

	async function fetchQuestionsFromDB() {
		try {
			const { data, error } = await supabase.from('quiz_questions').select('*');
			if (!error && data && data.length > 0) {
				dbQuestions = data as DBQuestion[];
			}
		} catch (err) {
			console.error('Failed to fetch quiz questions from database:', err);
		}
	}

	onMount(() => {
		fetchQuestionsFromDB();
	});

	const allQuestions: Question[] = [
		{
			q: 'What is Pateros?',
			options: [
				'A chartered city located in Metro Manila, Philippines.',
				'A province located in the Calabarzon region.',
				'Pateros is a municipality located in Metro Manila, Philippines. It is the only remaining municipality in the National Capital Region.',
				'A barangay of Pasig City famous for its trading ports.'
			],
			answer: 2
		},
		{
			q: 'Why is Pateros historically important?',
			options: [
				'It is the birthplace of José Rizal.',
				'Pateros is historically important because it is one of the oldest communities in Metro Manila and is famous for its duck-raising and balut industry.',
				'It was the capital of the First Philippine Republic.',
				'It is where the first Catholic mass in the Philippines took place.'
			],
			answer: 1
		},
		{
			q: 'What was the old name of Pateros?',
			options: [
				'Marikina or San Mateo.',
				'Pasay or Baclaran.',
				'Aguho or Embarcadero, when it was still a barrio of Pasig.',
				'Tondo or Maynila.'
			],
			answer: 2
		},
		{
			q: 'Why was it called Aguho?',
			options: [
				'It was named after a Spanish governor named Don Francisco Aguho.',
				'It was called Aguho because many agoho trees grew along the riverbanks in the area.',
				'It is a native word that translates directly to "duck nest".',
				'It was a term used by early Chinese traders for clay pots.'
			],
			answer: 1
		},
		{
			q: 'What does Embarcadero mean?',
			options: [
				'Embarcadero means "small port" because Pateros served as a trading port during the early times.',
				'It means "place of eggs" in ancient Spanish.',
				'It translates to "swamp area" where ducks gather.',
				'It means "independent town" in the local Tagalog dialect.'
			],
			answer: 0
		},
		{
			q: 'How did Pateros get its name?',
			options: [
				'It was named after Father Pateros, a beloved Spanish missionary priest.',
				'The name Pateros came from the word "pato" meaning duck, because the town became famous for duck raising and egg production.',
				'It came from "patio", referring to the church plaza.',
				'It was derived from "sapatos" due to the historical shoe-making industry.'
			],
			answer: 1
		},
		{
			q: 'What was the main livelihood in old Pateros?',
			options: [
				'Farming rice, fishing in Laguna de Bay, and weaving hats.',
				'Gold mining, blacksmithing, and building boats.',
				'The main livelihood was duck raising, balut making, salted egg production, and slipper making.',
				'Weaving blankets, harvesting coconuts, and salt farming.'
			],
			answer: 2
		},
		{
			q: 'Why is Pateros called the Balut Capital?',
			options: [
				'Because it was the first place in Southeast Asia to domesticate wild ducks.',
				'It is called the Balut Capital because it became widely known for producing balut and penoy from duck eggs.',
				'Because it was decreed by the Spanish Governor-General in 1800.',
				'Because the largest egg in the world was discovered there.'
			],
			answer: 1
		},
		{
			q: 'Before becoming independent, Pateros was part of what town?',
			options: ['Taguig', 'Pasig', 'Makati', 'Taytay'],
			answer: 1
		},
		{
			q: 'During what period did Pateros become progressive?',
			options: [
				'During the pre-colonial era before Spanish contact.',
				'During the American occupation period.',
				'Pateros became progressive during the Spanish colonial period because of trade and commerce in its port.',
				'During the Japanese occupation in World War II.'
			],
			answer: 2
		},
		{
			q: 'Who traded with Pateros in early history?',
			options: [
				'Malay, Chinese, Indian, and Swedish traders visited Pateros for business.',
				'British, French, and Russian merchants.',
				'Japanese samurai and Portuguese explorers.',
				'Dutch merchants and American whalers.'
			],
			answer: 0
		},
		{
			q: 'What industry did Chinese traders introduce?',
			options: [
				'Rice terrace farming and pottery.',
				'Chinese traders helped improve the balut industry and slipper-making industry.',
				'Sugar refining and tobacco farming.',
				'Silk weaving and abaca production.'
			],
			answer: 1
		},
		{
			q: 'When did Pateros officially become a municipality?',
			options: ['June 12, 1898', 'March 29, 1900', 'November 7, 1975', 'January 1, 1909'],
			answer: 1
		},
		{
			q: 'Under what province was Pateros included in 1901?',
			options: [
				'Province of Rizal',
				'Province of Tondo',
				'Province of Laguna',
				'Province of Cavite'
			],
			answer: 0
		},
		{
			q: 'What happened to Pateros in 1903?',
			options: [
				'It was converted into a highly urbanized city.',
				'In 1903, Pateros, Taguig, and Muntinlupa were combined into one municipality.',
				'It was completely destroyed by a massive fire.',
				'It was separated from the Province of Rizal.'
			],
			answer: 1
		},
		{
			q: 'What was the seat of government in the combined municipality?',
			options: [
				'Taguig',
				'Muntinlupa',
				'Pateros became the seat of the municipal government.',
				'Alabang'
			],
			answer: 2
		},
		{
			q: 'What happened in 1905 to the Municipality of Pateros?',
			options: [
				'In 1905, the Municipality of Pateros was renamed Municipality of Taguig.',
				'It was annexed to Manila City.',
				'It became the provincial capital of Rizal.',
				'It was split into two independent barangays.'
			],
			answer: 0
		},
		{
			q: 'Did Pateros lose its independence?',
			options: [
				'No, it has remained completely independent since the 16th century.',
				'Yes, for a short time Pateros lost its separate municipal status.',
				'Yes, it was bought by Makati.',
				'No, Muntinlupa took over Muntinlupa only.'
			],
			answer: 1
		},
		{
			q: 'When did Pateros regain independence?',
			options: ['March 29, 1900', 'January 1, 1909', 'November 7, 1975', 'June 12, 1946'],
			answer: 1
		},
		{
			q: 'Did Pateros join the Philippine Revolution?',
			options: [
				'No, they remained loyal to the Spanish Crown.',
				'Yes, many Pateros residents joined the Katipunan during the 1896 Philippine Revolution.',
				'Only after the Americans arrived in 1898.',
				'They declared neutrality and refused to participate.'
			],
			answer: 1
		},
		{
			q: 'Who was one of the known revolutionary leaders in Pateros?',
			options: [
				'Andres Bonifacio',
				'Emilio Aguinaldo',
				'One known revolutionary leader was Macario Almeda.',
				'Jose Rizal'
			],
			answer: 2
		},
		{
			q: 'What happened to Pateros during the Spanish retaliation?',
			options: [
				'The Spanish forces offered peace negotiations and land grants.',
				'Spanish forces attacked nearby towns including Pateros after the revolutionaries fought back.',
				'The town was evacuated and used as a Spanish military base.',
				'Pateros was protected by its deep rivers and was untouched.'
			],
			answer: 1
		},
		{
			q: "Did Pateros support Emilio Aguinaldo's government?",
			options: [
				'No, they opposed Aguinaldo and supported Andres Bonifacio.',
				'Yes, on August 6, 1898, Pateros joined the revolutionary government of Emilio Aguinaldo.',
				'They did not support any government until the 1900s.',
				'They joined the American civil government instead.'
			],
			answer: 1
		},
		{
			q: 'When did Pateros become part of Metro Manila?',
			options: ['June 12, 1898', 'January 1, 1909', 'November 7, 1975', 'March 29, 1900'],
			answer: 2
		},
		{
			q: 'What is unique about Pateros in Metro Manila today?',
			options: [
				'It is the only municipality left in Metro Manila; all others are cities.',
				'It is the largest city in terms of land area.',
				'It is the only place where ducks are legally allowed.',
				'It has no road connections to other cities.'
			],
			answer: 0
		},
		{
			q: 'Who is the patron saint of Pateros?',
			options: ['San Roque', 'Santa Marta', 'Santo Niño', 'San Juan Bautista'],
			answer: 1
		},
		{
			q: 'Why is Santa Marta important in Pateros history?',
			options: [
				'She was born and raised in Pateros.',
				'Santa Marta is believed to protect the town, especially its duck industry and people.',
				'She was the first historical ruler of the municipality.',
				'She built the first church of Pateros.'
			],
			answer: 1
		},
		{
			q: 'What local products made Pateros famous aside from balut?',
			options: [
				'Dried fish, barong tagalog, and abaca bags.',
				'Pateros is also famous for salted eggs, inutak, and alfombra slippers.',
				'Shoe manufacturing, chocolate, and clay pots.',
				'Wooden toys, cane sugar, and coconut wine.'
			],
			answer: 1
		},
		{
			q: 'Why is Pateros considered a historic town?',
			options: [
				'It is considered a historic town because of its old traditions, revolutionary participation, long-time industries, and unique identity in Metro Manila.',
				'Because it was the first town founded by Spanish conquistadors.',
				'Because it possesses the oldest stone fort in Luzon.',
				'Because it is the location where the first Philippine constitution was written.'
			],
			answer: 0
		},
		{
			q: 'What can we learn from the history of Pateros?',
			options: [
				'That communities must change their names to survive.',
				'We learn that Pateros remained strong in preserving its culture, livelihood, and independence despite many political changes.',
				'That duck raising is the only successful industry.',
				'That small towns cannot survive without merging with larger cities.'
			],
			answer: 1
		}
	];

	let questions = $state<Question[]>([]);

	function startGame() {
		let pool: Question[] = allQuestions;
		if (dbQuestions.length > 0) {
			pool = dbQuestions.map((item) => ({
				q: item.question,
				options: item.options,
				answer: item.answer
			}));
		}
		questions = [...pool].sort(() => Math.random() - 0.5).slice(0, 30);
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
				{#each [0, 1, 2] as const as i (i)}
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
