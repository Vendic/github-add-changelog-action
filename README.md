# Pull request changelog entries action [![Tests](https://github.com/Vendic/github-add-changelog-action/actions/workflows/tests.yml/badge.svg)](https://github.com/Vendic/github-add-changelog-action/actions/workflows/tests.yml)
A GitHub actions that:
1. Extracts changelog entries from a pull request body
2. Adds the changelog entries to the CHANGELOG.md after merge

## Avoiding changelog merge conflicts
Af [Vendic](https://vendic.nl/) every pull request needs a change in CHANGELOG.md. We follow the [keep a changelog](https://keepachangelog.com/en/1.0.0/) format. It costs a lot of time to fix the merge conflicts that come from mulltiple pull requests that are modifying the changelog.

After a lengthy internal discussion, we had the idea that we could extract the changelog entries (using regular expressions) from the pull request body after the PR is merged. Next, we would add it to the CHANGELOG.md using a [NodeJS keep a changelog library](https://github.com/oscarotero/keep-a-changelog) and some [git](https://www.npmjs.com/package/simple-git) actions. 

This repo is a result of that idea and it contains the workflows that you need to work with changelogs merge conflict-free.

## Usage
Internally we are using a [pull request template](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository) so that the pull requests are consistent:
```html
## Description
<!-- Please include a summary of the changes and the related issue. Please also include relevant context. -->

## How Has This Been Tested?
<!-- Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce. Please also list any relevant details for your test configuration -->

## Changelog
<!-- Available topics: Added, Changed, Deprecated, Removed, Fixed, Security -->
### Changed
<!-- Add bullet list of changes here -->

### Fixed
<!-- Add bullet list of fixes here -->
```

Actions workflow:
```yml
name: Modify changelog

on:
  pull_request:
    types: [ closed ]

jobs:
  modify_changelog:
    name: Modify changelog
    if: ${{ github.event.pull_request.merged == true }}
    runs-on: ubuntu
    steps:
      - name: Extract changelog entries from PR body and modify CHANGELOG.md
        uses: Vendic/github-add-changelog-action@develop
        with:
          committer_username: "YourUserName"
          committer_email: YourEmail@gmail.com
          token: ${{ secrets.YOUR_GITHUB_TOKEN }}
```

In addition to that we also check if every pull request body contains a Changelog section:
```yml
name: Pull request actions

on:
  pull_request:
    types: [ opened, synchronize ]

jobs:
  check_changelog_message:
    name: Check changelog message
    runs-on: ubuntu
    steps:
      - name: Chck if PR body contains changelog entries
        run: |
          echo "${{ github.event.pull_request.body }}" | grep "## Changelog"
```
