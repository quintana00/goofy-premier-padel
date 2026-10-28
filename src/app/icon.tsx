import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export function Logo({ tam }: { tam: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#0c1530",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          width: tam * 0.62,
          height: tam * 0.62,
          borderRadius: tam,
          background: "#d9ff3d",
          border: `${tam * 0.03}px solid #000`,
          alignItems: "center",
          justifyContent: "center",
          fontSize: tam * 0.3,
          fontWeight: 900,
          color: "#0c1530",
        }}
      >
        GP
      </div>
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(<Logo tam={512} />, size);
}
