import { UserIcon } from "@heroicons/react/24/outline";

export function ProfileAvatar({
  name,
  src,
  large = false,
  className = "",
}: {
  name: string;
  src: string;
  large?: boolean;
  className?: string;
}) {
  const size = large ? "size-20" : "size-9";
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 ${size} ${className}`}
    >
      {src ? (
        // Avatar sources may be local file/data URLs; keep the native image
        // adapter so the user-selected source is not restricted by config.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          // fill
          sizes={large ? "80px" : "36px"}
          className="h-full w-full object-contain"
        />
      ) : (
        <UserIcon className={large ? "size-9" : "size-5"} aria-hidden="true" />
      )}
    </span>
  );
}
