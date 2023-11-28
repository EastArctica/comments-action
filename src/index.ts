import { info, isDebug, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { PushEvent } from '@octokit/webhooks-types';
import { diffCss } from 'diff';
import { css_beautify } from 'js-beautify';

const token = process.env.GITHUB_TOKEN

function latexEscape(str) {
    // https://stackoverflow.com/a/1629466
    return str
        .replaceAll('\\', '\\\\\\')
        .replaceAll('{', '\\\\{')
        .replaceAll('}', '\\\\}')
        .replaceAll('_', '\\\\_')
        .replaceAll('^', '\\\\^')
        .replaceAll('#', '\\\\#')
        .replaceAll('&', '\\\\&')
        .replaceAll('$', '\\\\$')
        .replaceAll('%', '\\\\%')
        .replaceAll('~', '\\\\~');
}

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
                let rawDiff = diffCss(css_beautify(oldContent, { indent_size: 2 }),
                    css_beautify(newContent, { indent_size: 2 }));
                let semiFinalStr = '';
                
                rawDiff.forEach((part) => {
                    // green for additions, red for deletions
                    // grey for common parts
                    const color = part.added ? 'green' :
                        part.removed ? 'red' : false;
                
                    // Every line needs to be wrapped in `$\texttt{`
                    part.value.split('\n').forEach((val, i, arr) => {
                        // Every space at the beginning
                        let totalSpaces = 0;
                        while (val.slice(0, 1) == ' ') {
                            totalSpaces++;
                            val = val.slice(1);
                        }
                        if (totalSpaces > 0) {
                            semiFinalStr += `\\hspace\\{${(totalSpaces / 2)}em\\}`;
                        }
                
                        if (color) {
                            semiFinalStr += `\\color{${color}}`
                        }
                
                        semiFinalStr += latexEscape(val);
                
                        // The last item doesn't need a new line
                        if (i !== arr.length - 1) {
                            semiFinalStr += '\n';
                        }
                    })
                });
                
                semiFinalStr.split('\n').forEach(line => {
                    diff += `$\\texttt{${line}}$\n`;
                });

                let split = diff.split('\n');
                let newLines = [];
                for (let i = 0; i < split.length; i++) {
                    // if we have a colored(changed) line within 5, keep this line
                    for (let j = -5; j < 5; j++) {
                        if (split[i + j].toString().includes('\\color{')) {
                            newLines.push(split[i]);
                            break;
                        }
                    }
                }
                diff = newLines.join('\n');
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
        }
    } catch (error) {
        setFailed(isDebug() ? error.stack : error.message);
    }
})();
