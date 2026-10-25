import type { ReactNode } from 'react'

import masarAuto from '../../assets/masar-auto.jpg'

/**
 * The sign-in and registration frame: the supplied Masar Auto artwork on the left (on top on
 * phones) and the form on a warm white panel, inside one card on a soft neutral background.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9e9e6] sm:p-6 lg:p-10">
      <div className="grid w-full max-w-[1120px] overflow-hidden bg-[#fbfbf9] shadow-[0_30px_60px_-30px_rgba(23,26,32,0.35)] max-sm:min-h-screen sm:rounded-md md:min-h-[640px] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-cols-[minmax(0,11fr)_minmax(0,10fr)]">
        {/* At tablet width the panel is narrow and tall, so the whole artwork is shown on its own
            near-black instead of cropping its edges; wider and on phones it fills the panel. */}
        <div className="relative h-56 bg-[#070707] sm:h-72 md:h-auto">
          <img
            src={masarAuto}
            alt="Masar Auto"
            className="absolute inset-0 h-full w-full object-cover object-center md:object-contain lg:object-cover"
          />
        </div>
        <div className="flex items-center justify-center px-6 py-10 sm:px-10 md:py-14">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>
      </div>
    </div>
  )
}
