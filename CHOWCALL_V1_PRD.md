# ChowCall V1 — Product Requirements Document

ChowCall is a web AI voice ordering platform for restaurants. Each tenant restaurant gets a public landing page where customers speak with an AI assistant in the browser to place paid orders.

---

## Routing Architecture

### No wildcard subdomains
ChowCall uses **path-based routing** — no `{slug}.chowcall.live` subdomains. All URLs are on the root domain.

### Public customer routes
| Path | Purpose |
|------|---------|
| `/{tenantSlug}` | Public customer landing page for a restaurant |
| `/order/{tenantSlug}` | Web AI voice ordering interface |
| `/menu/{tenantSlug}` | Public menu page |
| `/order/{tenantSlug}/status` | Secure order lookup by order ID plus token or phone |
| `/order/{tenantSlug}/status/{orderId}` | Order tracking |

### Tenant admin routes
| Path | Purpose |
|------|---------|
| `/{tenantSlug}/dashboard` | Tenant admin dashboard |
| `/{tenantSlug}/orders` | Order management |
| `/{tenantSlug}/settings/*` | Tenant settings |
| `/{tenantSlug}/onboarding` | Onboarding flow |

### Super admin routes
| Path | Purpose |
|------|---------|
| `/super-admin/dashboard` | Platform overview |
| `/super-admin/tenants` | Tenant management |
| `/super-admin/orders` | All orders |
| `/super-admin/settings/*` | Platform settings |

### Auth routes
| Path | Purpose |
|------|---------|
| `/auth/signin` | Sign in |
| `/auth/signup` | Register |
| `/auth/verify-otp` | OTP verification |

---

## Reserved route slugs
The following slugs are reserved and cannot be used as tenant slugs:

```
super-admin, auth, billing, order, menu, api, dashboard, admin,
pricing, demo, support, terms, privacy
```

The public `/{tenantSlug}` page guards against these and redirects to `/` if matched.

---

## Key features

### AI Voice Ordering
- Available to tenants with `subscriptionStatus: "active"`
- Core feature of ChowCall — listens in the browser, speaks responses, takes orders, and logs to dashboard
- Configurable greeting, voice, language, and instructions via Settings > AI Voice Ordering

### Public AI Page
- Each tenant has a customizable public AI ordering page
- Configured via Settings > Public AI Page
- Fields: cover image, description, category, Instagram, WhatsApp, banner, popular items, pickup/delivery toggles, estimated prep time

### Public ordering flow
1. Customer visits `/{tenantSlug}` or scans QR code
2. Clicks "Start AI Voice Order" → `/order/{tenantSlug}`
3. Backend AI ordering engine validates menu items, availability, fulfilment type, customer phone/name, and delivery address when needed
4. Pricing is recalculated server-side with the same delivery/service-fee engines used by all public orders
5. Customer confirms the draft, receives a Paystack payment link, and can track only their own order by token or phone verification
6. Kitchen receives ticket after verified payment unless pay-on-delivery is explicitly enabled

### Shared AI ordering engine
- One backend module owns voice session state, menu matching, sold-out handling, draft updates, pricing, payment readiness, and next-step decisions
- Browser speech transcripts use the same backend engine; phone routing remains future scaffold only
- AI can only add structured menu items that exist and are available
- Payment is blocked until the order has items, fulfilment type, customer phone/name, delivery address for delivery, and server-side pricing
- Azure OpenAI enhances natural-language interpretation, but server-side menu validation, pricing, and payment readiness remain the source of truth

---

## Data model highlights

- `Tenant` — restaurant config, public AI page, AI voice settings, subscription
- `Order` — sources: voice, web, dashboard, whatsapp; lifecycle includes `PAID` before kitchen ticket dispatch
- `User` — platform roles (platform_owner, platform_admin) or tenant memberships
- `MenuItem` — menu items per tenant
- `Payment` — payment records (paidAt marks successful payment)
- `ChatSession` / `VoiceSession` — tenant-scoped AI order draft state for browser voice transcripts and future phone support
- `KitchenTicket` — ticket send status, retry/resend metadata, and provider result
