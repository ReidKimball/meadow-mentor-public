
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false, // Always fetch fresh data
  apiVersion: "2023-05-03",
});

const slug = "how-to-choose-the-right-nutrition-professional-for-gut-issues";

const query = `*[
  _type == "post"
  && slug.current == $slug
][0]{
  title,
  "authorName": author->name,
  "author": author->{
    name,
    image,
    bio
  }
}`;

async function test() {
  try {
    console.log(`Fetching post with slug: ${slug}...`);
    const result = await client.fetch(query, { slug });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
