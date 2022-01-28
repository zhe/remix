import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

import { collectResponses, getHtml } from "./utils";

const testPort = 3000;
const testServer = `http://localhost:${testPort}`;

describe("can set multiple set cookies headers", () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(() => browser.close());

  describe("loader headers", () => {
    it("are correct", async () => {
      let responses = collectResponses(
        page,
        url => url.pathname === "/multiple-set-cookies"
      );

      await page.goto(`${testServer}/multiple-set-cookies`);

      expect(responses).toHaveLength(1);

      let html = await getHtml(page, "#dump");
      expect(html).toMatchInlineSnapshot(`
        "<pre id=\\"dump\\">{}</pre>
        "
      `);

      let [response] = await Promise.all([
        page.waitForNavigation(),
        page.click("#submit")
      ]);

      expect(response!.status()).toBe(200);

      html = await getHtml(page, "#dump");
      expect(html).toMatchInlineSnapshot(`
        "<pre id=\\"dump\\">
        {
          \\"something\\": true,
          \\"somethingElse\\": true
        }</pre
        >
        "
      `);

      expect(responses[0].headers()["set-cookie"]).toMatchInlineSnapshot(
        `undefined`
      );
    });
  });
});
