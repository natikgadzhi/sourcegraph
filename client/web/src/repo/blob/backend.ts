import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { memoizeObservable } from '@sourcegraph/common'
import { dataOrThrowErrors, gql } from '@sourcegraph/http-client'
import { ParsedRepoURI, makeRepoURI } from '@sourcegraph/shared/src/util/url'

import { requestGraphQL } from '../../backend/graphql'
import {
    BlobFileFields,
    BlobResult,
    BlobVariables,
    FormattedBlobFileFIelds,
    FormattedBlobResult,
    FormattedBlobVariables,
} from '../../graphql-operations'

function fetchBlobCacheKey(parsed: ParsedRepoURI & { disableTimeout?: boolean }): string {
    if (parsed.disableTimeout !== undefined) {
        return makeRepoURI(parsed) + String(parsed.disableTimeout)
    }

    return makeRepoURI(parsed)
}

export const fetchFormattedBlob = memoizeObservable(
    (args: { repoName: string; commitID: string; filePath: string }): Observable<FormattedBlobFileFIelds | null> =>
        requestGraphQL<FormattedBlobResult, FormattedBlobVariables>(
            gql`
                query FormattedBlob($repoName: String!, $commitID: String!, $filePath: String!) {
                    repository(name: $repoName) {
                        commit(rev: $commitID) {
                            file(path: $filePath) {
                                ...FormattedBlobFileFIelds
                            }
                        }
                    }
                }

                fragment FormattedBlobFileFIelds on File2 {
                    content
                    richHTML
                    format {
                        aborted
                        html
                    }
                }
            `,
            args
        ).pipe(
            map(dataOrThrowErrors),
            map(data => {
                if (!data.repository?.commit) {
                    throw new Error('Commit not found')
                }
                return data.repository.commit.file
            })
        ),
    fetchBlobCacheKey
)

export const fetchBlob = memoizeObservable(
    (args: {
        repoName: string
        commitID: string
        filePath: string
        disableTimeout: boolean
    }): Observable<BlobFileFields | null> =>
        requestGraphQL<BlobResult, BlobVariables>(
            gql`
                query Blob($repoName: String!, $commitID: String!, $filePath: String!, $disableTimeout: Boolean!) {
                    repository(name: $repoName) {
                        commit(rev: $commitID) {
                            file(path: $filePath) {
                                ...BlobFileFields
                            }
                        }
                    }
                }

                fragment BlobFileFields on File2 {
                    content
                    richHTML
                    highlight(disableTimeout: $disableTimeout) {
                        aborted
                        html
                        lsif
                    }
                }
            `,
            args
        ).pipe(
            map(dataOrThrowErrors),
            map(data => {
                if (!data.repository?.commit) {
                    throw new Error('Commit not found')
                }
                return data.repository.commit.file
            })
        ),
    fetchBlobCacheKey
)
