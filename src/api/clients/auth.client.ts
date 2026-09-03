import got from "got";
import { CookieJar } from "tough-cookie";

export interface SeleniumCookie {
  name: string;
  value: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

export class AuthClient {
  constructor(private readonly baseUrl: string) {}

  async loginViaApi(
    username: string,
    password: string,
    userAgent?: string,
  ): Promise<SeleniumCookie[]> {
    const cookieJar = new CookieJar();
    const loginUrl = `${this.baseUrl}/user/login`;

    const headers = {
      "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    };

    await got.get(loginUrl, {
      cookieJar,
      followRedirect: true,
      headers,
    });

    await got.post(loginUrl, {
      cookieJar,
      followRedirect: true,
      form: {
        user_name: username,
        password: password,
      },
      headers: {
        ...headers,
        Referer: loginUrl,
      },
    });

    const cookies = await cookieJar.getCookies(this.baseUrl);

    return cookies.map((cookie) => ({
      name: cookie.key,
      value: cookie.value,
      path: cookie.path ?? "/",
      secure: cookie.secure ?? false,
      httpOnly: cookie.httpOnly ?? false,
    }));
  }
}
