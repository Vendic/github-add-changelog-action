import {expect, test} from '@jest/globals'
import {extractChangelogSection, extractEntriesFromMarkdown, ChangelogEntry} from '../src/changelog_entries'
import fs from "fs";

test('Extract nothing from markdown', async () => {
    const text = 'Some other text, definitely not a changelog.'
    const expectedOutput : ChangelogEntry[] = []

    expect(extractEntriesFromMarkdown(text)).toEqual(expectedOutput)
})

test('Extract changelog entries with leading spaces', async () => {
    const txtWithLeadingSpace = `## Changelog
### Changed
- [TEST-123](https://www.vendic.nl/) Some change
 - [TEST-123](https://www.vendic.nl/) Some change 2

### Removed
 - [TEST-123](https://www.vendic.nl/) Removal of something`


    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[TEST-123](https://www.vendic.nl/) Some change',
            type: 'changed'
        },
        {
            text: '[TEST-123](https://www.vendic.nl/) Some change 2',
            type: 'changed'
        },
        {
            text: '[TEST-123](https://www.vendic.nl/) Removal of something',
            type: 'removed'
        }
    ]

    expect(extractEntriesFromMarkdown(txtWithLeadingSpace)).toEqual(expectedOutput)
})


test('Extract single changelog entries fetched via the Github API', async () => {
    const txt = `## Changelog\\r\\n### Changed\\r\\n- [Hello](World) Hello world\\r\\n- [Hello](World) Hello world\\r\\n`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[Hello](World) Hello world',
            type: 'changed'
        },
        {
            text: '[Hello](World) Hello world',
            type: 'changed'
        },
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract single changelog entry fetched via the Github API that ends with \r\n', async () => {
    const txt = `## Changelog\\r\\n### Changed\\r\\n- Change 123\\r\\n`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: 'Change 123',
            type: 'changed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})



test('Extract multiple changelog entries from markdown with regular line breaks', async () => {
    const txt = `## Changelog
### Changed
- [TEST-123](https://www.vendic.nl/) Some change
- [TEST-123](https://www.vendic.nl/) Some change 2

### Removed
- [TEST-123](https://www.vendic.nl/) Removal of something`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[TEST-123](https://www.vendic.nl/) Some change',
            type: 'changed'
        },
        {
            text: '[TEST-123](https://www.vendic.nl/) Some change 2',
            type: 'changed'
        },
        {
            text: '[TEST-123](https://www.vendic.nl/) Removal of something',
            type: 'removed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Changelog Entry with numbered change is extracted properly', async () => {
    const txt = `## Changelog
### Changed
- [#1234](/hello-world) Test changelog modification`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[#1234](/hello-world) Test changelog modification',
            type: 'changed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract multiple changelog entries from markdown with \r\n line breaks', async () => {
    const txt = '## Description\r\n<!-- Please include a summary of the changes and the related issue. Please also include relevant context. -->\r\n\r\n## How Has This Been Tested?\r\n<!-- Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration -->\r\n\r\n## Checklist:\r\n- [ ] My code is up to date with the development branch, i\'ve pulled in the latest changes\r\n- [ ] I\'ve added the build label to my PR\r\n\r\n## Changelog\r\n### Changed\r\n- [Hello](World) Hello world\r\n- [Hello](World) Hello world 2\r\n- [Hello](World) Hello world 3\r\nSomething that\'s not the correct format\r\n\r\n## Deprecated (incorrect)\r\n- [Hello](World) Incorrect deprecated change\r\n\r\n### Fixed\r\n- [A fix](www.vendic.nl) Fixed\r\n- A great fix!\r\n'
    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[Hello](World) Hello world',
            type: 'changed'
        },
        {
            text: '[Hello](World) Hello world 2',
            type: 'changed'
        },
        {
            text: '[Hello](World) Hello world 3',
            type: 'changed'
        },
        {
            text: '[A fix](www.vendic.nl) Fixed',
            type: 'fixed'
        },
        {
            text: 'A great fix!',
            type: 'fixed'
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
        '- [Hello](World) Hello world 3\n' +
        '\n' +
        '### Deprecated\n' +
        '- [Hello](World) Hello\n' +
        '\n' +
        '### Fixed\n' +
        '- [A fix](www.vendic.nl) Fixed\n'

    expect(extractChangelogSection(fileContents)).toEqual(expectedResult)
})



test('Extract changelog entry with a blank line after the theme heading', async () => {
    const txt = `## Changelog

### Changed

- Update @playwright/test to 1.65.0 for the end-to-end tests
`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: 'Update @playwright/test to 1.65.0 for the end-to-end tests',
            type: 'changed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract changelog entries separated by blank and whitespace-only lines', async () => {
    const txt = `## Changelog
### Fixed
- [ABC-123](https://getfrost.app/task/ABC-123) First fix

- [ABC-124](https://getfrost.app/task/ABC-124) Second fix
   \t
* Third fix`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[ABC-123](https://getfrost.app/task/ABC-123) First fix',
            type: 'fixed'
        },
        {
            text: '[ABC-124](https://getfrost.app/task/ABC-124) Second fix',
            type: 'fixed'
        },
        {
            text: 'Third fix',
            type: 'fixed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract changelog entries from CRLF body with blank lines inside themes', async () => {
    const txt = '## Description\r\nSome description\r\n\r\n## Changelog\r\n\r\n### Added\r\n\r\n- [ABC-1](https://getfrost.app/task/ABC-1) New feature\r\n\r\n- Another feature\r\n\r\n### Removed\r\n\r\n- Old feature\r\n'

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[ABC-1](https://getfrost.app/task/ABC-1) New feature',
            type: 'added'
        },
        {
            text: 'Another feature',
            type: 'added'
        },
        {
            text: 'Old feature',
            type: 'removed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract changelog entries from escaped CRLF (literal \\r\\n) body with blank lines inside themes', async () => {
    const txt = `## Changelog\\r\\n\\r\\n### Changed\\r\\n\\r\\n- Change 123\\r\\n`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: 'Change 123',
            type: 'changed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract multiple themes separated by blank lines and stop at the next heading', async () => {
    const txt = `## Changelog

### Changed

- [ABC-123](https://getfrost.app/task/ABC-123) Some change


### Fixed

- [ABC-124](https://getfrost.app/task/ABC-124) Some fix

## Screenshots

- Not a changelog entry

### Notes

- Not a changelog entry either`

    const expectedOutput : ChangelogEntry[] = [
        {
            text: '[ABC-123](https://getfrost.app/task/ABC-123) Some change',
            type: 'changed'
        },
        {
            text: '[ABC-124](https://getfrost.app/task/ABC-124) Some fix',
            type: 'fixed'
        }
    ]

    expect(extractEntriesFromMarkdown(txt)).toEqual(expectedOutput)
})

test('Extract changelog entry from a full pull request body with blank lines inside the theme', async () => {
    const body = '## Description\r\n\r\nUpdate Playwright.\r\n\r\n## Changelog\r\n\r\n### Changed\r\n\r\n- Update @playwright/test to 1.65.0 for the end-to-end tests\r\n'
    const changelogSection = extractChangelogSection(body)

    const expectedOutput : ChangelogEntry[] = [
        {
            text: 'Update @playwright/test to 1.65.0 for the end-to-end tests',
            type: 'changed'
        }
    ]

    expect(extractEntriesFromMarkdown(changelogSection)).toEqual(expectedOutput)
})
