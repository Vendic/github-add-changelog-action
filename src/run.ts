import * as core from '@actions/core'
import * as github from '@actions/github'
import {simpleGit, SimpleGit, SimpleGitOptions} from "simple-git";
import path from "path";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "fs";
import {Changelog, parser, Release} from "keep-a-changelog";
import {randomBytes} from "crypto";
import {clone, push, isChangelogChanged} from './git'
import {ChangelogEntry, extractEntriesFromMarkdown, extractChangelogSection} from "./changelog_entries";

export default async function run(): Promise<void> {
    try {
        core.debug('Starting updating CHANGELOG.md')
        const token = process.env.GITHUB_TOKEN || core.getInput('token')
        const committerUsername = core.getInput('committer_username');
        const committerEmail = core.getInput('committer_email');
        const pull_request = github.context.payload.pull_request ?? github.context.payload.event.pull_request
        const repoUrl = github.context.payload.repositoryUrl

        // Extract changelog section
        const changelogSection = extractChangelogSection(pull_request.body)
        core.info(`Found changelog section in pull request body`)
        core.debug(changelogSection)

        // Extract changelog sections
        const changelogEntries : ChangelogEntry[] = extractEntriesFromMarkdown(changelogSection);
        if (changelogEntries.length === 0) {
            core.info('No changelog entries found in pull reuqest')
            return
        }

        // Creating folder where repo will be cloned + init git client
        const folder = './clone' + randomBytes(4).toString('hex')
        const dir = path.join(process.cwd(), folder);
        await mkdirSync(dir)

        const options: Partial<SimpleGitOptions> = {
            baseDir: dir,
            binary: 'git',
            maxConcurrentProcesses: 1,
            trimmed: false
        }
        const git: SimpleGit = simpleGit(options);

        // Clone repo and check changelog file
        await clone(token, repoUrl, dir, git);
        await checkIfChangelogExists(dir)

        const changelogPath = `${dir}/CHANGELOG.md`
        const changelogContent = readFileSync(changelogPath, {encoding: 'utf8', flag: 'r'});
        const changelog: Changelog = parser(changelogContent);
        const unreleased = getUnReleasedSection(changelog);

        // Add stuff to changelog
        core.info('Start changing CHANGELOG.md')
        changelogEntries.forEach((changelogEntry : ChangelogEntry) => {
            core.info(`Adding ${changelogEntry.text} to changelog. Text: ${changelogEntry.text}`)
            unreleased.addChange(changelogEntry.type, changelogEntry.text)
        })

        // Update changelog
        writeFileSync(changelogPath, changelog.toString())
        core.debug(`Changelog updated contents:`)
        core.debug(changelog.toString())

        // Check if  CHANGELOG.md was changed
        await git.add('./CHANGELOG.md');
        if (await isChangelogChanged(git) === false) {
            throw new Error('CHANGELOG.md was not changed!')
        }

        // Push to development branch
        await push('CHANGELOG.md updated', committerUsername, committerEmail, git)
        core.info('CHANGELOG.md was updated.')
        core.setOutput('changelog_updated', true)

        // Cleanup folder
        rmSync(dir, { recursive: true})

    } catch (error) {
        core.setFailed(`Action failed: ${error}`)
    }
}

async function checkIfChangelogExists(dir: string) {
    const changelogPath = `${dir}/CHANGELOG.md`
    if (existsSync(changelogPath) === false) {
        throw new Error('Repo has no CHANGELOG.md')
    }
}

/**
 * Get unreleased section from CHANGELOG.md or create one if it does not exist.
 * @param changelog
 */
function getUnReleasedSection(changelog: Changelog): Release {
    let unreleased: Release | undefined = changelog.releases.find((release) => {
        return release.version === undefined;
    })
    if (typeof unreleased === "undefined") {
        unreleased = new Release();
        changelog.addRelease(unreleased)
    }
    return unreleased;
}
