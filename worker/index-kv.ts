import worker from "./index";

type KvEnv = Env & { DELIVERABLES_KV: KVNamespace };
type LegacyEnv = Parameters<typeof worker.fetch>[1];

type R2LikePutOptions = {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

type StoredMetadata = {
  contentType?: string;
  customMetadata?: Record<string, string>;
};

async function toArrayBuffer(value: unknown): Promise<ArrayBuffer> {
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) {
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  }
  if (typeof value === "string") return new TextEncoder().encode(value).buffer as ArrayBuffer;
  if (value instanceof Blob) return value.arrayBuffer();
  if (value instanceof ReadableStream) return new Response(value).arrayBuffer();
  throw new TypeError("Unsupported deliverable body type");
}

class KvBackedDeliverables {
  constructor(private readonly kv: KVNamespace) {}

  async put(key: string, value: unknown, options?: R2LikePutOptions): Promise<void> {
    const bytes = await toArrayBuffer(value);
    const metadata: StoredMetadata = {
      contentType: options?.httpMetadata?.contentType ?? "application/octet-stream",
      customMetadata: options?.customMetadata ?? {},
    };
    await this.kv.put(key, bytes, { metadata });
  }

  async get(key: string): Promise<null | { body: ReadableStream<Uint8Array>; size: number; httpMetadata: { contentType?: string }; customMetadata: Record<string, string> }> {
    const result = await this.kv.getWithMetadata<StoredMetadata>(key, { type: "arrayBuffer" });
    if (!result.value) return null;
    const bytes = result.value as ArrayBuffer;
    const body = new Response(bytes).body;
    if (!body) return null;
    return {
      body,
      size: bytes.byteLength,
      httpMetadata: { contentType: result.metadata?.contentType },
      customMetadata: result.metadata?.customMetadata ?? {},
    };
  }
}

export default {
  async fetch(request: Request, env: KvEnv, context: ExecutionContext): Promise<Response> {
    const adaptedEnv = {
      ...env,
      DELIVERABLES: new KvBackedDeliverables(env.DELIVERABLES_KV),
    } as unknown as LegacyEnv;
    return worker.fetch(request, adaptedEnv, context);
  },
} satisfies ExportedHandler<KvEnv>;
