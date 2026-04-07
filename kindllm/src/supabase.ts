// Supabase client and chat persistence (conversations + messages).
// ES5 compatible in this module — no optional chaining or nullish coalescing.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Message } from "./storage";
import { logger } from "./diagnostic-log";

var client: SupabaseClient | null = null;
var currentConversationId: string | null = null;

export function isSupabaseConfigured(): boolean {
  var url = import.meta.env.VITE_SUPABASE_URL;
  var key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  return getOrCreateClient();
}

function getOrCreateClient(): SupabaseClient | null {
  if (client) {
    return client;
  }
  var url = import.meta.env.VITE_SUPABASE_URL;
  var key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  client = createClient(String(url), String(key), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

export function getCurrentConversationId(): string | null {
  return currentConversationId;
}

export async function initSupabase(): Promise<{ ok: boolean; error?: string }> {
  var sb = getOrCreateClient();
  if (!sb) {
    return {
      ok: false,
      error: "Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).",
    };
  }
  var sessionRes = await sb.auth.getSession();
  if (sessionRes.error) {
    logger("supabase").warn("getSession failed", { message: sessionRes.error.message });
    return { ok: false, error: sessionRes.error.message };
  }
  if (sessionRes.data.session) {
    return { ok: true };
  }
  var anonRes = await sb.auth.signInAnonymously();
  if (anonRes.error) {
    logger("supabase").error("signInAnonymously failed", { message: anonRes.error.message });
    return { ok: false, error: anonRes.error.message };
  }
  logger("supabase").info("anonymous session established");
  return { ok: true };
}

export async function loadLatestConversation(): Promise<{
  conversationId: string | null;
  messages: Message[];
  error?: string;
}> {
  var sb = getOrCreateClient();
  if (!sb) {
    currentConversationId = null;
    return { conversationId: null, messages: [] };
  }
  var conv = await sb
    .from("conversations")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (conv.error) {
    logger("supabase").warn("load conversation list failed", { message: conv.error.message });
    return { conversationId: null, messages: [], error: conv.error.message };
  }
  if (!conv.data) {
    currentConversationId = null;
    return { conversationId: null, messages: [] };
  }
  var cid = conv.data.id as string;
  currentConversationId = cid;
  var rows = await sb
    .from("messages")
    .select("role,content,position")
    .eq("conversation_id", cid)
    .order("position", { ascending: true });
  if (rows.error) {
    logger("supabase").warn("load messages failed", { message: rows.error.message });
    return { conversationId: cid, messages: [], error: rows.error.message };
  }
  var list: Message[] = [];
  var data = rows.data;
  if (data) {
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var role = row.role;
      if (role !== "user" && role !== "assistant") {
        continue;
      }
      list.push({ role: role, content: String(row.content) });
    }
  }
  return { conversationId: cid, messages: list };
}

export async function createConversation(model: string): Promise<string | null> {
  var sb = getOrCreateClient();
  if (!sb) {
    return null;
  }
  var u = await sb.auth.getUser();
  if (u.error || !u.data.user) {
    logger("supabase").warn("createConversation: no user", {
      message: u.error ? u.error.message : "missing user",
    });
    return null;
  }
  var ins = await sb
    .from("conversations")
    .insert({ user_id: u.data.user.id, model: model })
    .select("id")
    .single();
  if (ins.error || !ins.data) {
    logger("supabase").warn("createConversation insert failed", {
      message: ins.error ? ins.error.message : "no data",
    });
    return null;
  }
  var id = ins.data.id as string;
  currentConversationId = id;
  return id;
}

export async function ensureConversationId(model: string): Promise<string | null> {
  if (currentConversationId) {
    return currentConversationId;
  }
  return createConversation(model);
}

export async function insertChatMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  position: number,
): Promise<{ error?: string }> {
  var sb = getOrCreateClient();
  if (!sb) {
    return { error: "no client" };
  }
  var msgIns = await sb.from("messages").insert({
    conversation_id: conversationId,
    role: role,
    content: content,
    position: position,
  });
  if (msgIns.error) {
    logger("supabase").warn("insertChatMessage failed", { message: msgIns.error.message });
    return { error: msgIns.error.message };
  }
  await sb
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return {};
}

export async function clearConversationMessages(conversationId: string): Promise<{ error?: string }> {
  var sb = getOrCreateClient();
  if (!sb) {
    return { error: "no client" };
  }
  var delRes = await sb.from("messages").delete().eq("conversation_id", conversationId);
  if (delRes.error) {
    logger("supabase").warn("clearConversationMessages failed", { message: delRes.error.message });
    return { error: delRes.error.message };
  }
  await sb
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return {};
}

export async function signOutRemote(): Promise<void> {
  var sb = getOrCreateClient();
  if (sb) {
    await sb.auth.signOut();
    logger("supabase").info("signed out");
  }
  currentConversationId = null;
}
