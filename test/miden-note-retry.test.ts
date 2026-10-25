import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reuseOrCreateMidenNote } from "../src/lib/miden-note-retry.ts";

describe("Miden note retry", () => {
  const quote = {
    amount: "1000000",
    token: "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24_qr7qqq9wr6w",
    recipient: "mm1allocator",
    sourceAccount: "0xpublic-source",
    mandateBinding: "1:2:3",
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

  it("creates a note when the mandate binding changes", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      { ...quote, mandateBinding: "1:2:4" },
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });
  it("creates a note when the source account changes", async () => {
    let createCalls = 0;

    const result = await reuseOrCreateMidenNote(
      { noteId: "0xexisting-note", quote },
      { ...quote, sourceAccount: "0xdifferent-public-source" },
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xnew-note" });
    assert.equal(createCalls, 1);
  });

  it("resumes confirmation of a submitted note instead of minting again", async () => {
    let createCalls = 0;
    let resumeCalls = 0;
    const submitted = {
      noteId: "0xsubmitted-note",
      transactionId: "0xsubmitted-transaction",
      confirmed: false,
      quote,
    };

    const result = await reuseOrCreateMidenNote(
      submitted,
      quote,
      async () => {
        createCalls += 1;
        return { success: true, noteId: "0xnew-note" };
      },
      async (pending) => {
        resumeCalls += 1;
        assert.equal(pending.transactionId, "0xsubmitted-transaction");
        return { success: true, noteId: pending.noteId };
      },
    );

    assert.deepEqual(result, { success: true, noteId: "0xsubmitted-note" });
    assert.equal(createCalls, 0);
    assert.equal(resumeCalls, 1);
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
