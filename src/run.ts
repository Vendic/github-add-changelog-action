import * as core from '@actions/core'
import * as github from '@actions/github'
import {simpleGit, SimpleGit, SimpleGitOptions} from "simple-git";
import path from "path";
import {existsSync, mkdirSync} from "fs";



export default async function run(): Promise<void> {
    try {
        core.debug('Starting task id extraction.')
        const token = process.env.GITHUB_TOKEN || core.getInput('token')
        // const changelog_input = core.getInput('changelog_input');
        // const octokit = github.getOctokit(token)
        // const pull_request = github.context.payload.pull_request ?? github.context.payload.event.pull_request
        const repoUrl = github.context.payload.repositoryUrl
        // const body = pull_request.body



        // Creating folder where repo will be cloned + init git client
        const dir = path.join(process.cwd(), './clones');
        await mkdirSync(dir)

        const options: Partial<SimpleGitOptions> = {
            baseDir: dir,
            binary: 'git',
            maxConcurrentProcesses: 1,
            trimmed: false
        }
        const git : SimpleGit = simpleGit(options);

        // Clone repo and check changelog file
        await clone(token, repoUrl, dir, git);
        await checkIfChangelogExists(dir)

        // Change CHANGELOG.md

        // Push to development branch

    } catch (error) {
        core.setFailed(`Action failed: ${error}`)
    }
}

// @ts-ignore
async function clone(token: string, remote : string, dir: string, git: SimpleGit) {
    const REMOTE = 'auth';
    core.info(`Cloning ${remote}`);
    const remoteWithToken = await getAuthanticatedUrl(token, remote);
    await git.clone(remoteWithToken, dir, {'--depth': 1});
    await git.addRemote(REMOTE, remoteWithToken);
}

/**
 * Creates a url with authentication token in it
 *
 * @param  {String} token access token to GitHub
 * @param  {String} url repo URL
 * @returns  {String}
 */
async function getAuthanticatedUrl(token : string, url : string) : Promise<string> {
    const arr = url.split('//');
    return `https://${token}@${arr[arr.length - 1]}.git`;
};

async function checkIfChangelogExists(dir : string) {
    const changelogPath = `${dir}/CHANGELOG.md`
    if (existsSync(changelogPath) === false) {
        throw new Error('Repo has no CHANGELOG.md')
    }
 }
