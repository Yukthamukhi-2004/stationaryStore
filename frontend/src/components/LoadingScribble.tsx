export default function LoadingScribble({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="loading-scribble">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="var(--pencil-300)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Pencil body */}
        <path d="M14 38 L17 41 L35 23 L32 20 Z" />
        {/* Pencil tip */}
        <path d="M14 38 L11 35 L12.5 32.5 L15.5 35.5 Z" />
        {/* Pencil eraser end */}
        <path d="M32 20 L35 23 L38 20 L35 17 Z" />
        {/* Scribble line drawn by the pencil */}
        <path
          d="M8 28 C12 26, 16 30, 20 28 C24 26, 28 30, 32 28 C36 26, 40 30, 42 28"
          stroke="var(--pastel-blue-200)"
          strokeWidth="2"
          strokeDasharray="60"
          strokeDashoffset="0"
          fill="none"
          style={{
            animation: "pencilLine 1.5s ease-in-out infinite alternate",
          }}
        />
      </svg>
      <div className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      <span className="loading-text">{text}</span>
    </div>
  );
}
