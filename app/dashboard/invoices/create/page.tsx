import { fetchCustomers } from '../../../lib/data'
import Form from '../../../ui/invoices/create-form'
import Breadcrumbs from '../../../ui/invoices/breadcrumbs'

const breadcrumbs = [
	{ label: 'Invoices', href: '/dashboard/invoices' },
	{
		label: 'Create Invoice',
		href: '/dashboard/invoices/create',
		active: true,
	},
]

export default async function CreateInvoicePage() {
	const customers = await fetchCustomers()

	return (
		<main>
			<Breadcrumbs breadcrumbs={breadcrumbs} />
			<Form customers={customers} />
		</main>
	)
}
