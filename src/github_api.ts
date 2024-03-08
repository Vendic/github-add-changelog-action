import { Octokit } from "@octokit/action";

export async function getPullRequestById(token: string, owner: string, repo: string, prNumber: number) {
    const octokit = new Octokit({auth: token });
    const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
    });

    return data;
}
