import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    // The API routes spend the Labs key. Must match the checkLevel in
    // `lib/api.ts` or verification fails.
    {
      path: "/api/*",
      method: "*",
      advancedOptions: { checkLevel: "basic" },
    },
  ],
});
