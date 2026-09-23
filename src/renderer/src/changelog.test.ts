import { describe, expect, it } from 'vitest'
import { parseChangelog } from './changelog'

describe('parseChangelog', () => {
  it('extracts ordered release sections, dates, and bullet notes', () => {
    const markdown = `# Changelog

## 1.0.0
**Date:** January 2030

- First change
- Second change

## Next
**Status:** Planned

* Future change
`

    expect(parseChangelog(markdown)).toEqual([
      { version: '1.0.0', date: 'January 2030', notes: ['First change', 'Second change'] },
      { version: 'Next', date: 'Planned', notes: ['Future change'] },
    ])
  })

  it('ignores introductory copy and empty release sections', () => {
    expect(parseChangelog('# Changelog\nIntro\n\n## Empty\n**Date:** Soon')).toEqual([])
  })
})
