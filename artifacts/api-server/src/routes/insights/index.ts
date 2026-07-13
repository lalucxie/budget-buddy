import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env["GEMINI_API_KEY"] ?? "");

const supabaseAdmin = createClient(
  process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "",
  process.env["SUPABASE_SERVICE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? process.env["VITE_SUPABASE_ANON_KEY"] ?? ""
);

type InsightCard = {
  emoji: string;
  title: string;
  text: string;
};

function parseInsights(raw: string): InsightCard[] {
  const cards: InsightCard[] = [];
  const blocks = raw.split(/\n(?=\d+\.)/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const emojiMatch = block.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
    const titleMatch = block.match(/\*\*(.+?)\*\*/);
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    const emoji = emojiMatch ? emojiMatch[0] : "✨";
    const title = titleMatch ? titleMatch[1] : lines[0]?.replace(/^\d+\.\s*/, "").replace(/^[^\w]+/, "").slice(0, 60) ?? "Insight";
    const text = lines
      .slice(1)
      .join(" ")
      .replace(/\*\*/g, "")
      .trim();

    if (text.length > 0) {
      cards.push({ emoji, title, text });
    }
  }

  if (cards.length < 3) {
    const fallback = raw
      .split(/\n\n+/)
      .filter(p => p.trim().length > 30)
      .slice(0, 3)
      .map((p, i) => ({
        emoji: ["💡", "📊", "🌱"][i] ?? "✨",
        title: ["Spending Overview", "Budget Tip", "Action Step"][i] ?? "Insight",
        text: p.replace(/\*\*/g, "").trim(),
      }));
    return fallback.length > 0 ? fallback : cards;
  }

  return cards.slice(0, 3);
}

router.post("/insights/generate", async (req, res) => {
  const { user_id } = req.body as { user_id?: string };

  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: expenses, error } = await supabaseAdmin
      .from("expenses")
      .select("amount, category, mood, note, date, created_at")
      .eq("user_id", user_id)
      .gte("created_at", startOfMonth);

    if (error) {
      req.log.error({ error }, "Failed to fetch expenses");
      res.status(500).json({ error: "Failed to fetch expenses" });
      return;
    }

    const rows = expenses ?? [];

    if (rows.length === 0) {
      res.json({
        insights: [
          { emoji: "🌱", title: "Fresh Start!", text: "No expenses recorded this month yet. Start tracking your spending to get personalised AI insights!" },
          { emoji: "💡", title: "Pro Tip", text: "Add your daily expenses with a mood tag — Budget Buddy uses that data to spot patterns and give you smarter advice." },
          { emoji: "✨", title: "You Got This!", text: "Even small consistent tracking habits lead to big financial wins. Your future self will thank you 💕" },
        ],
        cached: false,
      });
      return;
    }

    // Build summary
    const totalSpent = rows.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    const byMood: Record<string, number> = {};
    rows.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      if (e.mood) byMood[e.mood] = (byMood[e.mood] ?? 0) + e.amount;
    });

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    const topMood = Object.entries(byMood).sort((a, b) => b[1] - a[1])[0];
    const biggest = rows.reduce((max, e) => e.amount > max.amount ? e : max, rows[0]!);
    const dailyAvg = totalSpent / now.getDate();

    const summary = `
Monthly spending summary (${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}):
- Total spent: ₹${Math.round(totalSpent)}
- Number of transactions: ${rows.length}
- Daily average spend: ₹${Math.round(dailyAvg)}
- Top spending category: ${topCategory?.[0] ?? "N/A"} (₹${Math.round(topCategory?.[1] ?? 0)})
- Category breakdown: ${Object.entries(byCategory).map(([k, v]) => `${k}: ₹${Math.round(v)}`).join(", ")}
- Top mood while spending: ${topMood?.[0] ?? "N/A"} (₹${Math.round(topMood?.[1] ?? 0)})
- Mood breakdown: ${Object.entries(byMood).map(([k, v]) => `${k}: ₹${Math.round(v)}`).join(", ") || "no mood data"}
- Biggest single purchase: ₹${Math.round(biggest.amount)} on ${biggest.category}
`.trim();

    const prompt = `You are Budget Buddy's AI coach — a supportive, Gen-Z friendly financial assistant for college students in India. You speak in a warm, casual tone with occasional emojis. 

Analyze this student's spending data and give exactly 3 specific, actionable insights. 

Format each insight EXACTLY like this (including the numbering and bold title):
1. **[Short punchy title]**
[2-3 sentences of insight text. Be specific, encouraging, not judgmental.]

2. **[Short punchy title]**
[2-3 sentences of insight text.]

3. **[Short punchy title]**
[2-3 sentences of insight text.]

End with one short motivational line on its own line.

Here is the spending data:
${summary}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const insights = parseInsights(rawText);

    res.json({ insights, cached: false, rawText });
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
