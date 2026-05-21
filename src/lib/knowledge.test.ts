import { describe, expect, it } from "vitest";
import { rankKnowledgeSources } from "./knowledge";

describe("knowledge retrieval", () => {
  it("ranks matching property knowledge above unrelated documents", () => {
    const sources = rankKnowledgeSources("Where can I park?", [
      { body: "Paid parking is available at Kotva Garage.", id: "1", title: "Parking" },
      { body: "The Wi-Fi network is HostOps.", id: "2", title: "Wi-Fi" },
    ]);

    expect(sources[0]?.title).toBe("Parking");
  });

  it("matches common guest-language synonyms for parking", () => {
    const sources = rankKnowledgeSources("Donde puedo aparcar?", [
      { body: "Paid parking is available at Kotva Garage.", id: "1", title: "Parking" },
      { body: "The Wi-Fi network is HostOps.", id: "2", title: "Wi-Fi" },
    ]);

    expect(sources[0]?.title).toBe("Parking");
  });
});
