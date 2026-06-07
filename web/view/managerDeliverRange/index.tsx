import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  useGetCollaboratorInfo,
  useUpsertCollaboratorShipperInfo,
} from "@/hooks/collaborator/useCollaboratorHook";
import type { CollaboratorShipperZone } from "@/services/collaborator/collaboratorService";
import { cn } from "@/lib/utils";

const SHIPPER_ZONE_BASE: CollaboratorShipperZone[] = ["I3", "I4", "I5"];
const SHIPPER_ZONE_ALL: CollaboratorShipperZone[] = [
  "I1",
  "I2",
  "I3",
  "I4",
  "I5",
];

function zoneSelectOptions(current?: string): CollaboratorShipperZone[] {
  if (
    typeof current === "string" &&
    SHIPPER_ZONE_ALL.includes(current as CollaboratorShipperZone)
  ) {
    const currentZone = current as CollaboratorShipperZone;
    if (!SHIPPER_ZONE_BASE.includes(currentZone)) {
      return [currentZone, ...SHIPPER_ZONE_BASE];
    }
  }
  return [...SHIPPER_ZONE_BASE];
}

const USER_LABELS: Record<string, string> = {
  email: "Email",
  name: "Name",
  avatar: "Avatar",
  provider: "Provider",
  role: "Role",
  status: "Status",
  createdAt: "Created at",
  updatedAt: "Updated at",
};

const SHIPPER_LABELS: Record<string, string> = {
  shipperId: "Shipper user",
  status: "Shipper status",
  createdAt: "Created at",
  updatedAt: "Updated at",
};

function humanLabel(key: string, section: "user" | "shipper"): string {
  const map = section === "user" ? USER_LABELS : SHIPPER_LABELS;
  return map[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return JSON.stringify(value);

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return value;
}

function entriesWithoutId(
  obj: Record<string, unknown> | null | undefined,
  omit: Set<string>
): [string, unknown][] {
  if (!obj) return [];
  return Object.entries(obj).filter(([key]) => key !== "id" && !omit.has(key));
}

const InfoRow = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "grid gap-1 border-b border-border/60 py-3 text-sm last:border-0 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start sm:gap-4",
      className
    )}
  >
    <div className="font-medium text-muted-foreground">{label}</div>
    <div className="min-w-0 wrap-break-word text-foreground">{children}</div>
  </div>
);

const ManagerDeliverRangeView = () => {
  const { user, shipper_infor, loading, data } = useGetCollaboratorInfo();
  const { upsertShipperInfo, loading: saving } =
    useUpsertCollaboratorShipperInfo();

  const initialZone = useMemo((): CollaboratorShipperZone => {
    const zone = shipper_infor?.shipperZone;
    if (
      typeof zone === "string" &&
      SHIPPER_ZONE_ALL.includes(zone as CollaboratorShipperZone)
    ) {
      return zone as CollaboratorShipperZone;
    }
    return "I3";
  }, [shipper_infor]);

  const zoneOptions = useMemo(
    () =>
      zoneSelectOptions(
        typeof shipper_infor?.shipperZone === "string"
          ? shipper_infor.shipperZone
          : undefined
      ),
    [shipper_infor?.shipperZone]
  );

  const [selectedZone, setSelectedZone] =
    useState<CollaboratorShipperZone>(initialZone);

  useEffect(() => {
    setSelectedZone(initialZone);
  }, [initialZone]);

  const savedZone = initialZone;
  const zoneDirty = !shipper_infor || selectedZone !== savedZone;

  const userRows = entriesWithoutId(user ?? undefined, new Set());
  const shipperRows = entriesWithoutId(
    shipper_infor ?? undefined,
    new Set(["shipperZone"])
  );

  const handleSaveZone = async () => {
    await upsertShipperInfo({ shipper_zone: selectedZone });
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Loading collaborator info...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">No user data found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Delivery Range Manager
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Collaborator profile and shipper zone settings.
      </p>
      <section className="mt-8 rounded-xl border border-slate-200 bg-linear-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-sm">
        <h2 className="text-lg font-medium">User Information</h2>
        <div className="mt-2 divide-y divide-border/80">
          {userRows.map(([key, value]) => {
            const label = humanLabel(key, "user");
            if (
              key === "avatar" &&
              typeof value === "string" &&
              value.startsWith("http")
            ) {
              return (
                <InfoRow key={key} label={label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value}
                    alt="avatar"
                    className="h-16 w-16 rounded-full border object-cover"
                  />
                </InfoRow>
              );
            }

            return (
              <InfoRow key={key} label={label}>
                {formatScalar(value)}
              </InfoRow>
            );
          })}
        </div>
      </section>{" "}
      <section className="mt-6 rounded-xl border border-slate-200 bg-linear-to-br from-white via-sky-50 to-cyan-50 p-5 shadow-sm">
        <h2 className="text-lg font-medium">Shipper Information</h2>

        {!shipper_infor ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Shipper info does not exist yet. Choose a zone and save to create.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-border/80">
            {shipperRows.map(([key, value]) => (
              <InfoRow key={key} label={humanLabel(key, "shipper")}>
                {formatScalar(value)}
              </InfoRow>
            ))}
          </div>
        )}

        <div className="mt-6 border-t pt-5">
          <div className="text-sm font-medium text-muted-foreground">
            Shipper Zone
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative w-full sm:w-[220px]">
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-br from-white via-sky-50 to-cyan-100 opacity-90 blur-sm" />
              <select
                value={selectedZone}
                onChange={(event) =>
                  setSelectedZone(event.target.value as CollaboratorShipperZone)
                }
                className={cn(
                  "relative h-11 w-full appearance-none rounded-xl border border-slate-200/80",
                  "bg-white/85 px-4 pr-10 text-sm text-slate-700 shadow-sm backdrop-blur-md",
                  "outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                )}
              >
                {zoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                v
              </span>
            </div>

            <button
              type="button"
              disabled={!zoneDirty || saving}
              onClick={() => void handleSaveZone()}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground",
                "hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              )}
            >
              {saving ? "Saving..." : "Save zone"}
            </button>
          </div>

          {shipper_infor && (
            <p className="mt-2 text-xs text-muted-foreground">
              Current saved zone: <span className="font-mono">{savedZone}</span>
              {zoneDirty ? " - Unsaved change" : ""}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ManagerDeliverRangeView;
