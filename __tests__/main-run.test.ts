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
    const payloadPath = path.join(__dirname, 'pull_request_context.json');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'))
    github.context.payload = payload as WebhookPayload

    await run()

    // Assertions
    expect(failedMock).toHaveBeenCalledTimes(0);
})

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    delete process.env['INPUT_TOKEN']
})
