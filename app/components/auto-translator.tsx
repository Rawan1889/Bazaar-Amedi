'use client'

// Runtime DOM translator. Walks the page after every render and swaps English
// text and common attribute values (placeholder, title, aria-label, alt) into
// the active locale using the auto-translations dictionary. Set dir="rtl" and
// lang on <html> when Arabic or Kurdish is active so layout mirrors.
//
// Trade-off: individual components don't have to know about locale. New copy
// added anywhere is translated automatically as long as it exists in the
// dictionary (or falls back silently to English if not).

import { useEffect } from 'react'
import { useLocale } from '@/lib/bazaar/locale-context'
import { AUTO_AR, AUTO_KU } from '@/lib/bazaar/auto-translations'

const ORIGINAL_ATTR = 'data-i18n-en'
const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'alt'] as const

export function AutoTranslator() {
  const { locale } = useLocale()

  useEffect(() => {
    const dict: Record<string, string> | null =
      locale === 'ar' ? AUTO_AR :
      locale === 'ku' ? AUTO_KU :
      null

    document.documentElement.lang = locale
    document.documentElement.dir = (locale === 'ar' || locale === 'ku') ? 'rtl' : 'ltr'

    function translateNode(root: Node) {
      // Text nodes
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const parent = n.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          const tag = parent.tagName
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      const nodes: Text[] = []
      let cur: Node | null = walker.nextNode()
      while (cur) { nodes.push(cur as Text); cur = walker.nextNode() }
      for (const node of nodes) {
        const stashed = (node as unknown as Record<string, unknown>)[ORIGINAL_ATTR] as string | undefined
        const original = stashed ?? node.nodeValue ?? ''
        const trimmed = original.trim()
        if (!trimmed) continue
        if (!dict) {
          // Locale is English — restore original if we stashed one
          if (stashed !== undefined) {
            node.nodeValue = stashed
            delete (node as unknown as Record<string, unknown>)[ORIGINAL_ATTR]
          }
          continue
        }
        const translated = dict[trimmed]
        if (!translated) continue
        // Stash the English value so we can restore if user switches back
        ;(node as unknown as Record<string, unknown>)[ORIGINAL_ATTR] = original
        // Preserve leading/trailing whitespace
        const lead = original.match(/^\s*/)?.[0] ?? ''
        const trail = original.match(/\s*$/)?.[0] ?? ''
        node.nodeValue = lead + translated + trail
      }

      // Attribute values on elements
      const elements = (root as Element).querySelectorAll?.('[placeholder],[title],[aria-label],[alt]')
      if (!elements) return
      elements.forEach(el => {
        for (const attr of ATTRS_TO_TRANSLATE) {
          const val = el.getAttribute(attr)
          if (!val) continue
          const stashKey = `${ORIGINAL_ATTR}-${attr}`
          const originalVal = el.getAttribute(stashKey) ?? val
          const trimmed = originalVal.trim()
          if (!dict) {
            if (el.hasAttribute(stashKey)) {
              el.setAttribute(attr, originalVal)
              el.removeAttribute(stashKey)
            }
            continue
          }
          const translated = dict[trimmed]
          if (!translated) continue
          if (!el.hasAttribute(stashKey)) el.setAttribute(stashKey, originalVal)
          el.setAttribute(attr, translated)
        }
      })
    }

    translateNode(document.body)

    // Watch for React re-renders / navigation
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(n => {
          if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
            translateNode(n)
          }
        })
        if (m.type === 'characterData' && m.target) {
          translateNode(m.target.parentNode ?? m.target)
        }
        if (m.type === 'attributes' && m.target instanceof Element) {
          const attr = m.attributeName
          if (attr && (ATTRS_TO_TRANSLATE as readonly string[]).includes(attr)) {
            translateNode(m.target)
          }
        }
      }
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS_TO_TRANSLATE],
    })
    return () => observer.disconnect()
  }, [locale])

  return null
}
