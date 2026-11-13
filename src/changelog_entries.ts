import * as core from '@actions/core'

export type ChangelogEntry = {
    text: string,
    type: string
}

enum Themes  {
    ADDED = 'Added',
    CHANGED = 'Changed',
    DEPRECATED = 'Deprecated',
    REMOVED = 'Removed',
    FIXED = 'Fixed',
    SECURITY = 'Security'
}

/**
 * Extract changelog entries from markdown text
 *
 * The markdown is scanned line by line. A theme section starts at a `### <Theme>` heading
 * and ends at the next markdown heading (`#`, `##`, `###`, ...) or at the end of the text.
 * Blank and whitespace-only lines inside a theme section are ignored, so these formats
 * are all accepted, just like the keep-a-changelog parser used by the PR validation:
 *
 * ### Changed
 *
 * - Some change
 *
 * - Another change
 *
 * @param markdown
 */
export function extractEntriesFromMarkdown(markdown : string) : ChangelogEntry[] {
    core.info('Extracting entries from markdown')
    core.debug('Searching through:')
    core.debug(markdown)

    const themes = Object.values(Themes)
    const entriesPerTheme = new Map<string, string[]>()

    const lines = markdown
        // Bodies fetched via the Github API can contain escaped "\r\n" sequences
        .replace(/\\r\\n/g, '\n')
        .split(/\r\n|\n|\r/)

    let currentTheme : string | null = null
    lines.forEach((line) => {
        const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*$/)
        if (heading) {
            currentTheme = null
            if (heading[1] !== '###') {
                return
            }
            const theme = themes.find((theme) => new RegExp('^' + theme + '\\b', 'i').test(heading[2]))
            if (typeof theme === 'string') {
                currentTheme = theme
                if (!entriesPerTheme.has(theme)) {
                    core.info(`Section: ${theme} found. `)
                    entriesPerTheme.set(theme, [])
                }
            }
            return
        }

        // Blank lines and other text (e.g. HTML comments) don't end a theme section
        // See https://regex101.com/r/4XYvpR/1
        if (currentTheme === null || !/^\s?[-*]\s.*$/.test(line)) {
            return
        }

        entriesPerTheme.get(currentTheme).push(line.trim().replace(/^[-*]\s/, ''))
    })

    core.info(`Found ${entriesPerTheme.size} themes.`)

    const changeLogEntries : ChangelogEntry[] = []
    themes.forEach((theme) => {
        (entriesPerTheme.get(theme) ?? []).forEach((text) => {
            changeLogEntries.push({
                text: text,
                type: theme.toLowerCase()
            })
        })
    })

    core.info(`Found ${changeLogEntries.length} changelog entries:`)
    changeLogEntries.forEach((changelogEntry : ChangelogEntry) => {
        core.info(`Type: ${changelogEntry.type}. Text: ${changelogEntry.text}`)
    })

    return changeLogEntries
}


/**
 * Extract changelog entries from PR body. The format should look like this:
 * ## Changelog
 * ... text
 *
 * @param body
 */
export function extractChangelogSection(body: string) : string | null {
    core.debug('PR body:')
    core.debug(JSON.stringify(body))

    if (typeof body !== "string") {
        throw new Error('Pull request has no body')
    }

    // @ts-ignore
    const matches = body.match(/#{2,3}\s[Cc]hangelog[\S\s]+/g);
    if (!Array.isArray(matches) || matches.length !== 1) {
        core.warning('Cannot extract CHANGELOG from body')
        return null
    }
    const changelogSection = matches[0]

    if (typeof changelogSection !== 'string') {
        core.warning('Cannot extract CHANGELOG from body')
        return null
    }

    core.debug(`Matching section: ${changelogSection}`);

    return changelogSection
}
