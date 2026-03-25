'use client';

export type ComplianceTab = 'open' | 'all' | 'vc' | 'audit-main' | 'audit-monitoring';

interface ComplianceTabsProps {
    activeTab: ComplianceTab;
    onTabChange: (tab: ComplianceTab) => void;
    counts: {
        openCases: number;
        allCases: number;
        vcTotal: number;
        mainAuditTotal: number;
        monitoringTotal: number;
    };
    tabsRef: React.RefObject<HTMLDivElement | null>;
}

export default function ComplianceTabs({ activeTab, onTabChange, counts, tabsRef }: ComplianceTabsProps) {
    const tabButtonClass = (tab: ComplianceTab) =>
        `px-4 py-2 font-medium transition-colors ${activeTab === tab
            ? 'border-b-2 border-[#00f2ff] text-[#00f2ff]'
            : 'text-gray-400 hover:text-gray-200'
        }`;

    return (
        <div
            id="compliance-tabs"
            ref={tabsRef}
            className="sticky top-0 z-20 flex gap-4 border-b border-white/10 bg-[#0f0f10]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0f10]/85"
        >
            <button onClick={() => onTabChange('open')} className={tabButtonClass('open')}>
                Open Cases ({counts.openCases})
            </button>
            <button onClick={() => onTabChange('all')} className={tabButtonClass('all')}>
                All Cases ({counts.allCases})
            </button>
            <button onClick={() => onTabChange('vc')} className={tabButtonClass('vc')}>
                VC Registry ({counts.vcTotal})
            </button>
            <button onClick={() => onTabChange('audit-main')} className={tabButtonClass('audit-main')}>
                Main Audit Logs ({counts.mainAuditTotal})
            </button>
            <button onClick={() => onTabChange('audit-monitoring')} className={tabButtonClass('audit-monitoring')}>
                Monitoring Logs ({counts.monitoringTotal})
            </button>
        </div>
    );
}
