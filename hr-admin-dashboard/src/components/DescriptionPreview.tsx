"use client";

import { useState } from "react";

interface Props {
  text?: string;
  limit?: number;
}

const DescriptionPreview = ({ text, limit = 200 }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return <span className="text-gray-400 italic">No description</span>;

  const isLong = text.length > limit;
  const preview = isLong ? text.substring(0, limit) + "..." : text;

  return (
    <div className="text-sm text-gray-700 leading-snug whitespace-pre-line">
      {expanded ? text : preview}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 ml-1 hover:underline text-xs font-medium"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </div>
  );
};

export default DescriptionPreview;
