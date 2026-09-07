/** Same printed address for every showroom. */
export const RECEIPT_COMPANY_ADDRESS = 'NO: 302/D, OLD KANDY ROAD,\nDALUGAMA, KELANIYA'

/** Head-office contact shown on every receipt. */
export const RECEIPT_HQ_PHONE = '0112 911 412'

/** HQ number plus the Phone field from the DMS Showroom record. */
export function formatReceiptContact(showroomPhone?: string | null): string {
  const local = (showroomPhone ?? '').trim()
  return local ? `${RECEIPT_HQ_PHONE} / ${local}` : RECEIPT_HQ_PHONE
}
