# Six-digit email verification (Supabase)

Pateros Quest sends a **6-digit code** to the registration email via Supabase Auth. Configure your Supabase project once:

## 1. Enable email confirmation

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **Providers** → **Email**.
3. Turn on **Confirm email** (users must verify before sign-in).

## 2. Use OTP in the email template (not only a magic link)

1. **Authentication** → **Email Templates** → **Confirm signup**.
2. Include the token in the body, for example:

```html
<h2>Verify your Pateros Quest account</h2>
<p>Enter this 6-digit code in the app:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 0.3em;">{{ .Token }}</p>
<p>This code expires in 1 hour.</p>
```

3. Save the template. Supabase sends `{{ .Token }}` as a 6-digit OTP when using email confirmation.

Optional: remove or de-emphasize `{{ .ConfirmationURL }}` if you only want the code flow.

## 3. Redirect URLs (optional)

**Authentication** → **URL Configuration** → add your app URLs, e.g.:

- `http://localhost:5173/auth/verify`
- `https://your-domain.com/auth/verify`

## 4. Test

1. Register with a real inbox.
2. Check email for the 6-digit code.
3. Enter it on `/auth/verify`.

If no email arrives, check **Authentication** → **Logs** and your project email rate limits (custom SMTP recommended for production).
