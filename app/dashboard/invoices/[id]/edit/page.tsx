import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Form from '../../../../ui/invoices/edit-form'
import Breadcrumbs from '../../../../ui/invoices/breadcrumbs'
import { fetchCustomers, fetchInvoiceById } from '../../../../lib/data'

export const metadata: Metadata = {
	title: 'Edit invoice',
}

interface EditInvoicePageParams {
	id: string
}

interface EditInvoicePageProps {
	params: Promise<EditInvoicePageParams>
}

export default async function EditInvoicePage({
	params,
}: EditInvoicePageProps) {
	const { id } = await params

	const breadcrumbs = [
		{ label: 'Invoices', href: '/dashboard/invoices' },
		{
			label: 'Edit Invoice',
			href: `/dashboard/invoices/${id}/edit`,
			active: true,
		},
	]

	const [invoice, customers] = await Promise.all([
		fetchInvoiceById(id),
		fetchCustomers(),
	])

	if (!invoice) {
		notFound()
	}

	return (
		<main>
			<Breadcrumbs breadcrumbs={breadcrumbs} />
			<Form invoice={invoice} customers={customers} />
		</main>
	)
}
