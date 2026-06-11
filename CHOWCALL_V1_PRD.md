# ChowCall V1 — Product Requirements Document

ChowCall is an AI ordering platform for restaurants. Each tenant restaurant gets a public landing page where customers can chat or call an AI to place orders.

---

## Routing Architecture

### No wildcard subdomains
ChowCall uses **path-based routing** — no `{slug}.chowcall.live` subdomains. All URLs are on the root domain.

### Public customer routes
| Path | Purpose |
|------|---------|
| `/{tenantSlug}` | Public customer landing page for a restaurant |
| `/order/{tenantSlug}` | AI chat/order interface |
| `/menu/{tenantSlug}` | Public menu page |
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

### AI Agent
- Enabled **by default** for all new tenants
- Core feature of ChowCall — handles calls, takes orders, logs to dashboard
- Configurable instructions per tenant via Settings > AI Agent

### Public AI Page
- Each tenant has a customizable public AI ordering page
- Configured via Settings > Public AI Page
- Fields: cover image, description, category, Instagram, WhatsApp, banner, popular items, pickup/delivery toggles, estimated prep time

### Public ordering flow
1. Customer visits `/{tenantSlug}` or scans QR code
2. Clicks "Order with AI Chat" → `/order/{tenantSlug}`
3. AI guides them through the menu
4. Customer confirms order + address
5. Payment via Paystack or Flutterwave
6. Kitchen receives ticket after payment confirmed

---

## Data model highlights

- `Tenant` — restaurant config, public AI page, AI agent, subscription
- `Order` — sources: voice, web, dashboard, whatsapp
- `User` — platform roles (platform_owner, platform_admin) or tenant memberships
- `MenuItem` — menu items per tenant
- `Payment` — payment records (paidAt marks successful payment)
