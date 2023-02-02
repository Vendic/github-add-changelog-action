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
 * @param markdown
 */
export function extractEntriesFromMarkdown(markdown : string) : ChangelogEntry[] {
    core.info('Extracting entries from markdown')
    core.debug('Searching through:')
    core.debug(markdown)
    const themesContent = markdown.match(/###[^#]+/mg);

    if (!Array.isArray(themesContent) || Array.isArray(themesContent) && themesContent.length === 0) {
        return []
    }
    core.info(`Found ${themesContent.length} themes.`)
    themesContent.forEach((themesContent) => {
        core.debug('Theme content is:')
        core.debug(themesContent)
    })

    let changeLogEntries : ChangelogEntry[] = []
    const themes = Object.values(Themes)
    themes.forEach((section) => {
        let regex  = new RegExp('##\\s{1}' + section)
        let themeContent = themesContent.find((themeContent) => {
            return regex.test(themeContent)
        })

        if (typeof themeContent !== "string") {
            return
        }

        core.info(`Section: ${section} found. `)
        core.debug(`Value: ${themeContent}`)

        // Split the content based on newlines, then check if we are dealing with a list.
         themeContent
             // Replace \r\n with \n
             .replace('\\r\\n', '\n')
             // After several tests I found out that this regex is the most reliable
             // It splits on both \r\n and \n. The Github PR body that I tested contained \r\n line breaks
            .split(/(\r\n|\n)/)
            .filter((line) => {
                return /^-\s{1}.*$/.test(line)
            })
            .forEach((filteredLine)  => {
                changeLogEntries.push({
                    text: filteredLine.replace(/(^-\s|\r\n|\n|\r)/, ''),
                    type: section.toLowerCase()
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
export function extractChangelogSection(body: string) : string {
    core.debug('PR body:')
    core.debug(JSON.stringify(body))

    if (typeof body !== "string") {
        throw new Error('Pull request has no body')
    }

    // @ts-ignore
    const matches = body.match(/#{2,3}\s[Cc]hangelog[\S\s]+/g);
    if (!Array.isArray(matches) || matches.length !== 1) {
        core.info('Cannot extract CHANGELOG from body')
    }
    const changelogSection = matches[0]

    if (typeof changelogSection !== 'string') {
        throw new Error('Changelog missing in pull request body!')
    }

    core.debug(`Matching section:`)
    core.debug(changelogSection)

    return changelogSection
}
