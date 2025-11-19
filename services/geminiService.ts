import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CaptionSuggestion } from "../types";

// Initialize Gemini client
// The API key must be available in the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates meme captions based on the image using Gemini 3 Pro.
 */
export const generateMagicCaptions = async (imageBase64: string): Promise<CaptionSuggestion[]> => {
  try {
    // Clean the base64 string if it has a header
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image and generate 5 funny, viral-worthy meme captions. 
            Each caption must have a 'topText' (setup) and 'bottomText' (punchline). 
            Sometimes topText can be empty if the bottomText carries the whole joke.
            Provide a mix of styles (sarcastic, relatable, puns). 
            Return the result strictly as a JSON array.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topText: { type: Type.STRING, description: "The top text setup" },
              bottomText: { type: Type.STRING, description: "The bottom text punchline" },
              category: { 
                type: Type.STRING, 
                enum: ['sarcastic', 'wholesome', 'relatable', 'pun', 'dark'],
                description: "The style of humor" 
              }
            },
            required: ["topText", "bottomText", "category"]
          }
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) return [];
    
    return JSON.parse(textResponse) as CaptionSuggestion[];
  } catch (error) {
    console.error("Error generating captions:", error);
    throw error;
  }
};

/**
 * Edits an image using text prompts via Gemini 2.5 Flash Image (Nano Banana).
 */
export const editImageWithGenAI = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    // Clean the base64 string
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/png', // Gemini handles various image inputs, specifying generic or png usually works safely
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts && parts.length > 0) {
      const part = parts[0];
      if (part.inlineData && part.inlineData.data) {
         return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data received from Gemini");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Generates creative edit prompt suggestions based on the image content using Gemini 3 Pro.
 */
export const generateEditSuggestions = async (imageBase64: string): Promise<string[]> => {
  try {
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this image and suggest 4 funny, creative, or surreal text prompts to edit this image using Generative AI.
            The goal is to make it more meme-worthy or hilarious.
            Keep prompts short, actionable, and descriptive (e.g., "Put huge pixelated sunglasses on the cat", "Change the background to a fiery explosion", "Make the person look like a clown").
            Return the result strictly as a JSON array of strings.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) return [];
    
    return JSON.parse(textResponse) as string[];
  } catch (error) {
    console.error("Error generating edit suggestions:", error);
    // Return some generic fallbacks if API fails
    return ["Add laser eyes", "Make the background outer space", "Add pixelated sunglasses", "Make it deep fried"];
  }
};