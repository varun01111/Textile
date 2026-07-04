import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f5dcc7 0%, #f7f2eb 40%, #d9c8b0 100%)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 178,
            height: 178,
            borderRadius: 44,
            background: "#201815",
            color: "#fff5ef",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 82,
            fontWeight: 700,
          }}
        >
          TI
        </div>
      </div>
    ),
    size,
  );
}
