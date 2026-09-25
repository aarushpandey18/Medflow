import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
app.listen(port, host, () => console.log(`Medical prescription API listening on http://${host}:${port}`));
