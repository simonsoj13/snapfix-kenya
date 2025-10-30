import SearchBar from "../SearchBar";

export default function SearchBarExample() {
  return (
    <SearchBar
      onSearch={(query) => console.log("Search:", query)}
      onFilterClick={() => console.log("Filter clicked")}
    />
  );
}
