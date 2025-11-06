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
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJyZGUtdXNlciIsImF1dGgiOiJTdXBlciBBZG1pbixVc2VyLFJERSIsIm5hbWUiOiJyZGUtdXNlciBsYXN0bmFtZSIsImV4cCI6MTc2MjQ0NzYxMX0.O1GUWR4UM6CHMQFE2p83gGvPqqnv4SiAL3J-Q6pJiYlDRlIG_6nOIVnVx6bSWyafqMWrTY0wv3_CZ7MIq4_JKQ"
        : new URLSearchParams(window.location.search).get("jwt");

export const audioTranscriptionUrl = process.env.NODE_ENV === "development"
? "http://localhost:7860/api/v1"
: "http://localhost:7860/api/v1";


