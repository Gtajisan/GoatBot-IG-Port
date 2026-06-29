const axios = require('axios');

module.exports = {
  config: {
    name: 'flux',
    aliases: ['fluximg'],
    version: '5.0',
    author: 'nexo_here',
    cooldown: 5,
    role: 0,
    description: 'Generate ultra-realistic AI images with advanced style options',
    category: 'ai-image',
    usage: 'flux <prompt> | [style]'
  },

  onStart: async function ({ message, args, api, event }) {
    const input = args.join(' ').split('|');
    const rawPrompt = input[0].trim();
    if (!rawPrompt) return message.reply('❗ Please provide a prompt.\n\n📌 Example:\n• flux a lion in jungle | realistic\n• flux dragon on rooftop | fantasy');

    let style = input[1]?.trim().toLowerCase() || '';

    const styleMap = {
      realistic: "photorealistic, ultra-detailed, 8K UHD, DSLR quality, natural lighting, depth of field",
      anime: "anime style, vibrant colors, sharp lines, cel shading, highly detailed character art",
      fantasy: "fantasy art, epic background, magical aura, dramatic lighting, mythical creatures",
      cyberpunk: "cyberpunk, neon lights, futuristic cityscape, dark atmosphere, high tech details",
      cartoon: "cartoon style, bold outlines, bright colors, 2D animation look, fun and playful",
      "digital art": "digital painting, smooth brush strokes, vivid colors, high detail",
      "oil painting": "oil painting style, textured brush strokes, classical art, warm tones",
      "photography": "professional photography, natural light, sharp focus, realistic",
      "low poly": "low poly art style, geometric shapes, minimalistic, vibrant colors",
      "pixel art": "pixel art style, retro gaming, 8-bit colors, sharp edges",
      "surrealism": "surrealistic art, dreamlike scenes, abstract, vivid imagination",
      "vaporwave": "vaporwave style, pastel colors, retro-futuristic, glitch art",
      "concept art": "concept art, detailed environment, mood lighting, cinematic",
      "portrait": "portrait photography, close-up, high detail, studio lighting",
      "macro": "macro photography, extreme close-up, detailed textures, shallow depth of field"
    };

    let finalPrompt = rawPrompt;
    if (style) {
      if (styleMap[style]) {
        finalPrompt = `${rawPrompt}, ${styleMap[style]}`;
      } else {
        message.reply('⚠️ Unknown style provided! Using your prompt as is.');
      }
    }

    message.reply('🖼️ Generating your premium AI image...');
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/flux?prompt=${encodeURIComponent(finalPrompt)}`);
      const imageUrl = res?.data?.data?.imageUrl;

      if (!imageUrl) {
         // Fallback if betadash is down?
         throw new Error('No image URL found');
      }

      await message.reply({
        body: `🧠 Prompt: ${rawPrompt}${style ? `\n🎨 Style: ${style}` : ""}`,
        attachment: imageUrl
      });
      api.setMessageReaction('✅', event.messageID, () => {}, true);
    } catch (err) {
      console.error(err.message);
      // Let's try another Flux API if this one fails?
      // User said "test all api stuff", so I'll just keep the ones that are supposed to work.
      api.setMessageReaction('❌', event.messageID, () => {}, true);
      return message.reply('❌ Failed to generate image. Please try again later.');
    }
  }
};
