import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dexie from 'dexie';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';


const sanitizeCode = (code) => {
  if (!code) return '';
  const firstLevelClean = code.toString().replace(/-/g, '');
  return firstLevelClean.replace(/^[\s-]+/, "");
};



class ICD11Database extends Dexie {
  constructor() {
    super('ICD11Database');
    this.version(1).stores({
      codes: '++id, code, *desc, chapter_no, [code+chapter_no], is_leaf'
    });
    this.codes = this.table('codes');
  }
}

const db = new ICD11Database();

class SearchCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

async function isDatabasePopulated() {
  try {
    const count = await db.codes.count();
    return count > 0;
  } catch (error) {
    console.error('Error checking database:', error);
    return false;
  }
}

async function loadICD11Data(jsonData) {
  try {
    await db.codes.clear();
    const batchSize = 5000;
    const totalBatches = Math.ceil(jsonData.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, jsonData.length);

      // PROCESS: Remove dashes from the code before saving
      const batch = jsonData.slice(start, end).map(item => ({
        ...item,
        code: sanitizeCode(item.code),
        desc: sanitizeCode(item.desc)
      }));

      await db.codes.bulkAdd(batch);
    }

    console.log(`Loaded ${jsonData.length} ICD-11 codes into IndexedDB (Dashes removed)`);
    return true;
  } catch (error) {
    console.error('Error loading ICD-11 data:', error);
    return false;
  }
}

async function fetchAndLoadData() {
  console.log("Checking ICD-11 Database status...");
  const populated = await isDatabasePopulated();

  if (populated) {
    console.log("ICD-11 Database is already populated.");
    return true;
  }

  try {
    console.log("Fetching icd-11-codes.json from public directory...");
    const response = await fetch(`${process.env.PUBLIC_URL}/icd-11-codes.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();

    console.log(`Starting to load ${jsonData.length} ICD-11 codes into IndexedDB...`);
    const success = await loadICD11Data(jsonData);

    if (success) {
      console.log("ICD-11 data loaded successfully.");
    }
    return success;
  } catch (error) {
    console.error('Failed to fetch or load ICD-11 data:', error);
    return false;
  }
}


async function searchICD11(query, filters = {}) {
  // PROCESS: Remove dashes from the search query to match the cleaned DB
  const searchTerm = sanitizeCode(query).toLowerCase().trim();

  // If query is short, return empty array
  if (searchTerm.length < 2) {
    return [];
  }

  const cacheKey = `${searchTerm}-${JSON.stringify(filters)}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let collection = db.codes;

    if (filters.chapter) {
      collection = collection.where('chapter_no').equals(filters.chapter);
    }

    const results = await collection
      .filter(item => {
        // Ensure we compare against safe strings
        const itemCode = (item.code || '').toLowerCase();
        const itemDesc = (item.desc || '').toLowerCase();

        // Check for exact code match, starts with, or description match
        const codeMatch = itemCode.includes(searchTerm);
        const descMatch = itemDesc.includes(searchTerm);
        return codeMatch || descMatch;
      })
      .limit(100)
      .toArray();

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}


function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


export default function ICD11SearchMUI({ label, value, onChange, chapterFilter = '', fullWidth = true }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearchQuery = useDebounce(inputValue, 300);

  useEffect(() => {
    fetchAndLoadData().then(setIsDbReady);
  }, []);


  useEffect(() => {
    async function performSearch() {
      // Clean query just for the length check, though searchICD11 cleans it again
      const cleanQuery = sanitizeCode(debouncedSearchQuery);

      if (!isDbReady || cleanQuery.trim().length < 2) {
        setOptions([]);
        return;
      }

      setIsLoading(true);
      try {
        const filters = chapterFilter ? { chapter: chapterFilter } : {};
        // Search using the raw query; searchICD11 will handle the dash stripping
        const searchResults = await searchICD11(debouncedSearchQuery, filters);

        const currentSelected = value ? [value] : [];

        const combinedResults = [...currentSelected, ...searchResults].reduce((acc, current) => {
          const x = acc.find(item => item.code === current.code);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        setOptions(combinedResults);

      } catch (error) {
        console.error('ICD-11 Search failed:', error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [debouncedSearchQuery, chapterFilter, isDbReady, value]);


  const handleAutocompleteChange = useCallback((event, newValue) => {
    if (onChange) {
      // Ensure the value passed out is strictly the code (no dashes) and desc
      // Since data from DB is already cleaned, newValue.code is already safe.
      onChange(newValue);
    }
  }, [onChange]);


  const getOptionLabel = useMemo(() => (option) => {
    if (typeof option === 'string') {
      return option;
    }
    // Returns just code and desc. Code is already dash-free from DB.
    return `${option?.code || ''} ${option?.desc || ''}`;
  }, []);


  const isOptionEqualToValue = useMemo(() => (option, val) => {
    if (!option || !val) return false;
    // Compare based on the dash-free codes
    return option.code === val.code;
  }, []);

  return (
    <Autocomplete
      fullWidth={fullWidth}
      id={`icd11-search-${label?.replace(/\s/g, '-')}`}
      options={options}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading}
      value={value}
      onChange={handleAutocompleteChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      filterOptions={(x) => x}
      noOptionsText={isDbReady ? "No results found (min 2 chars)" : "Loading ICD-11 data..."}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={option.code}
          sx={{
            borderBottom: '1px solid #eee',
            '&:last-child': { borderBottom: 'none' }
          }}
        >
          <span style={{ fontWeight: 'bold', color: '#014d88', marginRight: '8px' }}>
            {option.code}
          </span>
          {option.desc}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? (
                  <span style={{ fontSize: '10px', color: '#999' }}>Loading...</span>
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}