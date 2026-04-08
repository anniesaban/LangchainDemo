import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

// console.log(process.env.GOOGLE_API_KEY);

async function main() {
  const res = await model.invoke("how are you?");
  console.log(res.content);
}

main();