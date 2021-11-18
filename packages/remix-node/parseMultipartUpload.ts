import type { Request as NodeRequest } from "./fetch";
import type { UploadHandler } from "./form-data";

export interface ParseMultipartUploadOptions {
  request: Request;
  uploadHandler: UploadHandler;
}

export function parseMultipartUpload({
  request,
  uploadHandler
}: ParseMultipartUploadOptions) {
  return (request as unknown as NodeRequest).formData({ uploadHandler });
}
