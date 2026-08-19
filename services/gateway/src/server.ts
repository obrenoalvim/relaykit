import { createApp, SERVICE_NAME } from './app.js';
import { registryFromEnv } from './registry.js';

const PORT = Number(process.env.PORT ?? 4000);
const specialists = registryFromEnv();

createApp({ specialists }).listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] listening on port ${PORT}`);
  for (const spec of specialists) {
    console.log(`[${SERVICE_NAME}] -> ${spec.key} at ${spec.baseUrl}`);
  }
});
