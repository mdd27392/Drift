// script.js
// Farcaster Mini App SDK integration and environment awareness

import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

window.addEventListener("load", async () => {
  const envLabel = document.getElementById("env-label");

  try {
    const isMini = await sdk.isInMiniApp();

    if (envLabel) {
      envLabel.textContent = isMini
        ? "Running in Base App"
        : "Open in Base to feel your drift";
    }

    await sdk.actions.ready();
  } catch (error) {
    console.error("Failed to initialize Farcaster Mini App SDK:", error);
    if (envLabel) {
      envLabel.textContent = "Viewing in browser";
    }
  }
});
