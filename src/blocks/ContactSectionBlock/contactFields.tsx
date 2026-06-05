'use client'

import type { CheckboxField, CountryField, SelectField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldErrorsImpl } from 'react-hook-form'
import type { UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import React from 'react'

import { Error } from '@/blocks/Form/Error'
import { Checkbox as CheckboxUi } from '@/components/ui/checkbox'
import { cn } from '@/utilities/ui'
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countryOptions } from '@/blocks/Form/Country/options'
import { CMSLink } from '@/components/Link'

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
  rows = 4,
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

const ACCEPTANCE_ERROR = 'You must accept the Privacy Policy to continue.'

const checkboxClassName =
  'mt-0.5 size-5 shrink-0 rounded-md border-outline-variant/50 shadow-none data-[state=checked]:border-tertiary data-[state=checked]:bg-tertiary data-[state=checked]:text-white focus-visible:ring-4 focus-visible:ring-tertiary/20'

function renderCheckboxLabel(label: string, required?: boolean) {
  const parts = label.split(/(Privacy Policy)/i)

  return (
    <span className="font-body-md text-body-md leading-relaxed text-on-surface">
      {required && <span className="mr-1 text-tertiary">*</span>}
      {parts.map((part, index) =>
        /^Privacy Policy$/i.test(part) ? (
          <CMSLink
            className="font-medium text-tertiary decoration-tertiary/40 underline-offset-2 cursor-pointer hover:text-tertiary/80"
            key={index}
            appearance="inline"
            newTab={true}
            type="custom"
            url="/privacy"
            label={part}
          />
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </span>
  )
}

export const ContactCheckboxField: React.FC<
  CheckboxField & {
    control: Control
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<any>
  }
> = ({ name, label, required, control, errors, defaultValue }) => (
  <div>
    <Controller
      control={control}
      defaultValue={defaultValue ?? false}
      name={name}
      rules={{
        validate: (value) => value === true || ACCEPTANCE_ERROR,
      }}
      render={({ field: { onChange, value } }) => (
        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors border-outline-variant/35 hover:border-tertiary/40 has-focus-visible:border-tertiary has-focus-visible:ring-4 has-focus-visible:ring-tertiary/20',
          )}
          htmlFor={name}
        >
          <CheckboxUi
            checked={Boolean(value)}
            className={checkboxClassName}
            id={name}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          {label ? renderCheckboxLabel(label, required) : null}
        </label>
      )}
    />
    {errors[name] && (
      <p className="mt-2 flex items-start gap-1.5 font-body-sm text-body-sm text-error">
        <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
        <span>{(errors[name]?.message as string) || ACCEPTANCE_ERROR}</span>
      </p>
    )}
  </div>
)

export const contactFields = {
  text: ContactTextField,
  email: ContactEmailField,
  number: ContactNumberField,
  textarea: ContactTextareaField,
  select: ContactSelectField,
  country: ContactCountryField,
  checkbox: ContactCheckboxField,
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
