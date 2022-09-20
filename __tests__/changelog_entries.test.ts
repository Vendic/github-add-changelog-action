import {expect, test} from '@jest/globals'
import {extractChangelogSection, extractEntriesFromMarkdown, ChangelogEntry} from '../src/changelog_entries'
import fs from "fs";

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

test('Extract CHANGELOG section from pull request body', async () => {
    const fileContents = fs.readFileSync(__dirname + '/pr_body.md', 'utf8')
    const expectedResult = '## Changelog\n' +
        '### Changed\n' +
        '- [Hello](World) Hello world\n' +
        '- [Hello](World) Hello world 2\n' +
        '- [Hello](World) Hello world 3';


    expect(extractChangelogSection(fileContents)).toEqual(expectedResult)
})
