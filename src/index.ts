import { info, isDebug, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import type { PushEvent } from '@octokit/webhooks-types';
import { diffCss } from 'diff';
import { css_beautify } from 'js-beautify';

const sourceMapRegex = /\/\*# sourceMappingURL=.*?\.map\*\//g;
const token = process.env.GITHUB_TOKEN

function latexEscape(str: string) {
    // https://stackoverflow.com/a/1629466
    return str
        .replaceAll('\\', '\\\\\\')
        .replaceAll('{', '\\\\{')
        .replaceAll('}', '\\\\}')
        .replaceAll('_', '\\\\\\_') // I have no clue why this needs 3
        .replaceAll('^', '\\\\^')
        .replaceAll('#', '\\\\#')
        .replaceAll('&', '\\\\&')
        .replaceAll('$', '\\\\$')
        .replaceAll('%', '\\\\%')
        .replaceAll('~', '\\\\~')
        .replaceAll('*', '\\*')
        .replaceAll('`', '\\`')
        .replaceAll('@', '{@}'); // This makes no sense but you need it
}

function generateDiff(oldCss: string, newCss: string) {
    // Beautify & skip source mapping
    let oldBeautified = css_beautify(oldCss, { indent_size: 2 }).replaceAll(sourceMapRegex, '');
    let newBeautified = css_beautify(newCss, { indent_size: 2 }).replaceAll(sourceMapRegex, '');
    let changes = diffCss(oldBeautified, newBeautified);

    let latexedChanges: { change: Diff.Change, str: string}[] = [];
    changes.forEach((change) => {
        // green for additions, red for deletions
        // grey for common parts
        const color = change.added ? 'green' : change.removed ? 'red' : false;

        let latexedChange = {
            change,
            str: ''
        };

        change.value.split('\n').forEach((val, i, arr) => {
            // Github/markdown by default won't render spaces at the beginning of lines. This fixes that.
            let totalSpaces = 0;
            while (val.slice(0, 1) == ' ') {
                totalSpaces++;
                val = val.slice(1);
            }

            // Minor optimization to prevent an hspace with 0em size
            if (totalSpaces > 0) {
                latexedChange.str += `\\hspace\\{${(totalSpaces / 2)}em\\}`;
            }

            // Minor optimization, only add color if we need
            if (color) {
                latexedChange.str += `\\color{${color}}`
            }

            latexedChange.str += latexEscape(val);

            // The last item doesn't need a new line
            if (i !== arr.length - 1) {
                latexedChange.str += '\n';
            }
        });

        latexedChanges.push(latexedChange);
    });


    // Finalize the latex
    latexedChanges.forEach((change, i) => {
        let newStr = '';
        change.str.split('\n').forEach(line => {
            // Every line needs to be wrapped in latex to maintain monospace font throughout the comment.
            newStr += `$\\texttt{${line}}$\n`;
        });
        latexedChanges[i].str = newStr;
    });

    let diff = '';
    // Only keep 5 lines around modifications
    latexedChanges.forEach((change, i) => {
        // If nothing happened in this change, skip it
        if (!change.change.added && !change.change.removed) {
            return;
        }

        // Add header
        diff += `\n@@ -some_line,${change.change.value.length} @@\n`;

        if (latexedChanges[i - 1]) {
            // If we have a previous change, add the last 5 lines from it
            latexedChanges[i - 1].str.split('\n').slice(-5).forEach((line, i, arr) => {
                diff += `${line}`;
                if (i !== arr.length - 1) {
                    diff += '\n';
                }
            });
        }

        // Add the changes themselves
        diff += change.str;

        if (latexedChanges[i + 1]) {
            // If we have a future change, add the first 5 lines from it
            latexedChanges[i + 1].str.split('\n').slice(0, 5).forEach((line, i, arr) => {
                diff += `${line}`;
                if (i !== arr.length - 1) {
                    diff += '\n';
                }
            });
        }
    });


    return diff;
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
                diff = generateDiff(oldContent, newContent);
                // Prepend the file name
                diff = `${commitFile.filename}\n${diff}`;
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
