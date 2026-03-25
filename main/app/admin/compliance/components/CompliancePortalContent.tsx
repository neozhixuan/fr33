'use client';

import { useEffect, useRef, useState } from 'react';
import {
    listComplianceCases,
    listVCInventory,
    listMainServiceAuditLogs,
    listMonitoringLogs,
} from '@/lib/complianceActions';
import ComplianceCasesList from './compliance-portal-lists/ComplianceCasesList';
import ComplianceStats from './ComplianceStats';
import ComplianceScoringCriteria from './ComplianceScoringCriteria';
import VCRevocationList from './compliance-portal-lists/VCRevocationList';
import MainAuditLogsList from './compliance-portal-lists/MainAuditLogsList';
import MonitoringLogsList from './compliance-portal-lists/MonitoringLogsList';
import { ComplianceCase, MainServiceAuditLog, MonitoringLog, VCInventoryItem } from '@/type/complianceTypes';
import ComplianceTabs, { ComplianceTab } from './ComplianceTabs';

export default function CompliancePortalContent() {
    const tabsRef = useRef<HTMLDivElement | null>(null);
    const [cases, setCases] = useState<ComplianceCase[]>([]);
    const [vcRows, setVcRows] = useState<VCInventoryItem[]>([]);
    const [vcTotal, setVcTotal] = useState(0);
    const [vcPage, setVcPage] = useState(1);
    const [mainAuditLogs, setMainAuditLogs] = useState<MainServiceAuditLog[]>([]);
    const [monitoringLogs, setMonitoringLogs] = useState<MonitoringLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ComplianceTab>('open');
    const [refreshNonce, setRefreshNonce] = useState(0);

    const handleTabChange = (tab: ComplianceTab) => {
        setActiveTab(tab);

        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#tab-${tab}`);
        }

        tabsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const hash = window.location.hash.replace('#tab-', '');
        const allowedTabs = new Set(['open', 'all', 'vc', 'audit-main', 'audit-monitoring']);
        if (allowedTabs.has(hash)) {
            setActiveTab(hash as ComplianceTab);
        }
    }, []);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                setLoading(true);
                if (activeTab === 'vc') {
                    const response = await listVCInventory({
                        page: vcPage,
                        pageSize: 20,
                    });
                    setVcRows(response.rows);
                    setVcTotal(response.total);
                } else if (activeTab === 'audit-main') {
                    const response = await listMainServiceAuditLogs({
                        limit: 200,
                    });
                    setMainAuditLogs(response.logs);
                } else if (activeTab === 'audit-monitoring') {
                    const response = await listMonitoringLogs({
                        limit: 200,
                    });
                    setMonitoringLogs(response.logs);
                } else {
                    const status = activeTab === 'open' ? 'OPEN' : undefined;
                    const response = await listComplianceCases({
                        status,
                        limit: 100,
                    });
                    setCases(response.cases);
                }
                setError(null);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, [activeTab, refreshNonce, vcPage]);

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <ComplianceStats cases={cases} />

            <ComplianceScoringCriteria cases={cases} />

            {/* Error display */}
            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">Error: {error}</p>
                </div>
            )}

            {/* Tabs */}
            <ComplianceTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabsRef={tabsRef}
                counts={{
                    openCases: cases.filter((c) => c.status === 'OPEN').length,
                    allCases: cases.length,
                    vcTotal,
                    mainAuditTotal: mainAuditLogs.length,
                    monitoringTotal: monitoringLogs.length,
                }}
            />

            {/* Cases list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-gray-400">
                        {activeTab === 'vc'
                            ? 'Loading VC list...'
                            : activeTab === 'audit-main' || activeTab === 'audit-monitoring'
                                ? 'Loading logs...'
                                : 'Loading compliance cases...'}
                    </p>
                </div>
            ) : activeTab === 'vc' ? (
                vcRows.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-8 text-center">
                        <p className="text-gray-400">No VC records found</p>
                    </div>
                ) : (
                    <VCRevocationList
                        rows={vcRows}
                        total={vcTotal}
                        page={vcPage}
                        pageSize={20}
                        onPageChange={setVcPage}
                        onRevoked={() => setRefreshNonce((prev) => prev + 1)}
                    />
                )
            ) : activeTab === 'audit-main' ? (
                mainAuditLogs.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-8 text-center">
                        <p className="text-gray-400">No main service audit logs found</p>
                    </div>
                ) : (
                    <MainAuditLogsList logs={mainAuditLogs} />
                )
            ) : activeTab === 'audit-monitoring' ? (
                monitoringLogs.length === 0 ? (
                    <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-8 text-center">
                        <p className="text-gray-400">No monitoring logs found</p>
                    </div>
                ) : (
                    <MonitoringLogsList logs={monitoringLogs} />
                )
            ) : cases.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-[#131314]/60 p-8 text-center">
                    <p className="text-gray-400">No compliance cases found</p>
                </div>
            ) : (
                <ComplianceCasesList
                    cases={cases}
                    onCaseUpdated={() => setRefreshNonce((prev) => prev + 1)}
                />
            )}
        </div>
    );
}
