export interface MarkdownConfig {
  allowedElements?: string[];
  disallowedElements?: string[];
  sanitize: boolean;
}

export const DEFAULT_MARKDOWN_CONFIG: MarkdownConfig = {
  sanitize: true,
  allowedElements: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  disallowedElements: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button']
};

export function sanitizeMarkdown(content: string, config: MarkdownConfig = DEFAULT_MARKDOWN_CONFIG): string {
  if (typeof content !== 'string') {
    return '';
  }

  if (!config.sanitize) {
    return content;
  }

  return content;
}
