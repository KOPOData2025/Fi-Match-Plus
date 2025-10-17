"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/SearchInput"

interface ProductSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function ProductSearch({ 
  onSearch, 
  placeholder = "상품명 또는 키워드로 검색..." 
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const handleClear = () => {
    setSearchQuery("")
    onSearch("")
  }

  return (
    <div className="relative">
      <SearchInput
        value={searchQuery}
        onChange={handleSearch}
        onClear={handleClear}
        placeholder={placeholder}
        className="w-full max-w-md"
      />
    </div>
  )
}




