import { info, isDebug, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { PushEvent } from '@octokit/webhooks-types';
import { generateDiff } from './diff.js';
import ansiToSvg from 'ansi-to-svg';
import { Blob } from 'buffer';
import { uploadFile } from './uploader.js';

const token = process.env.GITHUB_TOKEN;
const uploadToken = process.env.UPLOAD_TOKEN;

!(async () => {
    try {
        if (!token) {
            return setFailed('Invalid GITHUB_TOKEN');
        }
        if (!uploadToken) {
            return setFailed('Invalid UPLOAD_TOKEN');
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

            let diff = '';
            try {
                const rawDiff = generateDiff(oldContent, newContent).trim();
                let svg = ansiToSvg(rawDiff, {
                    // Defaults to  2x for Retina compatibility
                    scale: 2,
                
                    // This doesn't work. I don't know why.
                    // fontFace: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
                    // fontSize: 12,
                    lineHeight: 16,
                
                    // Padding
                    paddingTop: 16,
                    paddingLeft: 16,
                    paddingBottom: 16,
                    paddingRight: 16,
                
                    // Or override the default colors
                    // (all defaults shown here)
                    colors: {
                        // Standard markdown diff colors
                        white: 'rgb(230, 237, 243)',
                        red: 'rgb(255, 220, 215)',
                        green: 'rgb(175, 245, 180)',
                        bgGreen: 'rgb(3, 58, 22)',
                        bgRed: 'rgb(103, 6, 12)',
                        backgroundColor: 'rgb(22, 27, 34)',
                
                        // Vibrant colors
                        // red: '#ff0000',
                        // green: '#008000',
                        // backgroundColor: '#0d1117'
                    }
                }).replace('SauceCodePro Nerd Font, Source Code Pro, Courier', 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace');                

                const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                const upload = await uploadFile(uploadToken, svgBlob, 'diff.svg');

                diff = `\`${commitFile.filename}\`\n![](https://i.eastarcti.ca/${upload.url})`;
            } catch (e) {
                console.log(e);
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
        }
    } catch (error) {
        setFailed(isDebug() ? error.stack : error.message);
    }
})();
