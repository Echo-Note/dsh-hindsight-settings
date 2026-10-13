import { defineConfig } from "vitest/config";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  test: {
    env: {
      // Never let a test read or write the developer's real ~/.hindsight/coding-agent.json.
      // HINDSIGHT_CONFIG is read by the upstream plugin too, so this also keeps upstream-derived
      // expectations stable on a machine that has a token or a bank override configured.
      HINDSIGHT_CONFIG: join(tmpdir(), "dsh-hindsight-settings-test-absent.json"),
    },
  },
});
