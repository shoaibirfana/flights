# Visa Flight Reservation Website

A Next.js website for selling flight reservations for visa applications. Customers search **live**
flights, select one and enter the traveler names and email. Orders are emailed to the team, which
sends the booking reference (or Duffel creates a hold with a PNR automatically, when enabled).

## Features
- Flight search: one-way, round trip, multi-city, cabin class, up to 9 travelers, exclude transit countries
- Live airport/city autocomplete
- Order form → email to the business + confirmation email to the customer
- Pages: Home, About, FAQ, Contact, Terms, Privacy, Refund Policy
- Online payment with Stripe Checkout (card, Apple Pay, Google Pay) when `STRIPE_SECRET_KEY` is set

## Live data providers
| Data | Provider | Env var |
|------|----------|---------|
| Flights, airport list | [LiteAPI / Nuitee Connect](https://liteapi.travel) | `LITEAPI_KEY` |
| Flight holds with a real PNR (optional) | [Duffel](https://duffel.com) | `DUFFEL_ACCESS_TOKEN` |

Airport city names come from the [OpenFlights](https://openflights.org/data) airport database
(ODbL) and [OurAirports](https://ourairports.com/data) (public domain), stored in
`lib/data/airport-cities.json`.

The sandbox key returns test data; the production key returns live data (flights in production must be
enabled by LiteAPI on request). Without a key the site shows a "not configured" message instead of results. It never shows fake data.

## Flight hold bookings (Duffel)
Set `DUFFEL_ACCESS_TOKEN` (`duffel_test_...` first; test mode is free). Flight search then shows only
flights the airline allows to be held, the order form asks for date of birth and gender, and each order
creates a Duffel **hold order**: a real airline booking with a booking reference (PNR), not paid, that
expires at the airline's deadline. The PNR is shown on the success page and in the emails. With Stripe
on, the hold is created only after payment.

## Payments (Stripe)
1. Add `STRIPE_SECRET_KEY` (`sk_test_...` for testing, `sk_live_...` for real payments).
2. In Stripe → Developers → Webhooks, add the endpoint `https://YOUR-SITE/api/stripe-webhook` with the events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`, then add its signing
   secret as `STRIPE_WEBHOOK_SECRET`.

Order emails are sent only after Stripe confirms the payment. Without the webhook, the success page sends
them instead.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in API keys and SMTP settings
npm run dev                  # http://localhost:3000
```

## Customising
- Brand name, contact details, WhatsApp number and prices: `lib/site.ts`
- FAQ text: `lib/faqs.ts`
- Colors: `app/globals.css` (`@theme` block)

## Deploy
Deploys as-is to Vercel (free tier): import the repo and add the environment variables from `.env.example`.
