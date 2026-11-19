# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The developer who owns the repo (single user), testing webhook integrations. The page stays open beside the editor/terminal while an external system sends webhooks; they glance at it to see what arrived and what the server answered.

## Product Purpose

A disposable webhook receiver: exposes `POST /api/webhook/receive`, shows the latest deliveries (payload, headers, response returned) and lets the developer choose which response the endpoint returns, to test how the sender handles success and errors. Success: copy the URL in one click, see a delivery appear within seconds, flip the simulated response without friction.

## Operating Context

Runs locally (often behind ngrok) or deployed on Vercel. Polls history every 2 s. History is in memory, last 20 deliveries.

## Capabilities and Constraints

- Response modes: 200 OK, 404 (returned as HTTP 400), "Recipient is not a WhatsApp user", "Template not approved", "Phone number not opted in" (all 400, WhatsApp-style error bodies).
- Force an invalid entry, clear history, copy endpoint URL.
- Plain static HTML + vanilla JS in `public/`, no build step. Payloads come from untrusted senders.

## Brand Commitments

None. UI language: Spanish. Theme follows the OS (light/dark).

## Product Principles

1. The incoming deliveries are the content; everything else is chrome around them.
2. The current simulated response must be unmistakable at a glance.
3. Zero setup: open, copy URL, watch.
