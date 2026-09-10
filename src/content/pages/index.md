---
_schema: default
title: Overview
description: 'A complete documentation template: search, reference pages, diagrams, media and a print layout. You write Markdown; the template handles the rest.'
pageSections:
  - _component: page-sections/heroes/hero-center
    sectionLabel: Hero
    eyebrow: v2.4 — code annotations, collapsible sections & diagrams
    eyebrowShowDot: true
    heading: Docs your users actually finish.
    headingHighlight: finish
    headingLevel: h1
    subtext: 'A complete documentation template for product teams: search, reference pages, diagrams, media and a print layout. You write Markdown; the template handles the rest.'
    alignmentHorizontal: start
    buttonSections:
      - _component: building-blocks/core-elements/button
        text: Get started
        hideText: false
        link: /installation/
        iconName: arrow-right
        iconColor: default
        iconPosition: after
        variant: primary
        size: md
      - _component: building-blocks/core-elements/command-line
        command: npm create docsmith@latest
        prompt: $
        showCopy: true
    maxContentWidth: 2xl
    paddingHorizontal: none
    paddingVertical: lg
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: base

  - _component: page-sections/explainers/stats
    sectionLabel: Numbers
    eyebrow: ''
    heading: ''
    headingLevel: h2
    alignmentHorizontal: start
    subtext: ''
    stats:
      - number: 0
        prefix: ''
        suffix: ''
        label: runtime dependencies
        sublabel: ''
      - number: 41
        prefix: ''
        suffix: ' KB'
        label: search index, 200 pages
        sublabel: ''
      - number: 1.4
        prefix: ''
        suffix: s
        label: cold build, 200 pages
        sublabel: ''
      - number: 100
        prefix: ''
        suffix: ''
        label: Lighthouse, out of the box
        sublabel: ''
    layout: tiles
    dividers: false
    maxContentWidth: 2xl
    paddingHorizontal: none
    paddingVertical: lg
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: base

  - _component: page-sections/builders/custom-section
    label: Feature demos
    contentSections:
      - _component: building-blocks/core-elements/heading
        text: Try the features. Don't read about them.
        level: h2
        size: md
        alignmentHorizontal: start
      - _component: building-blocks/core-elements/simple-text
        text: Every panel below is the shipped component, wired up and working.
        size: md
        alignmentHorizontal: start
      - _component: building-blocks/wrappers/content-selector
        label: Feature demos
        variant: panel
        navigationPosition: top
        items:
          - title: Callouts
            subtext: ''
            contentSections:
              - _component: building-blocks/core-elements/simple-text
                text: Four kinds, for the things a reader would otherwise learn the hard way.
                size: sm
              - _component: building-blocks/core-elements/alert
                variant: note
                title: Note
                text: Context that helps, but isn't required to succeed.
                iconName: ''
              - _component: building-blocks/core-elements/alert
                variant: warning
                title: Rotating a key revokes the old one
                text: Existing clients fail on the next request. Deploy the new key before rotating.
                iconName: ''
          - title: Code tabs
            subtext: ''
            contentSections:
              - _component: building-blocks/core-elements/simple-text
                text: One sample, many languages. The reader's choice is remembered site-wide, so a Python developer stays in Python across every page.
                size: sm
              - _component: building-blocks/core-elements/code-tabs
                filename: ''
                showCopy: true
                tabs:
                  - label: cURL
                    language: bash
                    code: |-
                      curl https://api.acme.com/v1/invoices \
                        -H "Authorization: Bearer $ACME_KEY" \
                        -d customer=cus_8Kq2
                    highlight: ''
                  - label: Node
                    language: js
                    code: |-
                      import { Acme } from '@acme/sdk'

                      const acme = new Acme(process.env.ACME_KEY)
                    highlight: ''
                  - label: Python
                    language: python
                    code: |-
                      from acme import Acme

                      acme = Acme(os.environ['ACME_KEY'])
                    highlight: ''
          - title: Annotations
            subtext: ''
            contentSections:
              - _component: building-blocks/core-elements/simple-text
                text: Notes sit under the block rather than in comments, so the snippet stays copy-paste clean.
                size: sm
              - _component: building-blocks/core-elements/code-annotations
                filename: docsmith.config.js
                language: js
                highlight: ''
                showCopy: true
                code: |-
                  export default {
                    search: { provider: 'local' },
                    nav: [
                      { group: 'Guides', dir: 'guides' },
                    ],
                  }
                notes:
                  - line: 2
                    text: Builds the index at compile time and ships it with the site — no search service, no API key.
                  - line: 4
                    text: Point a group at a directory and every page in it appears, ordered by frontmatter.
          - title: Diagrams
            subtext: ''
            contentSections:
              - _component: building-blocks/core-elements/simple-text
                text: Written as text and rendered in the browser, so they diff in review and whoever inherits the page can edit them without a design tool.
                size: sm
              - _component: building-blocks/core-elements/diagram
                caption: ''
                definition: |-
                  flowchart LR
                    A[Event] --> B{Retry?}
                    B -- yes --> C[Queue]
                    B -- no --> D[Dead letter]
          - title: Reference
            subtext: ''
            contentSections:
              - _component: building-blocks/core-elements/simple-text
                text: Parameter lists for the pages where a table would be three columns of nothing.
                size: sm
              - _component: building-blocks/core-elements/param-list
                params:
                  - name: site.name
                    type: string
                    required: true
                    defaultValue: ''
                    description: Shown in the header, page titles and OG metadata.
                  - name: site.url
                    type: string
                    required: false
                    defaultValue: ''
                    description: Canonical origin. Required for the sitemap and absolute OG image URLs.
    maxContentWidth: 2xl
    paddingHorizontal: none
    paddingVertical: lg
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: base
    rounded: false

  - _component: page-sections/collections/card-collection
    sectionLabel: Browse the docs
    eyebrow: ''
    heading: ''
    headingLevel: h2
    alignmentHorizontal: start
    subtext: ''
    items:
      - image: ''
        imageAlt: ''
        link: /introduction/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Introduction
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: What the template gives you out of the box, and who it's for.
            size: sm
      - image: ''
        imageAlt: ''
        link: /installation/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Installation
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: From an empty folder to a running docs site in about four minutes.
            size: sm
      - image: ''
        imageAlt: ''
        link: /writing-content/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Writing content
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: Frontmatter, callouts, tabbed code blocks, tables and images.
            size: sm
      - image: ''
        imageAlt: ''
        link: /configuration/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Configuration
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: One data file for the header, the sidebar, search and feedback.
            size: sm
      - image: ''
        imageAlt: ''
        link: /theming/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Theming
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: Design tokens control the whole surface, light and dark.
            size: sm
      - image: ''
        imageAlt: ''
        link: /config-api/
        contentSections:
          - _component: building-blocks/core-elements/heading
            text: Config API
            level: h3
            size: xs
            iconName: arrow-right
            iconPosition: after
          - _component: building-blocks/core-elements/simple-text
            text: Every option, its type, default and effect.
            size: sm
    layout: grid
    columns: 3
    gap: sm
    aspectRatio: none
    maxContentWidth: 2xl
    paddingHorizontal: none
    paddingVertical: lg
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: base

  - _component: page-sections/builders/custom-section
    label: Also included
    contentSections:
      - _component: building-blocks/core-elements/heading
        text: Also included, no plugins required
        level: h2
        size: xs
        alignmentHorizontal: start
      # A Spacer replaces the gap either side of it, which is the only way to
      # get a panel-label gap here: Grid's type default is `loose` (48px) and
      # `spaceBefore` can only reach `none`, `tight` or `loose`.
      - _component: building-blocks/core-elements/spacer
        size: md
      - _component: building-blocks/wrappers/grid
        label: ''
        columns: 3
        minItemWidth: 200
        maxItemWidth: null
        gap: md
        items:
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Instant search** — client-side index, ⌘K anywhere'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Dark mode** — token-driven, respects the system'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Code tabs** — one sample, many languages'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Code annotations** — highlighted lines, numbered notes'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**On-page TOC** — with scroll tracking'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Feedback** — per-page helpful votes'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Mobile drawer** — the full sidebar on small screens'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**Print styles** — a real print layout'
                size: sm
                spaceBefore: none
          - contentSections:
              - _component: building-blocks/core-elements/text
                text: '**SEO & OG** — meta, structured data and a sitemap'
                size: sm
                spaceBefore: none
    maxContentWidth: 2xl
    paddingHorizontal: lg
    paddingVertical: lg
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: surface
    rounded: true

  - _component: page-sections/conversion/cta-split
    sectionLabel: Closing CTA
    heading: Ship your docs this week.
    headingLevel: h2
    subtext: MIT licensed. No runtime, no per-seat pricing, no theme to maintain.
    imageSource: ''
    imageAlt: ''
    buttonSections:
      - _component: building-blocks/core-elements/button
        text: Install Docsmith
        hideText: false
        link: /installation/
        iconName: ''
        iconColor: default
        iconPosition: before
        variant: primary
        size: md
      - _component: building-blocks/core-elements/button
        text: See every option
        hideText: false
        link: /config-api/
        iconName: ''
        iconColor: default
        iconPosition: before
        variant: secondary
        size: md
    reverse: false
    maxContentWidth: 2xl
    paddingHorizontal: lg
    paddingVertical: xl
    colorScheme: inherit
    lockColorScheme: false
    backgroundColor: accent
    rounded: true
---
