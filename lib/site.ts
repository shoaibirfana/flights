// Central site settings — edit this file to rebrand the website.
export const site = {
  name: "FlyVisaDocs",
  tagline: "Flight & hotel reservations for visa applications",
  email: "support@example.com",
  // International format, digits only (used for WhatsApp links)
  whatsapp: "923000000000",
  phoneDisplay: "+92 300 0000000",
  address: "Your office address, City, Country",
  currency: "USD",
  currencySymbol: "$",
  social: {
    facebook: "",
    instagram: "",
  },
};

export const pricing = {
  // Price per traveler for a one-way or round-trip flight reservation
  flight: 15,
  // Extra per traveler for every multi-city leg beyond the second
  extraFlightLeg: 5,
  // Price per traveler for one hotel (one city)
  hotel: 15,
};

export type ServiceType = "flight" | "hotel";
export type TripType = "oneway" | "roundtrip" | "multicity";

export function calculatePrice(opts: {
  service: ServiceType;
  travelers: number;
  legs?: number;
  cities?: number;
}): number {
  const travelers = Math.max(1, Math.min(10, Math.floor(opts.travelers || 1)));
  if (opts.service === "hotel") {
    const cities = Math.max(1, Math.min(10, Math.floor(opts.cities || 1)));
    return pricing.hotel * cities * travelers;
  }
  const legs = Math.max(1, Math.min(6, Math.floor(opts.legs || 1)));
  const extraLegs = Math.max(0, legs - 2);
  return (pricing.flight + extraLegs * pricing.extraFlightLeg) * travelers;
}

export function formatPrice(amount: number): string {
  return `${site.currencySymbol}${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function whatsappLink(text?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
