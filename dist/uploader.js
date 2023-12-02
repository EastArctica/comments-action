import { FormData } from "node-fetch";
const fetch = (url, init) => import("node-fetch").then(({ default: fetch }) => fetch(url, init));
export async function uploadFile(token, blob, filename) {
    const formData = new FormData();
    formData.append('sharex', blob, filename);
    // Define your fetch request
    let req = await fetch("https://i.eastarcti.ca/upload", {
        method: "POST",
        headers: {
            "key": token,
        },
        body: formData
    });
    let res = await req.json();
    return res;
}
