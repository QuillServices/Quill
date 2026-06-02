const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

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

// Upload-Post social publishing
app.post("/api/publish", async (req, res) => {
  try {
    const uploadKey = process.env.UPLOADPOST_KEY;
    const openaiKey = process.env.OPENAI_KEY;
    const { platforms, text: postText, theme, imageUrl: userImageUrl } = req.body;
    console.log("Publishing to:", platforms);
    console.log("Caption:", postText?.slice(0, 80));

    // Use user-provided image or generate one for Instagram
    const needsImage = platforms.some(p => p === "instagram");
    let imageUrl = userImageUrl || null;

    if (needsImage && !imageUrl) {
      console.log("Instagram detected — generating image...");
      try {
        const imgResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: `Professional marketing photo for Instagram. Theme: ${theme || postText?.slice(0, 100)}. Clean, eye-catching, suitable for a boutique brand.`,
            n: 1,
            size: "1024x1024",
            output_format: "png",
          }),
        });
        const imgData = await imgResponse.json();
        if (imgData.data?.[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${imgData.data[0].b64_json}`;
          console.log("Image generated successfully");
        }
      } catch(e) {
        console.log("Image generation failed:", e.message);
      }
    }

    // Split platforms — text platforms vs image platforms
    const textPlatforms = platforms.filter(p => !["instagram"].includes(p));
    const imagePlatforms = platforms.filter(p => ["instagram"].includes(p));

    const results = [];

    // Post to text platforms (Facebook, LinkedIn, X)
    if (textPlatforms.length > 0) {
      const params = new URLSearchParams();
      params.append("user", "quill_services");
      params.append("title", postText);
      textPlatforms.forEach(p => params.append("platform[]", p));

      const response = await fetch("https://api.upload-post.com/api/upload_text", {
        method: "POST",
        headers: { "Authorization": `Apikey ${uploadKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const raw = await response.text();
      console.log("Text post response:", raw.slice(0, 200));
      try { results.push(JSON.parse(raw)); } catch { results.push({ error: raw.slice(0, 100) }); }
    }

    // Post to Instagram with image
    if (imagePlatforms.length > 0 && imageUrl) {
      const FormData = require("form-data");
      const form = new FormData();
      form.append("user", "quill_services");
      form.append("description", postText);
      imagePlatforms.forEach(p => form.append("platform[]", p));

      // Convert base64 to buffer
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");
      form.append("file", imgBuffer, { filename: "post.png", contentType: "image/png" });

      const response = await fetch("https://api.upload-post.com/api/upload_photos", {
        method: "POST",
        headers: { "Authorization": `Apikey ${uploadKey}`, ...form.getHeaders() },
        body: form,
      });
      const raw = await response.text();
      console.log("Instagram post response:", raw.slice(0, 200));
      try { results.push(JSON.parse(raw)); } catch { results.push({ error: raw.slice(0, 100) }); }
    } else if (imagePlatforms.length > 0 && !imageUrl) {
      results.push({ error: "Instagram requires an image but generation failed" });
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

app.listen(3001, () => console.log("Server running on port 3001"));
// Note: run "npm install stripe" in the marketai folder
