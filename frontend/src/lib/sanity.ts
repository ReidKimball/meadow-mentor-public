import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const projectId = 'jtquqimk'
export const dataset = 'production'
export const apiVersion = '2023-05-03'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for fresh data (revalidation handled by Next.js)
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}
