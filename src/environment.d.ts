declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      NEXT_PUBLIC_CRM_API_URL: string
      NEXT_PUBLIC_CRM_API_KEY: string
      NEXT_PUBLIC_OPTIMA_IMAGE_URL_WITHOUT_RESIZE: string
      NEXT_PUBLIC_OPTIMA_IMAGE_URL: string
      NEXT_PUBLIC_OPTIMA_PROPERTY_RESIZE_BASE: string
      NEXT_PUBLIC_OPTIMA_SITE_ID: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      ADMIN_EMAIL: string
      ADMIN_PASSWORD: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
