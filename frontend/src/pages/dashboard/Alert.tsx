import React from "react"
import SearchHeader from "@/components/dashboard/SearchHeader";
import { Input } from "@/components/ui/input"
import { cn } from "@/utils";
import { Search01Icon } from "@hugeicons/core-free-icons";
import SearchNotFound from "@/components/dashboard/SearchNotFound";
import AlertItems from "@/components/dashboard/AlertItems";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSuspenseQuery } from "@tanstack/react-query";
import { alertHistory } from "@/utils/safewalkFn";
import { FullSpinner } from "@/components/Loader"
import AlertEmpty from "@/components/dashboard/AlertEmpty";
import { timeData } from "@/utils/formatTime";

const FILTERS = ["All", "Resolved", "False Alarm", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];
const items = [
  { label: "Sort: Newest First", value: "newest" },
  { label: "Sort: Oldest First", value: "oldest" }
]

type SortValue = (typeof items)[number]["value"]; // "newest" | "oldest"


export default function Alert() {

  const [search, setSearch] = React.useState("")
  const [sortedData, setSortedData] = React.useState<SortValue>("newest")
  const [activeFilter, setActiveFilter] = React.useState<Filter>("All");



  const { data, isPending } = useSuspenseQuery({
    queryKey: ["alerts"],
    queryFn: alertHistory
  })


  function handleSortData(value: string | null) {

    if (value === null) return;

    setSortedData(value)

  }

  const filteredByPill = React.useMemo(() => {
    switch (activeFilter) {
      case "Resolved":
        return data.alerts.filter((alert) => alert.cancellationReason?.toLowerCase() === ("resolved"));
      case "False Alarm":
        return data.alerts.filter((alert) => alert.cancellationReason?.toLowerCase() === "false_alarm");
      case "Cancelled":
        return data.alerts.filter((alert) => alert.cancellationReason?.toLowerCase() === ("user_error"));
      case "All":
      default:
        return data.alerts;
    }
  }, [data.alerts, activeFilter]);

  // 2. sort — applied to the pill-filtered set, respects the dropdown
  const sortedAlerts = React.useMemo(() => {
    return [...filteredByPill].sort((a, b) =>
      sortedData === "newest"
        ? b.durationMs - a.durationMs
        : a.durationMs - b.durationMs
    );
  }, [filteredByPill, sortedData]);

  // 3. search — scoped to pill-filtered + sorted, mirrors HospitalDirectory's searchedHospitals
  const searchedAlerts = React.useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return sortedAlerts.filter((a) => timeData(a.cancelledAt).toLowerCase().includes(q));
  }, [sortedAlerts, search]);


  if (isPending) {
    return <FullSpinner />
  }

  if (data.alerts.length === 0) {

    return (
      <SearchHeader title="Alert History">
        <AlertEmpty />
      </SearchHeader>
    )

  }




  return (
    <section className="relative pb-24">
      <SearchHeader title="Alert History" caption="Review your previous emergency alerts.">
        <Input startIcon={Search01Icon} value={search} iconSize={20} placeholder="Search alert by location or date..." size="md" className="pl-10" onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {FILTERS.map((filter) => {

            return <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("px-3 py-2 rounded-full text-xs", activeFilter === filter ? "bg-brand-500 text-white" : "text-neutral-700 border border-neutral-700")}>{filter}</button>
          })}
        </div>

      </SearchHeader>




      <div className="mt-4 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-700">{`${sortedAlerts.length} ${sortedAlerts.length > 1 ? "alerts" : "alert"}`}</p>
          <Select items={items} value={sortedData} onValueChange={handleSortData}>
            <SelectTrigger className="w-fit" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort</SelectLabel>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>


        </div>


        {
          search && searchedAlerts.length > 0 &&
          <div className="space-y-3">
            < AlertItems data={searchedAlerts} />
          </div>

        }

        {search && searchedAlerts.length === 0 && <SearchNotFound title="No results found" description="Try a different search term." clear={() => setSearch("")} />}

        {!search &&

          <div className="space-y-3">

            <AlertItems data={sortedAlerts} />
          </div>


        }





      </div>

    </section>
  )
}


