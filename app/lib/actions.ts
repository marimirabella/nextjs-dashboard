'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import postgres from 'postgres'
import { z } from 'zod'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const InvoiceFormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(['pending', 'paid']),
	date: z.string(),
})

const CreateInvoice = InvoiceFormSchema.omit({ id: true, date: true })

const UpdateInvoice = InvoiceFormSchema.omit({ id: true, date: true })

export const createInvoice = async (formData: FormData) => {
	try {
		const { customerId, amount, status } = CreateInvoice.parse({
			customerId: formData.get('customerId'),
			amount: formData.get('amount'),
			status: formData.get('status'),
		})

		const amountInCents = amount * 100
		const date = new Date().toISOString().split('T')[0]

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

export const updateInvoice = async (id: string, formData: FormData) => {
	try {
		const { customerId, amount, status } = UpdateInvoice.parse({
			customerId: formData.get('customerId'),
			amount: formData.get('amount'),
			status: formData.get('status'),
		})

		const amountInCents = amount * 100

		await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
	} catch (e) {
		console.error(e)
	}

	revalidatePath('/dashboard/invoices')
	redirect('/dashboard/invoices')
}

export const deleteInvoice = async (id: string) => {
	try {
		await sql`DELETE FROM invoices WHERE id = ${id}`
	} catch (e) {
		console.error(e)
	}

	revalidatePath('/dashboard/invoices')
}
