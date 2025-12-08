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
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJyZGUtdXNlciIsImF1dGgiOiJTdXBlciBBZG1pbixVc2VyLFJERSIsIm5hbWUiOiJyZGUtdXNlciBsYXN0bmFtZSIsImV4cCI6MTc2NTIxNTE5OX0.tqyOIdkcwQ27Ae8P37b1ady9yBZ6Rs_8J1MhxdDIMUfHocCKXWZMuDBXTwmucFo88ZAXC-4hmaDQP_-GuorvIw"
        : new URLSearchParams(window.location.search).get("jwt");

export const audioTranscriptionUrl = process.env.NODE_ENV === "development"

    ? "http://96.0.40.252:7860/api/v1"

    : "http://96.0.40.252:7860/api/v1";

