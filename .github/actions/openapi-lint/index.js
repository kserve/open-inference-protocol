const openapi = require('@redocly/openapi-core');
const yamlAst = require('yaml-ast-parser');
const core = require('@actions/core');
const github = require('@actions/github');
const {GITHUB_SHA, GITHUB_EVENT_PATH, GITHUB_TOKEN, GITHUB_WORKSPACE} = process.env;
const yaml = require('js-yaml');
const path =  require('path');
import {yellow, red} from 'colorette';

const batch = (size, inputs) => inputs.reduce((batches, input) => {
    const current = batches[batches.length - 1]

    current.push(input)

    if (current.length === size) {
        batches.push([])
    }

    return batches
}, [[]]);

const stats = function (annotations) {
    const annotationsPerLevel = annotations.reduce((acc, annotation) => {
        const level = annotation.annotation_level
        let annotations
        if (level in acc) {
            annotations = acc[level]
        } else {
            annotations = []
            acc[level] = annotations
        }
        annotations.push(annotation)
        return acc
    }, {})
    const failureCount = (annotationsPerLevel['failure'] || []).length || 0
    const warningCount = (annotationsPerLevel['warning'] || []).length || 0
    const noticeCount = (annotationsPerLevel['notice'] || []).length || 0
    return { failureCount, warningCount, noticeCount }
}

const generateConclusion = function (failureCount, warningCount, noticeCount) {
    let conclusion = 'success'
    if (failureCount > 0) {
        conclusion = 'failure'
    } else if (warningCount > 0 || noticeCount > 0) {
        conclusion = 'neutral'
    }
    return conclusion
}

const generateSummary = function (failureCount, warningCount, noticeCount) {
    const messages = []
    if (failureCount > 0) {
        messages.push(`${failureCount} failure(s) found`)
    }
    if (warningCount > 0) {
        messages.push(`${warningCount} warning(s) found`)
    }
    if (noticeCount > 0) {
        messages.push(`${noticeCount} notice(s) found`)
    }
    return messages.join('\n')
}

function getLineColLocation(location) {
    if (location.pointer === undefined) return location;

    const { source, pointer, reportOnKey } = location;
    const ast = source.getAst(yaml.safeLoad);
    const astNode = getAstNodeByPointer(ast, pointer, !!reportOnKey);
    let startPosition = 1;
    let endPosition = 1;
    if(astNode !== undefined && astNode.startPosition !== undefined)
        startPosition = astNode.startPosition;
    if(astNode !== undefined && astNode.endPosition !== undefined)
        endPosition = astNode.endPosition;
    const pos = positionsToLoc(source.body, startPosition, endPosition);
    return {
        ...pos
    };
}

function positionsToLoc(
    source,
    startPos,
    endPos,
) {
    let currentLine = 1;
    let currentCol = 1;
    let start = { line: 1, col: 1 };

    for (let i = 0; i < endPos - 1; i++) {
        if (i === startPos - 1) {
            start = { line: currentLine, col: currentCol + 1 };
        }
        if (source[i] === '\n') {
            currentLine++;
            currentCol = 1;
            if (i === startPos - 1) {
                start = { line: currentLine, col: currentCol };
            }

            if (source[i + 1] === '\r') i++; // TODO: test it
            continue;
        }
        currentCol++;
    }

    const end = startPos === endPos ? { ...start } : { line: currentLine, col: currentCol + 1 };
    return { start, end };
}

function unescapePointer(fragment) {
    return decodeURIComponent(fragment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function parsePointer(pointer) {
    return pointer.substr(2).split('/').map(unescapePointer);
}

function getAstNodeByPointer(root, pointer, reportOnKey) {
    const pointerSegments = parsePointer(pointer);
    if (root === undefined) {
        return undefined;
    }

    let currentNode = root;
    for (const key of pointerSegments) {
        if (currentNode.kind === yamlAst.Kind.MAP) {
            const mapping = currentNode.mappings.find((m) => m.key.value === key);
            if (!mapping || !mapping.value) break;
            currentNode = mapping.value;
        } else if (currentNode.kind === yamlAst.Kind.SEQ) {
            const elem = currentNode.items[parseInt(key, 10)];
            if (!elem) break;
            currentNode = elem;
        }
    }

    if (!reportOnKey) {
        return currentNode;
    } else {
        const parent = currentNode.parent;
        if (!parent) return currentNode;
        if (parent.kind === yamlAst.Kind.SEQ) {
            return currentNode;
        } else if (parent.kind === yamlAst.Kind.MAPPING) {
            return parent.key;
        } else {
            return currentNode;
        }
    }
}

async function exec () {
    let lintResults;
    try {
        const file = core.getInput('file', {required: true});
        const config = await openapi.loadConfig(undefined);
        config.styleguide.resolveIgnore(path.join(process.cwd(), ".redocly.lint-ignore.yaml"))
        lintResults = await openapi.lint({
            ref: file,
            config: config
        });

        const totals = openapi.getTotals(lintResults);
        if (totals.ignored > 1) {
            console.log(yellow(`${totals.ignored} problems are explicitly ignored.`))
        } else if (totals.ignored === 1) {
            console.log(yellow(`${totals.ignored} problem is explicitly ignored.`))
        }
        console.log(yellow(`Total Warnings: ${totals.warnings}\t`) + red(`Total Errors: ${totals.errors}`))

        lintResults = lintResults.filter((m) => !m.ignored);

        const findings = [];
        for (let i = 0; i < lintResults.length; i++) {
            const finding = lintResults[i];
            const location = finding.location[0];
            const line = getLineColLocation(location);
            findings.push({
                path: file,
                start_line: line.start.line,
                end_line: line.end.line,
                title: `${finding.ruleId} - ${location.pointer}`,
                message: finding.message,
                annotation_level: finding.severity === 'error' ? 'failure' : finding.severity === 'warn' ? 'warning' : 'notice'
            });
        }

        console.table(findings);

        const octokit = new github.getOctokit(core.getInput('github_token', {required: true}));
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const title = 'Open API Lint Check';
        const {failureCount, warningCount, noticeCount} = stats(findings);
        const conclusion = generateConclusion(failureCount, warningCount, noticeCount);
        const summary = generateSummary(failureCount, warningCount, noticeCount);
        let sha = github.context.sha;
        if (github.context.payload.pull_request && github.context.payload.pull_request.head.sha)
            sha = github.context.payload.pull_request.head.sha;

        const createCheckRunData = {
            owner,
            repo,
            name: title,
            head_sha: sha,
            status: 'in_progress',
            started_at: new Date()
        };
        const data = await octokit.checks.create(createCheckRunData);
        const checkRunId = data.data.id;

        console.log(`Check Run Id - ${checkRunId}`);

        const batchFindings = batch(50, findings);
        for (let i = 0; i < batchFindings.length; i++) {
            const annotations = batchFindings[i];
            const updateData = {
                owner,
                repo,
                name: data.data.name,
                check_run_id: checkRunId,
                status: 'completed',
                completed_at: new Date(),
                conclusion,
                output: {
                    title,
                    summary,
                    annotations
                }
            };
            try {
                await octokit.checks.update(updateData);
            } catch {
                console.error('Unable to post annotation batch');
            }
        }
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

exec();
