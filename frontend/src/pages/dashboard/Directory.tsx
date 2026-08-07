import React from "react"
import SearchHeader from "@/components/dashboard/SearchHeader";
import { Input } from "@/components/ui/input"
import { cn } from "@/utils";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { useSearchParams } from "react-router";
import DirectoryItems from "@/components/dashboard/DirectoryItems";
import { hospitals } from "@/components/dashboard/data";
import SearchNotFound from "@/components/dashboard/SearchNotFound";

const FILTERS = ["Nearest", "Open Now", "Teaching", "General"] as const;


export default function Directory() {
  const [search, setSearch] = React.useState("")
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.getAll("filter");


  const nearest = hospitals.filter(hospital => hospital?.tag === "nearest")
  const others = hospitals.filter(hospital => hospital?.tag !== "nearest")

  const searchedHospital = hospitals.filter(hospital => hospital.name.toLowerCase().includes(search.toLowerCase()))



  function toggleFilter(filter: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = next.getAll("filter");

      next.delete("filter");
      const updated = current.includes(filter) ? current.filter(f => f !== filter) : [...current, filter]
      updated.forEach((f) => next.append("filter", f));

      return next;
    })
  }



  return (
    <section className="relative pb-24">
      <SearchHeader title="Hospital Directory" caption="Find nearby hospitals based on your current location.">
        <Input startIcon={Search01Icon} value={search} iconSize={20} placeholder="Search hospitals..." size="md" className="pl-10" onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter.includes(filter);

            return <button key={filter} onClick={() => toggleFilter(filter)} className={cn("px-3 py-2 rounded-full text-xs", isActive ? "bg-brand-500 text-white" : "text-neutral-700 border border-neutral-700")}>{filter}</button>
          })}
        </div>

      </SearchHeader>




      <div className="mt-4 space-y-4">

        {
          search && searchedHospital.length > 0 &&
          <div className="space-y-3">
            <p className="text-neutral-600 text-sm">{`Showing ${searchedHospital.length} matching "${search}"`} </p>
            < DirectoryItems data={searchedHospital} />
          </div>

        }

        {search && searchedHospital.length === 0 && <SearchNotFound />}

        {!search &&
          <>
            <div className="space-y-3">
              <h3 className="text-neutral-900 font-bold text-sm">Nearest Hospital</h3>
              <DirectoryItems data={nearest} />
            </div>
            <div className="space-y-3">
              <h3 className="text-neutral-900 font-bold text-sm">Nearby Hospitals</h3>
              <DirectoryItems data={others} />
            </div>
          </>
        }





      </div>

    </section>
  )
}

