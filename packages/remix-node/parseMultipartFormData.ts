import type { Request as NodeRequest } from "./fetch";
import type { UploadHandler } from "./form-data";

export interface parseMultipartFormDataOptions {
  request: Request;
  uploadHandler: UploadHandler;
}

export function parseMultipartFormData({
  request,
  uploadHandler
}: parseMultipartFormDataOptions) {
  return (request as unknown as NodeRequest).formData({ uploadHandler });
}
