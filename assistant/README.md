# Srivarshith AI

Floating portfolio assistant powered by a Vercel serverless API and OpenAI Responses API.

## Files
- assistant/widget.js: browser widget and greeting
- assistant/widget.css: responsive styling
- api/chat.js: server-side AI endpoint. The API key is never sent to the browser.

## Integration
Add this immediately before the closing body tag in the portfolio root index.html:

    <script src="/assistant/widget.js" defer></script>

The repository root index.html is a very large single-line file and could not be safely retrieved through the GitHub file API. Do not replace the existing page. Add only this script tag using the GitHub web editor or a local clone.

## Configure Vercel
1. Open the portfolio project in Vercel.
2. Go to Settings → Environment Variables.
3. Add OPENAI_API_KEY with your OpenAI API key. Keep it server-side. Never put it in widget.js, HTML, or a public environment variable.
4. Optionally add OPENAI_MODEL with a model available to your API account. The default is gpt-4.1-mini.
5. Apply to Production and Preview if needed, save, then redeploy.

The API uses the OpenAI Responses API and sets store=false. It validates request size and same-origin requests. Add an edge rate limiter before promoting the endpoint to high-traffic production.

## Test
After deployment, open the portfolio and check the floating assistant at the bottom-right. Ask: "Tell me about Srivarshith's travel photography". If it reports that it is not configured, add the Vercel environment variable and redeploy.

## Privacy
Visitor messages are sent to your server endpoint and then to OpenAI to generate a response. Do not ask visitors to submit sensitive personal information. No API key is exposed in browser code.
