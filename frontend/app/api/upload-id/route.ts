// app/api/upload-id/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { Buffer } from "buffer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.IMGBB_KEY;
  if (!apiKey) {
    console.error("IMGBB_KEY not set");
    return NextResponse.json(
      { error: "Server misconfiguration: IMGBB_KEY is missing" },
      { status: 500 }
    );
  }

  // parse form
  let file: File;
  try {
    const formData = await req.formData();
    const maybe = formData.get("image");
    if (!(maybe instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    file = maybe;
  } catch (e: any) {
    console.error("formData parse error:", e);
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // to base64
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  // build urlencoded body
  const body = new URLSearchParams();
  body.append("key", apiKey);
  body.append("image", base64);
  body.append("expiration", "600");

  try {
    const resp = await axios.post(
      "https://api.imgbb.com/1/upload",
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const url = resp.data?.data?.url;
    if (!url) {
      console.error("imgbb response missing URL:", resp.data);
      return NextResponse.json(
        { error: "Upload succeeded but no URL returned" },
        { status: 502 }
      );
    }
    return NextResponse.json({ url });
  } catch (err: any) {
    if (err.response) {
      console.error(
        "imgbb responded with non-200:",
        err.response.status,
        err.response.data
      );
      return NextResponse.json(
        {
          error:
            err.response.data.error?.message ||
            err.response.data ||
            err.response.statusText,
        },
        { status: err.response.status }
      );
    }
    console.error("imgbb request error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
