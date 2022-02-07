import {
  createAppFixture,
  createFixture,
  js,
  selectHtml
} from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

describe("loader", () => {
  let fixture: Fixture;
  let app: AppFixture;

  let _consoleError: any;
  const ROOT_DATA = "ROOT_DATA";
  const INDEX_DATA = "INDEX_DATA";

  beforeAll(async () => {
    _consoleError = console.error;
    console.error = () => {};
    fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet } from "remix";

          export function loader() {
            return "${ROOT_DATA}"
          }

          export default function Index() {
            return <html><body><Outlet/></body></html>
          }
        `,

        "app/routes/index.jsx": js`
          import { json } from "remix";

          export function loader() {
            return "${INDEX_DATA}"
          }

          export default function Index() {
            return <div/>
          }
        `,

        "app/routes/no-return.jsx": js`
          export function loader() {
            // Do nothing.
          }

          export default function NoReturn() {
            return (
              <div/>
            )
          }
        `
      }
    });

    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    console.error = _consoleError;
    await app.close();
  });

  it("returns responses for a specific route", async () => {
    let [root, index] = await Promise.all([
      fixture.requestData("/", "root"),
      fixture.requestData("/", "routes/index")
    ]);

    expect(root.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8"
    );

    expect(await root.json()).toBe(ROOT_DATA);
    expect(await index.json()).toBe(INDEX_DATA);
  });

  it("renders the RemixRootDefaultErrorBoundary", async () => {
    let response = await fixture.requestDocument("/no-return");
    expect(response.status).toBe(500);
    expect(selectHtml(await response.text(), "#error-message")).toContain(
      `Error: You defined a loader for route "routes/no-return" but didn't return anything from your \`loader\` function. Please return a value or \`null\`.`
    );

    await app.goto("/no-return");
    let appHtml = selectHtml(await app.getHtml(), "#error-message");
    expect(appHtml).toContain(
      `Error: You defined a loader for route "routes/no-return" but didn't return anything from your \`loader\` function. Please return a value or \`null\`.`
    );
  });
});
