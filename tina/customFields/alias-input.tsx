import React from "react";
import { wrapFieldsWithMeta } from "tinacms";

export const AliasInput = wrapFieldsWithMeta(({ input }) => (
  <input
    type="text"
    {...input}
    onChange={(e) => input.onChange(e.target.value.replace(/\s+/g, "-"))}
    className="focus:shadow-outline block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base text-gray-600 shadow-inner transition-all duration-150 ease-out placeholder:text-gray-300 focus:border-blue-500 focus:text-gray-900 focus:outline-none"
  />
));
