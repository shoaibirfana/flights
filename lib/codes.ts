// Random booking-code generators for the trip summary PDF.
// These are DEMO codes for a university project — they are not real airline PNRs
// and will not verify with any airline.

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DIGITS = "0123456789";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const pick = (alphabet: string, len: number): string =>
  Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

/** 6-character reservation code: only A–Z and 0–9. e.g. "U3UI0X", "K7P2NZ" */
export const randomReservationCode = (): string => pick(ALPHANUM, 6);

/** 15-character airline reservation code:
 *  positions 1–13 digits, position 14 uppercase letter, position 15 digit.
 *  e.g. "1234567890123A4"
 */
export const randomAirlineReservationCode = (): string =>
  pick(DIGITS, 13) + pick(ALPHA, 1) + pick(DIGITS, 1);
