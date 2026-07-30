import React from 'react'

interface InputProps {
  label?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = ''
}: InputProps): React.ReactNode {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  )
}
