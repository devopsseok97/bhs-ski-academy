type SpinnerProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-8 w-8 border-4",
};

export default function Spinner({ label = "불러오는 중", size = "md" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <span
        aria-hidden="true"
        className={`animate-spin rounded-full border-slate border-t-summit ${sizes[size]}`}
      />
    </span>
  );
}
