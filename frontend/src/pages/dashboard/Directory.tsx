import React from "react"
import SearchHeader from "@/components/dashboard/SearchHeader";
import { Input } from "@/components/ui/input"
import { cn } from "@/utils";
import { Search01Icon } from "@hugeicons/core-free-icons";
import DirectoryItems from "@/components/dashboard/DirectoryItems";
import { hospitals } from "@/components/dashboard/data";
import SearchNotFound from "@/components/dashboard/SearchNotFound";

const FILTERS = ["All", "Nearest", "Open Now", "Teaching", "General"] as const;
type Filter = (typeof FILTERS)[number];


export default function Directory() {
  const [search, setSearch] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<Filter>("All");



  const filteredByPill = React.useMemo(() => {
    switch (activeFilter) {
      case "Open Now":
        return hospitals.filter((h) => h.operatingHour.toLowerCase().includes("open"));
      case "Teaching":
        return hospitals.filter((h) => h.name.toLowerCase().includes("teaching"));
      case "General":
        return hospitals.filter((h) => h.name.toLowerCase().includes("general"));
      case "All":
      case "Nearest": // Nearest is a sort, not a filter — doesn't narrow the set
      default:
        return hospitals;
    }
  }, [hospitals, activeFilter]);

  const sortedByDistance = React.useMemo(() => {
    return [...filteredByPill].sort((a, b) => a.distance.km - b.distance.km);
  }, [filteredByPill]);

  const searchedHospitals = React.useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return filteredByPill.filter((h) => h.name.toLowerCase().includes(q));
  }, [filteredByPill, search]);

  const nearest = sortedByDistance.length > 0 ? [sortedByDistance[0]] : [];
  const others = sortedByDistance.slice(1);



  return (
    <section className="relative pb-24">
      <SearchHeader title="Hospital Directory" caption="Find nearby hospitals based on your current location.">
        <Input startIcon={Search01Icon} value={search} iconSize={20} placeholder="Search hospitals..." size="md" className="pl-10" onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {FILTERS.map((filter) => {

            return <button key={filter} onClick={() => setActiveFilter(filter)} className={cn("px-3 py-2 rounded-full text-xs", activeFilter === filter ? "bg-brand-500 text-white" : "text-neutral-700 border border-neutral-700")}>{filter}</button>
          })}
        </div>

      </SearchHeader>




      <div className="mt-4 space-y-4">

        {
          search && searchedHospitals.length > 0 &&
          <div className="space-y-3">
            <p className="text-neutral-600 text-sm">{`Showing ${searchedHospitals.length} matching "${search}"`} </p>
            < DirectoryItems data={searchedHospitals} />
          </div>

        }

        {search && searchedHospitals.length === 0 && <SearchNotFound title="No hospitals match your search" description="Double-check your spelling or try searching for another clinic/hospital type." clear={() => setSearch("")} />}

        {!search &&
          <>
            <div className="space-y-3">
              <h3 className="text-neutral-900 font-bold text-sm">Nearest Hospital</h3>
              <DirectoryItems data={nearest} />
            </div>
            {others.length > 0 && <div className="space-y-3">
              <h3 className="text-neutral-900 font-bold text-sm">Nearby Hospitals</h3>
              <DirectoryItems data={others} />
            </div>}
          </>
        }





      </div>

    </section>
  )
}

