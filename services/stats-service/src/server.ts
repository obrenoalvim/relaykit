import { createApp, SERVICE_NAME } from './app.js';

const PORT = Number(process.env.PORT ?? 4001);

createApp().listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
});
