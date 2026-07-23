'use client'

// Runtime DOM translator. Walks the page after every render and swaps English
// text and common attribute values (placeholder, title, aria-label, alt) into
// the active locale using the auto-translations dictionary. Set dir="rtl" and
// lang on <html> when Arabic or Kurdish is active so layout mirrors.
//
// Guardrails to stop the observer from looping on its own edits:
//  * disconnect/reconnect around every mutation we make
//  * skip writes when the new value already equals the current value
//  * debounce mutation-driven rescans through requestAnimationFrame

import { useEffect } from 'react'
import { useLocale } from '@/lib/bazaar/locale-context'
import { AUTO_AR, AUTO_KU } from '@/lib/bazaar/auto-translations'

const ORIGINAL_KEY = '__i18nOriginal'
const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'alt'] as const

type WithOriginal = { [ORIGINAL_KEY]?: string }

export function AutoTranslator() {
  const { locale } = useLocale()

  useEffect(() => {
    const dict: Record<string, string> | null =
      locale === 'ar' ? AUTO_AR :
      locale === 'ku' ? AUTO_KU :
      null

    document.documentElement.lang = locale
    document.documentElement.dir = (locale === 'ar' || locale === 'ku') ? 'rtl' : 'ltr'

    let observer: MutationObserver | null = null
    let scanQueued = false

    function translateTextNode(node: Text) {
      const meta = node as unknown as WithOriginal
      const original = meta[ORIGINAL_KEY] ?? node.nodeValue ?? ''
      const trimmed = original.trim()
      if (!trimmed) return

      if (!dict) {
        if (meta[ORIGINAL_KEY] !== undefined) {
          if (node.nodeValue !== original) node.nodeValue = original
          delete meta[ORIGINAL_KEY]
        }
        return
      }

      const translated = dict[trimmed]
      if (!translated) return
      const lead = original.match(/^\s*/)?.[0] ?? ''
      const trail = original.match(/\s*$/)?.[0] ?? ''
      const target = lead + translated + trail
      if (node.nodeValue === target) return
      meta[ORIGINAL_KEY] = original
      node.nodeValue = target
    }

    function translateElement(el: Element) {
      for (const attr of ATTRS_TO_TRANSLATE) {
        const current = el.getAttribute(attr)
        if (current === null) continue
        const stashKey = `data-i18n-${attr}`
        const originalVal = el.getAttribute(stashKey) ?? current
        const trimmed = originalVal.trim()
        if (!dict) {
          if (el.hasAttribute(stashKey)) {
            if (el.getAttribute(attr) !== originalVal) el.setAttribute(attr, originalVal)
            el.removeAttribute(stashKey)
          }
          continue
        }
        const translated = dict[trimmed]
        if (!translated) continue
        if (current === translated) continue
        if (!el.hasAttribute(stashKey)) el.setAttribute(stashKey, originalVal)
        el.setAttribute(attr, translated)
      }
    }

    function walk(root: Node) {
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
      let cur: Node | null = walker.nextNode()
      while (cur) {
        translateTextNode(cur as Text)
        cur = walker.nextNode()
      }
      if (root instanceof Element) {
        translateElement(root)
        root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el => translateElement(el))
      }
    }

    function safeWalk(root: Node) {
      if (!observer) { walk(root); return }
      observer.disconnect()
      try {
        walk(root)
      } finally {
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: [...ATTRS_TO_TRANSLATE],
        })
      }
    }

    function queueScan(target: Node = document.body) {
      if (scanQueued) return
      scanQueued = true
      requestAnimationFrame(() => {
        scanQueued = false
        safeWalk(target)
      })
    }

    observer = new MutationObserver(() => queueScan())
    safeWalk(document.body)

    return () => {
      observer?.disconnect()
      observer = null
    }
  }, [locale])

  return null
}
