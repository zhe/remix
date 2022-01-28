import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  RouteComponent
} from "remix";
import { useLoaderData } from "remix";
import { redirect, json, Form } from "remix";

import { userPrefsCookie } from "~/cookies";
import { commitSession, getSession } from "~/sessionStorage";

interface LoaderData {
  something?: boolean;
  somethingElse?: boolean;
}

let loader: LoaderFunction = async ({ request }) => {
  let cookie = request.headers.get("Cookie");
  let session = await getSession(cookie);
  let userPrefs = (await userPrefsCookie.parse(cookie)) || {};

  let something = userPrefs.something;
  let somethingElse = session.get("something-else");

  return json<LoaderData>({ something, somethingElse });
};

let action: ActionFunction = async ({ request }) => {
  let cookie = request.headers.get("Cookie");
  let session = await getSession(cookie);
  let userPrefs = (await userPrefsCookie.parse(cookie)) || {};

  userPrefs.something = true;
  session.set("something-else", true);

  let headers = new Headers();
  headers.append("Set-Cookie", await userPrefsCookie.serialize(userPrefs));
  headers.append("Set-Cookie", await commitSession(session));
  return redirect("/multiple-set-cookies", { headers });
};

let meta: MetaFunction = () => ({
  title: "Multi Set Cookie Headers"
});

let MultipleSetCookiesPage: RouteComponent = () => {
  let data = useLoaderData<LoaderData>();
  return (
    <>
      <p>👋</p>
      <pre id="dump">{JSON.stringify(data, null, 2)}</pre>
      <Form id="form" method="post">
        <button id="submit" type="submit">
          Add cookies
        </button>
      </Form>
    </>
  );
};

export default MultipleSetCookiesPage;
export { action, loader, meta };
