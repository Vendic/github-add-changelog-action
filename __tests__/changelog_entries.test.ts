import {expect, test} from '@jest/globals'
import {extractEntriesFromMarkdown, ChangelogEntry} from '../src/changelog_entries'

test('Extract nothing from markdown', async () => {
    const text = 'Some other text, definitely not a changelog.'
    const expectedOutput : ChangelogEntry[] = []

    expect(extractEntriesFromMarkdown(text)).toEqual(expectedOutput)
})

test('Extract multiple changelog entries from markdown', async () => {
    const txt = '## Changelog\n' +
        '### Changed\n' +
        '- [TEST-123](https://www.vendic.nl/) Some change\n' +
        '- [TEST-123](https://www.vendic.nl/) Some change 2\n' +
        '\n' +
        '### Removed\n' +
        '- [TEST-123](https://www.vendic.nl/) Removal of something\n'

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '- [TEST-123](https://www.vendic.nl/) Some change',
            type: 'changed'
        },
        {
            text: '- [TEST-123](https://www.vendic.nl/) Some change 2',
            type: 'changed'
        },
        {
            text: '- [TEST-123](https://www.vendic.nl/) Removal of something',
            type: 'removed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})
