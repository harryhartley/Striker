import { useRouter } from 'next/router'
import { useState } from 'react'

export const CopyToClipboardButton = () => {
  const [buttonText, setButtonText] = useState('Copy Striker Link')
  const { asPath } = useRouter()

  return (
    <button
      className="w-full rounded bg-green-500 px-4
             py-2 text-4xl  text-white hover:bg-green-700"
      onClick={() => {
        setButtonText('Copied!')
        void navigator.clipboard.writeText(`https://strkr.hyhy.gg${asPath}`)
      }}
      onMouseLeave={() => setButtonText('Copy Striker Link')}
    >
      {buttonText}
    </button>
  )
}
