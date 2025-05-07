"use client";

export default function Loading() {
  return (
    <div
      id="loading"
      className="absolute w-[100dvw] h-[100dvh] bg-[var(--dark)] light-grain top-0 left-0 flex items-center justify-center"
    >
      <div className="h-[4em] py-4 animate-pulse">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="Layer_1"
          viewBox="0 0 100 100"
          className="auto h-[2em] object-left transition-[fill] will-change-[fill] duration-1000"
        >
          <defs>
            <style>
              {
                ".bg,.fg{fill:var(--foreground)}.bg{opacity:.125}.fg{opacity:.5}"
              }
            </style>
          </defs>
          <path
            d="M0 0h18.14v100H0z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M54.57 0h18.14v100H54.57z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M81.86 0H100v100H81.86z"
            className="bg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M0 45.81h18.14V100H0z"
            className="fg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M27.29 0h18.14v100H27.29z"
            className="fg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M54.57 30.3h18.14V100H54.57z"
            className="fg transition-[fill] will-change-[fill] duration-1000"
          />
          <path
            d="M81.86 30.3H100v25H81.86z"
            className="fg transition-[fill] will-change-[fill] duration-1000"
          />
        </svg>
      </div>
    </div>
  );
}
