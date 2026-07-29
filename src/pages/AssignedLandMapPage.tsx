import { MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { AssignedLandMap } from '../components/map/AssignedLandMap';
import { useFieldDashboard } from '../hooks/useFieldDashboard';

export default function AssignedLandMapPage() {
  const [searchParams] = useSearchParams();
  const selectedSector = searchParams.get('sector');
  const { data, loading, error, retry } =
    useFieldDashboard();

  return (
    <FieldShell
      title="Assigned Land"
      subtitle="Read-only GeoJSON sectors assigned by a supervisor"
      officerName={data?.officer.displayName}
      notificationCount={data?.notificationCount}
    >
      <div className="p-5 md:p-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="h-[62vh] min-h-[420px] bg-[#FBFAEF] rounded-2xl animate-pulse" />
        ) : error || !data ? (
          <div className="h-80 bg-[#FBFAEF] rounded-2xl flex flex-col items-center justify-center">
            <p className="text-sm text-[#C65C52]">
              {error ?? 'Unable to load assigned land.'}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 text-xs font-bold text-[#5F7F52]"
            >
              Retry
            </button>
          </div>
        ) : data.assignedSectors.length ? (
          <div className="space-y-4">
            <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl px-4 py-3 flex gap-2 items-center text-xs text-[#6C756D]">
              <MapPin className="w-4 h-4 text-[#5F7F52]" />
              {data.assignedSectors.length} assigned sector
              {data.assignedSectors.length === 1 ? '' : 's'} ·
              select a polygon for assignment details
            </div>
            <AssignedLandMap
              sectors={data.assignedSectors}
              selectedSectorId={selectedSector}
            />
          </div>
        ) : (
          <div className="h-80 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <MapPin className="w-8 h-8 text-[#6C756D]/40" />
            <h2 className="font-bold mt-3">
              No assigned land sectors
            </h2>
            <p className="text-sm text-[#6C756D] mt-1">
              Only sectors attached to your active assignments are
              shown. You cannot create or self-select polygons.
            </p>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
