import { debug, info, isDebug, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import type { PushEvent } from '@octokit/webhooks-types'

const token = process.env.GITHUB_TOKEN
const currentFilename = 'current.js'

!(async () => {
    try {
        if (!token) {
            return setFailed('Invalid GITHUB_TOKEN');
        }

        const octokit = getOctokit(token);
        const { owner, repo } = context.repo;

        if (context.eventName !== 'push') {
            return;
        }

        const payload = context.payload as PushEvent;
        const commitSha = payload.after;

        const commit = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commitSha
        });

        if (!commit) {
            return setFailed('Failed to find commit.');
        }

        const currentTree = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: payload.before,
        });

        for (const file of commit.data.files) {
            if (file.status !== 'modified' || (file.filename !== 'shared.current.css' && file.filename !== 'app.current.css')) {
                continue;
            }

            console.log(`${file.filename} was modified.`);
            console.log(file);

            let fileSha = file.sha;
            const currentFileSha = currentTree?.data?.tree?.find?.(file => file.path === currentFilename)?.sha;
            if (!currentFileSha) {
                return info('Failed to find current file.');
            }

            const currentFile = await octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: currentFileSha
            });
            const newFile = await octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: fileSha,
            });



            const currentContent = Buffer.from(currentFile.data.content, 'base64').toString('utf8');
            const newContent = Buffer.from(newFile.data.content, 'base64').toString('utf8');

            let diff: string;
            try {
                console.log(currentContent, newContent);
                diff = 'idk if this workie';
            } catch (e) {
                return setFailed(`unable to diff strings: ${e}`);
            }

            if (!diff) {
                return info('no strings changed');
            }

            await octokit.rest.repos.createCommitComment({
                owner,
                repo,
                commit_sha: commitSha,
                body: diff
            });
            return info('created commit comment');
        }
    } catch (error) {
        setFailed(isDebug() ? error.stack : error.message);
    }
})();
