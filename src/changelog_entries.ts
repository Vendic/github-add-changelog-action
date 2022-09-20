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
    const themesContent = markdown.match((/###(.|\s\S)*/g));

    if (!Array.isArray(themesContent) || Array.isArray(themesContent) && themesContent.length === 0) {
        return []
    }
    core.info(`Found ${themesContent.length} themes.`)

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

        core.debug(`Section: ${section} found. `)
        core.debug(`Value: ${themeContent}`)

        // Split the content based on newlines, then check if we are dealing with a list.
         themeContent
            .split('\n')
            .filter((line) => {
                return /^-\s{1}.*$/.test(line)
            })
            .forEach((filteredLine)  => {
                changeLogEntries.push({
                    text: filteredLine,
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
    const changelogSection = body.match(/##(.|\s\S)*/g).find((section : any) => {
        core.debug(`Section: ${section}`)
        if (typeof section !== 'string') {
            return false;
        }
        return /[#]{1,3}\s{1}[Cc]{1}hangelog/.test(section)
    })

    if (typeof changelogSection !== 'string') {
        throw new Error('Changelog missing in pull request body!')
    }

    core.debug(`Matching section: ${changelogSection}`)

    return changelogSection
}
