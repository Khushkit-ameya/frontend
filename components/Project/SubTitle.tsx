"use client"

import { useRef, useState } from "react";
import SearchBar from "../common/SearchBar"
import { FiEyeOff, FiMoreHorizontal } from "react-icons/fi";
import { BiSortAlt2 } from "react-icons/bi";
import { FaSlidersH, FaUserCircle } from "react-icons/fa";
import AddFilter from "../common/AddFilter";

const Subtitle = () => {
    const [openFilter, setOpenFilter] = useState(false);
    console.log(openFilter)
    const anchorRef = useRef(null);
    return (
        <div className="flex  text-gray-600 text-[13px]">
            <SearchBar/>
            <button
                        className="flex  bg-white rounded items-center  px-2 border border-gray-400 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95" >
                        <p className="mr-1 flex items-center"><FaUserCircle /></p>
                        <span>Person</span>
                    </button>
                    <button
                   onClick={() => setOpenFilter((s) => !s)}
                        className="flex  bg-white rounded items-center  px-2 border border-gray-400 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95" >
                        <p className="mr-1 flex items-center"><FaSlidersH /></p>
                        <span>Add Filters</span>
                    </button>
                    <button
                        className="flex  bg-white rounded items-center  px-2 border border-gray-400 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95" >
                        <p className="mr-1 flex items-center"><BiSortAlt2 /></p>
                        <span>Sort</span>
                    </button>
                    
                    <button
                        className="flex  bg-white rounded items-center  px-2 border border-gray-400 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95" >
                        <p className="mr-1 flex items-center"><FiEyeOff/></p>
                        <span>Hide</span>
                    </button>
                    
                    <button
                        className="flex border-gray-600 bg-gray-300 text-2xl text-gray-600 rounded items-center px-1 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95" >
                         <p className="mr-1 flex items-center"><FiMoreHorizontal/></p>
                    </button>
            {/* Render AddFilter only when openFilter true */}
           {openFilter && (
           <AddFilter
          anchorRef={anchorRef}
          onClose={() => setOpenFilter(false)}
          // optional: pass any initial filters or callbacks here
        />
           )}
        </div>

    )
}

export default Subtitle;