import { pricing, formatPrice } from "./site";

export const faqs: { q: string; a: string }[] = [
  {
    q: "What is a flight reservation for a visa?",
    a: "It's a real airline booking (not a paid ticket) with your name, flight details and a booking reference (PNR). It shows the embassy your planned travel without you buying a full ticket before your visa is approved.",
  },
  {
    q: "Is the reservation verifiable?",
    a: "Yes. Every reservation comes with an airline booking reference (PNR), which can be checked on the airline's website or through a travel agent while it's valid.",
  },
  {
    q: "How long does it take to receive my reservation?",
    a: "Most orders are processed and emailed within a few hours during business hours. If you need it urgently, message us on WhatsApp after placing your order.",
  },
  {
    q: "Which visas can I use it for?",
    a: "Our reservations are used for Schengen, UK, USA, Canada, Australia, Japan and many other visa applications. Always check your embassy's current requirements.",
  },
  {
    q: "How long is the reservation valid?",
    a: "Airlines release unpaid reservations after a set period, which varies by airline. We recommend ordering close to your visa appointment. If you need it to stay valid longer, contact us.",
  },
  {
    q: "Can I change my travel dates?",
    a: "Yes. Date changes are free. Contact us with your order ID and new dates and we'll send an updated reservation.",
  },
  {
    q: "How much does it cost?",
    a: `A flight reservation costs ${formatPrice(pricing.flight)} per traveler for one-way or round-trip. Multi-city costs an extra ${formatPrice(pricing.extraFlightLeg)} per traveler for each flight after the second. A hotel reservation costs ${formatPrice(pricing.hotel)} per traveler per city.`,
  },
  {
    q: "Can I use the reservation to board a flight?",
    a: "No. A reservation is not a paid ticket, so you can't board with it. Once your visa is approved, buy your actual ticket from any airline or agent.",
  },
  {
    q: "Can I avoid transit through countries that need a transit visa?",
    a: "Yes. When you book, choose the countries to exclude, such as the USA, UK or Canada, and we'll pick a route that avoids them.",
  },
  {
    q: "What if my visa is refused?",
    a: "Our service is providing the reservation document. Visa decisions are made only by the embassy, and we can't influence them. Please see our refund policy for details.",
  },
];
