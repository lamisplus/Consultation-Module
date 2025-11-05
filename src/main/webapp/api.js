export const url =
    process.env.NODE_ENV === "development"
        ? "http://localhost:8383/api/v1/"
        : "/api/v1/";

export const apiUrl =
    process.env.NODE_ENV === "development"
        ? "http://localhost:8383/api/v1/"
        : "/api/v1/";

export const token =
    process.env.NODE_ENV === "development"
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJndWVzdEBsYW1pc3BsdXMub3JnIiwiYXV0aCI6IlN1cGVyIEFkbWluIiwibmFtZSI6Ikd1ZXN0IEd1ZXN0IiwiZXhwIjoxNzYyMzU2ODIwfQ.dIWQetINLlRjXPL7iI6jI69-GdgiHjkfNHx1VRQP0ZiAe2PF_c9O9iwr6zv_yQQW9kFnDt8YPK0LpkXaGJC5eQ"
        : new URLSearchParams(window.location.search).get("jwt");

export const audioTranscriptionUrl = process.env.NODE_ENV === "development"
? "http://localhost:7860/api/v1"
: "http://localhost:7860/api/v1";


