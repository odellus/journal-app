import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "katex/dist/katex.min.css";

const initial = `# Markdown + \\KaTeX

Inline math $\\int_0^1 x\\,dx = 1/2$.

Block:

$$
R_{\\mu\\nu} - \\tfrac12 g_{\\mu\\nu} R = \\kappa T_{\\mu\\nu}
$$
`;

export default function App() {
  const [value, setValue] = useState<string>(initial);

  return (
    <div data-color-mode="light" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <MDEditor
        height={500}
        value={value}
        onChange={setValue}
        previewOptions={{
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        }}
      />
    </div>
  );
}