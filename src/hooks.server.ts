import { createSupabaseServerClient } from '$lib/supabase-server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createSupabaseServerClient();

	// Get the session from the auth cookie
	const authHeader = event.request.headers.get('authorization');
	let session = null;
	let user = null;

	try {
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '');
			const { data } = await supabase.auth.getUser(token);
			user = data.user;
			session = { access_token: token, user } as import('@supabase/supabase-js').Session;
		}
	} catch {
		// Ignore auth errors
	}

	event.locals.session = session;
	event.locals.user = user;

	return resolve(event);
};
