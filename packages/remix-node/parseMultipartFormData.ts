import type { Request as NodeRequest } from "./fetch";
import type { UploadHandler } from "./form-data";

export function parseMultipartFormData(
  request: Request,
  uploadHandler: UploadHandler
) {
  return (request as unknown as NodeRequest).formData(uploadHandler);
}
