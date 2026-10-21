import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reuseOrCreateMidenNote } from "../src/lib/miden-note-retry.ts";

describe("Miden note retry", () => {
  const quote = {
    amount: "1000000",
    token: "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24_qr7qqq9wr6w",
    recipient: "mm1allocator",
  };

  it("reuses a note for an identical quote without minting another note", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      quote,
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xexisting-note" });
    assert.equal(createCalls, 0);
  });

  it("creates a note when the amount changes", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      { ...quote, amount: "2000000" },
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });

  it("creates a note when the token changes", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      { ...quote, token: "mm1different-token" },
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });

  it("creates a note when the recipient changes", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      { ...quote, recipient: "mm1different-recipient" },
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });

  it("creates a note when there is no reusable note", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(undefined, quote, async () => {
      createCalls += 1;
      return { success: true, noteId: "0xnew-note" };
    });

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });
});
