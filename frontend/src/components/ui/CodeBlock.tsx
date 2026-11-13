import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { Highlight, themes, type Language, type PrismTheme } from 'prism-react-renderer'
import { cn } from '@/utils/cn'
import { useToast } from '@/hooks/useToast'
import { prismLanguage } from '@/utils/language'

const codeTheme: PrismTheme = {
  ...themes.vsDark,
  plain: {
    ...themes.vsDark.plain,
    color: '#c7d2cc',
    backgroundColor: 'transparent',
  },
}

interface CodeBlockProps {
  code: string
  language?: string | null
  startLine?: number
  highlightLines?: number[]
  showLineNumbers?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language,
  startLine = 1,
  highlightLines = [],
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\s+$/, '')

  if (!normalizedCode) {
    return (
      <div className="rounded-lg border border-line bg-canvas/60 p-4 text-xs text-slate-500">
        No source content was returned for this file.
      </div>
    )
  }

  return (
    <div className={cn('overflow-auto rounded-lg border border-line bg-canvas/80', className)}>
      <Highlight
        theme={codeTheme}
        code={normalizedCode}
        language={prismLanguage(language) as Language}
      >
        {({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              'min-w-full w-max py-2.5 font-mono text-[12px] leading-6',
              preClassName,
            )}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, lineIndex) => {
              const lineNumber = startLine + lineIndex
              const isHighlighted = highlightLines.includes(lineNumber)
              const lineProps = getLineProps({ line })

              return (
                <div
                  {...lineProps}
                  key={lineIndex}
                  className={cn(
                    'flex min-w-full',
                    lineProps.className,
                    isHighlighted
                      ? 'border-l-2 border-emerald-400/70 bg-emerald-400/[0.09]'
                      : 'border-l-2 border-transparent',
                  )}
                >
                  {showLineNumbers ? (
                    <span className="w-12 shrink-0 select-none pr-3 text-right text-slate-600">
                      {lineNumber}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 whitespace-pre px-4">
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              )
            })}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

interface CodeViewerProps extends CodeBlockProps {
  title?: string
  subtitle?: ReactNode
  actions?: ReactNode
  copyable?: boolean
}

export function CodeViewer({
  title,
  subtitle,
  actions,
  copyable = true,
  className,
  code,
  ...props
}: CodeViewerProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      toast({ title: 'Code copied to clipboard', variant: 'success' })
    } catch {
      toast({
        title: 'Could not copy code',
        description: 'Your browser denied clipboard access.',
        variant: 'error',
      })
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      {title || actions || copyable ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            {title ? (
              <p className="truncate font-mono text-[11px] text-slate-300">{title}</p>
            ) : null}
            {subtitle ? <div className="mt-0.5 text-[11px] text-slate-500">{subtitle}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            {copyable ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                aria-label="Copy code"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <CodeBlock code={code} className={cn('rounded-none border-0', className)} {...props} />
    </div>
  )
}
