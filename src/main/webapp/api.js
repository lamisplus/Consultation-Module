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
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJyZGUtdXNlciIsImF1dGgiOiJTdXBlciBBZG1pbixVc2VyLFJERSIsIm5hbWUiOiJyZGUtdXNlciBsYXN0bmFtZSIsImV4cCI6MTc2MjU2NDIxMn0.m1SNN6HZIF3FUXSmxep-RKDCT2savTvYmEN2yk4mlC9gKDK179oEeoUJKUw0T0an3dm2OtUV2Gp0GyZWPSZiDg"
        : new URLSearchParams(window.location.search).get("jwt");

export const audioTranscriptionUrl = process.env.NODE_ENV === "development"
? "http://localhost:7860/api/v1"
: "http://localhost:7860/api/v1";


