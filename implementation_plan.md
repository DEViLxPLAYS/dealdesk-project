# Transform Deal Desk into a Multi-Tenant SaaS Platform

This plan outlines the architecture and steps required to transform the current CRM from a single-tenant application into a multi-tenant SaaS platform ("Deal Desk"). This will allow multiple companies (e.g., "Digital Next") to sign up, manage their own isolated data, and generate branded documents with a "Powered by Deal Desk" watermark.

## User Review Required

> [!CAUTION]
> This is a major architectural change. It requires modifying the database schema for *every* table, implementing Row Level Security (RLS) in Supabase, and fundamentally changing how users log in and fetch data. 
> 
> **Important Considerations:**
> 1. **Current Data:** If you have existing test data in Supabase, we will need to either assign it to a default test company or wipe it clean during the migration. Wiping it clean is usually safest for this kind of transition.
> 2. **Authentication Flow:** Users will *have* to use valid emails and passwords. The fake login will be replaced with real Supabase Auth.
> 3. **Supabase Access:** I will need to execute SQL commands via the Supabase client or you will need to run a provided SQL script in your Supabase SQL Editor to update the tables and security policies.

## Confirmed Decisions

> [!IMPORTANT]
> - ✅ **Data:** Wipe all existing data. Fresh start.
> - ✅ **Email Confirmation:** Required on signup via Supabase Auth (emails sent to registered Gmail).
> - ✅ **Payments:** Full **PayPal** payment gateway (subscription-based).
> - ✅ **Storage:** Supabase Storage for logo uploads and document logs.

## Open Questions

> [!IMPORTANT]
> **PayPal Plan:** For SaaS subscriptions, PayPal has a Subscriptions API (recurring billing). What billing cycle do you want? Options:
> - Monthly plan only
> - Monthly + Annual (discounted)
> What price per month do you want to charge companies? (e.g. $29/mo)
> 
> **Free Trial:** How many days of free trial before payment is required? (e.g. 14 days)
> 
> **Your Admin Access:** We need one special email (yours) that bypasses the subscription check and always has full access. What email should be the super-admin?

## Proposed Changes

---

### 1. Database Schema & RLS (Supabase)

To separate data, every table needs to know which "Company" owns it.

#### [NEW] `companies` Table
Create a new table to store tenant settings:
- `id` (UUID, Primary Key)
- `name` (String, e.g., "Digital Next")
- `email`, `phone`, `website`, `address` (Strings)
- `logo_url` (String)
- `subscription_status` (String: 'trial', 'active', 'inactive')
- `created_at` (Timestamp)

#### [MODIFY] Users & Auth Linking
- Create a `profiles` table linked to Supabase `auth.users`.
- `profiles` will have a `company_id` linking the user to their company.

#### [MODIFY] All Existing Tables (`clients`, `deals`, `invoices`, `contracts`, `projects`, etc.)
- Add a `company_id` column (UUID, Foreign Key to `companies`).
- Enable Row Level Security (RLS) on all tables.
- Add RLS Policies: `CREATE POLICY "Isolate data by company" ON clients FOR ALL USING (company_id = (select company_id from profiles where id = auth.uid()));` (This ensures companies can only ever see or edit their own data).

---

### 2. Authentication & Routing

#### [MODIFY] `src/pages/Auth.tsx`
- Remove the fake login simulation.
- Implement real `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.
- On Sign Up: Create an Auth user, insert a new row in `companies`, and insert a row in `profiles` linking them.

#### [MODIFY] `src/App.tsx` & `src/components/layout/AppLayout.tsx`
- Implement an authentication guard. Check `supabase.auth.getSession()` on load.
- If no session exists, strictly redirect to `/auth`.
- Provide a global React Context (e.g., `AuthContext` or `CompanyContext`) to hold the current user's company details so it's instantly available for the UI and PDF generation.

---

### 3. Customizable Settings

#### [MODIFY] `src/pages/Settings.tsx`
- Transform the hardcoded settings UI into a real form hooked up to the `companies` table.
- Allow uploading a logo (using Supabase Storage).
- Allow updating Name, Email, Phone, Website, and Address.
- Changes saved here will immediately update the global Context, reflecting across the app in real-time.

---

### 4. Dynamic Branding & Watermarks

#### [MODIFY] `src/lib/generateClientPDF.ts` & Invoice/Contract Generation
- Fetch the current company's profile from the Context/Supabase.
- Replace the hardcoded "Deal Desk" or "Digital Next" text at the top of exports with the *Company's* custom Name, Logo, and Address.
- Add a persistent watermark/footer at the very bottom of every generated document: `"Generated via Deal Desk CRM - www.dealdesk.com"`.

## Verification Plan

### Manual Verification
1. **Sign Up:** Register a new company "Alpha Corp". Verify a new Auth user, Profile, and Company are created in Supabase.
2. **Data Creation:** Create a client in "Alpha Corp". 
3. **Isolation:** Log out. Register a second company "Beta LLC". Log in. Verify that the "Alpha Corp" client is completely invisible.
4. **Settings:** Upload a logo and change the address for "Beta LLC".
5. **Branding:** Generate an invoice for "Beta LLC". Verify the PDF header shows the "Beta LLC" logo and address, and the footer shows the "Powered by Deal Desk" watermark.
