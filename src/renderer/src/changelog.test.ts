import { describe, expect, it } from 'vitest'
import { parseChangelog } from './changelog'

describe('parseChangelog', () => {
  it('extracts ordered releases with categorized Markdown sections', () => {
    const markdown = `# Changelog

## 1.0.0

### Features

- First change
- Second change

### Fixes

* Future change
`

    expect(parseChangelog(markdown)).toEqual([
      {
        version: '1.0.0',
        sections: [
          { title: 'Features', notes: ['First change', 'Second change'] },
          { title: 'Fixes', notes: ['Future change'] },
        ],
      },
    ])
  })

  it('supports uncategorized bullets and ignores empty release sections', () => {
    expect(parseChangelog('# Changelog\n\n## 1.0.0\n- Change\n\n## Empty')).toEqual([
      { version: '1.0.0', sections: [{ title: 'Changes', notes: ['Change'] }] },
    ])
  })
})
