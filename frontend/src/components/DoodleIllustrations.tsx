import { motion } from "framer-motion";

const doodles = [
  {
    id: "pencil",
    label: "Pencil",
    viewBox: "0 0 64 64",
    paths: [
      "M18 52 L22 56 L46 32 L42 28 Z",
      "M18 52 L14 48 L16 44 L20 48 Z",
      "M42 28 L46 32 L50 28 L46 24 Z",
      "M22 36 L26 40",
      "M26 32 L30 36",
    ],
    strokeWidth: 2.5,
  },
  {
    id: "notebook",
    label: "Notebook",
    viewBox: "0 0 64 64",
    paths: [
      "M12 10 L12 54 L52 54 L52 10 Z",
      "M16 10 L16 54",
      "M20 20 L42 20",
      "M20 28 L38 28",
      "M20 36 L42 36",
      "M20 44 L34 44",
    ],
    strokeWidth: 2.5,
  },
  {
    id: "paperclip",
    label: "Clip",
    viewBox: "0 0 64 64",
    paths: [
      "M20 52 C12 52 10 42 16 36 L36 16 C40 12 46 14 46 20 C46 24 42 28 38 32 L20 50 C18 52 14 52 14 48 C14 44 18 40 22 36",
    ],
    strokeWidth: 2.5,
  },
  {
    id: "star",
    label: "Star",
    viewBox: "0 0 64 64",
    paths: [
      "M32 8 L38 24 L55 24 L41 34 L46 50 L32 40 L18 50 L23 34 L9 24 L26 24 Z",
    ],
    strokeWidth: 2.5,
  },
  {
    id: "heart",
    label: "Heart",
    viewBox: "0 0 64 64",
    paths: [
      "M32 52 C32 52 12 40 12 26 C12 18 18 12 26 12 C30 12 32 16 32 16 C32 16 34 12 38 12 C46 12 52 18 52 26 C52 40 32 52 32 52 Z",
    ],
    strokeWidth: 2.5,
  },
  {
    id: "flower",
    label: "Flower",
    viewBox: "0 0 64 64",
    paths: [
      "M32 10 C36 20 44 24 44 24 C44 24 40 30 32 28 C24 30 20 24 20 24 C20 24 28 20 32 10 Z",
      "M32 54 C28 44 20 40 20 40 C20 40 24 34 32 36 C40 34 44 40 44 40 C44 40 36 44 32 54 Z",
      "M10 32 C20 28 24 20 24 20 C24 20 30 24 28 32 C30 40 24 44 24 44 C24 44 20 36 10 32 Z",
      "M54 32 C44 36 40 44 40 44 C40 44 34 40 36 32 C34 24 40 20 40 20 C40 20 44 28 54 32 Z",
      "M30 30 L34 30 L34 34 L30 34 Z",
    ],
    strokeWidth: 2,
  },
];

export default function DoodleIllustrations() {
  return (
    <div className="doodle-illustrations">
      {doodles.map((doodle, i) => (
        <motion.div
          key={doodle.id}
          className="doodle-item"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          <svg
            viewBox={doodle.viewBox}
            fill="none"
            stroke="currentColor"
            strokeWidth={doodle.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--pencil-300)" }}
          >
            {doodle.paths.map((d, idx) => (
              <path key={idx} d={d} />
            ))}
          </svg>
          <span className="doodle-label">{doodle.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
