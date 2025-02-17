'use server'

import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import postgres from 'postgres'
import { z } from 'zod'

import { signIn } from '../../auth'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const CreateInvoiceFormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: 'Please select a customer.',
	}),
	amount: z.coerce
		.number()
		.gt(0, { message: 'Please enter an amount greater than $0.' }),
	status: z.enum(['pending', 'paid'], {
		invalid_type_error: 'Please select an invoice status.',
	}),
	date: z.string(),
})

const CreateInvoice = CreateInvoiceFormSchema.omit({ id: true, date: true })

const UpdateInvoiceFormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce
		.number()
		.gt(0, { message: 'Please enter an amount greater than $0.' }),
	status: z.enum(['pending', 'paid']),
	date: z.string(),
})

const UpdateInvoice = UpdateInvoiceFormSchema.omit({
	id: true,
	date: true,
})

export type InvoiceState = {
	errors?: {
		customerId?: string[]
		amount?: string[]
		status?: string[]
	}
	message?: string | null
}

export const createInvoice = async (
	prevState: InvoiceState,
	formData: FormData,
) => {
	// Validate form fields using Zod
	// safeParse() will return an object containing either a success or error field.
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	})

	// If form validation fails, return errors early. Otherwise, continue.
	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to Create Invoice.',
		}
	}

	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data

	const amountInCents = amount * 100
	const date = new Date().toISOString().split('T')[0]

	// Insert data into the database
	try {
		await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
	} catch (e) {
		console.error(e)
	}

	// Once the database has been updated, the /dashboard/invoices path will be revalidated, and fresh data will be fetched from the server.
	revalidatePath('/dashboard/invoices')

	// redirect is being called outside of the try/catch block. This is because redirect works by throwing an error, which would be caught by the catch block. To avoid this, you can call redirect after try/catch. redirect would only be reachable if try is successful.
	redirect('/dashboard/invoices')
}

export const updateInvoice = async (
	id: string,
	prevState: InvoiceState,
	formData: FormData,
) => {
	const validatedFields = UpdateInvoice.safeParse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	})

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing Fields. Failed to Update Invoice.',
		}
	}

	// Prepare data for insertion into the database
	const { customerId, amount, status } = validatedFields.data

	const amountInCents = amount * 100

	try {
		await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
	} catch (e) {
		return {
			message: `Database Error: Failed to Create Invoice. Error message: ${
				(e as Error).message
			}`,
		}
	}

	revalidatePath('/dashboard/invoices')
	redirect('/dashboard/invoices')
}

export const deleteInvoice = async (id: string) => {
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`
	} catch (e) {
		return {
			message: `Database Error: Failed to Update Invoice. Error message: ${
				(e as Error).message
			}`,
		}
	}

	revalidatePath('/dashboard/invoices')
}

export async function authenticate(
	prevState: string | undefined,
	formData: FormData,
) {
	try {
		await signIn('credentials', formData)
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case 'CredentialsSignin':
					return 'Invalid credentials.'
				default:
					return 'Something went wrong.'
			}
		}

		throw error
	}
}
