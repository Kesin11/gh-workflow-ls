import { assertEquals } from "https://deno.land/std@0.221.0/assert/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.221.0/testing/bdd.ts";
import { Github, parseWorkflowRunUrl } from "./github.ts";

describe(Github.name, () => {
  describe("Set token at constructor", () => {
    beforeEach(() => {
      // reset env
      Deno.env.delete("GITHUB_TOKEN");
    });

    it("set options.token when options.token", () => {
      const github = new Github({ token: "token" });
      assertEquals(github.token, "token");
    });

    it("set GITHUB_TOKEN when undefined", () => {
      Deno.env.set("GITHUB_TOKEN", "foo");
      const github = new Github({ token: undefined });
      assertEquals(github.token, "foo");
    });

    it("set undefined when GITHUB_TOKEN env doesn't exists", () => {
      const github = new Github({ token: undefined });
      assertEquals(github.token, undefined);
    });
  });

  describe("Set baseUrl at constructor", () => {
    it("set http://api.github.com when origin is http://github.com", () => {
      const github = new Github({ origin: "https://github.com" });
      assertEquals(github.baseUrl, "https://api.github.com");
    });

    it("set http://{origin}/api/v3 when origin is some GHES host", () => {
      const github = new Github({ origin: "https://github.example.com" });
      assertEquals(github.baseUrl, "https://github.example.com/api/v3");
    });
  });
});

describe(parseWorkflowRunUrl.name, () => {
  it("should parse basic URL", () => {
    const url =
      "https://github.com/Kesin11/actions-timeline/actions/runs/1000000000/";
    const actual = parseWorkflowRunUrl(url);
    const expect = {
      origin: "https://github.com",
      owner: "Kesin11",
      repo: "actions-timeline",
      runId: 1000000000,
      runAttempt: undefined,
    };
    assertEquals(actual, expect);
  });

  it("should parse URL with run attempt", () => {
    const url =
      "https://github.com/Kesin11/actions-timeline/actions/runs/1000000000/attempts/2";
    const actual = parseWorkflowRunUrl(url);
    const expect = {
      origin: "https://github.com",
      owner: "Kesin11",
      repo: "actions-timeline",
      runId: 1000000000,
      runAttempt: 2,
    };
    assertEquals(actual, expect);
  });

  it("should parse URL with GHES host", () => {
    const url =
      "https://your_host.github.com/Kesin11/actions-timeline/actions/runs/1000000000/attempts/2";
    const actual = parseWorkflowRunUrl(url);
    const expect = {
      origin: "https://your_host.github.com",
      owner: "Kesin11",
      repo: "actions-timeline",
      runId: 1000000000,
      runAttempt: 2,
    };
    assertEquals(actual, expect);
  });
});
