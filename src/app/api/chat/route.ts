import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, lang: clientLang } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Fetch user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("age, gender, preferred_language, full_name")
      .eq("id", user.id)
      .single();

    const activeLang = clientLang || profile?.preferred_language || "en";

    const userProfile = {
      name: profile?.full_name || "Patient",
      age: profile?.age || null,
      gender: profile?.gender || null,
      preferred_language: activeLang,
    };


    // 2. Fetch reports
    const { data: reports } = await supabase
      .from("reports")
      .select("id, doc_type, title, report_date, doctor_name, facility, summary")
      .eq("user_id", user.id)
      .order("report_date", { ascending: false, nullsFirst: false });

    // 3. Fetch lab_values
    const { data: labValues } = await supabase
      .from("lab_values")
      .select("test_name, value, unit, ref_low, ref_high, ref_text, status, explanation, report_date")
      .eq("user_id", user.id)
      .order("report_date", { ascending: true, nullsFirst: false });

    // 4. Fetch medications
    const { data: medications } = await supabase
      .from("medications")
      .select("name, strength, dosage, frequency, duration, route, instructions, purpose, prescribed_date")
      .eq("user_id", user.id);

    // 5. Fetch conditions
    const { data: conditions } = await supabase
      .from("conditions")
      .select("name, status, notes")
      .eq("user_id", user.id);

    // 6. Fetch last 10 chat messages
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(10);

    const healthData = {
      documents: reports || [],
      tests: labValues || [],
      medications: medications || [],
      conditions: conditions || [],
    };

    const systemPrompt = `You are Arogya, a friendly personal health copilot. Answer using ONLY the user's own data below plus general health knowledge. Explain in simple language. Compare values across dates when asked about trends. Give lifestyle and diet suggestions, and tell the user which type of doctor to consult when relevant. Never diagnose or prescribe medicines or doses. When asked about medicines, only explain what they are generally used for and how they are usually taken as written in the prescription; never advise changing or stopping a medicine. If the question suggests an emergency (chest pain, difficulty breathing, severe bleeding, stroke signs, suicidal thoughts), tell them to call emergency services (112 in India) immediately. Reply in the user's preferred language (profile.preferred_language: en, te or hi) and keep medicine names and test names in English. Keep answers under 150 words unless asked for more. End serious topics with: 'Please consult your doctor for medical advice.' If data is missing, say so.

USER PROFILE: ${JSON.stringify(userProfile)}
HEALTH DATA (JSON): ${JSON.stringify(healthData)}`;

    // Prepare contents array for Gemini
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Append recent chat history
    if (recentMessages && recentMessages.length > 0) {
      recentMessages.forEach((msg) => {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      });
    }

    // Append new user message
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Call generateContentStream
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    // Save user message immediately to chat_messages
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: message.trim(),
    });

    // Create a streaming response
    let accumulatedText = "";
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            if (chunkText) {
              accumulatedText += chunkText;
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();

          // Save complete assistant reply to database
          if (accumulatedText.trim()) {
            await supabase.from("chat_messages").insert({
              user_id: user.id,
              role: "assistant",
              content: accumulatedText.trim(),
            });
          }
        } catch (streamErr) {
          console.error("Stream generation error:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const msg = err instanceof Error ? err.message : "Failed to process chat request";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Clear chat history
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to clear chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
