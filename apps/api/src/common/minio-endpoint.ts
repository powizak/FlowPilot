/**
 * Accepts either a bare hostname ("minio") or a URL ("http://minio:9000")
 * and returns the fields MinIO SDK's Client constructor expects.
 */
export interface MinioEndpoint {
  endPoint: string;
  port: number;
  useSSL: boolean;
}

export function parseMinioEndpoint(
  raw: string | undefined,
  fallbackPort = 9000,
): MinioEndpoint {
  const defaults: MinioEndpoint = {
    endPoint: 'minio',
    port: fallbackPort,
    useSSL: false,
  };
  if (!raw) return defaults;
  if (raw.includes('://')) {
    try {
      const u = new URL(raw);
      return {
        endPoint: u.hostname,
        port: u.port
          ? Number(u.port)
          : u.protocol === 'https:'
            ? 443
            : fallbackPort,
        useSSL: u.protocol === 'https:',
      };
    } catch {
      return defaults;
    }
  }
  return { endPoint: raw, port: fallbackPort, useSSL: false };
}
