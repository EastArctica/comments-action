import { Blob } from 'buffer';
import { RequestInfo, RequestInit, FormData } from "node-fetch";
const fetch = (url: RequestInfo, init?: RequestInit) =>  import("node-fetch").then(({ default: fetch }) => fetch(url, init));



export async function uploadFile(token: string, blob: Blob, filename: string): Promise<UploadResponse> {
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
    
    return res as UploadResponse;
}

export type UploadResponse = { status: number, message: string, url: string};
