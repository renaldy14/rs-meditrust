// frontend/components/PrimaryButton.js
"use client";

export default function PrimaryButton({ children, className = "", ...rest }) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}
