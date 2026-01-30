// import React from 'react';
import { IncidentTable } from '@/components/IncidentTable';

export function AuditList() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {/* Page header if needed */}
            </div>
            <IncidentTable />
        </div>
    );
}
