import { useMemo } from 'react'

import { formatDistanceStrict } from 'date-fns'
import { truncate } from 'lodash'
import { Observable, of, BehaviorSubject } from 'rxjs'
import { map } from 'rxjs/operators'

import { memoizeObservable } from '@sourcegraph/common'
import { dataOrThrowErrors, gql } from '@sourcegraph/http-client'
import { makeRepoURI } from '@sourcegraph/shared/src/util/url'
import { useObservable } from '@sourcegraph/wildcard'

import { requestGraphQL } from '../../backend/graphql'
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag'
import { GitBlameResult, GitBlameVariables } from '../../graphql-operations'

import { useBlameVisibility } from './useBlameVisibility'

interface BlameHunkDisplayInfo {
    displayName: string
    username: string
    dateString: string
    timestampString: string
    linkURL: string
    message: string
}

export type BlameHunk = NonNullable<
    NonNullable<NonNullable<GitBlameResult['repository']>['commit']>['blob']
>['blame'][number] & { displayInfo: BlameHunkDisplayInfo }

// TODO: Instead of GraphQL API use the `stream-blame` endpoint, stream hunks back
const fetchBlameViaGraphQL = memoizeObservable(
    ({
        repoName,
        revision,
        filePath,
    }: {
        repoName: string
        revision: string
        filePath: string
    }): Observable<Omit<BlameHunk, 'displayInfo'>[] | undefined> =>
        requestGraphQL<GitBlameResult, GitBlameVariables>(
            gql`
                query GitBlame($repo: String!, $rev: String!, $path: String!) {
                    repository(name: $repo) {
                        commit(rev: $rev) {
                            blob(path: $path) {
                                blame(startLine: 0, endLine: 0) {
                                    startLine
                                    endLine
                                    author {
                                        person {
                                            email
                                            displayName
                                            user {
                                                username
                                            }
                                        }
                                        date
                                    }
                                    message
                                    rev
                                    commit {
                                        url
                                    }
                                }
                            }
                        }
                    }
                }
            `,
            { repo: repoName, rev: revision, path: filePath }
        ).pipe(
            map(dataOrThrowErrors),
            map(({ repository }) => repository?.commit?.blob?.blame)
        ),
    makeRepoURI
)

interface RawStreamHunk {
    Author: {
        Name: string
        Email: string
        Date: string
    }
    CommitID: string
    EndByte: number
    EndLine: number
    Filename: string
    Message: string
    StartByte: number
    StartLine: number
}

const fetchBlameViaStreaming = memoizeObservable(
    ({
        repoName,
        revision,
        filePath,
    }: {
        repoName: string
        revision: string
        filePath: string
    }): Observable<Omit<BlameHunk, 'displayInfo'>[] | undefined> => {
        const hunks = new BehaviorSubject<Omit<BlameHunk, 'displayInfo'>[] | undefined>(undefined)
        let assembledHunks: Omit<BlameHunk, 'displayInfo'>[] = []
        let didEarlyFlush = false
        fetch(`/${repoName}${revision ? `@${revision}` : ''}/-/stream-blame/${filePath}`)
            .then(response => response.body)
            .then(async body => {
                if (body === null) {
                    throw new Error('No response')
                }

                const reader = body.getReader()
                let result
                let previousPartialResponse = ''
                while (!(result = await reader.read()).done) {
                    const rawString = previousPartialResponse + new TextDecoder('utf-8').decode(result.value)
                    previousPartialResponse = ''
                    const rows = rawString.split('\n')

                    for (const [index, row] of rows.entries()) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            const rawHunks: RawStreamHunk[] = JSON.parse(row)

                            for (const hunk of rawHunks) {
                                assembledHunks.push({
                                    startLine: hunk.StartLine,
                                    endLine: hunk.EndLine,
                                    message: hunk.Message,
                                    rev: revision,
                                    author: {
                                        date: hunk.Author.Date,
                                        person: {
                                            email: hunk.Author.Email,
                                            displayName: hunk.Author.Name,
                                            user: null,
                                        },
                                    },
                                    commit: {
                                        url: '',
                                    },
                                })
                            }

                            // For large responses we want to do a first render pass when we have
                            // a sensible amount of chunks loaded the first time. We batch the rest
                            // for the second flush after everything is assembled.
                            if (!didEarlyFlush && assembledHunks.length > 50) {
                                didEarlyFlush = true
                                hunks.next(assembledHunks)
                                // React will not re-render if the hunks array is the same reference.
                                // Since we need to create a new array, now is the best time since
                                // hunk count is still low.
                                assembledHunks = [...assembledHunks]
                            }
                        } catch (error) {
                            if (index === rows.length - 1) {
                                // When a JSON parse error happens, it's likely that the last row
                                // was only partially received. We store it and append it to the
                                // start of the next response.
                                previousPartialResponse = row
                                continue
                            }
                            throw error
                        }
                    }
                }
                hunks.next(assembledHunks)
            })
            .catch(error => {
                console.error(error)
            })

        return hunks
    },
    makeRepoURI
)

/**
 * Get display info shared between status bar items and text document decorations.
 */
const getDisplayInfoFromHunk = (
    { author, commit, message }: Omit<BlameHunk, 'displayInfo'>,
    sourcegraphURL: string,
    now: number
): BlameHunkDisplayInfo => {
    const displayName = truncate(author.person.displayName, { length: 25 })
    const username = author.person.user ? `(${author.person.user.username}) ` : ''
    const dateString = formatDistanceStrict(new Date(author.date), now, { addSuffix: true })
    const timestampString = new Date(author.date).toLocaleString()
    const linkURL = new URL(commit.url, sourcegraphURL).href
    const content = `${dateString} • ${username}${displayName} [${truncate(message, { length: 45 })}]`

    return {
        displayName,
        username,
        dateString,
        timestampString,
        linkURL,
        message: content,
    }
}

export const useBlameHunks = (
    {
        repoName,
        revision,
        filePath,
    }: {
        repoName: string
        revision: string
        filePath: string
    },
    sourcegraphURL: string
): BlameHunk[] | undefined => {
    const [enableStreamingGitBlame, status] = useFeatureFlag('enable-streaming-git-blame')

    const [isBlameVisible] = useBlameVisibility()
    const shouldFetchBlame = isBlameVisible && status !== 'initial'

    const hunks = useObservable(
        useMemo(
            () =>
                shouldFetchBlame
                    ? enableStreamingGitBlame
                        ? fetchBlameViaStreaming({ revision, repoName, filePath })
                        : fetchBlameViaGraphQL({ revision, repoName, filePath })
                    : of(undefined),
            [shouldFetchBlame, enableStreamingGitBlame, revision, repoName, filePath]
        )
    )

    const hunksWithDisplayInfo = useMemo(() => {
        const now = Date.now()
        return hunks?.map(hunk => ({
            ...hunk,
            displayInfo: getDisplayInfoFromHunk(hunk, sourcegraphURL, now),
        }))
    }, [hunks, sourcegraphURL])

    return hunksWithDisplayInfo
}
