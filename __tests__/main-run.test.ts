import * as github from '@actions/github'
import * as core from '@actions/core'
import run from '../src/run'
import path from "path";
import * as fs from "fs";
import {WebhookPayload} from "@actions/github/lib/interfaces";
import {expect, test} from '@jest/globals'

test('Test main run', async () => {
    // Mocks
    const failedMock = jest.spyOn(core, 'setFailed');
    const infoMock = jest.spyOn(core, 'info');
    const payloadPath = path.join(__dirname, 'pull_request_context.json');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'))
    github.context.payload = payload as WebhookPayload

    await run()

    // Assertions
    expect(failedMock).toHaveBeenCalledTimes(0);
    expect(infoMock).toHaveBeenCalledWith('CHANGELOG.md was updated.')
})

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    delete process.env['INPUT_TOKEN']
    delete process.env['INPUT_COMMITTER_USERNAME']
    delete process.env['INPUT_COMMITTER_EMAIL']
})
