// src/components/YearSelector.jsx

import React from 'react';

const YearSelector = ({ years, selectedYear, onYearChange, loading, error, disabled }) => {
  return (
    <div>
      <label htmlFor="year-select" className="block text-lg font-medium text-gray-300 mb-2 text-center">
        Filter by Year:
      </label>
      <select
        id="year-select"
        className="block w-full p-3 border border-gray-600 rounded-lg shadow-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out"
        value={selectedYear}
        onChange={onYearChange}
        disabled={loading || error || disabled}
      >
        <option value="">All Years</option>
        {years.filter(year => year !== '').map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;
