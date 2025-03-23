import { GoogleGenerativeAI } from "@google/generative-ai";
import { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: 'Only POST requests are allowed' });
        return;
    }

    const { prompt } = req.body;

    if (!prompt) {
        res.status(400).json({ error: 'Prompt is required!' });
        return;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: {
                responseModalities: ['Text', 'Image']
            },
          });

          const response = await model.generateContent(prompt);

          let imageBuffer;

          // Loop through generated parts and handle text or image content
          for (const part of response.response.candidates[0].content.parts) {
            if (part.inlineData) {
                const imageData = part.inlineData.data;
                imageBuffer = Buffer.from(imageData, "base64");
            }
          }

          if (imageBuffer) {
            res.setHeader("Content-Type", "image/png");
            res.send(imageBuffer);
          } else {
            res.status(500).json({ error: "No image was generated. "});
          }
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: 'Failed to generate image.' });
    }
}