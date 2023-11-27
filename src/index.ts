import { info, isDebug, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { PushEvent } from '@octokit/webhooks-types';
import { diffCss } from 'diff';

const token = process.env.GITHUB_TOKEN

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

        const oldTree = await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: payload.before,
        });

        for (const commitFile of commit.data.files) {
            if (commitFile.status !== 'modified' || (commitFile.filename !== 'shared.current.css' && commitFile.filename !== 'app.current.css')) {
                continue;
            }

            console.log(`${commitFile.filename} was modified.`);
            console.log(commitFile);

            let newFileSha = commitFile.sha;
            const oldFileSha = oldTree?.data?.tree?.find?.(file => file.path === commitFile.filename)?.sha;
            if (!oldFileSha) {
                return info('Failed to find old file.');
            }

            const oldFile = await octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: oldFileSha
            });
            const newFile = await octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: newFileSha,
            });



            const oldContent = Buffer.from(oldFile.data.content, 'base64').toString('utf8');
            const newContent = Buffer.from(newFile.data.content, 'base64').toString('utf8');

            let diff: string;
            try {
                console.log(oldContent.length, newContent.length);
                let rawDiff = diffCss(oldContent, newContent);
                rawDiff.forEach(part => {
                    if (part.added) {
                        diff += `+ ${part.value}`;
                    } else if (part.removed) {
                        diff += `- ${part.value}`;
                    }            
                });

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
