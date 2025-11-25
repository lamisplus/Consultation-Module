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
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJyZGUtdXNlciIsImF1dGgiOiJTdXBlciBBZG1pbixVc2VyLFJERSIsIm5hbWUiOiJyZGUtdXNlciBsYXN0bmFtZSIsImV4cCI6MTc2NDEyMTY4Nn0.BgcFr1JPVa99oaoUs9it70q6fffwzQttPXDsncMmf0zeFk03qrApouSY1hfVKpc5VG_PlZNM2l0e8bs1Tj6cPA"
        : new URLSearchParams(window.location.search).get("jwt");

export const audioTranscriptionUrl = process.env.NODE_ENV === "development"

    ? "http://3.238.242.92:7860/api/v1"

    : "http://3.238.242.92:7860/api/v1";

