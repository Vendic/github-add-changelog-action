import * as core from '@actions/core'
import {simpleGit, SimpleGit, SimpleGitOptions} from "simple-git";
import path from "path";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync} from "fs";
import {Changelog, parser, Release} from "keep-a-changelog";
import {randomBytes} from "crypto";
import {clone, push, isChangelogChanged} from './git'
import {ChangelogEntry, extractEntriesFromMarkdown, extractChangelogSection} from "./changelog_entries";
import {getPullRequestById} from "./github_api";

export default async function run(): Promise<void> {
    try {
        core.debug('Starting updating CHANGELOG.md')
        const token = process.env.GITHUB_TOKEN || core.getInput('token')
        const commitMessage = core.getInput('commit_message') ?? 'Update CHANGELOG.md'
        const committerUsername = core.getInput('committer_username');
        const committerEmail = core.getInput('committer_email');
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const prNumber = core.getInput('pr_number');
        const localChangelogPath = core.getInput('local_changelog_file_path') ?? null

        core.info(`Starting updating CHANGELOG.md for ${owner}/${repo}. PR: ${prNumber}`)

        if (token === '' || typeof token === 'undefined') {
            throw new Error('Input token is missing or empty.')
        }

        const pullRequest = await getPullRequestById(token, owner, repo, parseInt(prNumber))
        let body = pullRequest.body
        if (body === null) {
            core.info('Pull request body is empty')
            return
        }

        // Remove for double quotes at the start or end of body
        body = body.replace(/(^"|"$)/g, '');

        core.info(`Searching through pull request body for changelog section:`)
        core.info(body)

        const changelogSection = extractChangelogSection(body)
        core.info(`Found changelog section in pull request body`)
        core.debug(changelogSection)

        // Extract changelog sections
        const changelogEntries : ChangelogEntry[] = extractEntriesFromMarkdown(changelogSection);
        if (changelogEntries.length === 0) {
            core.warning('No changelog entries found in pull request')
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
        await clone(token, owner, repo, dir, git);
        const changelogPath = `${dir}/CHANGELOG.md`

        // Replace cloned changelog with the local one
        if (localChangelogPath) {
            if (existsSync(localChangelogPath) === false) {
                throw new Error(`Local changelog file does not exist: ${localChangelogPath}`)
            }
            core.info(`Replacing cloned changelog with local one: ${localChangelogPath}`)
            copyFileSync(localChangelogPath, changelogPath)
        }

        await checkIfChangelogExists(dir)

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
        await push(commitMessage, committerUsername, committerEmail, git)
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
