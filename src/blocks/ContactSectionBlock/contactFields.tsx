'use client'

import type {
  CheckboxField,
  CountryField,
  SelectField,
} from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldErrorsImpl } from 'react-hook-form'
import type { UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { AlertCircle, Globe, Mail, MessageSquare, Phone, Tag, User } from 'lucide-react'
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
import {
  useFormFieldInvalidEmailMessage,
  useFormFieldLabel,
  useFormFieldRequiredMessage,
  useTranslation,
} from '@/utilities/translateClient'

const inputClassName =
  'w-full rounded-xl border border-outline-variant/35 bg-white pl-10 pr-4 py-3.5 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-tertiary focus-visible:ring-4 focus-visible:ring-tertiary/20'

const labelClassName =
  'mb-2 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-tertiary'

const iconClassName =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant'

const textareaIconClassName = 'pointer-events-none absolute left-3 top-4 text-on-surface-variant'

type BaseFieldProps = {
  name: string
  label?: string
  required?: boolean
  errors: any
  register: UseFormRegister<any>
  defaultValue?: string
}

function fieldHint(name: string, label?: string): string {
  return `${name} ${label ?? ''}`.toLowerCase()
}

function isPhoneField(name: string, label?: string): boolean {
  return /phone|mobile|tel|cell|cellphone/.test(fieldHint(name, label))
}

function ContactFieldWrapper({
  name,
  label,
  required,
  errors,
  icon,
  textareaIcon,
  children,
}: BaseFieldProps & { children: React.ReactNode; icon?: React.ReactNode; textareaIcon?: boolean }) {
  return (
    <div>
      {label && (
        <label className={labelClassName} htmlFor={name}>
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className={textareaIcon ? textareaIconClassName : iconClassName}>{icon}</span>
        )}
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
}) => {
  const phoneField = isPhoneField(name, label)
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)

  return (
    <ContactFieldWrapper
      errors={errors}
      icon={
        phoneField ? (
          <Phone size={18} strokeWidth={2} />
        ) : (
          <User size={18} strokeWidth={2} />
        )
      }
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
    >
      <input
        className={inputClassName}
        defaultValue={defaultValue}
        id={name}
        placeholder={translatedLabel}
        type={phoneField ? 'tel' : 'text'}
        {...register(name, { required: required ? requiredMessage : false })}
      />
    </ContactFieldWrapper>
  )
}

export const ContactEmailField: React.FC<BaseFieldProps> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalidEmailMessage = useFormFieldInvalidEmailMessage(name)

  return (
    <ContactFieldWrapper
      errors={errors}
      icon={<Mail size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
    >
      <input
        className={inputClassName}
        defaultValue={defaultValue}
        id={name}
        placeholder={translatedLabel}
        type="email"
        {...register(name, {
          pattern: {
            value: /^\S[^\s@]*@\S+$/,
            message: invalidEmailMessage,
          },
          required: required ? requiredMessage : false,
        })}
      />
    </ContactFieldWrapper>
  )
}

export const ContactNumberField: React.FC<BaseFieldProps> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)

  return (
    <ContactFieldWrapper
      errors={errors}
      icon={<Phone size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
    >
      <input
        className={inputClassName}
        defaultValue={defaultValue}
        id={name}
        placeholder={translatedLabel}
        type="tel"
        {...register(name, { required: required ? requiredMessage : false })}
      />
    </ContactFieldWrapper>
  )
}

export const ContactTextareaField: React.FC<BaseFieldProps & { rows?: number }> = ({
  name,
  label,
  required,
  errors,
  register,
  defaultValue,
  rows = 4,
}) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)

  return (
    <ContactFieldWrapper
      errors={errors}
      icon={<MessageSquare size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
      textareaIcon
    >
      <textarea
        className={inputClassName}
        defaultValue={defaultValue}
        id={name}
        placeholder={translatedLabel}
        rows={rows}
        {...register(name, { required: required ? requiredMessage : false })}
      />
    </ContactFieldWrapper>
  )
}

const PRIVACY_POLICY_VALIDATION_KEY = 'form.validation.privacyPolicy.required'
const PRIVACY_POLICY_VALIDATION_FALLBACK =
  'You must accept the Privacy Policy to continue.'

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
> = ({ name, label, required, control, errors, defaultValue }) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const acceptanceError = useTranslation(
    PRIVACY_POLICY_VALIDATION_KEY,
    PRIVACY_POLICY_VALIDATION_FALLBACK,
  )

  return (
    <div>
      <Controller
        control={control}
        defaultValue={defaultValue ?? false}
        name={name}
        rules={{
          validate: (value) => value === true || acceptanceError,
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
            {translatedLabel ? renderCheckboxLabel(translatedLabel, required) : null}
          </label>
        )}
      />
      {errors[name] && (
        <p className="mt-2 flex items-start gap-1.5 font-body-sm text-body-sm text-error">
          <AlertCircle className="shrink-0" size={16} strokeWidth={2} />
          <span>{(errors[name]?.message as string) || acceptanceError}</span>
        </p>
      )}
    </div>
  )
}

export const contactFields = {
  text: ContactTextField,
  email: ContactEmailField,
  number: ContactNumberField,
  textarea: ContactTextareaField,
  select: ContactSelectField,
  country: ContactCountryField,
  checkbox: ContactCheckboxField,
}

function ContactSelectField(
  props: SelectField & { control: Control; errors: Partial<FieldErrorsImpl> },
) {
  const { name, control, errors, label, options, required, defaultValue } = props
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)

  return (
    <div>
      {translatedLabel && (
        <label className={labelClassName} htmlFor={name}>
          {translatedLabel}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue={defaultValue ?? ''}
        name={name}
        rules={{ required: required ? requiredMessage : false }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = options.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                className="w-full rounded-xl bg-white border-outline-variant/35 pl-10 pr-4 py-3.5 h-auto min-h-[52px] focus-visible:ring-4 focus-visible:ring-tertiary/20"
                id={name}
              >
                <Tag className={iconClassName} size={18} strokeWidth={2} />
                <SelectValue placeholder={translatedLabel} />
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

function ContactCountryField(
  props: CountryField & { control: Control; errors: Partial<FieldErrorsImpl> },
) {
  const { name, control, errors, label, required } = props
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)

  return (
    <div>
      {translatedLabel && (
        <label className={labelClassName} htmlFor={name}>
          {translatedLabel}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue=""
        name={name}
        rules={{ required: required ? requiredMessage : false }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = countryOptions.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                className="w-full rounded-xl bg-white border-outline-variant/35 pl-10 pr-4 py-3.5 h-auto min-h-[52px] focus-visible:ring-4 focus-visible:ring-tertiary/20"
                id={name}
              >
                <Globe className={iconClassName} size={18} strokeWidth={2} />
                <SelectValue placeholder={translatedLabel} />
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
