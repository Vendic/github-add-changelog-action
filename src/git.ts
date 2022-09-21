import {SimpleGit} from "simple-git";
import * as core from "@actions/core";

const REMOTE = 'auth';

export async function clone(token: string, remote: string, dir: string, git: SimpleGit) {
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
async function getAuthanticatedUrl(token: string, url: string): Promise<string> {
    const arr = url.split('//');
    return `https://${token}@${arr[arr.length - 1]}.git`;
};

export async function isChangelogChanged(git: SimpleGit): Promise<boolean> {
    const status = await git.status();
    core.debug('DEBUG: List of differences spotted in the repository');
    core.debug(JSON.stringify(status, null, 2));

    return status.files.length > 0;
}

export async function push(message: string, committerUsername: string, committerEmail: string, git: SimpleGit): Promise<void> {
    if (core.isDebug()) require('debug').enable('simple-git');
    core.info('Pushing changes to remote');

    await git.addConfig('user.name', committerUsername);
    await git.addConfig('user.email', committerEmail);
    await git.commit(message);
    await git.push();
}
