'use client';

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { MarkdownConfig, DEFAULT_MARKDOWN_CONFIG } from '@/lib/utils/markdown-config';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  config?: MarkdownConfig;
}

export const MarkdownRenderer = memo<MarkdownRendererProps>(({ content, config = DEFAULT_MARKDOWN_CONFIG }) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const allowedElements = config.allowedElements || DEFAULT_MARKDOWN_CONFIG.allowedElements;
  const disallowedElements = config.disallowedElements || DEFAULT_MARKDOWN_CONFIG.disallowedElements;

  return (
    <div className="markdown-renderer">
      <ReactMarkdown
        rehypePlugins={config.sanitize ? [[rehypeSanitize, { allowedTags: allowedElements }]] : []}
        components={{
          a: ({ href, children, ...props }: { href?: string; children?: React.ReactNode; [key: string]: any }) => {
            if (!href) return <span {...props}>{children}</span>;
            
            // Block dangerous protocols
            const isDangerous = href.startsWith('javascript:') || href.startsWith('data:');
            if (isDangerous) {
              return <span {...props}>{children}</span>;
            }

            const isExternal = href.startsWith('http://') || href.startsWith('https://');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="markdown-link"
                {...props}
              >
                {children}
              </a>
            );
          },
          code: ({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode; [key: string]: any }) => {
            return inline ? (
              <code className="markdown-code-inline" {...props}>
                {children}
              </code>
            ) : (
              <code className="markdown-code-block" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }: { children?: React.ReactNode }) => {
            return <pre className="markdown-pre">{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
