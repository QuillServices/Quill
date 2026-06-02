const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Supabase admin client — initialized lazily so env vars are available
let supabase;
const getSupabase = () => {
  if (!supabase) {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
    console.log("Supabase URL:", url ? "found" : "MISSING");
    console.log("Supabase Key:", key ? "found" : "MISSING");
    supabase = createClient(url, key, {
      realtime: { transport: ws },
    });
  }
  return supabase;
};

// Claude API
app.post("/api/chat", async (req, res) => {
  try {
    const key = process.env.REACT_APP_ANTHROPIC_KEY;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image generation
app.post("/api/image", async (req, res) => {
  try {
    const key = process.env.OPENAI_KEY;
    const { prompt } = req.body;
    console.log("Generating image...");
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        output_format: "png",
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    const imageData = data.data[0];
    if (imageData.url) return res.json({ url: imageData.url });
    if (imageData.b64_json) return res.json({ url: `data:image/png;base64,${imageData.b64_json}` });
    res.status(500).json({ error: "No image in response" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check Upload-Post profiles
app.get("/api/profiles", async (req, res) => {
  try {
    const key = process.env.UPLOADPOST_KEY;
    const response = await fetch("https://api.upload-post.com/api/uploadposts/users", {
      headers: { "Authorization": `Apikey ${key}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload-Post social publishing
app.post("/api/publish", async (req, res) => {
  try {
    const uploadKey = process.env.UPLOADPOST_KEY;
    const openaiKey = process.env.OPENAI_KEY;
    const { platforms, text: postText, theme, imageUrl: userImageUrl } = req.body;
    console.log("Publishing to:", platforms);
    console.log("Caption:", postText?.slice(0, 80));

    const needsImage = platforms.some(p => p === "instagram");
    let imageUrl = userImageUrl || null;

    if (needsImage && !imageUrl) {
      console.log("Generating image for Instagram...");
      try {
        const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: `Professional marketing photo for Instagram. Theme: ${theme || postText?.slice(0, 100)}. Clean, eye-catching boutique brand style.`,
            n: 1,
            size: "1024x1024",
            output_format: "png",
          }),
        });
        const imgData = await imgResponse.json();
        if (imgData.data?.[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${imgData.data[0].b64_json}`;
          console.log("Image generated");
        }
      } catch(e) {
        console.log("Image generation failed:", e.message);
      }
    }

    const textPlatforms = platforms.filter(p => !["instagram"].includes(p));
    const imagePlatforms = platforms.filter(p => ["instagram"].includes(p));
    const results = [];

    // Text platforms (LinkedIn, Facebook, X)
    if (textPlatforms.length > 0) {
      const params = new URLSearchParams();
      params.append("user", "Quill");
      params.append("title", postText);
      textPlatforms.forEach(p => params.append("platform[]", p));

      const response = await fetch("https://api.upload-post.com/api/upload_text", {
        method: "POST",
        headers: {
          "Authorization": `Apikey ${uploadKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: "Quill",
          title: postText,
          platform: textPlatforms,
        }),
      });
      const raw = await response.text();
      console.log("Text post response:", raw.slice(0, 200));
      try { results.push(JSON.parse(raw)); } catch { results.push({ error: raw.slice(0, 100) }); }
    }

    // Instagram with image
    if (imagePlatforms.length > 0) {
      if (!imageUrl) {
        results.push({ error: "Instagram requires an image" });
      } else {
        // Build multipart form manually for maximum compatibility
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");

        const boundary = "----QuillBoundary" + Date.now();
        const CRLF = "\r\n";

        const buildPart = (name, value) => {
          return Buffer.from(
            `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`
          );
        };

        const filePart = Buffer.concat([
          Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="photos[]"; filename="post.jpg"${CRLF}Content-Type: image/jpeg${CRLF}${CRLF}`),
          imgBuffer,
          Buffer.from(CRLF),
        ]);

        const closingPart = Buffer.from(`--${boundary}--${CRLF}`);

        const body = Buffer.concat([
          buildPart("user", "Quill"),
          buildPart("title", postText),
          buildPart("platform[]", "instagram"),
          filePart,
          closingPart,
        ]);

        console.log("Sending to Upload-Post photos endpoint...");
        console.log("Body starts with:", body.slice(0, 200).toString());

        const response = await fetch("https://api.upload-post.com/api/upload_photos", {
          method: "POST",
          headers: {
            "Authorization": `Apikey ${uploadKey}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": body.length,
          },
          body: body,
        });
        const raw = await response.text();
        console.log("Instagram response status:", response.status);
        console.log("Instagram response:", raw.slice(0, 300));
        try { results.push(JSON.parse(raw)); } catch { results.push({ error: raw.slice(0, 100) }); }
      }
    }

    res.json({ status: "success", results });
  } catch (err) {
    console.log("Publish error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stripe - create checkout session
app.post("/api/stripe/checkout", async (req, res) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { userId, userEmail, plan } = req.body;

    const priceMap = {
      starter: process.env.STRIPE_STARTER_PRICE,
      growth:  process.env.STRIPE_GROWTH_PRICE,
      agency:  process.env.STRIPE_AGENCY_PRICE,
    };
    const priceId = priceMap[plan];
    if (!priceId) return res.status(400).json({ error: "Invalid plan: " + plan });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "http://localhost:3000?payment=success&plan=" + plan,
      cancel_url: "http://localhost:3000?payment=cancelled",
      metadata: { userId, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.log("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stripe - get subscription status
app.post("/api/stripe/status", async (req, res) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { userEmail } = req.body;
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (!customers.data.length) return res.json({ plan: "free", status: "none" });
    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
    if (!subscriptions.data.length) return res.json({ plan: "free", status: "none" });
    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0].price.id;
    const planMap = {
      [process.env.STRIPE_STARTER_PRICE]: "starter",
      [process.env.STRIPE_GROWTH_PRICE]: "growth",
      [process.env.STRIPE_AGENCY_PRICE]: "agency",
    };
    res.json({ plan: planMap[priceId] || "unknown", status: sub.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Upload-Post user profile
app.post("/api/social/create-profile", async (req, res) => {
  try {
    const key = process.env.UPLOADPOST_KEY;
    const { username } = req.body;
    const response = await fetch("https://api.upload-post.com/api/uploadposts/users", {
      method: "POST",
      headers: { "Authorization": `Apikey ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    console.log("Create profile:", JSON.stringify(data).slice(0, 200));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate social connect link for a user
app.post("/api/social/connect-link", async (req, res) => {
  try {
    const key = process.env.UPLOADPOST_KEY;
    const { username } = req.body;
    const response = await fetch("https://api.upload-post.com/api/uploadposts/users/generate-jwt", {
      method: "POST",
      headers: { "Authorization": `Apikey ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    console.log("Connect link:", JSON.stringify(data).slice(0, 200));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user connected social accounts
app.post("/api/social/accounts", async (req, res) => {
  try {
    const key = process.env.UPLOADPOST_KEY;
    const { username } = req.body;
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/users/${encodeURIComponent(username)}`, {
      headers: { "Authorization": `Apikey ${key}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AUTOMATED POSTING ENGINE ────────────────────────────────────────────────
async function generateCaption(theme, brandVoice) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: "Write one engaging social media post caption. Output ONLY the caption, nothing else.",
      messages: [{ role: "user", content: `Theme: "${theme}". Brand voice: ${brandVoice || "professional"}. Make it unique and engaging.` }],
    }),
  });
  const data = await res.json();
  return data?.content?.[0]?.text || "";
}

async function generateImage(theme) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `Professional marketing image for social media. Theme: ${theme}. Clean, eye-catching boutique brand style.`,
      n: 1,
      size: "1024x1024",
      output_format: "png",
    }),
  });
  const data = await res.json();
  if (data.data?.[0]?.b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`;
  }
  return null;
}

async function publishCampaignPost(campaign) {
  try {
    console.log(`Auto-posting campaign: ${campaign.name}`);
    
    const caption = await generateCaption(campaign.theme, campaign.brand_voice);
    if (!caption) throw new Error("Could not generate caption");

    const uploadKey = process.env.UPLOADPOST_KEY;
    const platforms = campaign.platforms || [];
    const username = "Quill"; // TODO: map to user's Upload-Post profile when multi-user is set up

    const textPlatforms = platforms.filter(p => p !== "instagram");
    const imagePlatforms = platforms.filter(p => p === "instagram");

    // Post to text platforms
    if (textPlatforms.length > 0) {
      const params = new URLSearchParams();
      params.append("user", username);
      params.append("title", caption);
      textPlatforms.forEach(p => params.append("platform[]", p));
      const textRes = await fetch("https://api.upload-post.com/api/upload_text", {
        method: "POST",
        headers: { "Authorization": `Apikey ${uploadKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const textData = await textRes.text();
      console.log("Text post result:", textData.slice(0, 200));
    }

    // Post to Instagram with image
    if (imagePlatforms.length > 0) {
      const imageUrl = await generateImage(campaign.theme);
      if (imageUrl) {
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");

        const boundary = "----QuillCron" + Date.now();
        const CRLF = "\r\n";
        const buildPart = (name, value) => Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`);
        const filePart = Buffer.concat([
          Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="photos[]"; filename="post.jpg"${CRLF}Content-Type: image/jpeg${CRLF}${CRLF}`),
          imgBuffer,
          Buffer.from(CRLF),
        ]);
        const body = Buffer.concat([
          buildPart("user", username),
          buildPart("title", caption),
          buildPart("platform[]", "instagram"),
          filePart,
          Buffer.from(`--${boundary}--${CRLF}`),
        ]);

        const photoRes = await fetch("https://api.upload-post.com/api/upload_photos", {
          method: "POST",
          headers: {
            "Authorization": `Apikey ${uploadKey}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": body.length,
          },
          body: body,
        });
        const photoData = await photoRes.text();
        console.log("Photo post result:", photoData.slice(0, 300));
      }
    }

    // Update campaign in Supabase
    await getSupabase().from("campaigns").update({
      posts_published: (campaign.posts_published || 0) + 1,
      last_post: caption.slice(0, 55) + "...",
    }).eq("id", campaign.id);

    console.log(`Successfully posted campaign: ${campaign.name}`);
  } catch (e) {
    console.log(`Failed to post campaign ${campaign.name}:`, e.message);
  }
}

function shouldPostNow(campaign) {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMin = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMin}`;
  const currentDay = now.getDay(); // 0=Sun, 1=Mon...5=Fri, 6=Sat
  const isWeekday = currentDay >= 1 && currentDay <= 5;

  if (!campaign.post_time || campaign.post_time !== currentTime) return false;
  if (campaign.status !== "active") return false;

  switch (campaign.frequency) {
    case "daily": return true;
    case "weekdays": return isWeekday;
    case "weekly": return currentDay === 1; // Every Monday
    case "twice_week": return currentDay === 1 || currentDay === 4; // Mon & Thu
    default: return false;
  }
}

// Run every minute — check for campaigns due to post
cron.schedule("* * * * *", async () => {
  try {
    const { data: campaigns, error } = await getSupabase()
      .from("campaigns")
      .select("*")
      .eq("status", "active");

    if (error || !campaigns?.length) return;

    for (const campaign of campaigns) {
      if (shouldPostNow(campaign)) {
        console.log(`Cron triggered post for: ${campaign.name}`);
        await publishCampaignPost(campaign);
      }
    }
  } catch (e) {
    console.log("Cron error:", e.message);
  }
});

console.log("Automated posting engine started — checking every minute");

// Get real analytics from Upload-Post
app.post("/api/analytics/stats", async (req, res) => {
  try {
    const key = process.env.UPLOADPOST_KEY;
    const { username } = req.body;
    const profile = username || "Quill";

    console.log("Fetching analytics for:", profile);

    // Get total impressions
    const impressionsRes = await fetch(`https://api.upload-post.com/api/uploadposts/total-impressions/${encodeURIComponent(profile)}`, {
      headers: { "Authorization": `Apikey ${key}` },
    });
    const impressionsData = await impressionsRes.json();
    console.log("Impressions data:", JSON.stringify(impressionsData).slice(0, 300));

    // Get upload history for post-level analytics
    const historyRes = await fetch(`https://api.upload-post.com/api/uploadposts/history?user=${encodeURIComponent(profile)}&limit=10`, {
      headers: { "Authorization": `Apikey ${key}` },
    });
    const historyData = await historyRes.json();
    console.log("History data:", JSON.stringify(historyData).slice(0, 300));

    res.json({
      impressions: impressionsData,
      history: historyData,
    });
  } catch (err) {
    console.log("Analytics error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
