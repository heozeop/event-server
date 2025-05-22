import http from "k6/http";
import { ADMIN_EMAIL, API_BASE_URL, TEST_PASSWORD } from "prepare/constants";

export function getAdminToken() {
  const response = http.post(
    `${API_BASE_URL}/auth/login`,
    JSON.stringify({
      email: ADMIN_EMAIL,
      password: TEST_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(
      `Admin authentication failed: ${response.status} - ${response.body}`,
    );
  }

  return response.json("accessToken") as string;
}
