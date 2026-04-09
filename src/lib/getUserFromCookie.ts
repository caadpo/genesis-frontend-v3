export function getUserFromCookie() {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("userData="));

  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
  } catch (err) {
    console.error("Erro ao ler userData:", err);
    return null;
  }
}
