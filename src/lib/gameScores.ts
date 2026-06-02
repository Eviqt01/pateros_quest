import { supabase } from '$lib/supabase';

export type GameType = 'puzzle' | 'quiz' | 'flappy';

export type GameScore = {
	id: string;
	game_type: GameType;
	score: number;
	difficulty: string | null;
	created_at: string;
};

export type LeaderboardEntry = {
	user_id: string;
	username: string;
	score: number;
};

/** All scores for the logged-in user (newest first). Used on dashboard + recent activity. */
export async function fetchUserGameScores(userId: string) {
	return supabase
		.from('game_scores')
		.select('id, game_type, score, difficulty, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
}

/** Save a score row for the logged-in user. */
export async function saveGameScore(params: {
	userId: string;
	gameType: GameType;
	score: number;
	difficulty?: string;
}) {
	const row: {
		user_id: string;
		game_type: GameType;
		score: number;
		difficulty?: string;
	} = {
		user_id: params.userId,
		game_type: params.gameType,
		score: params.score
	};

	if (params.difficulty) {
		row.difficulty = params.difficulty;
	}

	return supabase.from('game_scores').insert(row);
}

/** Best score for one game type for a user. */
export async function fetchUserBestScore(userId: string, gameType: GameType) {
	return supabase
		.from('game_scores')
		.select('score')
		.eq('user_id', userId)
		.eq('game_type', gameType)
		.order('score', { ascending: false })
		.limit(1)
		.maybeSingle();
}

/** Global flappy leaderboard: best score per player. */
export async function fetchFlappyLeaderboard(limit = 10) {
	const { data: scores, error } = await supabase
		.from('game_scores')
		.select('score, user_id')
		.eq('game_type', 'flappy')
		.order('score', { ascending: false });

	if (error || !scores?.length) {
		return { data: [] as LeaderboardEntry[], error };
	}

	const bestByUser = new Map<string, number>();
	for (const row of scores) {
		const current = bestByUser.get(row.user_id) ?? 0;
		if (row.score > current) {
			bestByUser.set(row.user_id, row.score);
		}
	}

	const ranked = [...bestByUser.entries()]
		.map(([user_id, score]) => ({ user_id, score }))
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);

	const userIds = ranked.map((r) => r.user_id);
	const { data: profiles } = await supabase
		.from('profiles')
		.select('id, username')
		.in('id', userIds);

	const profileMap = new Map(profiles?.map((p) => [p.id, p.username]) ?? []);

	return {
		data: ranked.map((r) => ({
			user_id: r.user_id,
			username: profileMap.get(r.user_id) || 'Unknown',
			score: r.score
		})),
		error: null
	};
}

export function computeBestScores(scores: GameScore[]): Record<string, number> {
	const best: Record<string, number> = {};
	for (const s of scores) {
		if (!best[s.game_type] || s.score > best[s.game_type]) {
			best[s.game_type] = s.score;
		}
	}
	return best;
}
