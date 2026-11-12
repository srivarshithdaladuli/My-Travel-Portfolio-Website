# Srivarshith Personal CRM

A private admin workspace for your personal portfolio. This first version is a static HTML/CSS/JavaScript app backed by Supabase Auth and Postgres. It does not change the public portfolio page.

## Included modules

- Overview dashboard
- Contacts and professional network
- Opportunities (jobs, freelance enquiries, collaborations)
- Projects
- Tasks and follow-ups
- Finance (INR)
- Private notes

## 1. Create the private Supabase project

1. Create a project at https://supabase.com.
2. In Authentication settings, turn off public sign-ups. Only invited users should be able to sign in.
3. Create your own user from the Supabase Dashboard Authentication > Users area.
4. Copy the Project URL and publishable key from Project Connect / API Keys.
5. Open `admin/config.js` and paste those two values into `supabaseUrl` and `supabasePublishableKey`. The publishable key is designed for browser use. Never paste a `service_role` or secret key into the website.

## 2. Create the database

1. Open Supabase SQL Editor.
2. Paste and run the contents of `admin/schema.sql`.
3. In Authentication > Users, copy the UUID for the user you created.
4. In SQL Editor, run the membership insert at the bottom of the schema file after replacing the example UUID with your real Auth user UUID.

The admin membership table and Row Level Security policies ensure that only the explicitly registered admin can read or change CRM records. Keep public sign-ups disabled.

## 3. Deploy

This repository currently contains a single root `index.html` portfolio page. The CRM lives in a separate `admin/` directory and does not replace that page.

- If the website is deployed from this repository root (for example GitHub Pages or a static host), deploy the updated repository and open `https://srivarshithdaladuli.in/admin/`.
- If you use a custom deployment workflow, make sure it publishes the `admin/` directory alongside the existing `index.html`.
- Add `https://srivarshithdaladuli.in` and your preview/development origin to Supabase Authentication > URL Configuration > Site URL / Redirect URLs as appropriate.

## Security notes

- The HTML page is not a security boundary. Database access is protected by Supabase Auth and Postgres RLS.
- Do not add a service-role key, database password, or other secret to `config.js`.
- Use a strong unique password and enable MFA on the Supabase account if available.
- For extra protection, use an access-control layer at your hosting provider in addition to Supabase.

## Current scope

The app currently provides authenticated create, read, update and delete operations for its six record types. It does not yet connect the public portfolio inquiry form, send emails, sync calendars, upload documents, or process payments. Those integrations can be added after the hosting and Supabase setup is confirmed.
