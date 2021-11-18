import type { Readable } from "stream";
import type AbortController from "abort-controller";
import type { RequestInfo, RequestInit, Response } from "node-fetch";
import nodeFetch, { Request as NodeRequest } from "node-fetch";

import type { UploadHandler } from "./form-data";
import { parseFormData } from "./form-data";

export type { HeadersInit, RequestInfo, ResponseInit } from "node-fetch";
export { Headers, Response } from "node-fetch";

interface RemixRequestInit extends RequestInit {
  abortController?: AbortController;
}

class RemixRequest extends NodeRequest {
  private abortController?: AbortController;

  constructor(input: RequestInfo, init?: RemixRequestInit | undefined) {
    super(input, init);

    let anyInput = input as any;
    let anyInit = init as any;

    this.abortController =
      anyInput?.abortController || anyInit?.abortController;
  }

  async formData(uploadHandler?: UploadHandler): Promise<FormData> {
    let contentType = this.headers.get("Content-Type");
    if (contentType) {
      return await parseFormData(
        contentType,
        this.body as Readable,
        this.abortController,
        uploadHandler
      );
    }

    throw new Error("Invalid MIME type");
  }

  clone() {
    return new RemixRequest(super.clone());
  }
}

export { RemixRequest as Request, RemixRequestInit as RequestInit };

/**
 * A `fetch` function for node that matches the web Fetch API. Based on
 * `node-fetch`.
 *
 * @see https://github.com/node-fetch/node-fetch
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export function fetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  // Default to { compress: false } so responses can be proxied through more
  // easily in loaders. Otherwise the response stream encoding will not match
  // the Content-Encoding response header.
  return nodeFetch(input, { compress: false, ...init });
}
