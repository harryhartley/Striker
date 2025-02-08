import Link from 'next/link'

export const Footer = () => {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-4 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>hyhy</div>
          <div>{` • `}</div>
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{` • `}</div>
          <Link href="/">Striker</Link>
        </div>
      </div>
    </footer>
  )
}
