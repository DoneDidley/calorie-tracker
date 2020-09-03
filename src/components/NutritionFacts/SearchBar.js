import React from "react";

export default function SearchBar() {
  return (
    <div className="bg-white p-3 m-2 rounded-lg shadow-lg md:max-w-md">
      <h3>Search bar</h3>
      <div className="flex">
        <input
          class="mr-2 bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal"
          type="text"
          placeholder="search..."
        />
        <button className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">
          Search
        </button>
      </div>
    </div>
  );
}
