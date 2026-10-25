type BodyStyle = 'sedan' | 'suv' | 'truck' | 'hatchback'

/**
 * The backend stores no vehicle images and admins can add any make and model, so photographs
 * could not be matched reliably. Each card shows a labelled side-profile drawing of the body
 * style instead, chosen from the category.
 */
function bodyStyleOf(category: string): BodyStyle {
  const value = category.toLowerCase()
  if (/suv|crossover|jeep|4x4/.test(value)) return 'suv'
  if (/truck|pickup|pick-up|\bute\b/.test(value)) return 'truck'
  if (/sedan|saloon|coupe/.test(value)) return 'sedan'
  return 'hatchback'
}

const LABELS: Record<BodyStyle, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  truck: 'Truck',
  hatchback: 'Car',
}

const BODY = '#2b2f36'
const GLASS = '#a9b0b9'

function Wheels({ front, rear, radius }: { front: number; rear: number; radius: number }) {
  return (
    <>
      {[front, rear].map((x) => (
        <g key={x}>
          <circle cx={x} cy={97} r={radius} fill="#171a20" />
          <circle cx={x} cy={97} r={radius * 0.47} fill="#c9ccd1" />
        </g>
      ))}
    </>
  )
}

const SHAPES: Record<BodyStyle, React.ReactNode> = {
  sedan: (
    <>
      <path d="M20 84C20 72 30 66 48 64L96 60C112 46 136 36 168 36C196 36 214 44 236 60L276 64C292 66 300 74 300 84V92C300 95 298 97 295 97H25C22 97 20 95 20 92Z" fill={BODY} />
      <path d="M108 60C122 48 140 42 164 42V60Z M170 42C192 42 208 48 224 60H170Z" fill={GLASS} />
      <Wheels front={82} rear={240} radius={17} />
    </>
  ),
  suv: (
    <>
      <path d="M40 88C40 74 46 64 60 62L70 60L84 26C86 21 90 18 96 18H206C214 18 220 21 224 27L246 58C266 61 284 68 284 82V92C284 95 282 97 279 97H45C42 97 40 95 40 92Z" fill={BODY} />
      <path d="M92 28C93 26 95 25 98 25H148V56H80Z M154 25H204C209 25 213 27 216 31L232 56H154Z" fill={GLASS} />
      <Wheels front={94} rear={234} radius={20} />
    </>
  ),
  truck: (
    <>
      <path d="M16 92V64H150V32C150 28 153 26 157 26H206C214 26 220 30 224 36L242 60L290 64C298 65 304 72 304 80V92C304 95 302 97 299 97H21C18 97 16 95 16 92Z" fill={BODY} />
      <path d="M162 34H206C210 34 213 36 215 39L228 60H162Z" fill={GLASS} />
      <Wheels front={76} rear={246} radius={19} />
    </>
  ),
  hatchback: (
    <>
      <path d="M30 86C30 74 38 66 54 64L92 60C110 42 130 32 160 32H214C226 32 234 38 240 48L254 64C270 66 290 72 290 86V92C290 95 288 97 285 97H35C32 97 30 95 30 92Z" fill={BODY} />
      <path d="M104 60C120 46 136 39 158 39V60Z M164 39H212C219 39 224 43 228 50L236 60H164Z" fill={GLASS} />
      <Wheels front={88} rear={236} radius={17} />
    </>
  ),
}

export function VehicleIllustration({ category }: { category: string }) {
  const style = bodyStyleOf(category)
  return (
    <div className="relative grid aspect-[16/10] place-items-center rounded-sm bg-sunken">
      <svg role="img" aria-label={`${LABELS[style]} illustration`} viewBox="0 0 320 120" className="w-[82%]">
        <ellipse cx="160" cy="112" rx="140" ry="5" fill="#e3e4e6" />
        {SHAPES[style]}
      </svg>
      <span className="absolute bottom-2 left-3 text-[11px] tracking-wide text-muted">Illustration</span>
    </div>
  )
}
