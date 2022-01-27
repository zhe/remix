import { ActionFunction, Form } from "remix";
import { redirect, json, useActionData } from "remix";
import * as z from "zod";

const LoginFields = z.object({
  username: z.string(),
  password: z.string()
});

const ZodErrors = z.object({
  formErrors: z.array(z.string()),
  fieldErrors: z.object({
    username: z.array(z.string()),
    password: z.array(z.string())
  })
});

const ActionData = z.object({
  fields: LoginFields,
  errors: ZodErrors
});
type ActionData = z.infer<typeof ActionData>;

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const fields = Object.fromEntries(formData.entries());
  const result = LoginFields.safeParse(fields);
  if (!result.success) {
    return badRequest({
      fields,
      errors: ZodErrors.parse(result.error.flatten())
    });
  }
  console.log(formData);
  return {};
};

export default function Login() {
  return (
    <Form method="post">
      <div>
        <label htmlFor="username">Username:</label>
        <input name="username" id="username" />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input name="password" id="password" type="password" />
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
