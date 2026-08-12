import { describe, expect, it } from "vitest";
import { citationMetadata, parseBibTeX } from "./bibtex";

const citation = `@INPROCEEDINGS{10621115,
  author={Wu, Jiasheng and Su, Shaojie and Wang, Xiong},
  booktitle={IEEE INFOCOM 2024 - IEEE Conference on Computer Communications},
  title={Accelerating Handover in Mobile Satellite Network},
  year={2024},
  keywords={Satellite constellations;Handover;6G},
  doi={10.1109/INFOCOM52122.2024.10621115}}`;

describe("BibTeX citation", () => {
  it("parses fields and derives literature metadata", () => {
    expect(parseBibTeX(citation).type).toBe("inproceedings");
    expect(citationMetadata(citation)).toEqual({
      title: "Accelerating Handover in Mobile Satellite Network",
      authors: "Wu, Jiasheng, Su, Shaojie, Wang, Xiong",
      origin: "IEEE INFOCOM 2024 - IEEE Conference on Computer Communications",
      category: "inproceedings",
      tags: ["Satellite constellations", "Handover", "6G"],
      publicationDate: "2024",
    });
  });

  it("uses unknown metadata for an empty citation", () => {
    expect(citationMetadata("").title).toBe("unknown");
    expect(citationMetadata("").tags).toEqual(["unknown"]);
  });

  it("rejects non-BibTeX citations", () => {
    expect(() => parseBibTeX("ordinary text")).toThrow();
  });
});
