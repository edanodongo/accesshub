const tones = {
  dark: "bg-gray-900 text-white",
  light: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
} as const;

export default function Badge({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
}
