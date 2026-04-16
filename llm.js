import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 1. Updated tool using Open-Meteo
const getWeather = tool(
  async (input) => {
    try {
      console.log(`\n[System] Locating coordinates for ${input.city}...`);
      
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.city)}&count=1`);
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        return `Could not find a location matching "${input.city}".`;
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      console.log(`[System] Found ${name}, ${country}. Fetching weather...`);

      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`);
      const weatherData = await weatherResponse.json();
      
      const tempF = weatherData.current_weather.temperature;
      
      return `The current temperature in ${name}, ${country} is ${tempF}°F.`;
      
    } catch (error) {
      return `There was an error fetching the weather data for ${input.city}.`;
    }
  },
  {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get the weather for"),
    }),
  }
);

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

const modelWithTools = model.bindTools([getWeather]);

async function main() {
  const messages = [
    ["user", "What is the weather like in Shanghai today?"]
  ];

  console.log("Asking Gemini...");
  
  const aiMessage = await modelWithTools.invoke(messages);
  messages.push(aiMessage);

  if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
    for (const toolCall of aiMessage.tool_calls) {
      if (toolCall.name === "get_weather") {
        
        const toolMessage = await getWeather.invoke(toolCall);
        messages.push(toolMessage);
      }
    }

    const finalResponse = await modelWithTools.invoke(messages);
    console.log("\nFinal Answer:", finalResponse.content);
    
  } else {
    console.log("\nFinal Answer:", aiMessage.content);
  }
}

main();