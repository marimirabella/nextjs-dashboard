'use client'

import { ChangeEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchProps {
	placeholder: string
}

export default function Search({ placeholder }: SearchProps) {
	const searchParams = useSearchParams()

	const pathname = usePathname()
	const { replace } = useRouter()

	const defaultInputValue = searchParams.get('query')?.toString()

	const handleSearch = useDebouncedCallback(
		({ target: { value: term } }: ChangeEvent<HTMLInputElement>) => {
			const params = new URLSearchParams(searchParams)

			params.set('page', '1');

			if (term) {
				params.set('query', term)
			} else {
				params.delete('query')
			}

			replace(`${pathname}?${params.toString()}`)
		},
		300,
	)

	return (
		<div className="relative flex flex-1 flex-shrink-0">
			<label htmlFor="search" className="sr-only">
				Search
			</label>
			<input
				className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
				placeholder={placeholder}
				defaultValue={defaultInputValue}
				onChange={handleSearch}
			/>
			<MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
		</div>
	)
}
