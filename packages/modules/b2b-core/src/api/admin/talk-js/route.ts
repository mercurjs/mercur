import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({
    app_id: process.env.VITE_TALK_JS_APP_ID,
  });
}
