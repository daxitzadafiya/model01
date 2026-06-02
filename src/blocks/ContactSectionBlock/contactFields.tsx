'use client'

import type { CountryField, SelectField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldErrorsImpl } from 'react-hook-form'
import type { UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import React from 'react'

import { Error } from '@/blocks/Form/Error'
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countryOptions } from '@/blocks/Form/Country/options'

const inputClassName =
  'w-full rounded-xl border border-outline-variant/35 bg-white pl-10 pr-4 py-3.5 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-tertiary focus-visible:ring-4 focus-visible:ring-tertiary/20'

const labelClassName =
  'mb-2 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-tertiary'

const iconClassName =
  'material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]'

const textareaIconClassName =
  'material-symbols-outlined pointer-events-none absolute left-3 top-4 text-on-surface-variant text-[18px]'

type BaseFieldProps = {
  name: string
  label?: string
  required?: boolean
  errors: any
  register: UseFormRegister<any>
  defaultValue?: string
}

function ContactFieldWrapper({
  name,
  label,
  required,
  errors,
  icon,
  textareaIcon,
  children,
}: BaseFieldProps & { children: React.ReactNode; icon?: string; textareaIcon?: boolean }) {
  return (
    <div>
      {label && (
        <label className={labelClassName} htmlFor={name}>
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="relative">
        {icon && <span className={textareaIcon ? textareaIconClassName : iconClassName}>{icon}</span>}
      {children}
      </div>
      {errors[name] && <Error name={name} />}
    </div>
  )
}

export const ContactTextField: React.FC<BaseFieldProps> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => (
  <ContactFieldWrapper
    errors={errors}
    label={label}
    name={name}
    register={register}
    required={required}
    icon="person"
  >
    <input
      className={inputClassName}
      defaultValue={defaultValue}
      id={name}
      placeholder={label}
      type="text"
      {...register(name, { required })}
    />
  </ContactFieldWrapper>
)

export const ContactEmailField: React.FC<BaseFieldProps> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => (
  <ContactFieldWrapper
    errors={errors}
    label={label}
    name={name}
    register={register}
    required={required}
    icon="mail"
  >
    <input
      className={inputClassName}
      defaultValue={defaultValue}
      id={name}
      placeholder={label}
      type="email"
      {...register(name, { pattern: /^\S[^\s@]*@\S+$/, required })}
    />
  </ContactFieldWrapper>
)

export const ContactNumberField: React.FC<BaseFieldProps> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => (
  <ContactFieldWrapper
    errors={errors}
    label={label}
    name={name}
    register={register}
    required={required}
    icon="call"
  >
    <input
      className={inputClassName}
      defaultValue={defaultValue}
      id={name}
      placeholder={label}
      type="tel"
      {...register(name, { required })}
    />
  </ContactFieldWrapper>
)

export const ContactTextareaField: React.FC<BaseFieldProps & { rows?: number }> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
  rows = 6,
}) => (
  <ContactFieldWrapper
    errors={errors}
    label={label}
    name={name}
    register={register}
    required={required}
    icon="chat"
    textareaIcon
  >
    <textarea
      className={inputClassName}
      defaultValue={defaultValue}
      id={name}
      placeholder={label}
      rows={rows}
      {...register(name, { required })}
    />
  </ContactFieldWrapper>
)

export const contactFields = {
  text: ContactTextField,
  email: ContactEmailField,
  number: ContactNumberField,
  textarea: ContactTextareaField,
  select: ContactSelectField,
  country: ContactCountryField,
}

function ContactSelectField(props: SelectField & { control: Control; errors: Partial<FieldErrorsImpl> }) {
  const { name, control, errors, label, options, required, defaultValue } = props

  return (
    <div>
      {label && (
        <label className={labelClassName} htmlFor={name}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue={defaultValue ?? ''}
        name={name}
        rules={{ required }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = options.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                className="w-full rounded-xl bg-white border-outline-variant/35 pl-10 pr-4 py-3.5 h-auto min-h-[52px] focus-visible:ring-4 focus-visible:ring-tertiary/20"
                id={name}
              >
                <span className={iconClassName}>sell</span>
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {options.map(({ label: optionLabel, value: optionValue }) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectComponent>
          )
        }}
      />
      {errors[name] && <Error name={name} />}
    </div>
  )
}

function ContactCountryField(props: CountryField & { control: Control; errors: Partial<FieldErrorsImpl> }) {
  const { name, control, errors, label, required } = props

  return (
    <div>
      {label && (
        <label className={labelClassName} htmlFor={name}>
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue=""
        name={name}
        rules={{ required }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = countryOptions.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                className="w-full rounded-xl bg-white border-outline-variant/35 pl-10 pr-4 py-3.5 h-auto min-h-[52px] focus-visible:ring-4 focus-visible:ring-tertiary/20"
                id={name}
              >
                <span className={iconClassName}>public</span>
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map(({ label: optionLabel, value: optionValue }) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectComponent>
          )
        }}
      />
      {errors[name] && <Error name={name} />}
    </div>
  )
}
