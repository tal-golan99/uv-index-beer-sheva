// Pool photos served from /public/pool.
// `pool` is the main BGU pool (used as the backdrop for "who's at the pool").
// `lifestyle` are the personal pool shots used in sliders / galleries.

export const POOL_IMAGE = "/pool/pool.jpg";

export interface Photo {
  src: string;
  alt: string;
}

export const LIFESTYLE_PHOTOS: Photo[] = [
  { src: "/pool/life1.jpg", alt: "צף בבריכה עם מזרן" },
  { src: "/pool/life3.jpg", alt: "עובדים מהבריכה" },
  { src: "/pool/life2.jpg", alt: "גלגל ים צהוב בבריכה" },
  { src: "/pool/life8.jpg", alt: "כיף משפחתי בבריכה" },
  { src: "/pool/life4.jpg", alt: "שיזוף על מזרן" },
  { src: "/pool/life7.jpg", alt: "יום שמשי בבריכה" },
  { src: "/pool/life5.jpg", alt: "רגיעה במים" },
  { src: "/pool/life6.jpg", alt: "חברים חוגגים בבריכה" },
];
