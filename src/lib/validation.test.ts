import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  passwordChangeSchema,
  investigationPersonSchema,
  warrantCreateSchema,
  agentCreateSchema,
} from "./validation";

test("loginSchema rejects a bad e-mail", () => {
  assert.equal(loginSchema.safeParse({ email: "nope", password: "x" }).success, false);
  assert.equal(
    loginSchema.safeParse({ email: "a@fbi.gov", password: "x" }).success,
    true,
  );
});

test("passwordChangeSchema enforces a 10-char minimum", () => {
  assert.equal(
    passwordChangeSchema.safeParse({ currentPassword: "old", newPassword: "short" }).success,
    false,
  );
  assert.equal(
    passwordChangeSchema.safeParse({
      currentPassword: "old",
      newPassword: "a-long-enough-one",
    }).success,
    true,
  );
});

test("investigationPersonSchema needs an id or a real name", () => {
  assert.equal(investigationPersonSchema.safeParse({ role: "SUSPECT" }).success, false);
  assert.equal(
    investigationPersonSchema.safeParse({ personId: "abc", role: "SUSPECT" }).success,
    true,
  );
  assert.equal(
    investigationPersonSchema.safeParse({ fullName: "Jane Doe", role: "WITNESS" }).success,
    true,
  );
});

test("warrantCreateSchema defaults type and status", () => {
  const r = warrantCreateSchema.parse({ investigationId: "i1" });
  assert.equal(r.type, "ARREST");
  assert.equal(r.status, "REQUESTED");
});

test("agentCreateSchema treats an empty password as absent", () => {
  const r = agentCreateSchema.parse({
    name: "New Agent",
    email: "n@fbi.gov",
    title: "Special Agent",
    division: "SA",
    password: "",
  });
  assert.equal(r.password, undefined);
});
