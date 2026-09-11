import React from "react";

export const CmsUsageWarning = ({ input }: { input: { value?: string } }) => {
  if (!input.value) return null;

  return (
    <div className="my-4 w-full rounded-md bg-gradient-to-b from-red-800 to-black p-4 text-sm text-white">
      <p>This page is referenced by error messages in the CMS application.</p>
      <p className="mt-3 opacity-90">
        Be careful to preserve <b>title fragments</b>, <b>slug</b> and other
        metadata when editing this document.
      </p>
      <p className="mt-3 opacity-90">
        URL:{" "}
        <a
          href={input.value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-200 underline hover:text-blue-500"
        >
          GitHub
        </a>
      </p>
    </div>
  );
};
