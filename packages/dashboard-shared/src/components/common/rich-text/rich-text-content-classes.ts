export const richTextContentClasses = [
  "txt-small text-ui-fg-subtle break-words",
  "[&_p]:my-0 [&_p+p]:mt-2",
  "[&_h2]:h3-core [&_h2]:text-ui-fg-base [&_h2]:mb-2 [&_h2]:mt-4 [&_h2:first-child]:mt-0",
  "[&_h3]:txt-compact-medium-plus [&_h3]:text-ui-fg-base [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3:first-child]:mt-0",
  "[&_strong]:text-ui-fg-base [&_strong]:font-medium",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li_p]:my-0",
  "[&_blockquote]:border-ui-border-strong [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic",
  "[&_a]:text-ui-fg-interactive [&_a]:underline [&_a:hover]:text-ui-fg-interactive-hover",
  "[&_img]:my-2 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md",
].join(" ")
