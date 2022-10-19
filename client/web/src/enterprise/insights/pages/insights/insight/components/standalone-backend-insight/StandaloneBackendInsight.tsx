import React, { useContext, useState } from 'react'

import classNames from 'classnames'
import { useHistory } from 'react-router'

import { useQuery } from '@sourcegraph/http-client'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { Card, CardBody, useDebounce, useDeepMemo } from '@sourcegraph/wildcard'

import { GetInsightDataResult, GetInsightDataVariables } from '../../../../../../../graphql-operations'
import { useSeriesToggle } from '../../../../../../../insights/utils/use-series-toggle'
import { InsightCard, InsightCardHeader, InsightCardLoading, FormChangeEvent } from '../../../../../components'
import {
    parseBackendInsightResponse,
    insightPollingInterval,
    GET_INSIGHT_DATA,
} from '../../../../../components/insights-view-grid/components/backend-insight'
import {
    DrillDownInsightFilters,
    FilterSectionVisualMode,
    DrillDownInsightCreationForm,
    DrillDownFiltersStep,
    BackendInsightChart,
    BackendInsightErrorAlert,
    DrillDownFiltersFormValues,
    FiltersCreationFormValues,
    parseSeriesLimit,
} from '../../../../../components/insights-view-grid/components/backend-insight/components'
import { ALL_INSIGHTS_DASHBOARD } from '../../../../../constants'
import { BackendInsight, CodeInsightsBackendContext, InsightFilters } from '../../../../../core'
import { createBackendInsightData } from '../../../../../core/backend/gql-backend/methods/get-backend-insight-data/deserializators'
import { getTrackingTypeByInsightType, useCodeInsightViewPings } from '../../../../../pings'
import { StandaloneInsightContextMenu } from '../context-menu/StandaloneInsightContextMenu'

import styles from './StandaloneBackendInsight.module.scss'

interface StandaloneBackendInsight extends TelemetryProps {
    insight: BackendInsight
    className?: string
}

export const StandaloneBackendInsight: React.FunctionComponent<StandaloneBackendInsight> = props => {
    const { telemetryService, insight, className } = props
    const history = useHistory()
    const { createInsight, updateInsight } = useContext(CodeInsightsBackendContext)

    const seriesToggleState = useSeriesToggle()

    // Visual line chart settings
    const [zeroYAxisMin, setZeroYAxisMin] = useState(false)
    const [step, setStep] = useState(DrillDownFiltersStep.Filters)

    // Original insight filters values that are stored in setting subject with insight
    // configuration object, They are updated  whenever the user clicks update/save button
    const [originalInsightFilters, setOriginalInsightFilters] = useState(insight.filters)

    // Live valid filters from filter form. They are updated whenever the user is changing
    // filter value in filters fields.
    const [filters, setFilters] = useState<InsightFilters>(originalInsightFilters)
    const [filterVisualMode, setFilterVisualMode] = useState<FilterSectionVisualMode>(FilterSectionVisualMode.Preview)
    const debouncedFilters = useDebounce(useDeepMemo<InsightFilters>(filters), 500)

    const { data, error, loading, stopPolling } = useQuery<GetInsightDataResult, GetInsightDataVariables>(
        GET_INSIGHT_DATA,
        {
            pollInterval: insightPollingInterval(insight),
            variables: {
                id: insight.id,
                filters: {
                    includeRepoRegex: debouncedFilters.includeRepoRegexp,
                    excludeRepoRegex: debouncedFilters.excludeRepoRegexp,
                    searchContexts: [debouncedFilters.context],
                },
                seriesDisplayOptions: {
                    limit: parseSeriesLimit(debouncedFilters.seriesDisplayOptions.limit),
                    sortOptions: debouncedFilters.seriesDisplayOptions.sortOptions,
                },
            },
            onCompleted: data => {
                const parsedData = createBackendInsightData({ ...insight, filters }, data.insightViews.nodes[0])
                if (!parsedData.isFetchingHistoricalData) {
                    stopPolling()
                }
            },
            onError: () => {
                stopPolling()
            },
        }
    )

    const insightData = parseBackendInsightResponse({ ...insight, filters }, data)

    const { trackMouseLeave, trackMouseEnter, trackDatumClicks } = useCodeInsightViewPings({
        telemetryService,
        insightType: getTrackingTypeByInsightType(insight.type),
    })

    const handleFilterChange = (event: FormChangeEvent<DrillDownFiltersFormValues>): void => {
        if (event.valid) {
            setFilters(event.values)
        }
    }

    const handleFilterSave = async (filters: InsightFilters): Promise<void> => {
        await updateInsight({ insightId: insight.id, nextInsightData: { ...insight, filters } }).toPromise()
        setOriginalInsightFilters(filters)
        telemetryService.log('CodeInsightsSearchBasedFilterUpdating')
    }

    const handleInsightFilterCreation = async (values: FiltersCreationFormValues): Promise<void> => {
        await createInsight({
            insight: {
                ...insight,
                title: values.insightName,
                filters,
            },
            dashboard: null,
        }).toPromise()

        history.push(`/insights/dashboard/${ALL_INSIGHTS_DASHBOARD.id}`)
        telemetryService.log('CodeInsightsSearchBasedFilterInsightCreation')
    }

    return (
        <div className={classNames(className, styles.root)}>
            <Card as={CardBody} className={styles.filters}>
                {step === DrillDownFiltersStep.Filters && (
                    <DrillDownInsightFilters
                        initialValues={filters}
                        originalValues={originalInsightFilters}
                        visualMode={filterVisualMode}
                        onVisualModeChange={setFilterVisualMode}
                        onFiltersChange={handleFilterChange}
                        onFilterSave={handleFilterSave}
                        onCreateInsightRequest={() => setStep(DrillDownFiltersStep.ViewCreation)}
                    />
                )}

                {step === DrillDownFiltersStep.ViewCreation && (
                    <DrillDownInsightCreationForm
                        onCreateInsight={handleInsightFilterCreation}
                        onCancel={() => setStep(DrillDownFiltersStep.Filters)}
                    />
                )}
            </Card>

            <InsightCard
                data-testid={`insight-standalone-card.${insight.id}`}
                className={styles.chart}
                onMouseEnter={trackMouseEnter}
                onMouseLeave={trackMouseLeave}
            >
                <InsightCardHeader title={insight.title}>
                    <StandaloneInsightContextMenu
                        insight={insight}
                        zeroYAxisMin={zeroYAxisMin}
                        onToggleZeroYAxisMin={setZeroYAxisMin}
                    />
                </InsightCardHeader>

                {error ? (
                    <BackendInsightErrorAlert error={error} />
                ) : loading || !insightData ? (
                    <InsightCardLoading>Loading code insight</InsightCardLoading>
                ) : error ? (
                    <BackendInsightErrorAlert error={error} />
                ) : (
                    <BackendInsightChart
                        {...insightData}
                        isLocked={insight.isFrozen}
                        isZeroYAxisMin={zeroYAxisMin}
                        onDatumClick={trackDatumClicks}
                        seriesToggleState={seriesToggleState}
                    />
                )}
            </InsightCard>
        </div>
    )
}
