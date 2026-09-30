'use client'

// Runtime DOM translator. Walks the page after every render and swaps English
// text and common attribute values (placeholder, title, aria-label, alt) into
// the active locale using the auto-translations dictionary. Set dir="rtl" and
// lang on <html> when Arabic or Kurdish is active so layout mirrors.
//
// Guardrails to stop the observer from looping on its own edits:
//  * disconnect/reconnect around every mutation we make
//  * skip writes when the new value already equals the current value
//  * debounce mutation-driven rescans through a short timer

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
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let retries = 0
    let pending = false

    // React tags every DOM node it owns with a `__reactFiber$<id>` key once the
    // node is hydrated. Server HTML inside a boundary that hasn't hydrated yet
    // has no such key — changing its text now would make hydration fail and
    // force React to re-render the page. Those nodes are retried shortly after.
    let fiberKey: string | null = null
    function isHydrated(el: Element): boolean {
      if (fiberKey) return fiberKey in el
      const k = Object.keys(el).find(key => key.startsWith('__reactFiber$'))
      if (k) fiberKey = k
      return !!k
    }

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
          if (!isHydrated(parent)) { pending = true; return NodeFilter.FILTER_REJECT }
          return NodeFilter.FILTER_ACCEPT
        },
      })
      let cur: Node | null = walker.nextNode()
      while (cur) {
        translateTextNode(cur as Text)
        cur = walker.nextNode()
      }
      if (root instanceof Element) {
        const els = [root, ...root.querySelectorAll('[placeholder],[title],[aria-label],[alt]')]
        for (const el of els) {
          if (isHydrated(el)) translateElement(el)
          else pending = true
        }
      }
    }

    function safeWalk(root: Node) {
      pending = false
      if (!observer) { walk(root); scheduleRetry(); return }
      observer.disconnect()
      try {
        walk(root)
        scheduleRetry()
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

    // Nodes skipped because React hadn't hydrated them yet produce no DOM
    // mutation when they do hydrate, so poll briefly (max ~6s) until done.
    function scheduleRetry() {
      if (!pending || retryTimer || retries >= 60) return
      retries++
      retryTimer = setTimeout(() => { retryTimer = null; queueScan() }, 100)
    }

    function queueScan(target: Node = document.body) {
      if (scanQueued) return
      scanQueued = true
      // setTimeout, not requestAnimationFrame: rAF is paused in background
      // tabs, which left pages opened in a new tab untranslated.
      setTimeout(() => {
        scanQueued = false
        safeWalk(target)
      }, 16)
    }

    observer = new MutationObserver(() => queueScan())
    safeWalk(document.body)

    return () => {
      observer?.disconnect()
      observer = null
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [locale])

  return null
}
