// Central site settings — edit this file to rebrand the website.
export const site = {
  name: "Viza Bunny",
  tagline: "Flight reservations for visa applications",
  email: "support@vizabunny.com",
  // Where new orders are emailed (ORDER_NOTIFY_EMAIL in Vercel overrides it)
  orderEmail: "shoaibirfana@gmail.com",
  currency: "USD",
  currencySymbol: "$",
  social: {
    facebook: "",
    instagram: "",
  },
};

export const pricing = {
  // Price per traveler for a one-way or round-trip flight reservation
  flight: 12,
  // Extra per traveler for every multi-city leg beyond the second
  extraFlightLeg: 0,
};

export type ServiceType = "flight";
export type TripType = "oneway" | "roundtrip" | "multicity";

export function calculatePrice(opts: {
  service: ServiceType;
  travelers: number;
  legs?: number;
}): number {
  const travelers = Math.max(1, Math.min(10, Math.floor(opts.travelers || 1)));
  const legs = Math.max(1, Math.min(6, Math.floor(opts.legs || 1)));
  const extraLegs = Math.max(0, legs - 2);
  return (pricing.flight + extraLegs * pricing.extraFlightLeg) * travelers;
}

export function formatPrice(amount: number): string {
  return `${site.currencySymbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}
