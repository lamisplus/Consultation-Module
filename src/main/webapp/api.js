// export const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJndWVzdEBsYW1pc3BsdXMub3JnIiwiYXV0aCI6IlN1cGVyIEFkbWluIiwibmFtZSI6Ikd1ZXN0IEd1ZXN0IiwiZXhwIjoxNzU1MTgxNjg1fQ.SjafK7ZGn0nJSPbCeFHgvgFcuz4HPWnHGnhrzyGA2T98xeNUaVNUpCTzei7AaK85TxQ_LCfEXrxtB0C3EoVOOQ"
// export const url = "/api/v1/";
// export const apiUrl = "/api/v1/";
// const devToken = process.env.REACT_APP_API_TOKEN;

// export const url = "http://localhost:8789/api/v1/";
// export const apiUrl = "http://localhost:8789/api/";
// export const token = devToken;


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
        ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJndWVzdEBsYW1pc3BsdXMub3JnIiwiYXV0aCI6IlN1cGVyIEFkbWluIiwibmFtZSI6Ikd1ZXN0IEd1ZXN0IiwiZXhwIjoxNzU1MTgzMjEyfQ.t_yZiqdjp7QMApsSqI_fWvsHbTvsYR-CPjrlW5xoPAJR4fPI1a7NhQAzYzgg8PTkQVHt7-12ZK16T0lvV-LuDw"
        : new URLSearchParams(window.location.search).get("jwt");



