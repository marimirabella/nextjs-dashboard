import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const authConfig = {
	// the user will be redirected to our custom login page, rather than the NextAuth.js default page.
	pages: {
		signIn: '/login',
	},
	// protect your routes. This will prevent users from accessing the dashboard pages unless they are logged in.
	callbacks: {
		// auth property contains the user's session, and the request property contains the incoming request.
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user

			const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

			if (isOnDashboard) {
				if (isLoggedIn) {
					return true
				}

				return false // Redirect unauthenticated users to login page
			} else if (isLoggedIn) {
				return Response.redirect(new URL('/dashboard', nextUrl))
			}

			return true
		},
	},
	// different login options such as Google or GitHub
	// here is only used Credential provider https://authjs.dev/getting-started/providers/credentials?framework=next-js
	providers: [Credentials({})], // Add providers with an empty array for now
} satisfies NextAuthConfig
