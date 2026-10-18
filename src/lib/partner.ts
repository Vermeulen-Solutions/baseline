/** Resolved presentation data. Collection queries and media resolution stay outside the panel. */
export interface Partner {
  name: string;
  href?: string;
  image: string;
  alt: string;
  ground?: 'light' | 'dark';
}
