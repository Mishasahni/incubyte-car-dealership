const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

/** Prices are shown in rupees with two decimals (decision D-12). */
export function formatPrice(price: number): string {
  return inr.format(price)
}

export function stockLabel(quantity: number): string {
  if (quantity === 0) return 'Out of stock'
  if (quantity === 1) return '1 left'
  return `${quantity} in stock`
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
