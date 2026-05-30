const BACKEND_BASE = "http://10.210.177.59:8000"; // change to your laptop IP

type AuthResponse = {
  ok?: boolean;
  user_id?: number;
  username?: string;
  message?: string;
  error?: string;
};

export async function signupUser(username: string, password: string) {
  const res = await fetch(`${BACKEND_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data: AuthResponse = await res.json();

  if (!data?.ok || !data?.user_id) {
    throw new Error(data?.error || "Signup failed");
  }

  return {
    user_id: data.user_id,
    username: data.username || username,
  };
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${BACKEND_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data: AuthResponse = await res.json();

  if (!data?.ok || !data?.user_id) {
    throw new Error(data?.error || "Login failed");
  }

  return {
    user_id: data.user_id,
    username: data.username || username,
  };
}
