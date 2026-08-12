import React, { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  text: string;
  selected: boolean;
  icon?: string; // Optional icon (emoji or icon identifier)
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  /** Controlled selected values. When provided, overrides internal state. */
  value?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  value,
  onChange,
  disabled = false,
  placeholder = "Select option",
}) => {
  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(value ?? defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedOptions(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = (e?: React.MouseEvent) => {
    if (disabled) return;
    if (e) {
      e.stopPropagation();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    if (onChange) onChange(newSelectedOptions);
  };

  const removeOption = (index: number, value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    if (onChange) onChange(newSelectedOptions);
  };

  const selectedValuesText = selectedOptions.map(
    (value) => {
      const option = options.find((option) => option.value === value);
      return {
        text: option?.text || "",
        icon: option?.icon || "",
      };
    }
  );

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 w-full" ref={dropdownRef}>
        <div className="relative flex w-full flex-col">
          <div onClick={(e) => toggleDropdown(e)} className="w-full min-w-0">
            <div className="mb-2 flex min-h-11 w-full min-w-0 items-start gap-2 rounded-lg border border-gray-300 py-1.5 pl-3 pr-2 shadow-theme-xs outline-hidden transition focus-within:border-brand-300 focus-within:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-300">
              <div className="flex min-h-8 min-w-0 flex-1 flex-wrap content-center gap-1.5 overflow-hidden">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((item, index) => (
                    <div
                      key={index}
                      title={item.text}
                      className="group inline-flex max-w-full min-w-0 items-center rounded-full border border-transparent bg-gray-100 py-1 pl-2.5 pr-1.5 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                    >
                      {item.icon && (
                        <span className="mr-1.5 shrink-0 text-base">{item.icon}</span>
                      )}
                      <span className="min-w-0 truncate">{item.text}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.text}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(index, selectedOptions[index]);
                        }}
                        className="ml-1.5 shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg
                          className="fill-current"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <input
                    placeholder={placeholder}
                    className="h-8 w-full min-w-0 p-1 pr-2 text-sm bg-transparent border-0 outline-hidden appearance-none placeholder:text-gray-800 focus:border-0 focus:outline-hidden focus:ring-0 dark:placeholder:text-white/90"
                    readOnly
                    value={placeholder}
                  />
                )}
              </div>
              <div className="flex h-8 shrink-0 items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(e);
                  }}
                  className="flex h-5 w-5 items-center justify-center text-gray-700 outline-hidden cursor-pointer focus:outline-hidden dark:text-gray-400"
                >
                  <svg
                    className={`stroke-current transition-transform ${isOpen ? "rotate-180" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-select dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {options.map((option, index) => (
                  <div key={index}>
                    <div
                      className={`hover:bg-primary/5 w-full cursor-pointer rounded-t border-b border-gray-200 dark:border-gray-800`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <div
                        className={`relative flex w-full items-center p-2 pl-2 ${
                          selectedOptions.includes(option.value)
                            ? "bg-primary/10"
                            : ""
                        }`}
                      >
                        {option.icon && (
                          <span className="ml-2 mr-2 text-lg flex-shrink-0">{option.icon}</span>
                        )}
                        <div className="leading-6 text-gray-800 dark:text-white/90">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
