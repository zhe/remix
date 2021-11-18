import { File } from "web-file-polyfill";
import Busboy from "busboy";
import type { Readable } from "stream";

export type UploadHandlerArgs = {
  name: string;
  stream: Readable;
  filename: string;
  encoding: string;
  mimetype: string;
};

export type UploadHandler = (
  args: UploadHandlerArgs
) => Promise<string | File | undefined>;

export async function parseFormData(
  contentType: string,
  stream: Readable,
  abortController?: AbortController,
  uploadHandler?: UploadHandler
) {
  let fields: Record<string, (File | string)[]> = {};
  let fileWorkQueue: Promise<void>[] = [];

  await new Promise<void>(async (resolve, reject) => {
    let busboy = new Busboy({
      highWaterMark: 2 * 1024 * 1024,
      headers: {
        "content-type": contentType
      }
    });

    let aborted = false;
    function abort(error?: Error) {
      if (aborted) return;
      aborted = true;

      stream.unpipe();
      stream.removeAllListeners();
      busboy.removeAllListeners();

      abortController?.abort();
      reject(error || new Error("failed to parse form data"));
    }

    busboy.on("field", (name, value) => {
      fields[name] = fields[name] || [];
      fields[name].push(value);
    });

    if (uploadHandler) {
      busboy.on("file", (name, filestream, filename, encoding, mimetype) => {
        if (filename) {
          fileWorkQueue.push(
            (async () => {
              try {
                let value = await uploadHandler({
                  name,
                  stream: filestream,
                  filename,
                  encoding,
                  mimetype
                });

                if (value) {
                  fields[name] = fields[name] || [];
                  fields[name].push(value);
                }
              } catch (error: any) {
                // Emit error to busboy to bail early if possible
                busboy.emit("error", error);
                // It's possible that the handler is doing stuff and fails
                // *after* busboy has finished. Rethrow the error for surfacing
                // in the Promise.all(fileWorkQueue) below.
                throw error;
              } finally {
                filestream.resume();
              }
            })()
          );
        } else {
          filestream.resume();
        }
      });
    }

    stream.on("error", abort);
    stream.on("aborted", abort);
    busboy.on("error", abort);
    busboy.on("finish", resolve);

    stream.pipe(busboy);
  });

  await Promise.all(fileWorkQueue);

  return new RemixFormData(fields);
}

export class RemixFormData implements FormData {
  private _fields: Record<string, (File | string)[]>;

  constructor(fields: Record<string, (File | string)[]> = {}) {
    this._fields = fields;
  }
  append(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string" && !(value instanceof Blob)) {
      throw new Error("formData.append can only accept a string or Blob");
    }

    this._fields[name] = this._fields[name] || [];
    if (typeof value === "string") {
      this._fields[name].push(value);
    } else {
      this._fields[name].push(new File([value], fileName || "unknown"));
    }
  }
  delete(name: string): void {
    delete this._fields[name];
  }
  get(name: string): FormDataEntryValue | null {
    let arr = this._fields[name];
    return (arr && arr[0]) || null;
  }
  getAll(name: string): FormDataEntryValue[] {
    let arr = this._fields[name];
    return arr || [];
  }
  has(name: string): boolean {
    return name in this._fields;
  }
  set(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string" && !(value instanceof Blob)) {
      throw new Error("formData.append can only accept a string or Blob");
    }
    if (typeof value === "string") {
      this._fields[name] = [value];
    } else {
      this._fields[name] = [new File([value], fileName || "unknown")];
    }
  }
  forEach(
    callbackfn: (
      value: FormDataEntryValue,
      key: string,
      parent: FormData
    ) => void,
    thisArg?: any
  ): void {
    Object.entries(this._fields).forEach(([name, values]) => {
      values.forEach(value => callbackfn(value, name, thisArg), thisArg);
    });
  }
  entries(): IterableIterator<[string, FormDataEntryValue]> {
    return Object.entries(this._fields)
      .reduce((entries, [name, values]) => {
        values.forEach(value => entries.push([name, value]));
        return entries;
      }, [] as [string, FormDataEntryValue][])
      .values();
  }
  keys(): IterableIterator<string> {
    return Object.keys(this._fields).values();
  }
  values(): IterableIterator<FormDataEntryValue> {
    return Object.entries(this._fields)
      .reduce((results, [name, values]) => {
        values.forEach(value => results.push(value));
        return results;
      }, [] as FormDataEntryValue[])
      .values();
  }
  *[Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    yield* this.entries();
  }
}
